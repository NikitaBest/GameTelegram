import { useState, useEffect, useRef, useCallback } from 'react';
import { getStableViewportHeight, isTelegramWebApp } from '../../lib/telegram';
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
// Упрощенная сложность:
const GRAVITY = 0.4; // Уменьшена гравитация (было 0.5) - птица падает медленнее
const JUMP_STRENGTH = -9; // Увеличена сила прыжка (было -8) - легче подниматься
const PIPE_WIDTH = 60;
const PIPE_GAP = 200; // Увеличен зазор между трубами (было 150) - больше места для пролета
const PIPE_SPEED = 1.5; // Уменьшена скорость труб (было 2) - больше времени на реакцию
const PIPE_SPAWN_INTERVAL = 2500; // Увеличен интервал между трубами (было 2000) - больше времени между препятствиями

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
  const lastPipeSpawnRef = useRef<number>(0);
  const pipeIdCounterRef = useRef<number>(1);
  const birdRef = useRef(bird);
  const pipesRef = useRef(pipes);
  const scoreRef = useRef(score);
  const gameOverHandledRef = useRef(false);

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

  // Генерация случайной высоты трубы
  const generatePipe = useCallback((): Pipe => {
    const minTopHeight = 50;
    const maxTopHeight = GAME_HEIGHT - PIPE_GAP - minTopHeight;
    const topHeight = Math.random() * (maxTopHeight - minTopHeight) + minTopHeight;
    
    return {
      id: pipeIdCounterRef.current++,
      x: GAME_WIDTH,
      topHeight,
      bottomY: topHeight + PIPE_GAP,
      passed: false,
    };
  }, []);

  // Прыжок птицы
  const jump = useCallback(() => {
    if (!isPlaying || isGameOver) return;
    
    setBird(prev => ({
      ...prev,
      velocity: JUMP_STRENGTH,
    }));
  }, [isPlaying, isGameOver]);

  // Обработка клика/тапа
  const handleClick = useCallback(() => {
    if (showRules) {
      startGame();
    } else {
      jump();
    }
  }, [showRules, jump]);

  // Обработка клавиатуры
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        handleClick();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleClick]);

  // Начало игры
  const startGame = useCallback(() => {
    setBird({ x: BIRD_START_X, y: BIRD_START_Y, velocity: 0 });
    setPipes([]);
    setScore(0);
    setIsPlaying(true);
    setIsGameOver(false);
    setShowRules(false);
    lastPipeSpawnRef.current = Date.now();
    pipeIdCounterRef.current = 1;
    gameOverHandledRef.current = false;
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

    const gameLoop = () => {
      const now = Date.now();

      // Обновление птицы
      setBird(prev => {
        const newVelocity = prev.velocity + GRAVITY;
        const newY = Math.max(0, Math.min(GAME_HEIGHT - BIRD_SIZE, prev.y + newVelocity));
        
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

      // Обновление труб
      setPipes(prev => {
        const updated = prev
          .map(pipe => ({
            ...pipe,
            x: pipe.x - PIPE_SPEED,
            passed: pipe.passed || (pipe.x + PIPE_WIDTH < birdRef.current.x),
          }))
          .filter(pipe => pipe.x + PIPE_WIDTH > 0);

        // Подсчет очков
        const newPassedPipes = updated.filter(
          pipe => pipe.passed && !prev.find(p => p.id === pipe.id && p.passed)
        );
        
        if (newPassedPipes.length > 0) {
          setScore(prevScore => prevScore + newPassedPipes.length);
        }

        return updated;
      });

      // Проверка столкновений (только если есть трубы)
      if (pipesRef.current.length > 0) {
        setTimeout(() => {
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
        }, 0);
      }

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [isPlaying, isGameOver, generatePipe, checkCollision, onGameOver]);

  const viewportHeight = isTelegramWebApp()
    ? getStableViewportHeight()
    : typeof window !== 'undefined' ? window.innerHeight : 600;

  return (
    <div 
      className="flappy-bird-game-container"
      onClick={handleClick}
      style={{ touchAction: 'none' }}
    >
      <div className="flappy-bird-game-wrapper">
        <div 
          className="flappy-bird-game-area"
          style={{
            width: '100%',
            height: '100%',
            maxWidth: '400px',
            maxHeight: '600px',
            aspectRatio: `${GAME_WIDTH} / ${GAME_HEIGHT}`,
          }}
        >
          {/* Фон */}
          <div className="flappy-bird-background" />

          {/* Трубы */}
          {pipes.map(pipe => (
            <div key={pipe.id}>
              {/* Верхняя труба */}
              <div
                className="flappy-bird-pipe pipe-top"
                style={{
                  left: `${(pipe.x / GAME_WIDTH) * 100}%`,
                  width: `${(PIPE_WIDTH / GAME_WIDTH) * 100}%`,
                  height: `${(pipe.topHeight / GAME_HEIGHT) * 100}%`,
                }}
              />
              {/* Нижняя труба */}
              <div
                className="flappy-bird-pipe pipe-bottom"
                style={{
                  left: `${(pipe.x / GAME_WIDTH) * 100}%`,
                  top: `${(pipe.bottomY / GAME_HEIGHT) * 100}%`,
                  width: `${(PIPE_WIDTH / GAME_WIDTH) * 100}%`,
                  height: `${((GAME_HEIGHT - pipe.bottomY) / GAME_HEIGHT) * 100}%`,
                }}
              />
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
              🐦
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
            <div className="flappy-bird-rules">
              <h2>Flappy Bird</h2>
              <p>Нажимай, чтобы прыгать</p>
              <p>Избегай труб!</p>
              <button className="flappy-bird-start-button" onClick={startGame}>
                Начать игру
              </button>
            </div>
          )}

          {/* Экран Game Over */}
          {isGameOver && !showRules && (
            <div className="flappy-bird-game-over">
              <h2>Игра окончена!</h2>
              <p>Очки: {score}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

