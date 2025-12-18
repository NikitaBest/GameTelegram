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
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [loadTime, setLoadTime] = useState(Date.now());
  
  // Загрузка данных о розыгрышах
  useEffect(() => {
    setIsLoading(true);
    const loadStartTime = Date.now();
    setLoadTime(loadStartTime);
    
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
  
  // Таймер для обновления времени в реальном времени
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000); // Обновляем каждую секунду
    
    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="active-draws-page">
      <BackgroundStars />
      <div className="active-draws-content">
        <div className="title-block">
          <h1 className="page-title">Активные розыгрыши</h1>
          <p className="page-subtitle">фарми звёзды!</p>
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
          
          {!isLoading && !error && draws.map((draw) => {
            // Вычисляем оставшееся время с учетом прошедшего времени
            const elapsedSeconds = Math.floor((currentTime - loadTime) / 1000);
            const remainingSeconds = Math.max(0, draw.secondsToEnd - elapsedSeconds);
            const time = formatTime(remainingSeconds);
            const timeString = `${time.hours}:${time.minutes}:${time.seconds}`;
            
            // Вычисляем оставшееся время в часах для определения цвета
            const remainingHours = remainingSeconds / 3600;
            const isLessThan2Hours = remainingHours < 2;
            
            return (
              <div 
                key={draw.id} 
                className="draw-card"
                onClick={() => onSelectDraw?.(draw.id)}
              >
                {/* Иконка слева по середине */}
                <div className="draw-card-icon">
                  <img src="/1many.svg" alt="" className="draw-card-icon-img" />
                </div>
                
                {/* Контент справа */}
                <div className="draw-card-content">
                  {/* Верхняя часть: информация и время */}
                  <div className="draw-card-header">
                    <div className="draw-card-info">
                      {draw.name && (
                        <h3 className="draw-card-title">
                          {draw.name}
                        </h3>
                      )}
                      {draw.description && (
                        <p className="draw-card-description">
                          {draw.description}
                        </p>
                      )}
                    </div>
                    <div className="draw-card-time-wrapper">
                      <div 
                        className="draw-card-time"
                        style={{
                          color: isLessThan2Hours ? '#FFAD98' : '#C7DFFF'
                        }}
                      >
                        {timeString}
                      </div>
                      {/* Иконка стрелки под временем */}
                      <div className="draw-card-footer">
                        {draw.attemptsCount > 0 ? (
                          <img 
                            src="/maki_arrow.svg" 
                            alt="Участвовать" 
                            className="draw-card-arrow-icon"
                          />
                        ) : (
                          <img 
                            src="/maki_arrow (1).svg" 
                            alt="Участвовать" 
                            className="draw-card-arrow-icon"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ActiveDrawsPage;
