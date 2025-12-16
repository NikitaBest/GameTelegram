import { Button } from '../../components/ui/button';
import { RotateCcw, Trophy } from 'lucide-react';

interface GameOverScreenProps {
  score: number;
  onRestart: () => void;
}

export function GameOverScreen({ score, onRestart }: GameOverScreenProps) {
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md text-white">
      <div className="mb-8 text-center animate-in zoom-in duration-500">
        <h2 className="font-display text-5xl font-bold text-red-500 mb-2 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]">
          МИССИЯ ПРОВАЛЕНА
        </h2>
        <p className="text-gray-400">Сигнал потерян...</p>
      </div>

      <div className="bg-white/5 border border-white/10 p-8 rounded-xl mb-8 flex flex-col items-center min-w-[300px]">
        <Trophy className="w-12 h-12 text-yellow-500 mb-4" />
        <div className="text-sm text-cyan-200/60 uppercase tracking-widest mb-1">Итоговый счет</div>
        <div className="text-5xl font-mono font-bold text-white mb-6">
          {score.toLocaleString()}
        </div>
      </div>

      <Button 
        onClick={onRestart}
        size="lg"
        className="font-display bg-cyan-600 hover:bg-cyan-500 min-w-[160px] rounded-full px-8 py-6"
      >
        <RotateCcw className="mr-2 h-4 w-4" />
        Заново
      </Button>
    </div>
  );
}
