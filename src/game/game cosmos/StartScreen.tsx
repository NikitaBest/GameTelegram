import { Button } from '../../components/ui/button';
import { Star } from 'lucide-react';

interface StartScreenProps {
  onStart: () => void;
}

export function StartScreen({ onStart }: StartScreenProps) {
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm text-white p-4 pointer-events-auto">
      <div className="mb-12 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
        <h1 className="font-display text-4xl md:text-6xl font-black text-white mb-4 drop-shadow-[0_0_15px_rgba(6,182,212,0.5)] leading-tight">
          КОСМИЧЕСКИЙ СБОРЩИК
        </h1>
        <p className="text-cyan-200/70 font-display tracking-widest text-sm md:text-lg">
          ВЫЖИВИ В КОСМОСЕ
        </p>
      </div>

      {/* Instructions */}
      <div className="mb-8 flex flex-row gap-6 items-center justify-center animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
        <div className="flex items-center gap-3 text-white/90">
          <Star className="w-6 h-6 text-yellow-400 fill-yellow-400/50 drop-shadow-[0_0_10px_rgba(250,204,21,0.8)]" />
          <span className="font-display text-sm md:text-base">Лови звезды</span>
        </div>
        <div className="flex items-center gap-3 text-white/90">
          <img 
            src="/cameta.svg" 
            alt="Comet" 
            className="w-6 h-6 drop-shadow-[0_0_15px_rgba(239,68,68,0.6)]"
          />
          <span className="font-display text-sm md:text-base">Избегай комет</span>
        </div>
      </div>

      <Button 
        onClick={(e) => {
          e.stopPropagation();
          onStart();
        }}
        size="lg"
        className="font-display text-lg md:text-xl px-10 py-6 md:px-16 md:py-8 bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_20px_rgba(8,145,178,0.6)] transition-all hover:scale-105 border-none w-full md:w-auto rounded-full pointer-events-auto z-50"
      >
        НАЧАТЬ МИССИЮ
      </Button>
    </div>
  );
}
