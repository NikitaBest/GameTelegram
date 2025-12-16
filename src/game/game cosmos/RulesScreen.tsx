import { Target, Hand, Sparkles } from 'lucide-react';

interface RulesScreenProps {
  onStart: () => void;
}

export function RulesScreen({ onStart }: RulesScreenProps) {
  return (
    <div 
      className="absolute inset-0 z-50 flex flex-col items-center justify-center text-white pointer-events-auto px-4"
      onClick={onStart}
      style={{
        background: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(2px)',
      }}
    >
      {/* Прозрачное окно с правилами - по центру, адаптивный размер */}
      <div 
        className="w-full max-w-sm rounded-2xl p-5 md:p-6 mb-6"
        style={{
          background: 'rgba(173, 216, 230, 0.25)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Заголовок */}
        <h2 className="text-xl md:text-2xl font-bold text-white text-center mb-5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
          Правила игры
        </h2>

        {/* Список правил */}
        <div className="space-y-4">
          {/* Правило 1 */}
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <Target className="w-5 h-5 md:w-6 md:h-6 text-white" strokeWidth={2.5} />
            </div>
            <p className="text-white text-sm md:text-base leading-relaxed flex-1">
              Лови звезды для получения очков!
            </p>
          </div>

          {/* Правило 2 */}
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <Hand className="w-5 h-5 md:w-6 md:h-6 text-white" strokeWidth={2.5} />
            </div>
            <p className="text-white text-sm md:text-base leading-relaxed flex-1">
              Тапай по экрану, чтобы двигать корабль
            </p>
          </div>

          {/* Правило 3 */}
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-white" strokeWidth={2.5} />
            </div>
            <p className="text-white text-sm md:text-base leading-relaxed flex-1">
              Избегай комет, чтобы не потерять жизнь!
            </p>
          </div>
        </div>
      </div>

      {/* Кнопка "Тапни чтобы начать" */}
      <div 
        className="flex items-center gap-2.5 text-white cursor-pointer transition-all active:scale-95"
        onClick={onStart}
        style={{
          background: 'rgba(255, 255, 255, 0.15)',
          padding: '12px 24px',
          borderRadius: '14px',
          border: '1px solid rgba(255, 255, 255, 0.4)',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
          animation: 'pulse 2s ease-in-out infinite',
        }}
      >
        <Hand className="w-4 h-4 md:w-5 md:h-5" strokeWidth={2.5} />
        <span className="text-base md:text-lg font-bold">
          Тапни чтобы начать
        </span>
      </div>
    </div>
  );
}

