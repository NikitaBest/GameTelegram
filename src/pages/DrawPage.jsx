import { useState, useEffect } from 'react';
import BalanceIndicator from '../components/BalanceIndicator';
import TasksButton from '../components/TasksButton';
import CountdownTimer from '../components/CountdownTimer';
import TreasureChest from '../components/TreasureChest';
import PrizeFundButton from '../components/PrizeFundButton';
import PrizeList from '../components/PrizeList';
import UserRank from '../components/UserRank';
import StartGameButton from '../components/StartGameButton';
import Leaderboard from '../components/Leaderboard';
import BackgroundStars from '../components/BackgroundStars';
import LoadingScreen from '../components/LoadingScreen';
import { startDraw } from '../api/services/drawService';
import { getLeaderboard, getUserRank } from '../api/services/leaderboardService';
import { useAuth } from '../hooks/useAuth';
import { formatTime } from '../utils/mockData';
import './DrawPage.css';

const DrawPage = ({ drawId, onStartGame, onParticipatingIdReceived, onAttemptsReceived, onGameIdReceived, onGameDataReceived }) => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [drawData, setDrawData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLeaderboardLoaded, setIsLeaderboardLoaded] = useState(false);
  const [isTasksButtonVisible, setIsTasksButtonVisible] = useState(true); // По умолчанию показываем, пока не проверим

  // Загружаем данные о розыгрыше
  useEffect(() => {
    if (drawId && isAuthenticated && !authLoading) {
      setIsLoading(true);
      setError(null);

      if (import.meta.env.DEV) {
        console.log(`Загрузка данных розыгрыша для ID: ${drawId}`);
      }

      // Загружаем данные розыгрыша и место пользователя
      const loadData = async () => {
        try {
          // Загружаем данные розыгрыша
          const drawResponse = await startDraw(drawId);
          console.log('Данные розыгрыша:', drawResponse);
          
          if (!drawResponse.isSuccess || !drawResponse.value) {
            setError(drawResponse.error || 'Ошибка при загрузке данных розыгрыша');
            return;
          }
          
          const data = drawResponse.value;
          const draw = data.draw;
          const prizeList = draw.prizeList;
          const participatingId = data.id; // Получаем participatingId для поиска пользователя
          
          // Передаём gameId в родительский компонент
          if (draw.gameId) {
            console.log('[DrawPage] GameId получен из бекенда:', draw.gameId);
            onGameIdReceived?.(draw.gameId);
          } else {
            console.warn('[DrawPage] GameId не найден в ответе бекенда, будет использована игра по умолчанию');
          }

          // Передаём данные игры (правила) в родительский компонент
          if (data.game) {
            console.log('[DrawPage] Данные игры получены из бекенда:', data.game);
            onGameDataReceived?.(data.game);
          } else {
            console.warn('[DrawPage] Данные игры не найдены в ответе бекенда');
          }

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
              // 1 место - золотой кубок
              placeLabel = 'Приз за 1 место';
              icon = 'gold';
            } else if (item.startPosition === 2 && item.endPosition === 2) {
              // 2 место - серебряный кубок
              placeLabel = 'Приз за 2 место';
              icon = 'silver';
            } else if (item.startPosition === 3 && item.endPosition === 3) {
              // 3 место - бронзовый кубок
              placeLabel = 'Приз за 3 место';
              icon = 'bronze';
            } else if (item.startPosition === 2 && item.endPosition === 3) {
              // Диапазон 2-3 места - серебряный кубок
              placeLabel = `Приз за ${item.startPosition} - ${item.endPosition} места`;
              icon = 'silver';
            } else if (item.startPosition >= 4 && item.endPosition <= 8) {
              // 4-8 места - бронзовый кубок
              placeLabel = `Приз за ${item.startPosition} - ${item.endPosition} места`;
              icon = 'bronze';
            } else if (item.startPosition >= 9 && item.endPosition <= 10) {
              // 9-10 места - специальный кубок
              placeLabel = `Приз за ${item.startPosition} - ${item.endPosition} места`;
              icon = '4th-10th';
            } else {
              // Остальные случаи - серебряный по умолчанию
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

          // Функция для поиска текущего пользователя в списке
          const findCurrentUser = (items) => {
            if (!items || items.length === 0) return null;
            
            // Сначала ищем по participatingId (самый надежный способ)
            if (participatingId) {
              const found = items.find(item => 
                item.participatingId === participatingId || 
                String(item.participatingId) === String(participatingId) ||
                Number(item.participatingId) === Number(participatingId)
              );
              if (found) return found;
            }
            
            // Если не нашли по participatingId, ищем по userTelegramId
            if (user?.telegramId) {
              const found = items.find(item => item.userTelegramId === user.telegramId);
              if (found) return found;
            }
            
            return null;
          };

          // Получаем место и аватар пользователя из лидерборда
          let userPlace = null;
          let userPhotoUrl = null;
          
          // Используем getUserRank для получения места пользователя независимо от позиции
          // Это работает для любых мест (включая трехзначные)
          try {
            const userRankResponse = await getUserRank(drawId);
            if (userRankResponse.isSuccess && userRankResponse.value) {
              const items = userRankResponse.value.items || [];
              
              // Ищем текущего пользователя по participatingId
              let currentUser = null;
              if (participatingId) {
                currentUser = items.find(item => 
                  item.participatingId === participatingId || 
                  String(item.participatingId) === String(participatingId) ||
                  Number(item.participatingId) === Number(participatingId)
                );
              }
              
              // Если не нашли по participatingId, ищем по userTelegramId
              if (!currentUser && user?.telegramId) {
                currentUser = items.find(item => item.userTelegramId === user.telegramId);
              }
              
              // Устанавливаем место и аватар, если нашли пользователя
              if (currentUser) {
                if (currentUser.topNumber) {
                  userPlace = currentUser.topNumber;
                }
                if (currentUser.photoUrl) {
                  userPhotoUrl = currentUser.photoUrl;
                }
                
                if (import.meta.env.DEV) {
                  console.log('[DrawPage] Место пользователя получено через getUserRank:', {
                    topNumber: currentUser.topNumber,
                    participatingId: currentUser.participatingId,
                    userTelegramId: currentUser.userTelegramId,
                    foundBy: participatingId && currentUser.participatingId === participatingId ? 'participatingId' : 'userTelegramId'
                  });
                }
              } else {
                // Если getUserRank не вернул пользователя, пробуем через обычный лидерборд (fallback)
                if (import.meta.env.DEV) {
                  console.log('[DrawPage] Пользователь не найден в getUserRank, пробуем через getLeaderboard (0, 0)');
                }
                
                const leaderboardResponse = await getLeaderboard(drawId, 0, 0);
                if (leaderboardResponse.isSuccess && leaderboardResponse.value) {
                  const items = leaderboardResponse.value.items || [];
                  const foundUser = findCurrentUser(items);
                  if (foundUser) {
                    if (foundUser.topNumber) {
                      userPlace = foundUser.topNumber;
                    }
                    if (foundUser.photoUrl) {
                      userPhotoUrl = foundUser.photoUrl;
                    }
                  }
                }
              }
            }
          } catch (err) {
            console.error('[DrawPage] Ошибка при получении места пользователя:', err);
            // В случае ошибки пробуем fallback через обычный лидерборд
            try {
              const leaderboardResponse = await getLeaderboard(drawId, 0, 0);
              if (leaderboardResponse.isSuccess && leaderboardResponse.value) {
                const items = leaderboardResponse.value.items || [];
                const foundUser = findCurrentUser(items);
                if (foundUser) {
                  if (foundUser.topNumber) {
                    userPlace = foundUser.topNumber;
                  }
                  if (foundUser.photoUrl) {
                    userPhotoUrl = foundUser.photoUrl;
                  }
                }
              }
            } catch (fallbackErr) {
              console.error('[DrawPage] Ошибка при fallback запросе:', fallbackErr);
            }
          }

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
              minAmount: 10, // Статичное значение, не берем с бекенда
              description: 'Всем участникам звёзды',
              note: 'Чем выше место тем больше звёзд!',
              iconCount: 2,
            },
            userRank: {
              place: userPlace,
              label: userPlace 
                ? `Ты на ${userPlace} месте` 
                : 'Твоё место будет определено после игры',
            },
            userAvatar: userPhotoUrl,
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
          
          // Передаём количество оставшихся попыток
          onAttemptsReceived?.(formattedData.attemptsLeft);
        } catch (err) {
          console.error('Ошибка при загрузке данных розыгрыша:', err);
          setError(err.message || 'Не удалось загрузить данные розыгрыша');
        } finally {
          setIsLoading(false);
        }
      };
      
      loadData();
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
    console.log('Начало игры, попыток осталось:', drawData?.attemptsLeft);
    // Передаём количество попыток в родительский компонент
    onStartGame?.(drawData?.attemptsLeft);
  };

  // Показываем экран загрузки пока данные розыгрыша не загружены
  // Лидерборд догружаем "под капотом", пока поверх висит оверлей
  if (isLoading || authLoading || !drawData) {
    return <LoadingScreen />;
  }

  if (error) {
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
      {/* Оверлей загрузки, пока лидерборд не подгрузился */}
      {!isLeaderboardLoaded && <LoadingScreen />}

      <BackgroundStars />
      <div className="draw-content">
        <div className={`balance-tasks-container ${!isTasksButtonVisible ? 'tasks-hidden' : ''}`}>
          <TasksButton onVisibilityChange={setIsTasksButtonVisible} />
          <BalanceIndicator balance={drawData.balance} />
        </div>
        
        <CountdownTimer 
          initialSeconds={drawData.timeUntilEnd}
          onComplete={handleCountdownComplete}
        />
        
        <div className="treasure-and-prize-container">
          <TreasureChest prizeFund={drawData.prizeFund} />
          
          <div className="info-panel-container">
            <PrizeFundButton />
            
            <div className="info-panel">
              <PrizeList 
                prizes={drawData.prizes}
                starsForParticipants={drawData.starsForParticipants}
              />
              
              <UserRank userRank={drawData.userRank} userAvatar={drawData.userAvatar} />
            </div>
          </div>
        </div>
        
        <StartGameButton onClick={handleStartGame} />
        
        <div className="info-panel-container leaderboard-panel-container">
          <div className="info-panel">
            <Leaderboard 
              drawId={drawId} 
              userId={user?.id} 
              onInitialLoad={() => setIsLeaderboardLoaded(true)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DrawPage;

