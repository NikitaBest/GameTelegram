import { useCallback, useEffect, useRef, useState } from 'react';
import {
  GAME_HEIGHT,
  GAME_WIDTH,
  GameEffect,
  GameObject,
  GameObjectType,
  GameState,
  SHIP_HEIGHT,
  SHIP_WIDTH,
} from '../lib/game-types';

type MovementDirection = 'left' | 'right' | 'stop';

interface UseGameLogicResult {
  gameState: GameState;
  playerX: number;
  playerY: number;
  gameObjects: GameObject[];
  effects: GameEffect[];
  startGame: () => void;
  resetGame: () => void;
  setMovement: (dir: MovementDirection) => void;
  setPlayerPosition: (x: number, y: number) => void;
}

const INITIAL_STATE: GameState = {
  score: 0,
  multiplier: 1,
  level: 1,
  lives: 3,
  isPlaying: false,
  isPaused: false,
  isGameOver: false,
};

let objectIdCounter = 1;
let effectIdCounter = 1;

export function useGameLogic(): UseGameLogicResult {
  const [gameState, setGameState] = useState<GameState>(INITIAL_STATE);
  const [playerX, setPlayerX] = useState(GAME_WIDTH / 2 - SHIP_WIDTH / 2);
  const [playerY, setPlayerY] = useState(GAME_HEIGHT - SHIP_HEIGHT - 20);
  const [gameObjects, setGameObjects] = useState<GameObject[]>([]);
  const [effects, setEffects] = useState<GameEffect[]>([]);

  const movementRef = useRef<MovementDirection>('stop');
  const lastSpawnTimeRef = useRef(0);
  const lastFrameTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  // Используем refs для позиции игрока в игровом цикле, чтобы избежать лишних зависимостей
  const playerXRef = useRef(playerX);
  const playerYRef = useRef(playerY);
  const gameObjectsRef = useRef<GameObject[]>([]);
  
  // Синхронизируем refs с state
  useEffect(() => {
    playerXRef.current = playerX;
  }, [playerX]);
  
  useEffect(() => {
    playerYRef.current = playerY;
  }, [playerY]);
  
  useEffect(() => {
    gameObjectsRef.current = gameObjects;
  }, [gameObjects]);

  const spawnObject = useCallback(() => {
    // Только звезды и кометы
    const types: GameObjectType[] = ['star', 'asteroid'];
    const type = types[Math.floor(Math.random() * types.length)];

    const width = 50;
    const height = 50;
    const x = Math.random() * (GAME_WIDTH - width);
    const y = -height;
    const speed = 2 + Math.random() * 3;

    const obj: GameObject = {
      id: objectIdCounter++,
      x,
      y,
      width,
      height,
      speed,
      type,
    };

    setGameObjects(prev => [...prev, obj]);
  }, []);

  const addEffect = useCallback((x: number, y: number, type: GameEffect['type'], text?: string) => {
    const effect: GameEffect = {
      id: Date.now() + effectIdCounter++,
      x,
      y,
      type,
      text,
    };
    setEffects(prev => [...prev, effect]);
    // авто‑очистка
    setTimeout(() => {
      setEffects(prev => prev.filter(e => e.id !== effect.id));
    }, 900);
  }, []);

  const startGame = useCallback(() => {
    setGameState({
      ...INITIAL_STATE,
      isPlaying: true,
    });
    setGameObjects([]);
    setEffects([]);
    movementRef.current = 'stop';
    lastSpawnTimeRef.current = 0;
    lastFrameTimeRef.current = null;
  }, []);

  const resetGame = useCallback(() => {
    startGame();
  }, [startGame]);

  const setMovement = useCallback((dir: MovementDirection) => {
    movementRef.current = dir;
  }, []);

  const setPlayerPosition = useCallback((x: number, y: number) => {
    setPlayerX(Math.max(0, Math.min(GAME_WIDTH - SHIP_WIDTH, x)));
    setPlayerY(Math.max(0, Math.min(GAME_HEIGHT - SHIP_HEIGHT, y)));
  }, []);

  // основной игровой цикл
  useEffect(() => {
    if (!gameState.isPlaying || gameState.isPaused || gameState.isGameOver) {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }

    const loop = (time: number) => {
      if (!lastFrameTimeRef.current) {
        lastFrameTimeRef.current = time;
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      const deltaMs = time - lastFrameTimeRef.current;
      lastFrameTimeRef.current = time;
      const delta = deltaMs / (1000 / 60); // в кадрах

      // движение корабля по X от клавиатуры (только если есть движение)
      if (movementRef.current !== 'stop') {
        const speed = 8;
        const currentX = playerXRef.current;
        let nextX = currentX;
        if (movementRef.current === 'left') nextX -= speed * delta;
        if (movementRef.current === 'right') nextX += speed * delta;
        nextX = Math.max(0, Math.min(GAME_WIDTH - SHIP_WIDTH, nextX));
        if (Math.abs(nextX - currentX) > 0.1) {
          playerXRef.current = nextX;
          setPlayerX(nextX);
        }
      }

      // спавн объектов примерно раз в 500–700 мс, но не больше 15 объектов на экране
      const maxObjects = 15;
      if ((lastSpawnTimeRef.current === 0 || time - lastSpawnTimeRef.current > 600) && 
          gameObjectsRef.current.length < maxObjects) {
        spawnObject();
        lastSpawnTimeRef.current = time;
      }
      
      // движение объектов и коллизии
      setGameObjects(prev => {
        // Используем актуальное значение из state, а не из замыкания
        const currentObjects = prev;
        const updated: GameObject[] = [];
        let scoreDelta = 0;
        let livesDelta = 0;

        for (const obj of currentObjects) {
          const ny = obj.y + obj.speed * delta * 4;
          if (ny > GAME_HEIGHT + 100) {
            continue; // вышел за экран
          }

          const nextObj = { ...obj, y: ny };

          // проверка столкновений (используем актуальные значения из refs)
          const playerRect = {
            x: playerXRef.current,
            y: playerYRef.current,
            w: SHIP_WIDTH,
            h: SHIP_HEIGHT,
          };
          const objRect = {
            x: nextObj.x,
            y: nextObj.y,
            w: nextObj.width,
            h: nextObj.height,
          };

          const intersect =
            playerRect.x < objRect.x + objRect.w &&
            playerRect.x + playerRect.w > objRect.x &&
            playerRect.y < objRect.y + objRect.h &&
            playerRect.y + playerRect.h > objRect.y;

          if (intersect) {
            const centerX = nextObj.x + nextObj.width / 2;
            const centerY = nextObj.y + nextObj.height / 2;
            if (nextObj.type === 'asteroid' || nextObj.type === 'enemy') {
              livesDelta -= 1;
              addEffect(centerX, centerY, 'damage', '-1');
            } else {
              scoreDelta += 10;
              addEffect(centerX, centerY, 'score', '+10');
            }
            continue; // объект удаляем
          }

          updated.push(nextObj);
        }

        if (scoreDelta !== 0 || livesDelta !== 0) {
          setGameState(prevState => {
            const nextScore = prevState.score + scoreDelta * prevState.multiplier;
            const nextLives = Math.max(0, prevState.lives + livesDelta);
            const isGameOver = nextLives <= 0;
            return {
              ...prevState,
              score: nextScore,
              lives: nextLives,
              isGameOver,
              isPlaying: isGameOver ? false : prevState.isPlaying,
            };
          });
        }

        return updated;
      });

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current != null) {
        cancelAnimationFrame(rafRef.current);
      }
      rafRef.current = null;
      lastFrameTimeRef.current = null;
    };
  }, [addEffect, gameState.isGameOver, gameState.isPaused, gameState.isPlaying, spawnObject]);

  return {
    gameState,
    playerX,
    playerY,
    gameObjects,
    effects,
    startGame,
    resetGame,
    setMovement,
    setPlayerPosition,
  };
}


