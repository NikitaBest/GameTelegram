import { ReactNode, useMemo } from 'react';
import { Hand, Target, AlertTriangle } from 'lucide-react';
import type { Game } from '../api/services/drawService';

export interface GameRule {
  icon: ReactNode; // React компонент иконки или img элемент
  text: string;
}

interface GameRulesScreenProps {
  rules?: GameRule[]; // Правила в формате компонента (опционально, для обратной совместимости)
  gameData?: Game | null; // Данные игры из бекенда (опционально)
  onStart: () => void;
  startButtonType?: 'button' | 'text'; // Тип кнопки: кнопка или текст внизу
  startButtonIcon?: ReactNode; // Опциональная иконка для кнопки
}

export function GameRulesScreen({ 
  rules, 
  gameData,
  onStart, 
  startButtonType = 'button',
  startButtonIcon 
}: GameRulesScreenProps) {
  const defaultStartIcon = startButtonIcon || <Hand className="w-4 h-4 md:w-5 md:h-5" strokeWidth={2.5} />;

  // Преобразуем правила из бекенда в формат GameRule[]
  const processedRules = useMemo(() => {
    // Если есть правила в формате компонента - используем их
    if (rules && rules.length > 0) {
      return rules;
    }

    // Если есть данные игры из бекенда - преобразуем их в правила
    if (gameData) {
      const backendRules: GameRule[] = [];

      // Правила игры (rules)
      if (gameData.rules) {
        backendRules.push({
          icon: <Target className="w-5 h-5 md:w-6 md:h-6 text-white" strokeWidth={2.5} />,
          text: gameData.rules
        });
      }

      // Описание управления (gameControlDescription)
      if (gameData.gameControlDescription) {
        backendRules.push({
          icon: <Hand className="w-5 h-5 md:w-6 md:h-6 text-white" strokeWidth={2.5} />,
          text: gameData.gameControlDescription
        });
      }

      // Условия получения очков (pointConditionDescription)
      if (gameData.pointConditionDescription) {
        backendRules.push({
          icon: <AlertTriangle className="w-5 h-5 md:w-6 md:h-6 text-white" strokeWidth={2.5} />,
          text: gameData.pointConditionDescription
        });
      }

      return backendRules;
    }

    // Если ничего нет - возвращаем пустой массив
    return [];
  }, [rules, gameData]);

  return (
    <div 
      className="absolute inset-0 z-50 flex flex-col items-center justify-center text-white pointer-events-auto px-4"
      onClick={onStart}
      style={{
        background: 'rgba(0, 0, 0, 0.2)',
        backdropFilter: 'blur(2px)',
      }}
    >
      {/* Прозрачное окно с правилами - по центру, адаптивный размер */}
      <div 
        className="w-full max-w-sm rounded-2xl p-5 md:p-6 mb-6"
        style={{
          background: 'rgba(173, 216, 230, 0.05)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Заголовок */}
        <h2 className="text-xl md:text-2xl font-bold text-white text-center mb-5">
          Правила игры
        </h2>

        {/* Список правил */}
        <div className="space-y-4">
          {processedRules.map((rule, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {rule.icon}
              </div>
              <p className="text-white text-sm md:text-base leading-relaxed flex-1">
                {rule.text}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Кнопка или текст "Тапни чтобы начать" */}
      {startButtonType === 'button' ? (
        <div 
          className="flex items-center gap-2.5 text-white cursor-pointer transition-all active:scale-95 whitespace-nowrap"
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
          {defaultStartIcon}
          <span className="text-sm md:text-base lg:text-lg font-bold whitespace-nowrap">
            Тапни чтобы начать
          </span>
        </div>
      ) : (
        <>
          <style>{`
            @keyframes blink {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.3; }
            }
          `}</style>
          <div 
            className="absolute bottom-8 left-0 right-0 flex items-center justify-center gap-3 text-white cursor-pointer whitespace-nowrap"
            onClick={onStart}
            style={{
              gap: 'clamp(10px, 2.5vw, 16px)',
              animation: 'blink 1.5s ease-in-out infinite',
            }}
          >
            {startButtonIcon || defaultStartIcon}
            <span className="font-bold whitespace-nowrap" style={{
              fontSize: 'clamp(1.5rem, 4vw, 2rem)',
            }}>
              Тапни чтобы начать
            </span>
          </div>
        </>
      )}
    </div>
  );
}

