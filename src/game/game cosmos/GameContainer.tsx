import { useEffect, useRef, useCallback } from 'react';
import { useGameLogic } from '../../hooks/useGameLogic';
import { Spaceship } from './Spaceship';
import { FallingObject } from './FallingObject';
import { HUD } from './HUD';
import { StartScreen } from './StartScreen';
import { GameOverScreen } from './GameOverScreen';
import { GAME_WIDTH, GAME_HEIGHT, SHIP_WIDTH, SHIP_HEIGHT } from '../../lib/game-types';
import { getStableViewportHeight, isTelegramWebApp } from '../../lib/telegram';
import { VisualEffects } from './VisualEffects';
import './GameContainer.css';

export function GameContainer() {
  const {
    gameState,
    playerX,
    playerY,
    gameObjects,
    effects,
    startGame,
    resetGame,
    setMovement,
    setPlayerPosition
  } = useGameLogic();

  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  // Convert screen coordinates to game coordinates
  const screenToGameCoords = useCallback((screenX: number, screenY: number): [number, number] => {
    if (!containerRef.current) return [playerX, playerY];
    
    const rect = containerRef.current.getBoundingClientRect();
    const relativeX = screenX - rect.left;
    const relativeY = screenY - rect.top;
    const percentageX = relativeX / rect.width;
    const percentageY = relativeY / rect.height;
    const gameX = percentageX * GAME_WIDTH - SHIP_WIDTH / 2;
    const gameY = percentageY * GAME_HEIGHT - SHIP_HEIGHT / 2;
    
    // Clamp to game bounds
    const clampedX = Math.max(0, Math.min(GAME_WIDTH - SHIP_WIDTH, gameX));
    const clampedY = Math.max(0, Math.min(GAME_HEIGHT - SHIP_HEIGHT, gameY));
    return [clampedX, clampedY];
  }, [playerX, playerY]);

  // Handle drag/touch start
  const handlePointerStart = (e: React.TouchEvent | React.MouseEvent) => {
    // Don't interfere with buttons or other interactive elements
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('[role="button"]')) {
      return; // Let button handle its own click
    }
    
    if (!gameState.isPlaying || gameState.isPaused) return;
    e.preventDefault();
    isDraggingRef.current = true;
    
    const clientX = 'touches' in e && e.touches.length > 0 
      ? e.touches[0].clientX 
      : 'clientX' in e ? e.clientX : 0;
    const clientY = 'touches' in e && e.touches.length > 0 
      ? e.touches[0].clientY 
      : 'clientY' in e ? e.clientY : 0;
    
    const [gameX, gameY] = screenToGameCoords(clientX, clientY);
    setMovement('stop'); // Stop keyboard movement
    setPlayerPosition(gameX, gameY);
  };

  // Handle drag/touch move (local handler)
  const handlePointerMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!gameState.isPlaying || gameState.isPaused || !isDraggingRef.current) return;
    e.preventDefault();
    
    const clientX = 'touches' in e && e.touches.length > 0 
      ? e.touches[0].clientX 
      : 'clientX' in e ? e.clientX : 0;
    const clientY = 'touches' in e && e.touches.length > 0 
      ? e.touches[0].clientY 
      : 'clientY' in e ? e.clientY : 0;
    
    const [gameX, gameY] = screenToGameCoords(clientX, clientY);
    setPlayerPosition(gameX, gameY);
  };

  // Handle drag/touch end
  const handlePointerEnd = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    isDraggingRef.current = false;
  };

  // Add global mouse/touch move handlers for smooth dragging
  useEffect(() => {
    if (!gameState.isPlaying || gameState.isPaused) return;

    const handleGlobalMove = (e: MouseEvent | TouchEvent) => {
      if (!isDraggingRef.current) return;
      e.preventDefault();
      const clientX = 'touches' in e && e.touches.length > 0 
        ? e.touches[0].clientX 
        : 'clientX' in e ? e.clientX : 0;
      const clientY = 'touches' in e && e.touches.length > 0 
        ? e.touches[0].clientY 
        : 'clientY' in e ? e.clientY : 0;
      const [gameX, gameY] = screenToGameCoords(clientX, clientY);
      setPlayerPosition(gameX, gameY);
    };

    const handleGlobalEnd = () => {
      isDraggingRef.current = false;
    };

    window.addEventListener('mousemove', handleGlobalMove);
    window.addEventListener('touchmove', handleGlobalMove, { passive: false });
    window.addEventListener('mouseup', handleGlobalEnd);
    window.addEventListener('touchend', handleGlobalEnd);

    return () => {
      window.removeEventListener('mousemove', handleGlobalMove);
      window.removeEventListener('touchmove', handleGlobalMove);
      window.removeEventListener('mouseup', handleGlobalEnd);
      window.removeEventListener('touchend', handleGlobalEnd);
    };
      }, [gameState.isPlaying, gameState.isPaused, setPlayerPosition, screenToGameCoords]);

  // Keyboard controls (optional, can be kept)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameState.isPlaying || gameState.isPaused) return;
      if (e.key === 'ArrowLeft' || e.key === 'a') setMovement('left');
      if (e.key === 'ArrowRight' || e.key === 'd') setMovement('right');
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'ArrowRight' || e.key === 'd') {
        setMovement('stop');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState.isPlaying, gameState.isPaused, setMovement]);

  // Use Telegram viewport height if available, otherwise use dynamic viewport height
  const viewportHeight = isTelegramWebApp() 
    ? getStableViewportHeight() 
    : typeof window !== 'undefined' ? window.innerHeight : 600;

  return (
    <div 
      className="flex flex-col items-center justify-center w-full bg-black overflow-hidden relative touch-none"
      style={{ height: `${viewportHeight}px` }}
    >
      {/* Game Area Wrapper - Handles aspect ratio and scaling */}
      {/* On mobile: flex-1 w-full relative (fills screen). On desktop: constrained */}
      <div className="w-full h-full md:max-w-4xl md:h-auto md:px-2 md:flex-1 md:flex md:items-center md:justify-center relative">
        <div 
          ref={containerRef}
          className={`relative overflow-hidden md:rounded-xl md:shadow-[0_0_50px_rgba(8,145,178,0.2)] bg-black md:ring-1 md:ring-white/10 w-full h-full md:aspect-auto md:h-[600px] md:w-[800px] ${gameState.isPlaying && !gameState.isGameOver ? 'cursor-grab active:cursor-grabbing' : ''}`}
          onMouseDown={gameState.isPlaying && !gameState.isGameOver ? handlePointerStart : undefined}
          onMouseMove={gameState.isPlaying && !gameState.isGameOver ? handlePointerMove : undefined}
          onMouseUp={gameState.isPlaying && !gameState.isGameOver ? handlePointerEnd : undefined}
          onMouseLeave={gameState.isPlaying && !gameState.isGameOver ? handlePointerEnd : undefined}
          onTouchStart={gameState.isPlaying && !gameState.isGameOver ? handlePointerStart : undefined}
          onTouchMove={gameState.isPlaying && !gameState.isGameOver ? handlePointerMove : undefined}
          onTouchEnd={gameState.isPlaying && !gameState.isGameOver ? handlePointerEnd : undefined}
        >
          {/* Inner container to scale logic coordinates to visual size */}
          <div className="absolute inset-0 w-full h-full">
            {/* We map internal 800x600 coordinates to percentage-based display for responsiveness */}
            <div className="relative w-full h-full">
              
              {/* Background Layer */}
              <div 
                className="absolute inset-0 z-0 opacity-60"
                style={{
                  // Однотонный космический фон вместо внешнего изображения
                  backgroundImage: 'radial-gradient(circle at 20% 0%, #22d3ee 0, transparent 45%), radial-gradient(circle at 80% 20%, #a855f7 0, transparent 55%), radial-gradient(circle at 10% 80%, #f97316 0, transparent 55%), radial-gradient(circle at 90% 90%, #38bdf8 0, transparent 55%), radial-gradient(circle at 50% 50%, #020617 0, #020617 60%)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              />
              
              {/* Animated Stars Layer (CSS) */}
              <div 
                className="absolute inset-0 z-0 opacity-40"
                style={{
                  backgroundImage: 'radial-gradient(2px 2px at 20% 30%, white, transparent), radial-gradient(2px 2px at 60% 70%, white, transparent), radial-gradient(1px 1px at 50% 50%, white, transparent), radial-gradient(1px 1px at 80% 10%, white, transparent), radial-gradient(2px 2px at 90% 40%, white, transparent), radial-gradient(1px 1px at 33% 60%, white, transparent), radial-gradient(3px 3px at 10% 80%, white, transparent), radial-gradient(1px 1px at 40% 90%, white, transparent)',
                  backgroundSize: '200% 200%',
                  animation: 'pulse 4s infinite',
                }}
              />

              {/* Game Elements - Using % for positions to be responsive */}
              {gameState.isPlaying && !gameState.isGameOver && (
                <>
                  {/* Spaceship - now can move in 2D */}
                  <div 
                    className="absolute z-20 will-change-transform"
                    style={{ 
                      left: `${(playerX / GAME_WIDTH) * 100}%`,
                      top: `${(playerY / GAME_HEIGHT) * 100}%`,
                      width: `${(SHIP_WIDTH / GAME_WIDTH) * 100}%`, // width relative to game width
                      height: `${(SHIP_HEIGHT / GAME_HEIGHT) * 100}%`, // height relative to game height
                      transform: 'translateZ(0)', // GPU acceleration
                    }}
                  >
                     <Spaceship x={0} /* x is handled by parent div style */ /> 
                  </div>

                  {gameObjects.map(obj => (
                    <div
                      key={obj.id}
                      className="absolute z-10 will-change-transform"
                      style={{
                        left: `${(obj.x / GAME_WIDTH) * 100}%`,
                        top: `${(obj.y / GAME_HEIGHT) * 100}%`,
                        width: `${(obj.width / GAME_WIDTH) * 100}%`,
                        height: `${(obj.height / GAME_HEIGHT) * 100}%`,
                        transform: 'translateZ(0)', // GPU acceleration
                      }}
                    >
                       <FallingObject object={obj} />
                    </div>
                  ))}
                  
                  <VisualEffects effects={effects} />
                  <HUD gameState={gameState} />
                </>
              )}

              {/* Screens */}
              {!gameState.isPlaying && !gameState.isGameOver && (
                <StartScreen onStart={startGame} />
              )}

              {gameState.isGameOver && (
                <GameOverScreen score={gameState.score} onRestart={resetGame} />
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
