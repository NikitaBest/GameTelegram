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
  
  useEffect(() => {
    setIsLoading(true);
    getActiveDraws()
      .then((response) => {
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
              <h3 className="draw-card-title">{draw.name}</h3>
              
              <div className="draw-card-footer">
                <div className="draw-card-time">
                  {(() => {
                    const time = formatTime(draw.secondsToEnd);
                    return `${time.hours}:${time.minutes}:${time.seconds}`;
                  })()}
                </div>
                
                {draw.hasParticipating ? (
                  <span className="draw-status participating">Участвовать</span>
                ) : (
                  <span className="draw-status new">Участвовать</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ActiveDrawsPage;
