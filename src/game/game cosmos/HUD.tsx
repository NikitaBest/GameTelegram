import { GameState } from '../../lib/game-types';
import { Heart, Trophy, Zap } from 'lucide-react';

interface HUDProps {
  gameState: GameState;
}

export function HUD({ gameState }: HUDProps) {
  return (
    <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start z-30 pointer-events-none">
      <div className="flex flex-col gap-2">
        {/* Score Board */}
        <div className="bg-black/40 backdrop-blur-md border border-cyan-500/30 p-3 rounded-lg flex items-center gap-4 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            <span className="font-display text-xl font-bold text-white tracking-widest">
              {gameState.score.toString().padStart(6, '0')}
            </span>
          </div>
          
          {gameState.multiplier > 1 && (
            <div className="flex items-center gap-1 text-green-400 animate-pulse font-bold">
              <Zap className="w-4 h-4" />
              <span>x{gameState.multiplier}</span>
            </div>
          )}
        </div>

        {/* Level Indicator */}
        <div className="text-cyan-400/80 font-display text-sm pl-1">
          УРОВЕНЬ {gameState.level}
        </div>
      </div>

      {/* Lives */}
      <div className="flex gap-1">
        {[...Array(3)].map((_, i) => (
          <Heart
            key={i}
            className={`w-8 h-8 transition-all duration-300 ${
              i < gameState.lives 
                ? 'text-red-500 fill-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]' 
                : 'text-red-900/30'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
