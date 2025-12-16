import { memo } from 'react';
import { GameObject } from '../../lib/game-types';
import { Star } from 'lucide-react';

interface FallingObjectProps {
  object: GameObject;
}

function FallingObjectComponent({ object }: FallingObjectProps) {
  const { type } = object;

  const getIcon = () => {
    if (type === 'asteroid') {
      return (
        <img 
          src="/cameta.svg"
          alt="Comet"
          className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(239,68,68,0.6)] scale-125 md:scale-110"
          style={{
            animation: 'rotate 2s linear infinite',
          }}
        />
      );
    }
    // По умолчанию звезда
    return <Star className="text-yellow-400 fill-yellow-400/50 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]" />;
  };

  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className={`w-full h-full ${type === 'asteroid' ? 'p-0 md:p-1' : 'p-1'}`}>
        {getIcon()}
      </div>
    </div>
  );
}

// Мемоизируем компонент, чтобы избежать лишних ре-рендеров
export const FallingObject = memo(FallingObjectComponent);
