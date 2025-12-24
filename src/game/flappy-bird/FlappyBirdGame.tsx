import { useState, useEffect, useRef, useCallback } from 'react';
import { FlappyBirdRulesScreen } from './FlappyBirdRulesScreen';
import './FlappyBirdGame.css';

interface FlappyBirdGameProps {
  onGameOver: (score: number) => void;
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

export function FlappyBirdGame({ onGameOver }: FlappyBirdGameProps) {
  console.log('[FlappyBirdGame] Компонент монтирован');
  
  const [bird, setBird] = useState<Bird>({
    x: BIRD_START_X,
    y: BIRD_START_Y,
    velocity: 0,
  });
  
  const [pipes, setPipes] = useState<Pipe[]>([]);
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [showRules, setShowRules] = useState(true);
  
  const gameLoopRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number | null>(null);
  const lastPipeSpawnRef = useRef<number>(0);
  const pipeIdCounterRef = useRef<number>(1);
  const birdRef = useRef(bird);
  const pipesRef = useRef(pipes);
  const scoreRef = useRef(score);
  const gameOverHandledRef = useRef(false);
  const scoredPipesRef = useRef<Set<number>>(new Set()); // Отслеживаем трубы, за которые уже начислены очки

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

  // Прыжок птицы
  const jump = useCallback(() => {
    if (!isPlaying || isGameOver) return;
    
    setBird(prev => ({
      ...prev,
      velocity: JUMP_STRENGTH,
    }));
  }, [isPlaying, isGameOver]);

  // Обработка клика/тапа (только для игры, не для правил)
  const handleClick = useCallback(() => {
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
    setBird({ x: BIRD_START_X, y: BIRD_START_Y, velocity: 0 });
    setPipes([]);
    setScore(0);
    setIsPlaying(true);
    setIsGameOver(false);
    setShowRules(false);
    lastPipeSpawnRef.current = Date.now();
    lastFrameTimeRef.current = null; // Сбрасываем время кадра
    pipeIdCounterRef.current = 1;
    gameOverHandledRef.current = false;
    scoredPipesRef.current.clear(); // Очищаем отслеживание начисленных очков
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
          }
        });

        return updated;
      });

      // Проверка столкновений (только если есть трубы)
      if (pipesRef.current.length > 0) {
        const currentBird = birdRef.current;
        const currentPipes = pipesRef.current;
        
        if (checkCollision(currentBird, currentPipes) && !gameOverHandledRef.current) {
          console.log('[FlappyBirdGame] Столкновение обнаружено!');
          gameOverHandledRef.current = true;
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
  }, [isPlaying, isGameOver, generatePipe, checkCollision, onGameOver, getCurrentPipeSpeed]);

  return (
    <div 
      className="flappy-bird-game-container"
      onClick={handleClick}
      style={{ touchAction: 'none' }}
      onTouchStart={handleClick}
    >
      <div className="flappy-bird-game-wrapper">
        <div 
          className="flappy-bird-game-area"
        >
          {/* Фон */}
          <div className="flappy-bird-background" />

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
                  top: `${(pipe.bottomY / GAME_HEIGHT) * 100}%`,
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
            <FlappyBirdRulesScreen onStart={startGame} />
          )}
        </div>
      </div>
    </div>
  );
}

