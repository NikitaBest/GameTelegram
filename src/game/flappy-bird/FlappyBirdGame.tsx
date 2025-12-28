import { useState, useEffect, useRef, useCallback } from 'react';
import { GameRulesScreen, GameRule } from '../GameRulesScreen';
import { Hand, Target, AlertTriangle } from 'lucide-react';
import { soundManager } from '../../utils/soundManager';
import { Game } from '../../api/services/drawService';
import './FlappyBirdGame.css';

interface FlappyBirdGameProps {
  onGameOver: (score: number) => void;
  gameData?: Game | null;
}

// Константы игры
const GAME_WIDTH = 400;
const GAME_HEIGHT = 600;
const BIRD_SIZE = 40;
const BIRD_START_X = 100;
const BIRD_START_Y = 250;
// Физика игры - более отзывчивая и менее плавная:
const GRAVITY = 0.35; // Гравитация для падения
const JUMP_STRENGTH = -6.5; // Сила прыжка для быстрого подъема
const MAX_FALL_VELOCITY = 7; // Максимальная скорость падения (терминальная скорость)
const AIR_RESISTANCE = 0.01; // Минимальное сопротивление воздуха при подъеме
const PIPE_WIDTH = 60;
const PIPE_GAP_BASE = 200; // Базовый зазор между трубами
const PIPE_GAP_MIN = 130; // Минимальный зазор (птица 40px + запас 90px) - всегда можно пройти
const PIPE_SPEED_BASE = 1.5; // Базовая скорость труб
const PIPE_SPEED_MAX = 2.5; // Максимальная скорость труб
const PIPE_SPAWN_INTERVAL = 2500; // Интервал между трубами

interface Bird {
  x: number;
  y: number;
  velocity: number;
}

interface Pipe {
  id: number;
  x: number;
  topHeight: number;
  bottomY: number;
  passed: boolean;
}

interface Cloud {
  id: number;
  x: number;
  y: number;
  image: string; // Путь к изображению облака
  speed: number; // Скорость движения облака
  size: number; // Размер облака (в процентах от высоты экрана)
}

export function FlappyBirdGame({ onGameOver, gameData }: FlappyBirdGameProps) {
  console.log('[FlappyBirdGame] Компонент монтирован');
  
  const [bird, setBird] = useState<Bird>({
    x: BIRD_START_X,
    y: BIRD_START_Y,
    velocity: 0,
  });
  
  const [pipes, setPipes] = useState<Pipe[]>([]);
  const [clouds, setClouds] = useState<Cloud[]>([]);
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [showRules, setShowRules] = useState(true);

  // Правила игры (используются только если нет данных из бекенда)
  const gameRules: GameRule[] | undefined = gameData ? undefined : [
    {
      icon: <Hand className="w-5 h-5 md:w-6 md:h-6 text-white" strokeWidth={2.5} />,
      text: 'Тапай по экрану, чтобы птица прыгала'
    },
    {
      icon: <Target className="w-5 h-5 md:w-6 md:h-6 text-white" strokeWidth={2.5} />,
      text: 'Пролетай между трубами для получения очков'
    },
    {
      icon: <AlertTriangle className="w-5 h-5 md:w-6 md:h-6 text-white" strokeWidth={2.5} />,
      text: 'Избегай столкновений с трубами и границами!'
    }
  ];
  
  const gameLoopRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number | null>(null);
  const lastPipeSpawnRef = useRef<number>(0);
  const lastCloudSpawnRef = useRef<number>(0);
  const pipeIdCounterRef = useRef<number>(1);
  const cloudIdCounterRef = useRef<number>(1);
  const birdRef = useRef(bird);
  const pipesRef = useRef(pipes);
  const scoreRef = useRef(score);
  const gameOverHandledRef = useRef(false);
  const scoredPipesRef = useRef<Set<number>>(new Set()); // Отслеживаем трубы, за которые уже начислены очки
  const lastJumpTimeRef = useRef<number>(0); // Время последнего прыжка для предотвращения двойного срабатывания
  const isTouchDeviceRef = useRef<boolean>(false); // Флаг для определения touch устройства
  
  // Массив изображений облаков
  const cloudImages = ['/Облако1.png', '/Облако2.png', '/Облако3.png'];

  // Синхронизация refs
  useEffect(() => {
    birdRef.current = bird;
  }, [bird]);

  useEffect(() => {
    pipesRef.current = pipes;
  }, [pipes]);

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  // Вычисление текущего зазора между трубами на основе счета
  const getCurrentPipeGap = useCallback((): number => {
    // Каждые 20 очков уменьшаем зазор на 10px
    const gapReduction = Math.floor(score / 20) * 10;
    const currentGap = Math.max(PIPE_GAP_MIN, PIPE_GAP_BASE - gapReduction);
    return currentGap;
  }, [score]);

  // Вычисление текущей скорости труб на основе счета
  const getCurrentPipeSpeed = useCallback((): number => {
    // Каждые 20 очков увеличиваем скорость на 0.1
    const speedIncrease = Math.floor(score / 20) * 0.1;
    const currentSpeed = Math.min(PIPE_SPEED_MAX, PIPE_SPEED_BASE + speedIncrease);
    return currentSpeed;
  }, [score]);

  // Генерация случайной высоты трубы
  const generatePipe = useCallback((): Pipe => {
    const currentGap = getCurrentPipeGap();
    const minTopHeight = 50;
    const maxTopHeight = GAME_HEIGHT - currentGap - minTopHeight;
    const topHeight = Math.random() * (maxTopHeight - minTopHeight) + minTopHeight;
    
    return {
      id: pipeIdCounterRef.current++,
      x: GAME_WIDTH,
      topHeight,
      bottomY: topHeight + currentGap,
      passed: false,
    };
  }, [getCurrentPipeGap]);

  // Генерация нового облака
  const generateCloud = useCallback((): Cloud => {
    const randomImage = cloudImages[Math.floor(Math.random() * cloudImages.length)];
    const randomY = Math.random() * (GAME_HEIGHT * 0.6); // Облака в верхних 60% экрана
    const randomSize = 8 + Math.random() * 12; // Размер от 8% до 20% высоты экрана
    const randomSpeed = 0.3 + Math.random() * 0.4; // Скорость от 0.3 до 0.7
    
    return {
      id: cloudIdCounterRef.current++,
      x: GAME_WIDTH + 50, // Начинаем справа за экраном
      y: randomY,
      image: randomImage,
      speed: randomSpeed,
      size: randomSize,
    };
  }, []);

  // Прыжок птицы
  const jump = useCallback(() => {
    if (!isPlaying || isGameOver) return;
    
    // Защита от двойного срабатывания: проверяем, не было ли прыжка в последние 200ms
    const now = Date.now();
    if (now - lastJumpTimeRef.current < 200) {
      return; // Игнорируем, если прыжок был недавно
    }
    lastJumpTimeRef.current = now;
    
    // Воспроизводим звук прыжка
    soundManager.play('jump');
    
    setBird(prev => ({
      ...prev,
      velocity: JUMP_STRENGTH,
    }));
  }, [isPlaying, isGameOver]);

  // Обработка touch события (для мобильных)
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!showRules && isPlaying && !isGameOver) {
      e.preventDefault(); // Предотвращаем эмуляцию click события
      isTouchDeviceRef.current = true; // Помечаем, что это touch устройство
      jump();
    }
  }, [showRules, isPlaying, isGameOver, jump]);

  // Обработка клика (только для десктопа, не для touch устройств)
  const handleClick = useCallback((_e: React.MouseEvent) => {
    // Игнорируем click события на touch устройствах (они уже обработаны через touch)
    if (isTouchDeviceRef.current) {
      // Сбрасываем флаг через небольшую задержку, чтобы не блокировать настоящие клики мыши
      setTimeout(() => {
        isTouchDeviceRef.current = false;
      }, 300);
      return;
    }
    
    if (!showRules && isPlaying && !isGameOver) {
      jump();
    }
  }, [showRules, isPlaying, isGameOver, jump]);

  // Обработка клавиатуры (только во время игры)
  useEffect(() => {
    if (showRules || !isPlaying || isGameOver) return;
    
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        jump();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showRules, isPlaying, isGameOver, jump]);

  // Начало игры
  const startGame = useCallback(() => {
    // Разблокируем аудиоконтекст при первом взаимодействии (критично для мобильных)
    soundManager.unlockAudioContext();
    
    // Воспроизводим звук начала игры
    soundManager.play('start');
    
    setBird({ x: BIRD_START_X, y: BIRD_START_Y, velocity: 0 });
    setPipes([]);
    setScore(0);
    setIsPlaying(true);
    setIsGameOver(false);
    setShowRules(false);
    lastPipeSpawnRef.current = Date.now();
    lastCloudSpawnRef.current = Date.now();
    lastFrameTimeRef.current = null; // Сбрасываем время кадра
    lastJumpTimeRef.current = 0; // Сбрасываем время последнего прыжка
    pipeIdCounterRef.current = 1;
    cloudIdCounterRef.current = 1;
    gameOverHandledRef.current = false;
    scoredPipesRef.current.clear(); // Очищаем отслеживание начисленных очков
    isTouchDeviceRef.current = false; // Сбрасываем флаг touch устройства
    
    // Создаем начальные облака
    const initialClouds: Cloud[] = [];
    for (let i = 0; i < 3; i++) {
      initialClouds.push({
        id: cloudIdCounterRef.current++,
        x: Math.random() * GAME_WIDTH,
        y: Math.random() * (GAME_HEIGHT * 0.6),
        image: cloudImages[Math.floor(Math.random() * cloudImages.length)],
        speed: 0.3 + Math.random() * 0.4,
        size: 8 + Math.random() * 12,
      });
    }
    setClouds(initialClouds);
  }, []);

  // Проверка столкновений
  const checkCollision = useCallback((bird: Bird, pipes: Pipe[]): boolean => {
    // Столкновение с верхом/низом
    if (bird.y < 0 || bird.y + BIRD_SIZE > GAME_HEIGHT) {
      return true;
    }

    // Столкновение с трубами
    for (const pipe of pipes) {
      if (
        bird.x + BIRD_SIZE > pipe.x &&
        bird.x < pipe.x + PIPE_WIDTH
      ) {
        if (bird.y < pipe.topHeight || bird.y + BIRD_SIZE > pipe.bottomY) {
          return true;
        }
      }
    }

    return false;
  }, []);

  // Основной игровой цикл
  useEffect(() => {
    if (!isPlaying || isGameOver) {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
        gameLoopRef.current = null;
      }
      return;
    }

    const gameLoop = (currentTime: number) => {
      // Расчет delta time для независимости от FPS
      if (lastFrameTimeRef.current === null) {
        lastFrameTimeRef.current = currentTime;
        gameLoopRef.current = requestAnimationFrame(gameLoop);
        return;
      }

      const deltaTime = currentTime - lastFrameTimeRef.current;
      lastFrameTimeRef.current = currentTime;
      
      // Нормализуем delta time к 60 FPS (16.67ms на кадр)
      // Это обеспечивает одинаковую скорость на всех устройствах
      const normalizedDelta = deltaTime / 16.67;
      const now = Date.now();

      // Обновление птицы с плавной физикой (с учетом delta time)
      setBird(prev => {
        let newVelocity = prev.velocity;
        
        // Применяем сопротивление воздуха при подъеме (когда velocity отрицательная)
        if (newVelocity < 0) {
          newVelocity += AIR_RESISTANCE * normalizedDelta; // Замедляем подъем для плавности
        }
        
        // Применяем гравитацию (с учетом delta time)
        newVelocity += GRAVITY * normalizedDelta;
        
        // Ограничиваем максимальную скорость падения для плавности
        newVelocity = Math.min(newVelocity, MAX_FALL_VELOCITY);
        
        // Применяем скорость с учетом delta time
        const newY = Math.max(0, Math.min(GAME_HEIGHT - BIRD_SIZE, prev.y + newVelocity * normalizedDelta));
        
        return {
          ...prev,
          y: newY,
          velocity: newVelocity,
        };
      });

      // Спавн новых труб
      if (now - lastPipeSpawnRef.current > PIPE_SPAWN_INTERVAL) {
        setPipes(prev => [...prev, generatePipe()]);
        lastPipeSpawnRef.current = now;
      }

      // Обновление труб (с учетом delta time)
      setPipes(prev => {
        const currentSpeed = getCurrentPipeSpeed();
        const updated = prev
          .map(pipe => ({
            ...pipe,
            x: pipe.x - currentSpeed * normalizedDelta, // Применяем delta time
            passed: pipe.passed || (pipe.x + PIPE_WIDTH < birdRef.current.x),
          }))
          .filter(pipe => pipe.x + PIPE_WIDTH > 0);

        // Подсчет очков - за каждую пройденную пару труб начисляется одно очко
        const newPassedPipes = updated.filter(
          pipe => pipe.passed && !prev.find(p => p.id === pipe.id && p.passed)
        );
        
        // Начисляем только одно очко за каждую пройденную пару труб
        // Используем Set для гарантии, что за каждую пару труб начисляется только одно очко
        newPassedPipes.forEach(pipe => {
          if (!scoredPipesRef.current.has(pipe.id)) {
            scoredPipesRef.current.add(pipe.id);
            setScore(prevScore => prevScore + 1);
            // Воспроизводим звук получения очка
            soundManager.play('score');
          }
        });

        return updated;
      });

      // Обновление облаков
      setClouds(prev => {
        const updated = prev
          .map(cloud => ({
            ...cloud,
            x: cloud.x - cloud.speed * normalizedDelta * 2, // Движение облаков медленнее труб
          }))
          .filter(cloud => cloud.x + (GAME_WIDTH * cloud.size / 100) > -100); // Удаляем облака, которые ушли за экран

        // Спавним новые облака примерно раз в 4-6 секунд
        const cloudSpawnInterval = 4000 + Math.random() * 2000; // 4-6 секунд
        if (now - lastCloudSpawnRef.current > cloudSpawnInterval && updated.length < 5) {
          updated.push(generateCloud());
          lastCloudSpawnRef.current = now;
        }

        return updated;
      });

      // Проверка столкновений (только если есть трубы)
      if (pipesRef.current.length > 0) {
        const currentBird = birdRef.current;
        const currentPipes = pipesRef.current;
        
        if (checkCollision(currentBird, currentPipes) && !gameOverHandledRef.current) {
          console.log('[FlappyBirdGame] Столкновение обнаружено!');
          gameOverHandledRef.current = true;
          
          // Воспроизводим звук столкновения и окончания игры
          soundManager.play('hit');
          soundManager.play('gameOver');
          
          setIsGameOver(true);
          setIsPlaying(false);
          setTimeout(() => {
            console.log('[FlappyBirdGame] Вызываем onGameOver с очками:', scoreRef.current);
            onGameOver(scoreRef.current);
          }, 500);
          return;
        }
      }

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
      lastFrameTimeRef.current = null; // Сбрасываем время кадра при размонтировании
    };
  }, [isPlaying, isGameOver, generatePipe, generateCloud, checkCollision, onGameOver, getCurrentPipeSpeed]);

  return (
    <div 
      className="flappy-bird-game-container"
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      style={{ touchAction: 'none' }}
    >
      <div className="flappy-bird-game-wrapper">
        <div 
          className="flappy-bird-game-area"
        >
          {/* Фон */}
          <div className="flappy-bird-background" />

          {/* Облака */}
          {clouds.map(cloud => (
            <div
              key={cloud.id}
              className="flappy-bird-cloud"
              style={{
                position: 'absolute',
                left: `${(cloud.x / GAME_WIDTH) * 100}%`,
                top: `${(cloud.y / GAME_HEIGHT) * 100}%`,
                width: `${cloud.size}%`,
                height: 'auto',
                zIndex: 0,
                pointerEvents: 'none',
                opacity: 0.7,
              }}
            >
              <img
                src={cloud.image}
                alt="Облако"
                style={{
                  width: '100%',
                  height: 'auto',
                  objectFit: 'contain',
                  imageRendering: 'auto',
                  userSelect: 'none',
                }}
              />
            </div>
          ))}

          {/* Трубы */}
          {pipes.map(pipe => (
            <div key={pipe.id}>
              {/* Верхняя труба - основание вверху */}
              <div
                className="flappy-bird-pipe-container pipe-top"
                style={{
                  left: `${(pipe.x / GAME_WIDTH) * 100}%`,
                  width: `${(PIPE_WIDTH / GAME_WIDTH) * 100}%`,
                  height: `${(pipe.topHeight / GAME_HEIGHT) * 100}%`,
                }}
              >
                <img 
                  src="/pipe green.png" 
                  alt="Pipe top" 
                  className="flappy-bird-pipe-svg pipe-top-svg"
                  style={{
                    height: '100%',
                    width: '100%',
                    objectFit: 'cover',
                    objectPosition: 'top',
                  }}
                />
              </div>
              {/* Нижняя труба - основание внизу */}
              <div
                className="flappy-bird-pipe-container pipe-bottom"
                style={{
                  left: `${(pipe.x / GAME_WIDTH) * 100}%`,
                  bottom: 0, // Прижимаем к самому низу
                  width: `${(PIPE_WIDTH / GAME_WIDTH) * 100}%`,
                  height: `${((GAME_HEIGHT - pipe.bottomY) / GAME_HEIGHT) * 100}%`,
                }}
              >
                <img 
                  src="/pipe green (1).png" 
                  alt="Pipe bottom" 
                  className="flappy-bird-pipe-svg pipe-bottom-svg"
                  style={{
                    height: '100%',
                    width: '100%',
                    objectFit: 'cover',
                    objectPosition: 'bottom',
                  }}
                />
              </div>
            </div>
          ))}

          {/* Птица */}
          {!showRules && (
            <div
              className="flappy-bird-bird"
              style={{
                left: `${(bird.x / GAME_WIDTH) * 100}%`,
                top: `${(bird.y / GAME_HEIGHT) * 100}%`,
                width: `${(BIRD_SIZE / GAME_WIDTH) * 100}%`,
                height: `${(BIRD_SIZE / GAME_HEIGHT) * 100}%`,
                transform: `rotate(${Math.min(bird.velocity * 3, 30)}deg)`,
              }}
            >
              <img 
                src="/Flappy Bird.png" 
                alt="Птица" 
                className="flappy-bird-bird-image"
              />
            </div>
          )}

          {/* HUD */}
          {!showRules && (
            <div className="flappy-bird-hud">
              <div className="flappy-bird-score">Очки: {score}</div>
            </div>
          )}

          {/* Экран правил */}
          {showRules && (
            <GameRulesScreen rules={gameRules} gameData={gameData} onStart={startGame} />
          )}
        </div>
      </div>
    </div>
  );
}

