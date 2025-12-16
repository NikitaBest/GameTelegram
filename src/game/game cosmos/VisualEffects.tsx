import { motion, AnimatePresence } from 'framer-motion';
import { GameEffect, GAME_WIDTH, GAME_HEIGHT } from '../../lib/game-types';

interface VisualEffectsProps {
  effects: GameEffect[];
}

export function VisualEffects({ effects }: VisualEffectsProps) {
  return (
    <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden">
      <AnimatePresence>
        {effects.map((effect) => (
          <motion.div
            key={effect.id}
            initial={{ opacity: 1, scale: 0.5, y: 0 }}
            animate={{ opacity: 0, scale: 1.5, y: -100 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute flex items-center justify-center font-black"
            style={{
              left: `${(effect.x / GAME_WIDTH) * 100}%`,
              top: `${(effect.y / GAME_HEIGHT) * 100}%`,
              // Center the effect
              marginLeft: '5%', 
            }}
          >
            {effect.type === 'score' ? (
              <div className="flex flex-col items-center">
                <div className="text-4xl text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,1)]">
                  {effect.text || '+10'}
                </div>
                <div className="w-20 h-20 absolute rounded-full border-4 border-yellow-400 opacity-50 animate-ping" />
              </div>
            ) : (
              <div className="flex flex-col items-center">
                 <div className="text-4xl text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,1)]">
                  {effect.text || '-1'}
                </div>
                <div className="absolute inset-0 bg-red-500/30 blur-xl rounded-full scale-150" />
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
      
      {/* Full screen red flash for damage */}
      <AnimatePresence>
        {(() => {
          // Мемоизируем проверку, чтобы не вычислять каждый рендер
          const hasRecentDamage = effects.some(e => e.type === 'damage' && Date.now() - e.id < 200);
          return hasRecentDamage ? (
            <motion.div
              initial={{ opacity: 0.5 }}
              animate={{ opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 bg-red-600/30 mix-blend-overlay z-50"
            />
          ) : null;
        })()}
      </AnimatePresence>
    </div>
  );
}
