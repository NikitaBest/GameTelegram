import { useState, useEffect } from 'react';
import BackgroundStars from '../components/BackgroundStars';
import { getActiveDraws } from '../api/services/activeDrawsService';
import { formatTime } from '../utils/mockData';
import './ActiveDrawsPage.css';

/**
 * Страница активных розыгрышей
 * Отображается, когда пользователь заходит без параметра tgWebAppStartParam
 */
const ActiveDrawsPage = ({ onSelectDraw }) => {
  const [draws, setDraws] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  console.log('ActiveDrawsPage рендер, isLoading:', isLoading, 'draws:', draws.length, 'error:', error);

  useEffect(() => {
    setIsLoading(true);
    console.log('Загрузка активных розыгрышей...');
    getActiveDraws()
      .then((response) => {
        console.log('Ответ активных розыгрышей:', response);
        if (response.isSuccess && response.value) {
          setDraws(response.value);
        } else {
          setError(response.error || 'Ошибка загрузки');
        }
      })
      .catch((err) => {
        console.error('Ошибка загрузки активных розыгрышей:', err);
        setError('Не удалось загрузить розыгрыши');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  // Вычисляем общий призовой фонд
  const calculatePrizeFund = (prizeList) => {
    if (!prizeList?.items) return 0;
    return prizeList.items.reduce((sum, item) => {
      const prizeValue = parseFloat(item.prize.value) || 0;
      return sum + prizeValue * item.countWinner;
    }, 0);
  };

  return (
    <div className="active-draws-page">
      <BackgroundStars />
      <div className="active-draws-content">
        <div className="title-block">
          <h1 className="page-title">Активные розыгрыши</h1>
          <p className="page-subtitle">Выберите розыгрыш для участия</p>
        </div>
        
        <div className="draws-list">
          {isLoading && (
            <p className="placeholder-text">Загрузка розыгрышей...</p>
          )}
          
          {error && (
            <p className="placeholder-text error-text">{error}</p>
          )}
          
          {!isLoading && !error && draws.length === 0 && (
            <p className="placeholder-text">Нет активных розыгрышей</p>
          )}
          
          {!isLoading && !error && draws.map((draw) => (
            <div 
              key={draw.id} 
              className="draw-card"
              onClick={() => onSelectDraw?.(draw.id)}
            >
              <div className="draw-card-header">
                <h3 className="draw-card-title">{draw.name}</h3>
                {draw.participating?.maxPoints !== null && (
                  <div className="draw-card-score">
                    {draw.participating.maxPointsAlias || `${draw.participating.maxPoints} очков`}
                  </div>
                )}
              </div>
              
              <div className="draw-card-info">
                <div className="draw-card-prize">
                  <span className="prize-label">Призовой фонд:</span>
                  <span className="prize-value">{calculatePrizeFund(draw.prizeList)} ₽</span>
                </div>
                
                <div className="draw-card-time">
                  <span className="time-label">До конца:</span>
                  <span className="time-value">
                    {(() => {
                      const time = formatTime(draw.secondsToEnd);
                      return `${time.hours}:${time.minutes}:${time.seconds}`;
                    })()}
                  </span>
                </div>
              </div>
              
              <div className="draw-card-footer">
                {draw.hasParticipating ? (
                  <span className="draw-status participating">Вы участвуете</span>
                ) : (
                  <span className="draw-status new">Новый</span>
                )}
                <span className="draw-arrow">→</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ActiveDrawsPage;
