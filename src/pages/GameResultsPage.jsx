import { useState, useEffect, useRef } from 'react';
import { RotateCcw, Clock, Bot } from 'lucide-react';
import Leaderboard from '../components/Leaderboard';
import MoreAttemptsModal from '../components/MoreAttemptsModal';
import { useAuth } from '../hooks/useAuth';
import { saveAttempt } from '../api/services/attemptService';
import { startDraw } from '../api/services/drawService';
import { getLeaderboard } from '../api/services/leaderboardService';
import './GameResultsPage.css';

const GameResultsPage = ({ score, drawId, participatingId, onPlayAgain, onGoToMain }) => {
  const [activeTab, setActiveTab] = useState('my-results'); // 'my-results' | 'rating'
  const [userRank, setUserRank] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [attemptsLeft, setAttemptsLeft] = useState(0);
  const [secondsToEnd, setSecondsToEnd] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [referralLink, setReferralLink] = useState(null);
  const hasSavedRef = useRef(false);
  const { user } = useAuth();

  // Отправляем результат на бекенд при монтировании
  useEffect(() => {
    if (participatingId && score !== undefined && !hasSavedRef.current) {
      hasSavedRef.current = true;
      setIsSaving(true);
      setSaveError(null);

      saveAttempt(participatingId, score)
        .then((response) => {
          if (response.isSuccess) {
            console.log('Результат успешно сохранен:', response);
            if (response.value?.topNumber) {
              setUserRank(response.value.topNumber);
            }
          } else {
            console.error('Ошибка сохранения результата:', response.error);
            setSaveError(response.error);
          }
        })
        .catch((err) => {
          console.error('Ошибка при сохранении результата:', err);
          setSaveError(err.message);
        })
        .finally(() => {
          setIsSaving(false);
        });
    }
  }, [participatingId, score]);

  // Загружаем данные о розыгрыше для получения времени и попыток
  useEffect(() => {
    if (drawId) {
      setIsLoading(true);
      
      // Параллельно загружаем данные розыгрыша и место в рейтинге
      Promise.all([
        startDraw(drawId),
        getLeaderboard(drawId, 1, 1) // Запрос с текущим пользователем и соседями
      ])
        .then(([drawResponse, leaderboardResponse]) => {
          // Обрабатываем данные розыгрыша
          if (drawResponse.isSuccess && drawResponse.value) {
            const data = drawResponse.value;
            const remaining = data.maxAttemptsCount - data.attemptsCount;
            setAttemptsLeft(remaining > 0 ? remaining : 0);
            setSecondsToEnd(data.draw?.secondsToEnd || 0);
            setReferralLink(data.referralLink || null);
            
            if (import.meta.env.DEV) {
              console.log('Данные результатов:', {
                attemptsCount: data.attemptsCount,
                maxAttemptsCount: data.maxAttemptsCount,
                remaining,
                secondsToEnd: data.draw?.secondsToEnd,
              });
            }
          }
          
          // Обрабатываем данные лидерборда для получения места
          if (leaderboardResponse.isSuccess && leaderboardResponse.value) {
            const items = leaderboardResponse.value.items || [];
            // При запросе with-user первый элемент — текущий пользователь
            // Но для надежности ищем по participatingId или userTelegramId
            let currentUser = items.find(item => item.participatingId === participatingId);
            
            // Если не нашли по participatingId, ищем по userTelegramId
            if (!currentUser && user?.telegramId) {
              currentUser = items.find(item => item.userTelegramId === user.telegramId);
            }
            
            // Если всё ещё не нашли, берём первый элемент (API возвращает текущего пользователя первым)
            if (!currentUser && items.length > 0) {
              currentUser = items[0];
            }
            
            if (currentUser && currentUser.topNumber) {
              setUserRank(currentUser.topNumber);
              if (import.meta.env.DEV) {
                console.log('Место пользователя из лидерборда:', currentUser.topNumber, 'participatingId:', currentUser.participatingId);
              }
            }
          }
        })
        .catch((err) => {
          console.error('Ошибка загрузки данных результатов:', err);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [drawId, participatingId]);

  // Таймер обратного отсчёта
  useEffect(() => {
    if (secondsToEnd <= 0) return;
    
    const interval = setInterval(() => {
      setSecondsToEnd(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [secondsToEnd > 0]); // Запускаем только когда есть время

  // Форматирование времени
  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Склонение слова "попытка"
  const getAttemptsWord = (count) => {
    const lastTwo = count % 100;
    const lastOne = count % 10;
    if (lastTwo >= 11 && lastTwo <= 19) return 'попыток';
    if (lastOne === 1) return 'попытка';
    if (lastOne >= 2 && lastOne <= 4) return 'попытки';
    return 'попыток';
  };

  const timeUntilFinal = formatTime(secondsToEnd);
  const botUsername = 'chest_of_goldbot';
  const isFirstPlace = userRank === 1;

  return (
    <div className="game-results-page">
      {/* SVG фон за элементами */}
      <div 
        className="background-svg-layer"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 0,
          backgroundImage: 'url(/Задник.svg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />
      
      {/* Кнопка назад */}
      <button className="back-to-main" onClick={onGoToMain}>
        <img src="/material-symbols_arrow-back-rounded.svg" alt="Назад" className="back-arrow" />
        <span>На главную</span>
      </button>

      <div className="results-content">
        {/* Заголовок */}
        <div className="results-title-container">
          <img 
            src={isFirstPlace ? "/winner.png" : "/Frame 1171275345.svg"}
            alt={isFirstPlace ? "ПОБЕДИТЕЛЬ" : "ТВОЙ РЕЗУЛЬТАТ"}
            className="results-title-image"
          />
        </div>
        <p className="results-subtitle">
          {isFirstPlace 
            ? "Теперь удержи эту позицию до конца розыгрыша." 
            : "Отличная работа! Сможешь лучше?"}
        </p>

        {/* Табы */}
        <div className="results-tabs">
          <button
            className={`tab-button ${activeTab === 'my-results' ? 'active' : ''}`}
            onClick={() => setActiveTab('my-results')}
          >
            Мои итоги
          </button>
          <button
            className={`tab-button ${activeTab === 'rating' ? 'active' : ''}`}
            onClick={() => setActiveTab('rating')}
          >
            Рейтинг
          </button>
        </div>

        {/* Контент табов */}
        <div className="results-scrollable-content">
        {activeTab === 'my-results' && (
          <div className="results-content-area">
            {/* Карточка с местом и очками */}
            <div className="result-card">
              <div className="result-card-label">Твоё место</div>
                <div className="result-card-rank">
                  {isSaving ? '...' : (userRank || '—')}
                </div>
              <div className="result-card-score">{score} очков</div>
                {saveError && (
                  <div className="result-card-error">Ошибка сохранения</div>
                )}
            </div>

            {/* Карточка с таймером и ботом */}
            <div className="result-card">
              <div className="result-card-timer">
                <Clock className="timer-icon" />
                <span>ДО ФИНАЛА ОСТАЛОСЬ: {timeUntilFinal}</span>
              </div>
              <div className="result-card-bot">
                <Bot className="bot-icon" />
                <span>Результаты придут в бот @{botUsername}</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'rating' && (
          <div className="results-content-area">
              {drawId ? (
                <Leaderboard drawId={drawId} userId={user?.id} />
              ) : (
            <div className="rating-placeholder">
              <p>Рейтинг будет доступен после финала</p>
            </div>
              )}
          </div>
        )}
        </div>
      </div>

      {/* Кнопка - фиксированная внизу */}
      {attemptsLeft > 0 ? (
        <button 
          className="play-again-button" 
          onClick={onPlayAgain}
        >
          <img src="/Vector.svg" alt="" className="play-again-icon" />
          <div className="play-again-text">
            <span className="play-again-main">
              {isFirstPlace ? 'ЗАКРЕПИТЬ!' : 'ОТЫГРАТЬСЯ!'}
            </span>
            <span className="play-again-sub">
              осталась {attemptsLeft} {getAttemptsWord(attemptsLeft)}
            </span>
          </div>
        </button>
      ) : (
        <button 
          className="play-again-button more-attempts" 
          onClick={() => setIsModalOpen(true)}
        >
          <div className="play-again-text">
            <span className="play-again-main">ЕЩЁ ПОПЫТКИ</span>
          </div>
          <img src="/material-symbols_arrow-back-rounded.svg" alt="" className="play-again-arrow" />
        </button>
      )}

      {/* Модальное окно для получения попыток */}
      <MoreAttemptsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        participatingId={participatingId}
        onInviteFriends={() => {
          if (referralLink) {
            const tg = window.Telegram?.WebApp;
            if (tg?.openTelegramLink) {
              // Формируем ссылку для шаринга через Telegram
              const shareText = 'Присоединяйся к игре и выиграй призы! 🎮';
              const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(shareText)}`;
              tg.openTelegramLink(shareUrl);
            } else {
              // Fallback для браузера
              window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent('Присоединяйся к игре!')}`, '_blank');
            }
          }
          setIsModalOpen(false);
        }}
        onAttemptAdded={() => {
          // Обновляем количество попыток после успешного просмотра рекламы
          setAttemptsLeft(prev => prev + 1);
          console.log('Попытка добавлена через рекламу');
        }}
      />
    </div>
  );
};

export default GameResultsPage;

