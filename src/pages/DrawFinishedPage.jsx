import { useState, useEffect } from 'react';
import Leaderboard from '../components/Leaderboard';
import BackgroundStars from '../components/BackgroundStars';
import { getLeaderboard } from '../api/services/leaderboardService';
import { startDraw } from '../api/services/drawService';
import { useAuth } from '../hooks/useAuth';
import '../styles/gradient-text.css';
import '../styles/action-button.css';
import './DrawFinishedPage.css';

const DrawFinishedPage = ({ drawId, onNewDraws }) => {
  const { user } = useAuth();
  const [userRank, setUserRank] = useState(null);
  const [userPoints, setUserPoints] = useState(null);
  const [pointsToTop10, setPointsToTop10] = useState(null);
  const [awardDateTime, setAwardDateTime] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Форматирование даты на русском языке
  const formatAwardDate = (dateString) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      
      // Проверяем валидность даты
      if (isNaN(date.getTime())) {
        return '';
      }
      
      const day = date.getDate();
      // Массив месяцев в родительном падеже
      const monthsGenitive = [
        'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
        'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
      ];
      const month = monthsGenitive[date.getMonth()];
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      
      return `до ${day} ${month} в ${hours}:${minutes}`;
    } catch (error) {
      console.error('Ошибка форматирования даты:', error);
      return '';
    }
  };

  // Загружаем данные пользователя и вычисляем разницу с 10-м местом
  useEffect(() => {
    if (!drawId) {
      setIsLoading(false);
      return;
    }

    const loadUserData = async () => {
      try {
        // Получаем participatingId и awardDateTime из startDraw
        const drawResponse = await startDraw(drawId);
        const participatingId = drawResponse.isSuccess && drawResponse.value 
          ? drawResponse.value.id 
          : null;
        
        // Сохраняем дату начисления приза
        if (drawResponse.isSuccess && drawResponse.value?.draw?.awardDateTime) {
          setAwardDateTime(drawResponse.value.draw.awardDateTime);
        }

        // Загружаем лидерборд (первые 10 мест и данные пользователя)
        const [top10Response, userResponse] = await Promise.all([
          getLeaderboard(drawId, 1, 10), // Первые 10 мест
          getLeaderboard(drawId, 0, 0) // Данные текущего пользователя
        ]);

        let currentUser = null;

        // Ищем пользователя в ответе (0, 0)
        if (userResponse.isSuccess && userResponse.value) {
          const items = userResponse.value.items || [];
          
          // Ищем по participatingId
          if (participatingId) {
            currentUser = items.find(item => 
              item.participatingId === participatingId || 
              String(item.participatingId) === String(participatingId) ||
              Number(item.participatingId) === Number(participatingId)
            );
          }
          
          // Если не нашли, ищем по userTelegramId
          if (!currentUser && user?.telegramId) {
            currentUser = items.find(item => item.userTelegramId === user.telegramId);
          }
        }

        // Если не нашли в (0, 0), ищем в большем диапазоне
        if (!currentUser) {
          const widerResponse = await getLeaderboard(drawId, 1, 100);
          if (widerResponse.isSuccess && widerResponse.value) {
            const items = widerResponse.value.items || [];
            
            if (participatingId) {
              currentUser = items.find(item => 
                item.participatingId === participatingId || 
                String(item.participatingId) === String(participatingId) ||
                Number(item.participatingId) === Number(participatingId)
              );
            }
            
            if (!currentUser && user?.telegramId) {
              currentUser = items.find(item => item.userTelegramId === user.telegramId);
            }
          }
        }

        if (currentUser) {
          setUserRank(currentUser.topNumber);
          setUserPoints(currentUser.maxPoints || 0);

          // Если пользователь не в топ-10, вычисляем разницу с 10-м местом
          if (currentUser.topNumber > 10 && top10Response.isSuccess && top10Response.value) {
            const top10Items = top10Response.value.items || [];
            if (top10Items.length > 0) {
              // Берем последнее место из топ-10 (10-е место)
              const tenthPlace = top10Items[top10Items.length - 1];
              const tenthPlacePoints = tenthPlace.maxPoints || 0;
              const userPointsValue = currentUser.maxPoints || 0;
              const difference = tenthPlacePoints - userPointsValue;
              
              if (difference > 0) {
                setPointsToTop10(difference);
              }
            }
          }
        }
      } catch (error) {
        console.error('Ошибка при загрузке данных пользователя:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, [drawId, user]);

  // Определяем, какой заголовок показывать
  const isInTop10 = userRank && userRank <= 10;
  const isNotInTop10 = userRank && userRank > 10 && pointsToTop10 !== null;

  return (
    <div className="draw-finished-page">
      <BackgroundStars />
      
      <div className="draw-finished-content">
        {/* Заголовок с текстом */}
        <div className="draw-finished-header">
          {!isLoading && isInTop10 ? (
            <>
              <img 
                src="/призер.png" 
                alt="Ты в призёрах" 
                className="draw-finished-default-image"
              />
              <img 
                src="/в_призерах.png" 
                alt="Ты в призёрах" 
                className="draw-finished-title-image"
              />
              <p className="draw-finished-subtitle">
                Приз начисляется {formatAwardDate(awardDateTime)}
              </p>
            </>
          ) : !isLoading && isNotInTop10 ? (
            <>
              <img 
                src="/попытка.png" 
                alt="Хорошая попытка" 
                className="draw-finished-default-image"
              />
              <img 
                src="/хорошая_попытка.png" 
                alt="Хорошая попытка" 
                className="draw-finished-title-image"
              />
              <p className="draw-finished-subtitle">
                До призов не хватило {pointsToTop10} очков. Новый розыгрыш уже ждёт.
              </p>
            </>
          ) : (
            <>
              <img 
                src="/звершен.png" 
                alt="Розыгрыш завершён" 
                className="draw-finished-default-image"
              />
              <img 
                src="/завершен.png" 
                alt="Розыгрыш завершён" 
                className="draw-finished-title-image"
              />
              <p className="draw-finished-subtitle">
                В этот раз без тебя. Загляни в новые — там тебя ждут призы.
              </p>
            </>
          )}
        </div>

        {/* Список участников */}
        <div className="draw-finished-leaderboard">
          <Leaderboard drawId={drawId} showPrizes={true} hideHeader={true} />
        </div>

      </div>

      {/* Кнопка к новым розыгрышам - фиксированная внизу */}
      <div className="draw-finished-button-container">
        <button className="draw-finished-button action-button-base" onClick={onNewDraws}>
          К новым победам!
        </button>
      </div>
    </div>
  );
};

export default DrawFinishedPage;

