import { useState, useEffect, useRef } from 'react';
import { RotateCcw, Clock, Bot } from 'lucide-react';
import Leaderboard from '../components/Leaderboard';
import MoreAttemptsModal from '../components/MoreAttemptsModal';
import { useAuth } from '../hooks/useAuth';
import { saveAttempt } from '../api/services/attemptService';
import { getLeaderboard, getUserRank } from '../api/services/leaderboardService';
import '../styles/gradient-text.css';
import '../styles/action-button.css';
import './GameResultsPage.css';

const GameResultsPage = ({ score, drawId, participatingId, onPlayAgain, onGoToMain }) => {
  const [activeTab, setActiveTab] = useState('my-results'); // 'my-results' | 'rating'
  const [userRank, setUserRank] = useState(null);
  const [userMaxPoints, setUserMaxPoints] = useState(null); // Максимальный счет пользователя из лидерборда
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [attemptsLeft, setAttemptsLeft] = useState(0);
  const [secondsToEnd, setSecondsToEnd] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [referralLink, setReferralLink] = useState(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false); // Флаг, что save и with-user выполнены
  const hasSavedRef = useRef(false);
  const { user } = useAuth();

  // Запрос 1: Сохраняем попытку и получаем participating, отображаем сколько попыток осталось
  useEffect(() => {
    if (participatingId && score !== undefined && !hasSavedRef.current) {
      hasSavedRef.current = true;
      setIsSaving(true);
      setSaveError(null);

      saveAttempt(participatingId, score)
        .then(async (response) => {
          if (response.isSuccess) {
            console.log('Результат успешно сохранен:', response);
            
            // Отображаем количество попыток из ответа saveAttempt
            // Попытки могут быть в response.value или response.value.participating
            const attemptsData = response.value?.participating || response.value;
            if (attemptsData) {
              const attemptsCount = attemptsData.attemptsCount || 0; // Растрачено попыток
              const maxAttemptsCount = attemptsData.maxAttemptsCount || 0; // Доступно попыток
              const remaining = maxAttemptsCount - attemptsCount; // Оставшиеся попытки
              setAttemptsLeft(remaining > 0 ? remaining : 0);
              
              if (import.meta.env.DEV) {
                console.log('Данные попыток из saveAttempt:', {
                  attemptsCount, // Растрачено
                  maxAttemptsCount, // Доступно
                  remaining, // Осталось (50 - 23 = 27)
                });
              }
            }
            
            // Запрос 2: Запрашиваем место через with-user сразу после сохранения попытки
            if (drawId) {
              try {
                const userRankResponse = await getUserRank(drawId);
                if (userRankResponse.isSuccess && userRankResponse.value) {
                  const items = userRankResponse.value.items || [];
                  // Ищем текущего пользователя по participatingId
                  if (participatingId) {
                    const currentUser = items.find(item => 
                      item.participatingId === participatingId || 
                      String(item.participatingId) === String(participatingId) ||
                      Number(item.participatingId) === Number(participatingId)
                    );
                    
                    if (currentUser) {
                      if (currentUser.topNumber) {
                        setUserRank(currentUser.topNumber);
                      }
                      if (currentUser.maxPoints !== undefined && currentUser.maxPoints !== null) {
                        setUserMaxPoints(currentUser.maxPoints);
                      }
                      if (import.meta.env.DEV) {
                        console.log('Место пользователя получено через with-user:', {
                          topNumber: currentUser.topNumber,
                          maxPoints: currentUser.maxPoints,
                          participatingId: currentUser.participatingId,
                        });
                      }
                    }
                  }
                }
              } catch (err) {
                console.error('Ошибка при получении места пользователя:', err);
              }
            }
            
            // После выполнения save и with-user разрешаем загрузку Leaderboard
            setIsDataLoaded(true);
          } else {
            console.error('Ошибка сохранения результата:', response.error);
            setSaveError(response.error);
            setIsDataLoaded(true); // Разрешаем загрузку даже при ошибке
          }
        })
        .catch((err) => {
          console.error('Ошибка при сохранении результата:', err);
          setSaveError(err.message);
          setIsDataLoaded(true); // Разрешаем загрузку даже при ошибке
        })
        .finally(() => {
          setIsSaving(false);
          setIsLoading(false); // Завершаем загрузку после всех запросов
        });
    }
  }, [participatingId, score, drawId]);

  // Запрос 3: top-list используется только для отображения рейтинга в компоненте Leaderboard
  // Все данные (попытки, время, referralLink) получаем из saveAttempt

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
    <div className={`game-results-page ${activeTab === 'rating' ? 'rating-active' : ''}`}>
      {/* Фон за элементами */}
      <div 
        className="background-svg-layer"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: -1,
          backgroundImage: 'url(/Задник.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          pointerEvents: 'none',
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
          {isFirstPlace ? (
            <>
              <img 
                src="/Crown.png"
                alt="Корона"
                className="results-crown"
              />
              <div className="results-title-with-stars">
                <img 
                  src="/Stars12.png"
                  alt="Звезды"
                  className="results-stars results-stars-left"
                />
                <h1 className="results-title-text">
                  <div className="results-title-line">
                    {'ЦАРЬ'.split('').map((char, index) => (
                      <span key={index} className="gradient-text-char" data-char={char}>
                        {char}
                      </span>
                    ))}
                  </div>
                  <div className="results-title-line">
                    {'ГОРЫ'.split('').map((char, index) => (
                      <span key={`mountain-${index}`} className="gradient-text-char" data-char={char}>
                        {char}
                      </span>
                    ))}
                  </div>
                </h1>
                <img 
                  src="/Stars12.png"
                  alt="Звезды"
                  className="results-stars results-stars-right"
                />
              </div>
            </>
          ) : (
            <h1 className="results-title-text">
              <div className="results-title-line">
                {'ТВОЙ'.split('').map((char, index) => (
                  <span key={index} className="gradient-text-char" data-char={char}>
                    {char}
                  </span>
                ))}
              </div>
              <div className="results-title-line">
                {'РЕЗУЛЬТАТ'.split('').map((char, index) => (
                  <span key={`result-${index}`} className="gradient-text-char" data-char={char}>
                    {char}
                  </span>
                ))}
              </div>
            </h1>
          )}
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
            {isFirstPlace ? 'Мой рекорд' : 'Мои итоги'}
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
        {/* Вкладка "Мои итоги" */}
        <div className={`results-content-area ${activeTab === 'my-results' ? '' : 'hidden'}`}>
          {/* Карточка с местом и очками */}
          <div className="result-card">
            <div className="result-card-label">Твоё место</div>
              <div className="result-card-rank">
                {isSaving ? '...' : (userRank || '—')}
              </div>
            <div className="result-card-score">
              {/* Показываем максимальный счет из лидерборда, если он есть, иначе текущий score */}
              {/* maxPoints может быть 0, что валидно, поэтому проверяем на null/undefined */}
              {(userMaxPoints !== null && userMaxPoints !== undefined) 
                ? `${userMaxPoints} очков` 
                : (score !== undefined && score !== null ? `${score} очков` : '0 очков')}
            </div>
              {saveError && (
                <div className="result-card-error">Ошибка сохранения</div>
              )}
          </div>

          {/* Карточка с таймером и ботом */}
          <div className="result-card">
            <div className="result-card-timer">
              <span>ДО ФИНАЛА ОСТАЛОСЬ: {timeUntilFinal}</span>
            </div>
            <div className="result-card-bot">
              <span>Результаты придут в бот{' '}
                <a 
                  href={`https://t.me/${botUsername}`}
                  className="bot-link"
                  onClick={(e) => {
                    e.preventDefault();
                    const tg = window.Telegram?.WebApp;
                    if (tg?.openTelegramLink) {
                      tg.openTelegramLink(`https://t.me/${botUsername}`);
                    } else {
                      window.open(`https://t.me/${botUsername}`, '_blank');
                    }
                  }}
                >
                  @{botUsername}
                </a>
              </span>
            </div>
          </div>
        </div>

        {/* Вкладка "Рейтинг" - загружаем только после выполнения save и with-user */}
        <div className={`results-content-area rating-tab ${activeTab === 'rating' ? '' : 'hidden'}`}>
            {drawId && isDataLoaded ? (
              <Leaderboard drawId={drawId} userId={user?.id} />
            ) : drawId ? (
              <div className="rating-placeholder">
                <p>Загрузка рейтинга...</p>
              </div>
            ) : (
              <div className="rating-placeholder">
                <p>Рейтинг будет доступен после финала</p>
              </div>
            )}
        </div>
        </div>
      </div>

      {/* Кнопка - фиксированная внизу */}
      {attemptsLeft > 0 ? (
        <button 
          className="play-again-button action-button-base" 
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

