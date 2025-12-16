import { motion } from 'framer-motion';

interface SpaceshipProps {
  x: number;
}

export function Spaceship({ x }: SpaceshipProps) {
  return (
    <motion.div
      className="relative z-20 w-full h-full"
      initial={false}
      style={{ minWidth: '40px', minHeight: '40px' }}
    >
      <div className="relative w-full h-full group" style={{ minWidth: '40px', minHeight: '40px' }}>
        {/* Engine Glow */}
        <div 
          className="absolute left-1/2"
          style={{
            bottom: '-8px',
            transform: 'translateX(-50%)',
            width: '30%',
            height: '50%',
            background: 'rgba(6, 182, 212, 0.8)',
            filter: 'blur(8px)',
            animation: 'pulse 2s infinite',
          }}
        />
        <div 
          className="absolute left-1/2"
          style={{
            bottom: '-4px',
            transform: 'translateX(-50%)',
            width: '15%',
            height: '40%',
            background: 'white',
            filter: 'blur(4px)',
          }}
        />
        
        {/* Ship Body - Using custom car SVG */}
        <img 
          src="/car.svg"
          alt="Spaceship"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            filter: 'drop-shadow(0 0 10px rgba(34, 211, 238, 0.8))',
            transform: 'scale(1.1)',
          }}
          onError={(e) => {
            // Fallback если SVG не загрузился
            e.target.style.display = 'none';
          }}
        />
        
        {/* Fallback если SVG не загрузился */}
        <div 
          style={{
            width: '100%',
            height: '100%',
            background: 'linear-gradient(135deg, #06b6d4 0%, #22d3ee 100%)',
            borderRadius: '8px',
            border: '2px solid #22d3ee',
            display: 'none',
          }}
          className="spaceship-fallback"
        />
      </div>
    </motion.div>
  );
}
