import { useEffect, useRef, useState, useCallback } from "react";
import { GameRulesScreen, GameRule } from "../GameRulesScreen";
import { Target, AlertTriangle } from 'lucide-react';
import { AnimatePresence } from "framer-motion";
import { soundManager } from "../../utils/soundManager";
import "./MyNewGame.css";

const tapIcon = '/hugeicons_tap-01.svg';

interface BallAndWallGameProps {
  onGameOver: (score: number) => void;
}

// --- Game Constants & Types ---
const GRAVITY = 0.18; // Уменьшена для более плавного падения
const JUMP_FORCE = -8; // Уменьшена для более плавного прыжка
const MOVE_SPEED_X = 2.2; // Уменьшена для более медленного движения
const BALL_RADIUS = 12;
const SPIKE_WIDTH = 60; // Увеличено с 45
const SPIKE_HEIGHT = 55; // Увеличено с 40

// Background colors and corresponding ball/spike colors
const BG_COLORS = [
  "#A799DF", // фон 1
  "#DD95B6", // фон 2
  "#9BDAB5", // фон 3
  "#B77576", // фон 4
];

// Ball colors corresponding to each background
const BALL_COLORS = [
  "#291A65", // шар для фона A799DF
  "#91377D", // шар для фона DD95B6
  "#24794D", // шар для фона 9BDAB5
  "#772526", // шар для фона B77576
];

// Spike colors corresponding to each background
const SPIKE_COLORS = [
  "#99D869", // шипы для фона A799DF
  "#33E2CD", // шипы для фона DD95B6
  "#F56BFF", // шипы для фона 9BDAB5
  "#7C93EB", // шипы для фона B77576
];

interface Point {
  x: number;
  y: number;
}

interface Spike {
  y: number;
  side: "left" | "right";
  active: boolean;
  offsetX: number; // Смещение для анимации выезда/заезда (0-1)
  state: "entering" | "visible" | "exiting"; // Состояние анимации
  animationTime: number; // Время начала анимации
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

export function BallAndWallGame({ onGameOver }: BallAndWallGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number | undefined>(undefined);
  
  // Game State
  const [isPlaying, setIsPlaying] = useState(false);
  const [showRules, setShowRules] = useState(true);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [bgColor, setBgColor] = useState(BG_COLORS[0]);
  const [isDestroying, setIsDestroying] = useState(false); // Состояние для отслеживания разрушения

  // Правила игры
  const gameRules: GameRule[] = [
    {
      icon: <img src={tapIcon} alt="tap" className="w-5 h-5 md:w-6 md:h-6" />,
      text: 'Тапай по экрану, чтобы мяч прыгал'
    },
    {
      icon: <Target className="w-5 h-5 md:w-6 md:h-6 text-white" strokeWidth={2.5} />,
      text: 'Отскакивай от стен для получения очков'
    },
    {
      icon: <AlertTriangle className="w-5 h-5 md:w-6 md:h-6 text-white" strokeWidth={2.5} />,
      text: 'Избегай шипов на стенах!'
    }
  ];

  // Physics State (refs for performance in loop)
  const ballPos = useRef<Point>({ x: 0, y: 0 });
  const ballVel = useRef<Point>({ x: MOVE_SPEED_X, y: 0 });
  const trail = useRef<Point[]>([]);
  const spikes = useRef<Spike[]>([]);
  const scoreRef = useRef(0);
  const gameOverHandledRef = useRef(false);
  const lastTapTimeRef = useRef<number>(0);
  const isTouchDeviceRef = useRef<boolean>(false);
  // Эффекты удара
  const tapEffectTimeRef = useRef<number>(0); // Время последнего тапа для эффекта
  const wallHitEffectTimeRef = useRef<number>(0); // Время последнего удара о стену для эффекта
  // Система частиц
  const particles = useRef<Particle[]>([]);
  // Эффект разрушения
  const destroyStartTimeRef = useRef<number>(0); // Время начала разрушения

  // --- Game Loop Logic ---

  const initGame = useCallback(() => {
    if (!canvasRef.current) return;
    const { width, height } = canvasRef.current;
    
    ballPos.current = { x: width / 2, y: height / 2 };
    ballVel.current = { x: MOVE_SPEED_X, y: 0 }; // Start moving right
    trail.current = [];
    spikes.current = [];
    particles.current = []; // Очищаем частицы
    scoreRef.current = 0;
    setScore(0);
    setGameOver(false);
    setIsPlaying(true);
    setBgColor(BG_COLORS[0]);
    gameOverHandledRef.current = false;
    setIsDestroying(false); // Сбрасываем флаг разрушения
    destroyStartTimeRef.current = 0;
    // Создаем начальные шипы
    spawnSpikes(height);
  }, []);

  const spawnSpikes = (canvasHeight: number) => {
    // Generate some random spikes
    // Difficulty scaling: more spikes as score increases
    const spikeCount = Math.min(1 + Math.floor(scoreRef.current / 5), 5);
    const newSpikes: Spike[] = [];
    const now = Date.now();
    const MIN_SPIKE_DISTANCE = SPIKE_HEIGHT + 20; // Минимальное расстояние между шипами
    
    // Генерируем шипы с проверкой на перекрытие
    let attempts = 0;
    const maxAttempts = spikeCount * 20; // Максимальное количество попыток
    
    while (newSpikes.length < spikeCount && attempts < maxAttempts) {
      attempts++;
      const side = Math.random() > 0.5 ? "left" : "right";
      const y = Math.random() * (canvasHeight - 100) + 50; // Keep away from extreme edges
      
      // Проверяем, не перекрывается ли новый шип с существующими
      const overlaps = newSpikes.some(existingSpike => {
        // Проверяем расстояние по вертикали
        const verticalDistance = Math.abs(existingSpike.y - y);
        return verticalDistance < MIN_SPIKE_DISTANCE;
      });
      
      // Если не перекрывается, добавляем
      if (!overlaps) {
        newSpikes.push({ 
          y, 
          side, 
          active: true,
          offsetX: 0, // Начинаем с выезда
          state: "entering",
          animationTime: now
        });
      }
    }
    
    spikes.current = newSpikes;
  };

  // Создание частиц, разлетающихся от шара
  const createParticles = useCallback((x: number, y: number, count: number = 8, intensity: number = 1.0) => {
    const colorIndex = BG_COLORS.indexOf(bgColorRef.current);
    const particleColor = colorIndex >= 0 ? BALL_COLORS[colorIndex] : BALL_COLORS[0];
    
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const speed = (2 + Math.random() * 3) * intensity;
      particles.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        maxLife: 1.0,
        size: 2 + Math.random() * 3,
        color: particleColor,
      });
    }
  }, []);

  // Используем ref для bgColor, чтобы не пересоздавать draw при каждой смене цвета
  const bgColorRef = useRef(bgColor);
  useEffect(() => {
    bgColorRef.current = bgColor;
  }, [bgColor]);

  const draw = useCallback(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    const { width, height } = canvasRef.current;

    // Clear Canvas
    ctx.clearRect(0, 0, width, height);

    // Get current color index based on background color (используем ref для актуального значения)
    const colorIndex = BG_COLORS.indexOf(bgColorRef.current);
    const currentBallColor = colorIndex >= 0 ? BALL_COLORS[colorIndex] : BALL_COLORS[0];
    const currentSpikeColor = colorIndex >= 0 ? SPIKE_COLORS[colorIndex] : SPIKE_COLORS[0];

    // Draw Spikes with animation
    ctx.fillStyle = currentSpikeColor;
    spikes.current.forEach(spike => {
      // Вычисляем текущую ширину шипа на основе анимации (от 0 до SPIKE_WIDTH)
      const currentWidth = spike.offsetX * SPIKE_WIDTH;
      
      ctx.beginPath();
      if (spike.side === "left") {
        // Всегда начинаем от стены (x = 0), анимируем только ширину
        ctx.moveTo(0, spike.y - SPIKE_HEIGHT/2);
        ctx.lineTo(currentWidth, spike.y);
        ctx.lineTo(0, spike.y + SPIKE_HEIGHT/2);
      } else {
        // Всегда начинаем от стены (x = width), анимируем только ширину
        ctx.moveTo(width, spike.y - SPIKE_HEIGHT/2);
        ctx.lineTo(width - currentWidth, spike.y);
        ctx.lineTo(width, spike.y + SPIKE_HEIGHT/2);
      }
      ctx.closePath();
      ctx.fill();
    });

    // Draw Trail (белая тень) - используем now из ниже
    // Draw Particles (частицы, отлетающие от шара)
    particles.current.forEach(particle => {
      const alpha = particle.life / particle.maxLife;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Draw Ball with effects
    // Используем один вызов Date.now() для оптимизации
    const now = Date.now();
    
    // Вычисляем прогресс растворения trail во время разрушения
    let trailFadeProgress = 1; // Множитель прозрачности для trail
    let destroyElapsed = 0;
    let destroyProgress = 0;
    if (isDestroying) {
      destroyElapsed = now - destroyStartTimeRef.current;
      const DESTROY_DURATION = 800;
      destroyProgress = Math.min(1, destroyElapsed / DESTROY_DURATION);
      trailFadeProgress = 1 - destroyProgress; // От 1 до 0
    }
    
    // Draw Trail (белая тень) - рисуем после вычисления now
    trail.current.forEach((pos, index) => {
      const opacity = index / Math.max(1, trail.current.length);
      const size = (index / Math.max(1, trail.current.length)) * BALL_RADIUS;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, size, 0, Math.PI * 2);
      // Белая тень с прозрачностью, уменьшающейся во время разрушения
      ctx.fillStyle = `rgba(255, 255, 255, ${opacity * 0.3 * trailFadeProgress})`;
      ctx.fill();
    });
    const TAP_EFFECT_DURATION = 150; // Длительность эффекта тапа (мс)
    const WALL_HIT_EFFECT_DURATION = 200; // Длительность эффекта удара о стену (мс)
    
    // Эффект тапа (легкое увеличение размера)
    const tapEffectElapsed = now - tapEffectTimeRef.current;
    const tapEffectProgress = Math.max(0, 1 - (tapEffectElapsed / TAP_EFFECT_DURATION));
    const tapScale = 1 + (tapEffectProgress * 0.3); // Увеличение до 30%
    
    // Эффект удара о стену (более сильное увеличение + вспышка)
    const wallHitEffectElapsed = now - wallHitEffectTimeRef.current;
    const wallHitEffectProgress = Math.max(0, 1 - (wallHitEffectElapsed / WALL_HIT_EFFECT_DURATION));
    const wallHitScale = 1 + (wallHitEffectProgress * 0.5); // Увеличение до 50%
    
    // Эффект разрушения (используем уже вычисленные значения)
    let destroyScale = 1;
    let destroyOpacity = 1;
    if (isDestroying) {
      // destroyElapsed и destroyProgress уже вычислены выше
      
      // Мячик уменьшается и становится прозрачным
      destroyScale = 1 - destroyProgress * 0.7; // Уменьшается до 30% (более заметно)
      destroyOpacity = 1 - destroyProgress * 1.2; // Быстрее исчезает
      
      // Эффект раскалывания на две крупные части
      const halfSize = BALL_RADIUS * (1 - destroyProgress * 0.4); // Размер половинок уменьшается медленнее
      const splitDistance = destroyProgress * 40; // Расстояние разлета половинок
      const rotation = destroyProgress * Math.PI * 0.5; // Вращение половинок
      
      // Определяем направление разлета (противоположно направлению движения)
      const moveAngle = Math.atan2(ballVel.current.y, ballVel.current.x);
      const leftAngle = moveAngle + Math.PI + rotation;
      const rightAngle = moveAngle + Math.PI - rotation;
      
      // Левая половина
      const leftX = ballPos.current.x + Math.cos(leftAngle) * splitDistance;
      const leftY = ballPos.current.y + Math.sin(leftAngle) * splitDistance;
      
      // Правая половина
      const rightX = ballPos.current.x + Math.cos(rightAngle) * splitDistance;
      const rightY = ballPos.current.y + Math.sin(rightAngle) * splitDistance;
      
      // Рисуем две крупные половинки
      ctx.save();
      ctx.globalAlpha = Math.max(0, destroyOpacity * 0.9);
      
      // Левая половина
      ctx.beginPath();
      ctx.arc(leftX, leftY, halfSize, 0, Math.PI * 2);
      ctx.fillStyle = currentBallColor;
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Правая половина
      ctx.beginPath();
      ctx.arc(rightX, rightY, halfSize, 0, Math.PI * 2);
      ctx.fillStyle = currentBallColor;
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
      ctx.lineWidth = 2;
      ctx.stroke();
      
      ctx.restore();
    }
    
    // Используем максимальный эффект (но учитываем разрушение)
    const currentScale = isDestroying 
      ? destroyScale 
      : Math.max(tapScale, wallHitScale);
    const currentRadius = BALL_RADIUS * currentScale;
    
    // Вспышка при ударе о стену (только если не разрушается)
    if (wallHitEffectProgress > 0 && !isDestroying) {
      ctx.save();
      ctx.globalAlpha = wallHitEffectProgress * 0.4;
      ctx.beginPath();
      ctx.arc(ballPos.current.x, ballPos.current.y, currentRadius + 5, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
      ctx.fill();
      ctx.restore();
    }
    
    // Основной шар (только если не разрушился полностью)
    if (destroyOpacity > 0) {
      ctx.save();
      ctx.globalAlpha = destroyOpacity;
      ctx.beginPath();
      ctx.arc(ballPos.current.x, ballPos.current.y, currentRadius, 0, Math.PI * 2);
      ctx.fillStyle = currentBallColor;
      ctx.fill();
      
      // Ball Highlight
      ctx.beginPath();
      ctx.arc(ballPos.current.x - 3, ballPos.current.y - 3, (currentRadius * 0.33), 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.fill();
      ctx.restore();
    }
  }, []); // Убрали bgColor из зависимостей, используем ref вместо этого

  const startDestruction = useCallback(() => {
    // Запускаем эффект разрушения
    setIsDestroying(true);
    destroyStartTimeRef.current = Date.now();
    
    // Звук столкновения с шипами
    soundManager.play('hit');
    
    // НЕ останавливаем движение мячика - он продолжает двигаться
    
    // Создаем много частиц для эффекта разрушения
    const colorIndex = BG_COLORS.indexOf(bgColorRef.current);
    const ballColor = colorIndex >= 0 ? BALL_COLORS[colorIndex] : BALL_COLORS[0];
    
    // Создаем больше частиц для более сильного эффекта
    for (let i = 0; i < 30; i++) {
      const angle = (Math.PI * 2 * i) / 30 + (Math.random() - 0.5) * 0.4;
      const speed = 4 + Math.random() * 5; // Увеличена скорость
      particles.current.push({
        x: ballPos.current.x,
        y: ballPos.current.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        maxLife: 1.0,
        size: 4 + Math.random() * 5, // Увеличен размер
        color: ballColor,
      });
    }
  }, []);

  const endGame = useCallback(() => {
    setIsPlaying(false);
    setGameOver(true);
    
    // ВАЖНО: Вызываем onGameOver только один раз
    if (!gameOverHandledRef.current) {
      gameOverHandledRef.current = true;
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      
      // Задержка после анимации разрушения
      setTimeout(() => {
        onGameOver(scoreRef.current);
      }, 800);
    }
  }, [onGameOver]);

  const update = useCallback(() => {
    if (!canvasRef.current) return;
    // Продолжаем цикл даже во время разрушения, чтобы анимация работала
    if (!isPlaying && !isDestroying) return;
    
    const canvas = canvasRef.current;
    const { width, height } = canvas;

    // 1. Update Ball Physics (всегда, даже во время разрушения)
    ballVel.current.y += GRAVITY;
    ballPos.current.x += ballVel.current.x;
    ballPos.current.y += ballVel.current.y;

    // Проверяем, не закончилась ли анимация разрушения
    if (isDestroying) {
      const destroyElapsed = Date.now() - destroyStartTimeRef.current;
      const DESTROY_DURATION = 800; // Длительность анимации разрушения (мс) - увеличена
      
      if (destroyElapsed >= DESTROY_DURATION) {
        // Анимация закончилась, завершаем игру
        endGame();
        return;
      }
      
      // Продолжаем анимацию разрушения (обновляем частицы и физику)
    }

    // 2. Trail Logic
    if (!isDestroying) {
      trail.current.push({ ...ballPos.current });
      if (trail.current.length > 40) trail.current.shift();
    } else {
      // Во время разрушения постепенно уменьшаем длину trail (растворяем тень)
      const destroyElapsed = Date.now() - destroyStartTimeRef.current;
      const DESTROY_DURATION = 800;
      const destroyProgress = Math.min(1, destroyElapsed / DESTROY_DURATION);
      
      // Удаляем элементы из начала trail, чтобы тень постепенно исчезала
      const targetLength = Math.floor(40 * (1 - destroyProgress));
      while (trail.current.length > targetLength) {
        trail.current.shift();
      }
    }

    // 2.5. Update Particles (с ограничением количества для производительности)
    particles.current = particles.current
      .map(particle => ({
        ...particle,
        x: particle.x + particle.vx,
        y: particle.y + particle.vy,
        life: particle.life - 0.02, // Затухание
        vy: particle.vy + 0.1, // Гравитация для частиц
      }))
      .filter(particle => particle.life > 0);
    
    // Ограничиваем количество частиц для производительности (максимум 50)
    if (particles.current.length > 50) {
      particles.current = particles.current.slice(-50);
    }

    // 2.6. Update Spikes Animation
    const now = Date.now();
    const ENTER_DURATION = 400; // Время выезда (мс)
    const VISIBLE_DURATION = 2000; // Время видимости (мс)
    const EXIT_DURATION = 400; // Время заезда (мс)
    
    spikes.current = spikes.current.map(spike => {
      const elapsed = now - spike.animationTime;
      
      if (spike.state === "entering") {
        const progress = Math.min(1, elapsed / ENTER_DURATION);
        spike.offsetX = progress; // От 0 до 1
        
        if (progress >= 1) {
          spike.state = "visible";
          spike.animationTime = now;
        }
      } else if (spike.state === "visible") {
        spike.offsetX = 1; // Полностью выехали
        
        if (elapsed >= VISIBLE_DURATION) {
          spike.state = "exiting";
          spike.animationTime = now;
        }
      } else if (spike.state === "exiting") {
        const progress = Math.min(1, elapsed / EXIT_DURATION);
        spike.offsetX = 1 - progress; // От 1 до 0
        
        if (progress >= 1) {
          // Шип полностью заехал, помечаем как неактивный
          spike.active = false;
        }
      }
      
      return spike;
    }).filter(spike => spike.active || spike.offsetX > 0); // Удаляем только полностью заехавшие

    // 3. Floor/Ceiling Collisions (Bounce) - только если не разрушается
    if (!isDestroying) {
      // Столкновение с полом
      if (ballPos.current.y + BALL_RADIUS >= height) {
        ballPos.current.y = height - BALL_RADIUS;
        // Отталкиваем шарик вверх с более сильным отскоком
        const bounceVelocity = -Math.abs(ballVel.current.y) * 1.1; // Увеличен коэффициент отскока
        // Минимальная скорость отскока увеличена для более сильного отталкивания
        const minBounceVelocity = -6;
        ballVel.current.y = Math.min(bounceVelocity, minBounceVelocity);
      }
      // Столкновение с потолком
      if (ballPos.current.y - BALL_RADIUS <= 0) {
        ballPos.current.y = BALL_RADIUS;
        ballVel.current.y = -ballVel.current.y * 0.85; // Bounce with slight damping
      }

      // 4. Проверка столкновения с шипами (ПЕРЕД проверкой стен, чтобы остановить мяч)
      const hitSpike = spikes.current.find(spike => {
        // Проверяем только если шип полностью выехал
        if (spike.offsetX < 0.9) return false;
        
        if (spike.side === "left") {
          // Проверяем столкновение с левым шипом
          const distanceX = ballPos.current.x - BALL_RADIUS;
          const distanceY = Math.abs(ballPos.current.y - spike.y);
          return distanceX <= SPIKE_WIDTH && distanceY < (SPIKE_HEIGHT / 2 + BALL_RADIUS);
        } else {
          // Проверяем столкновение с правым шипом
          const distanceX = width - (ballPos.current.x + BALL_RADIUS);
          const distanceY = Math.abs(ballPos.current.y - spike.y);
          return distanceX <= SPIKE_WIDTH && distanceY < (SPIKE_HEIGHT / 2 + BALL_RADIUS);
        }
      });

      if (hitSpike) {
        // Откатываем позицию мяча назад, чтобы он не пролетел через шип
        if (hitSpike.side === "left") {
          ballPos.current.x = BALL_RADIUS + SPIKE_WIDTH;
        } else {
          ballPos.current.x = width - BALL_RADIUS - SPIKE_WIDTH;
        }
        // НЕ останавливаем движение - мяч продолжает двигаться во время разрушения
        // Запускаем эффект разрушения
        startDestruction();
        return;
      }

      // 5. Wall Collisions (Left/Right)
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
        // Эффект удара о стену
        wallHitEffectTimeRef.current = Date.now();
        // Создаем частицы при ударе о стену
        createParticles(ballPos.current.x, ballPos.current.y, 12, 1.5);
        // Звук удара о стену (score, так как это успешное отскакивание)
        soundManager.play('score');

        // b. If safe, increment score & change BG
        scoreRef.current += 1;
        setScore(scoreRef.current);
        
        // Random new color that isn't the current one
        let newColorIdx;
        do {
          newColorIdx = Math.floor(Math.random() * BG_COLORS.length);
        } while (BG_COLORS[newColorIdx] === bgColorRef.current);
        setBgColor(BG_COLORS[newColorIdx]);

        // c. Refresh spikes
        spawnSpikes(height);
      }
    }

    // Всегда отрисовываем (даже во время разрушения)
    draw();
    requestRef.current = requestAnimationFrame(update);
  }, [isPlaying, isDestroying, endGame, draw, startDestruction, createParticles, spawnSpikes]); // Добавили isDestroying

  // Обработка клика (только для десктопа)
  const handleClick = useCallback((_e: React.MouseEvent) => {
    // Игнорируем click события на touch устройствах
    if (isTouchDeviceRef.current) {
      setTimeout(() => {
        isTouchDeviceRef.current = false;
      }, 300);
      return;
    }

    // Защита от двойного срабатывания
    const now = Date.now();
    if (now - lastTapTimeRef.current < 200) {
      return;
    }
    lastTapTimeRef.current = now;

    if (!showRules && isPlaying && !gameOver) {
      // Jump mechanic
      ballVel.current.y = JUMP_FORCE;
      // Эффект тапа
      tapEffectTimeRef.current = Date.now();
      // Создаем частицы при тапе
      createParticles(ballPos.current.x, ballPos.current.y, 6, 0.8);
      // Звук прыжка
      soundManager.play('jump');
    } else if (!isPlaying && !gameOver && !showRules) {
      initGame();
    }
  }, [showRules, isPlaying, gameOver, initGame, createParticles]);

  // --- Effects ---

  // Resize Handler и инициализация canvas (с debounce для производительности)
  useEffect(() => {
    let resizeTimeout: number | undefined;
    let initTimeout1: number | undefined;
    let initTimeout2: number | undefined;
    
    const handleResize = () => {
      if (canvasRef.current) {
        // Use visible window size
        const width = window.innerWidth;
        const height = window.innerHeight;
        canvasRef.current.width = width;
        canvasRef.current.height = height;
        // Center ball only if game is not playing (initial state)
        if (!isPlaying && !gameOver) {
          ballPos.current = { x: width / 2, y: height / 2 };
        }
        // Draw current state (draw стабильна, не пересоздается)
        draw();
      }
    };
    
    // Debounced resize handler для производительности
    const debouncedResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(handleResize, 150);
    };
    
    window.addEventListener('resize', debouncedResize, { passive: true });
    // Initial setup - пробуем несколько раз для гарантии
    initTimeout1 = setTimeout(() => {
      handleResize();
    }, 50);
    initTimeout2 = setTimeout(() => {
      handleResize();
    }, 200);

    return () => {
      window.removeEventListener('resize', debouncedResize);
      clearTimeout(resizeTimeout);
      clearTimeout(initTimeout1);
      clearTimeout(initTimeout2);
    };
  }, [isPlaying, gameOver, draw]); // draw стабильна (пустые зависимости), можно безопасно добавить

  // Game Loop Trigger
  useEffect(() => {
    // Запускаем цикл если игра идет ИЛИ идет анимация разрушения
    if (isPlaying || isDestroying) {
      requestRef.current = requestAnimationFrame(update);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, isDestroying, update]);

  // Confetti эффект убран, так как canvas-confetti не установлен
  // Можно добавить позже, если нужно


  // --- Effects ---

  // Добавляем обработчик touch через ref с passive: false
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTouch = (e: TouchEvent) => {
      // Защита от двойного срабатывания
      const now = Date.now();
      if (now - lastTapTimeRef.current < 200) {
        return;
      }
      lastTapTimeRef.current = now;

      if (!showRules && isPlaying && !gameOver) {
        e.preventDefault(); // Теперь можем использовать preventDefault
        isTouchDeviceRef.current = true;
        // Jump mechanic
        ballVel.current.y = JUMP_FORCE;
        // Эффект тапа
        tapEffectTimeRef.current = Date.now();
        // Создаем частицы при тапе
        createParticles(ballPos.current.x, ballPos.current.y, 6, 0.8);
        // Звук прыжка
        soundManager.play('jump');
      } else if (!isPlaying && !gameOver && !showRules) {
        e.preventDefault();
        initGame();
      }
    };

    container.addEventListener('touchstart', handleTouch, { passive: false });

    return () => {
      container.removeEventListener('touchstart', handleTouch);
    };
  }, [showRules, isPlaying, gameOver, initGame, createParticles]);

  return (
    <div 
      ref={containerRef}
      className="game-container" 
      onClick={handleClick}
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
          <GameRulesScreen 
            rules={gameRules}
            onStart={() => {
              setShowRules(false);
              initGame();
            }}
            startButtonType="text"
            startButtonIcon={<img src={tapIcon} alt="tap" className="w-5 h-5 md:w-6 md:h-6" />}
          />
        )}
      </AnimatePresence>

    </div>
  );
}
