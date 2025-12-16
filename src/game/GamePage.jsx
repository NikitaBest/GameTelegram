import { useEffect, useRef, useState } from 'react';
import BackgroundStars from '../components/BackgroundStars';
import './GamePage.css';

const GRAVITY = 0.5;
const JUMP_VELOCITY = -8;
const MAX_FALL_SPEED = 12;
const H_WALL_LEFT = 10; // границы движения шара по горизонтали (в процентах)
const H_WALL_RIGHT = 90;
const SPIKE_SPEED = 0.7; // скорость шипов

const createInitialSpikes = () => [
  { id: 'l1', side: 'left', y: 20, dir: 1 },
  { id: 'l2', side: 'left', y: 60, dir: -1 },
  { id: 'r1', side: 'right', y: 40, dir: -1 },
  { id: 'r2', side: 'right', y: 80, dir: 1 }
];

const GamePage = () => {
  const [ballY, setBallY] = useState(50); // в процентах от высоты поля
  const [ballX, setBallX] = useState(30);
  const [velocityY, setVelocityY] = useState(0);
  const [velocityX, setVelocityX] = useState(0.6);
  const [isRunning, setIsRunning] = useState(true);
  const [isGameOver, setIsGameOver] = useState(false);
  const [spikes, setSpikes] = useState(createInitialSpikes);

  const requestRef = useRef(null);
  const lastTimeRef = useRef(null);

  const ballYRef = useRef(ballY);
  const ballXRef = useRef(ballX);

  useEffect(() => {
    ballYRef.current = ballY;
  }, [ballY]);

  useEffect(() => {
    ballXRef.current = ballX;
  }, [ballX]);

  const resetGame = () => {
    const startY = 40;
    const startX = 30;
    setBallY(startY);
    setBallX(startX);
    ballYRef.current = startY;
    ballXRef.current = startX;
    setVelocityY(0);
    setVelocityX(0.6);
    setSpikes(createInitialSpikes);
    setIsGameOver(false);
    setIsRunning(true);
    lastTimeRef.current = null;
  };

  const handleTap = () => {
    if (isGameOver) {
      resetGame();
      return;
    }
    // задаём вертикальную скорость вверх
    setVelocityY(JUMP_VELOCITY);
  };

  // простой цикл игры
  useEffect(() => {
    const update = (time) => {
      if (!isRunning) return;

      if (lastTimeRef.current == null) {
        lastTimeRef.current = time;
        requestRef.current = requestAnimationFrame(update);
        return;
      }

      const delta = (time - lastTimeRef.current) / 16.67; // кадры ~60fps
      lastTimeRef.current = time;

      // вертикальное движение
      setBallY(prevY => {
        let newVelY = velocityY + GRAVITY * delta;
        newVelY = Math.min(newVelY, MAX_FALL_SPEED);

        let newY = prevY + newVelY;

        // ограничиваем движение по вертикали, но не завершаем игру
        if (newY < 5) {
          newY = 5;
          newVelY = 0;
        }

        if (newY > 95) {
          newY = 95;
          newVelY = 0;
        }

        setVelocityY(newVelY);
        ballYRef.current = newY;
        return newY;
      });

      // горизонтальное движение с отскоком от стен
      setBallX(prevX => {
        let newVelX = velocityX;
        let newX = prevX + newVelX * delta;

        if (newX < H_WALL_LEFT) {
          newX = H_WALL_LEFT;
          newVelX = Math.abs(newVelX);
        } else if (newX > H_WALL_RIGHT) {
          newX = H_WALL_RIGHT;
          newVelX = -Math.abs(newVelX);
        }

        setVelocityX(newVelX);
        ballXRef.current = newX;
        return newX;
      });

      // движение шипов и проверка столкновений
      setSpikes(prevSpikes => {
        const next = prevSpikes.map(spike => {
          let y = spike.y + spike.dir * SPIKE_SPEED * delta;
          let dir = spike.dir;
          if (y < 10) {
            y = 10;
            dir = 1;
          } else if (y > 90) {
            y = 90;
            dir = -1;
          }
          return { ...spike, y, dir };
        });

        const ballYNow = ballYRef.current;
        const ballXNow = ballXRef.current;
        const BALL_RADIUS_Y = 3;
        const BALL_RADIUS_X = 5;
        const SPIKE_HIT_HEIGHT = 6;
        const SPIKE_X_LEFT = H_WALL_LEFT;
        const SPIKE_X_RIGHT = H_WALL_RIGHT;

        let hit = false;
        for (const spike of next) {
          const spikeX = spike.side === 'left' ? SPIKE_X_LEFT : SPIKE_X_RIGHT;
          const dx = Math.abs(ballXNow - spikeX);
          const dy = Math.abs(ballYNow - spike.y);
          if (dx < BALL_RADIUS_X && dy < SPIKE_HIT_HEIGHT) {
            hit = true;
            break;
          }
        }

        if (hit) {
          setIsGameOver(true);
          setIsRunning(false);
        }

        return next;
      });

      requestRef.current = requestAnimationFrame(update);
    };

    requestRef.current = requestAnimationFrame(update);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      lastTimeRef.current = null;
    };
  }, [isRunning, velocityY, velocityX]);

  return (
    <div className="game-page" onClick={handleTap}>
      <BackgroundStars />
      <div className="game-content">
        <div className="game-header">
          <div className="game-lives">
            <span>❤</span>
            <span>❤</span>
            <span>❤</span>
          </div>
          <div className="game-score">6</div>
        </div>

        <div className="game-field">
          {/* Шипы */}
          {spikes.map(spike => (
            <div
              key={spike.id}
              className={`spike spike-${spike.side}`}
              style={{ top: `${spike.y}%` }}
            />
          ))}

          {/* Мяч */}
          <div
            className={`ball ${isGameOver ? 'ball-game-over' : ''}`}
            style={{ top: `${ballY}%`, left: `${ballX}%` }}
          >
            <div className="ball-tail" />
          </div>
        </div>

        {isGameOver && (
          <div className="game-overlay">
            <div className="game-over-text">Поражение</div>
            <div className="game-over-subtext">Тапни, чтобы сыграть ещё раз</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GamePage;


