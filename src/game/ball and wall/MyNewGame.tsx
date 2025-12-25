import { useEffect, useRef, useState, useCallback } from "react";
import { MyNewGameRulesScreen } from "./MyNewGameRulesScreen";
import { AnimatePresence } from "framer-motion";
import "./MyNewGame.css";

interface BallAndWallGameProps {
  onGameOver: (score: number) => void;
}

// --- Game Constants & Types ---
const GRAVITY = 0.25;
const JUMP_FORCE = -10;
const MOVE_SPEED_X = 3;
const BALL_RADIUS = 12;
const SPIKE_WIDTH = 45;
const SPIKE_HEIGHT = 40;

// Pastel colors for background changes
const BG_COLORS = [
  "#e0f2fe", // sky-100
  "#fce7f3", // pink-100
  "#dcfce7", // green-100
  "#fef9c3", // yellow-100
  "#ede9fe", // violet-100
  "#ffedd5", // orange-100
];

interface Point {
  x: number;
  y: number;
}

interface Spike {
  y: number;
  side: "left" | "right";
  active: boolean;
}

export function BallAndWallGame({ onGameOver }: BallAndWallGameProps) {
  console.log('[BallAndWallGame] Компонент монтирован');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | undefined>(undefined);
  
  // Game State
  const [isPlaying, setIsPlaying] = useState(false);
  const [showRules, setShowRules] = useState(true);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [bgColor, setBgColor] = useState(BG_COLORS[0]);

  // Physics State (refs for performance in loop)
  const ballPos = useRef<Point>({ x: 0, y: 0 });
  const ballVel = useRef<Point>({ x: MOVE_SPEED_X, y: 0 });
  const trail = useRef<Point[]>([]);
  const spikes = useRef<Spike[]>([]);
  const scoreRef = useRef(0);
  const gameOverHandledRef = useRef(false);
  const lastTapTimeRef = useRef<number>(0);
  const isTouchDeviceRef = useRef<boolean>(false);

  // --- Game Loop Logic ---

  const initGame = useCallback(() => {
    if (!canvasRef.current) return;
    const { width, height } = canvasRef.current;
    
    ballPos.current = { x: width / 2, y: height / 2 };
    ballVel.current = { x: MOVE_SPEED_X, y: 0 }; // Start moving right
    trail.current = [];
    spikes.current = [];
    scoreRef.current = 0;
    setScore(0);
    setGameOver(false);
    setIsPlaying(true);
    setBgColor(BG_COLORS[0]);
    gameOverHandledRef.current = false;
  }, []);

  const spawnSpikes = (canvasHeight: number) => {
    // Generate some random spikes
    // Difficulty scaling: more spikes as score increases
    const spikeCount = Math.min(1 + Math.floor(scoreRef.current / 5), 5);
    const newSpikes: Spike[] = [];
    
    // Avoid spawning spikes too close to each other or where the ball just bounced?
    // For simplicity, random positions on both walls
    for (let i = 0; i < spikeCount; i++) {
      const side = Math.random() > 0.5 ? "left" : "right";
      const y = Math.random() * (canvasHeight - 100) + 50; // Keep away from extreme edges
      newSpikes.push({ y, side, active: true });
    }
    spikes.current = newSpikes;
  };

  const draw = useCallback(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    const { width, height } = canvasRef.current;

    // Clear Canvas
    ctx.clearRect(0, 0, width, height);

    // Draw Spikes
    ctx.fillStyle = "#ef4444"; // red-500
    spikes.current.forEach(spike => {
      ctx.beginPath();
      if (spike.side === "left") {
        ctx.moveTo(0, spike.y - SPIKE_HEIGHT/2);
        ctx.lineTo(SPIKE_WIDTH, spike.y);
        ctx.lineTo(0, spike.y + SPIKE_HEIGHT/2);
      } else {
        ctx.moveTo(width, spike.y - SPIKE_HEIGHT/2);
        ctx.lineTo(width - SPIKE_WIDTH, spike.y);
        ctx.lineTo(width, spike.y + SPIKE_HEIGHT/2);
      }
      ctx.closePath();
      ctx.fill();
    });

    // Draw Trail
    trail.current.forEach((pos, index) => {
      const opacity = index / trail.current.length;
      const size = (index / trail.current.length) * BALL_RADIUS;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0,0,0, ${opacity * 0.1})`;
      ctx.fill();
    });

    // Draw Ball
    ctx.beginPath();
    ctx.arc(ballPos.current.x, ballPos.current.y, BALL_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = "#1e293b"; // slate-800
    ctx.fill();
    // Ball Highlight
    ctx.beginPath();
    ctx.arc(ballPos.current.x - 3, ballPos.current.y - 3, BALL_RADIUS/3, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.fill();
  }, []);

  const endGame = useCallback(() => {
    setIsPlaying(false);
    setGameOver(true);
    
    // ВАЖНО: Вызываем onGameOver только один раз
    if (!gameOverHandledRef.current) {
      gameOverHandledRef.current = true;
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      
      // Небольшая задержка для плавности
      setTimeout(() => {
        onGameOver(scoreRef.current);
      }, 500);
    }
  }, [onGameOver]);

  const update = useCallback(() => {
    if (!canvasRef.current || !isPlaying) return;
    const canvas = canvasRef.current;
    const { width, height } = canvas;

    // 1. Update Ball Physics
    ballVel.current.y += GRAVITY;
    ballPos.current.x += ballVel.current.x;
    ballPos.current.y += ballVel.current.y;

    // 2. Trail Logic
    trail.current.push({ ...ballPos.current });
    if (trail.current.length > 40) trail.current.shift();

    // 3. Floor/Ceiling Collisions (Bounce)
    if (ballPos.current.y + BALL_RADIUS >= height) {
      ballPos.current.y = height - BALL_RADIUS;
      ballVel.current.y = -ballVel.current.y * 0.85; // Bounce with slight damping
    }
    if (ballPos.current.y - BALL_RADIUS <= 0) {
      ballPos.current.y = BALL_RADIUS;
      ballVel.current.y = -ballVel.current.y * 0.85; // Bounce with slight damping
    }

    // 4. Wall Collisions (Left/Right)
    let hitWall = false;
    
    // Right Wall
    if (ballPos.current.x + BALL_RADIUS >= width) {
      ballPos.current.x = width - BALL_RADIUS;
      ballVel.current.x = -MOVE_SPEED_X; // Flip direction
      hitWall = true;
    } 
    // Left Wall
    else if (ballPos.current.x - BALL_RADIUS <= 0) {
      ballPos.current.x = BALL_RADIUS;
      ballVel.current.x = MOVE_SPEED_X; // Flip direction
      hitWall = true;
    }

    if (hitWall) {
      // Logic when hitting a wall:
      // a. Check if hit a spike
      const hitSpike = spikes.current.some(spike => {
        if (spike.side === "left" && ballPos.current.x <= BALL_RADIUS + SPIKE_WIDTH) {
           return Math.abs(ballPos.current.y - spike.y) < (SPIKE_HEIGHT + BALL_RADIUS);
        }
        if (spike.side === "right" && ballPos.current.x >= width - BALL_RADIUS - SPIKE_WIDTH) {
           return Math.abs(ballPos.current.y - spike.y) < (SPIKE_HEIGHT + BALL_RADIUS);
        }
        return false;
      });

      if (hitSpike) {
        endGame();
        return;
      }

      // b. If safe, increment score & change BG
      scoreRef.current += 1;
      setScore(scoreRef.current);
      
      // Random new color that isn't the current one
      let newColorIdx;
      do {
        newColorIdx = Math.floor(Math.random() * BG_COLORS.length);
      } while (BG_COLORS[newColorIdx] === bgColor);
      setBgColor(BG_COLORS[newColorIdx]);

      // c. Refresh spikes
      spawnSpikes(height);
    }

      draw();
    requestRef.current = requestAnimationFrame(update);
  }, [isPlaying, bgColor, endGame, draw]); // Dependencies needed for React state updates inside

  const handleTap = useCallback((e?: React.MouseEvent | React.TouchEvent) => {
    // Защита от двойного срабатывания (touch + click)
    const now = Date.now();
    if (now - lastTapTimeRef.current < 200) {
      return;
    }
    lastTapTimeRef.current = now;

    if (e && 'touches' in e) {
      e.preventDefault();
      isTouchDeviceRef.current = true;
    } else if (e && isTouchDeviceRef.current) {
      // Игнорируем click после touch
      setTimeout(() => {
        isTouchDeviceRef.current = false;
      }, 300);
      return;
    }

    if (!isPlaying && !gameOver && !showRules) {
      initGame();
      return;
    }
    if (gameOver) return;

    // Jump mechanic
    ballVel.current.y = JUMP_FORCE;
  }, [isPlaying, gameOver, showRules, initGame]);

  // --- Effects ---

  // Resize Handler и инициализация canvas
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        // Use visible window size
        const width = window.innerWidth;
        const height = window.innerHeight;
        console.log('[BallAndWallGame] Инициализация canvas:', { width, height });
        canvasRef.current.width = width;
        canvasRef.current.height = height;
        // Center ball initially
        ballPos.current = { x: width / 2, y: height / 2 };
        // Draw initial state (даже если игра не запущена, чтобы показать мяч)
        draw();
      } else {
        console.warn('[BallAndWallGame] canvasRef.current is null');
      }
    };
    
    window.addEventListener('resize', handleResize);
    // Initial setup - пробуем несколько раз для гарантии
    const timeoutId1 = setTimeout(() => {
      handleResize();
    }, 50);
    const timeoutId2 = setTimeout(() => {
      handleResize();
    }, 200);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId1);
      clearTimeout(timeoutId2);
    };
  }, [draw]);

  // Game Loop Trigger
  useEffect(() => {
    if (isPlaying) {
      requestRef.current = requestAnimationFrame(update);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, update]);

  // Confetti эффект убран, так как canvas-confetti не установлен
  // Можно добавить позже, если нужно


  // --- Render ---

  return (
    <div 
      className="game-container" 
      onClick={(e) => handleTap(e)}
      onTouchStart={(e) => handleTap(e)}
      style={{ 
        backgroundColor: bgColor, 
        transition: "background-color 0.5s ease"
      }}
    >
      {/* Background Score */}
      <div className="game-score-overlay">
        {score}
      </div>

      <canvas 
        ref={canvasRef} 
        className="game-canvas"
      />

      {/* Rules Overlay */}
      <AnimatePresence>
        {showRules && (
          <MyNewGameRulesScreen onStart={() => {
            setShowRules(false);
            initGame();
          }} />
        )}
      </AnimatePresence>

    </div>
  );
}
