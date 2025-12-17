import { useState, useEffect } from 'react';
import BalanceIndicator from '../components/BalanceIndicator';
import CountdownTimer from '../components/CountdownTimer';
import TreasureChest from '../components/TreasureChest';
import PrizeFundButton from '../components/PrizeFundButton';
import PrizeList from '../components/PrizeList';
import UserRank from '../components/UserRank';
import StartGameButton from '../components/StartGameButton';
import Leaderboard from '../components/Leaderboard';
import BackgroundStars from '../components/BackgroundStars';
import { startDraw } from '../api/services/drawService';
import { useAuth } from '../hooks/useAuth';
import { formatTime } from '../utils/mockData';
import './DrawPage.css';

const DrawPage = ({ drawId, onStartGame, onParticipatingIdReceived }) => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [drawData, setDrawData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Загружаем данные о розыгрыше
  useEffect(() => {
    if (drawId && isAuthenticated && !authLoading) {
      setIsLoading(true);
      setError(null);

      if (import.meta.env.DEV) {
        console.log(`Загрузка данных розыгрыша для ID: ${drawId}`);
      }

      startDraw(drawId)
        .then((response) => {
          console.log('Данные розыгрыша:', response);
          
          if (response.isSuccess && response.value) {
            const data = response.value;
            const draw = data.draw;
            const prizeList = draw.prizeList;

            // Вычисляем общий призовой фонд (сумма всех призов)
            const totalPrizeFund = prizeList.items.reduce((sum, item) => {
              const prizeValue = parseFloat(item.prize.value) || 0;
              // Учитываем количество победителей для каждого приза
              return sum + (prizeValue * item.countWinner);
            }, 0);

            // Преобразуем призы в формат для компонента
            const prizes = prizeList.items.map((item) => {
              let placeLabel = '';
              let icon = 'silver';
              
              if (item.startPosition === 1 && item.endPosition === 1) {
                placeLabel = 'Приз за 1 место';
                icon = 'gold';
              } else if (item.startPosition === 2 && item.endPosition === 2) {
                placeLabel = 'Приз за 2 место';
                icon = 'silver';
              } else if (item.startPosition === 3 && item.endPosition === 3) {
                placeLabel = 'Приз за 3 место';
                icon = 'bronze';
              } else {
                placeLabel = `Приз за ${item.startPosition} - ${item.endPosition} места`;
                icon = 'silver';
              }

              return {
                place: item.startPosition === item.endPosition ? item.startPosition : `${item.startPosition}-${item.endPosition}`,
                label: placeLabel,
                amount: item.prize.value,
                currency: 'Р', // Рубли
                icon: icon,
              };
            });

            // Формируем данные для компонентов
            const formattedData = {
              balance: user?.starsAmount || 0,
              timeUntilEnd: draw.secondsToEnd || 0,
              prizeFund: {
                total: totalPrizeFund,
                currency: 'Р',
              },
              prizes: prizes,
              starsForParticipants: {
                minAmount: Math.floor(draw.starsDistributionAmount) || 0,
                description: 'Всем участникам звёзды',
                note: 'Чем выше место тем больше звёзд!',
                iconCount: 2,
              },
              userRank: {
                place: null, // TODO: получить из отдельного запроса или из ответа
                label: 'Твоё место будет определено после игры',
              },
              attemptsLeft: data.maxAttemptsCount - data.attemptsCount,
              maxAttemptsCount: data.maxAttemptsCount,
            };

            setDrawData(formattedData);
            
            // Передаём participatingId (id из ответа) в родительский компонент
            if (data.id) {
              onParticipatingIdReceived?.(data.id);
              if (import.meta.env.DEV) {
                console.log('ParticipatingId:', data.id);
              }
            }
          } else {
            setError(response.error || 'Ошибка при загрузке данных розыгрыша');
          }
        })
        .catch((err) => {
          console.error('Ошибка при загрузке данных розыгрыша:', err);
          setError(err.message || 'Не удалось загрузить данные розыгрыша');
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      // Если нет drawId или пользователь не авторизован, показываем ошибку
      if (!drawId) {
        setError('ID розыгрыша не указан');
      } else if (!isAuthenticated) {
        setError('Требуется авторизация');
      }
      setIsLoading(false);
    }
  }, [drawId, isAuthenticated, authLoading, user]);

  const handleCountdownComplete = () => {
    console.log('Розыгрыш завершен');
  };

  const handleStartGame = () => {
    console.log('Начало игры');
    onStartGame?.();
  };

  if (isLoading || authLoading) {
    return (
      <div className="draw-page">
        <BackgroundStars />
        <div className="draw-content">
          <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255, 255, 255, 0.7)' }}>
            Загрузка данных розыгрыша...
          </div>
        </div>
      </div>
    );
  }

  if (error || !drawData) {
    return (
      <div className="draw-page">
        <BackgroundStars />
        <div className="draw-content">
          <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255, 255, 255, 0.7)' }}>
            {error || 'Не удалось загрузить данные розыгрыша'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="draw-page">
      <BackgroundStars />
      <div className="draw-content">
        <BalanceIndicator balance={drawData.balance} />
        
        <CountdownTimer 
          initialSeconds={drawData.timeUntilEnd}
          onComplete={handleCountdownComplete}
        />
        
        <TreasureChest prizeFund={drawData.prizeFund} />
        
        <div className="info-panel-container">
          <PrizeFundButton />
          
          <div className="info-panel">
            <PrizeList 
              prizes={drawData.prizes}
              starsForParticipants={drawData.starsForParticipants}
            />
            
            <UserRank userRank={drawData.userRank} />
          </div>
        </div>
        
        <StartGameButton onClick={handleStartGame} />
        
        <Leaderboard drawId={drawId} userId={user?.id} />
      </div>
    </div>
  );
};

export default DrawPage;

