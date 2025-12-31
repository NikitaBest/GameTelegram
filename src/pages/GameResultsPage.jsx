import { useState, useEffect, useRef } from 'react';
import { RotateCcw, Clock, Bot } from 'lucide-react';
import Leaderboard from '../components/Leaderboard';
import MoreAttemptsModal from '../components/MoreAttemptsModal';
import ChannelSubscriptionModal from '../components/ChannelSubscriptionModal';
import { useAuth } from '../hooks/useAuth';
import { saveAttempt, checkChannelSubscriptionBoost } from '../api/services/attemptService';
import { getLeaderboard, getUserRank } from '../api/services/leaderboardService';
import { startDraw } from '../api/services/drawService';
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
  const [isChannelSubscriptionModalOpen, setIsChannelSubscriptionModalOpen] = useState(false);
  const [referralLink, setReferralLink] = useState(null);
  const [isViewedAds, setIsViewedAds] = useState(false); // Флаг просмотра рекламы
  const [isDataLoaded, setIsDataLoaded] = useState(false); // Флаг, что save и with-user выполнены
  const [channelSubscriptionBoosted, setChannelSubscriptionBoosted] = useState(null); // Флаг подписки на канал из ответа
  const hasSavedRef = useRef(false);
  const channelSubscriptionModalShownRef = useRef(false); // Флаг, что модальное окно уже было показано
  const userClickedSubscribeRef = useRef(false); // Флаг, что пользователь нажал на кнопку подписки
  const subscriptionCheckedRef = useRef(false); // Флаг, что проверка подписки уже была выполнена
  const wasHiddenRef = useRef(false); // Флаг, что страница была скрыта
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
            let attemptsCount = 0;
            let maxAttemptsCount = 0;
            let remaining = 0;
            
            if (attemptsData) {
              attemptsCount = attemptsData.attemptsCount || 0; // Растрачено попыток
              maxAttemptsCount = attemptsData.maxAttemptsCount || 0; // Доступно попыток
              remaining = maxAttemptsCount - attemptsCount; // Оставшиеся попытки
              setAttemptsLeft(remaining > 0 ? remaining : 0);
              
              // Получаем isViewedAds из ответа
              // isViewedAds может быть в response.value.isViewedAds или attemptsData.isViewedAds
              const isViewedAdsValue = 
                response.value?.isViewedAds !== undefined 
                  ? response.value.isViewedAds 
                  : attemptsData?.isViewedAds !== undefined 
                    ? attemptsData.isViewedAds 
                    : false;
              
              setIsViewedAds(isViewedAdsValue);
              
              if (import.meta.env.DEV) {
                console.log('Данные попыток из saveAttempt:', {
                  attemptsCount, // Растрачено
                  maxAttemptsCount, // Доступно
                  remaining, // Осталось (50 - 23 = 27)
                  isViewedAds: isViewedAdsValue,
                });
              }
            }
            
            // Получаем secondsToEnd из ответа saveAttempt
            // secondsToEnd может быть в разных местах ответа:
            // 1. response.value.draw.secondsToEnd (в объекте draw)
            // 2. response.value.secondsToEnd (прямо в value)
            // 3. response.value.participating.draw.secondsToEnd (в participating.draw)
            const secondsToEndData = 
              response.value?.draw?.secondsToEnd !== undefined 
                ? response.value.draw.secondsToEnd 
                : response.value?.secondsToEnd !== undefined 
                  ? response.value.secondsToEnd 
                  : response.value?.participating?.draw?.secondsToEnd !== undefined
                    ? response.value.participating.draw.secondsToEnd
                    : null;
            
            if (secondsToEndData !== null && secondsToEndData !== undefined) {
              setSecondsToEnd(secondsToEndData);
              console.log('[GameResultsPage] secondsToEnd получен из saveAttempt:', secondsToEndData);
            } else {
              // Если secondsToEnd не найден в saveAttempt, получаем из данных розыгрыша
              if (drawId) {
                try {
                  const drawResponse = await startDraw(drawId);
                  if (drawResponse.isSuccess && drawResponse.value?.draw?.secondsToEnd !== undefined) {
                    const secondsToEndFromDraw = drawResponse.value.draw.secondsToEnd;
                    setSecondsToEnd(secondsToEndFromDraw);
                    console.log('[GameResultsPage] secondsToEnd получен из startDraw:', secondsToEndFromDraw);
                  } else {
                    if (import.meta.env.DEV) {
                      console.warn('[GameResultsPage] secondsToEnd не найден ни в saveAttempt, ни в startDraw');
                    }
                  }
                } catch (err) {
                  console.error('[GameResultsPage] Ошибка при получении secondsToEnd из startDraw:', err);
                }
              } else {
                // Если drawId нет, логируем для отладки
                if (import.meta.env.DEV) {
                  console.warn('[GameResultsPage] secondsToEnd не найден в ответе saveAttempt, и drawId отсутствует');
                  console.log('[GameResultsPage] Структура ответа saveAttempt для secondsToEnd:', {
                    hasValue: !!response.value,
                    valueKeys: response.value ? Object.keys(response.value) : [],
                    hasDraw: !!response.value?.draw,
                    drawKeys: response.value?.draw ? Object.keys(response.value.draw) : [],
                    hasParticipating: !!response.value?.participating,
                    participatingKeys: response.value?.participating ? Object.keys(response.value.participating) : [],
                  });
                }
              }
            }
            
            // Получаем referralLink из ответа saveAttempt
            // referralLink может быть в разных местах ответа:
            // 1. response.value.referralLink (прямо в value)
            // 2. response.value.participating.referralLink (в объекте participating)
            // 3. attemptsData.referralLink (в данных попыток)
            const referralLinkData = 
              response.value?.referralLink || 
              response.value?.participating?.referralLink || 
              attemptsData?.referralLink ||
              response.value?.value?.referralLink; // Дополнительная проверка
            
            if (referralLinkData) {
              setReferralLink(referralLinkData);
              console.log('[GameResultsPage] ReferralLink получен из saveAttempt:', referralLinkData);
              
              // Проверяем формат ссылки
              if (referralLinkData.includes('t.me/') && referralLinkData.includes('startapp=')) {
                console.log('[GameResultsPage] ReferralLink имеет правильный формат для Telegram Web App');
              } else {
                console.warn('[GameResultsPage] ReferralLink может иметь неправильный формат:', referralLinkData);
              }
            } else {
              // Если referralLink не найден - логируем структуру ответа для отладки
              console.error('[GameResultsPage] ReferralLink не найден в ответе saveAttempt');
              console.log('[GameResultsPage] Структура ответа saveAttempt:', {
                hasValue: !!response.value,
                valueKeys: response.value ? Object.keys(response.value) : [],
                hasParticipating: !!response.value?.participating,
                participatingKeys: response.value?.participating ? Object.keys(response.value.participating) : [],
                attemptsDataKeys: attemptsData ? Object.keys(attemptsData) : [],
              });
              
              // Показываем предупреждение пользователю только в DEV режиме
              if (import.meta.env.DEV) {
                console.warn('[GameResultsPage] ReferralLink будет недоступен для приглашения друзей');
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

  // Запрос 4: Получаем channelSubscriptionBoosted из /participating/start для проверки условий показа модального окна
  useEffect(() => {
    if (!drawId || !isDataLoaded) {
      console.log('[GameResultsPage] Пропускаем проверку channelSubscriptionBoosted:', { drawId, isDataLoaded });
      return; // Ждем, пока save завершится
    }
    
    const checkChannelSubscription = async () => {
      try {
        console.log('[GameResultsPage] Запрашиваем startDraw для получения channelSubscriptionBoosted, drawId:', drawId);
        const drawResponse = await startDraw(drawId);
        
        console.log('[GameResultsPage] Ответ startDraw:', {
          isSuccess: drawResponse.isSuccess,
          hasValue: !!drawResponse.value,
          valueKeys: drawResponse.value ? Object.keys(drawResponse.value) : [],
          hasUser: !!drawResponse.value?.user,
          userKeys: drawResponse.value?.user ? Object.keys(drawResponse.value.user) : [],
          channelSubscriptionBoosted: drawResponse.value?.user?.channelSubscriptionBoosted,
          channelSubscriptionBoostedType: typeof drawResponse.value?.user?.channelSubscriptionBoosted,
        });
        
        if (drawResponse.isSuccess && drawResponse.value) {
          // channelSubscriptionBoosted находится в объекте user
          const channelSubscriptionBoostedData = drawResponse.value.user?.channelSubscriptionBoosted;
          
          console.log('[GameResultsPage] channelSubscriptionBoosted получен из startDraw:', {
            value: channelSubscriptionBoostedData,
            type: typeof channelSubscriptionBoostedData,
            isFalse: channelSubscriptionBoostedData === false,
            isStrictlyFalse: channelSubscriptionBoostedData === false && typeof channelSubscriptionBoostedData === 'boolean',
          });
          
          setChannelSubscriptionBoosted(channelSubscriptionBoostedData);
          
          // ВРЕМЕННО ОТКЛЮЧЕНО: Проверяем условия для показа модального окна подписки на канал
          // Показываем модальное окно только если channelSubscriptionBoosted === false
          // Используем строгую проверку на false (boolean)
          // Показываем модальное окно, если оно еще не открыто
          // ВРЕМЕННО СКРЫТО - модальное окно не показывается
          /*
          if (channelSubscriptionBoostedData === false && !isChannelSubscriptionModalOpen) {
            console.log('[GameResultsPage] ✅ Условия для показа модального окна подписки на канал выполнены! Показываем модальное окно.');
            channelSubscriptionModalShownRef.current = true; // Помечаем, что модальное окно было показано
            // Показываем модальное окно с небольшой задержкой, чтобы страница успела загрузиться
            setTimeout(() => {
              console.log('[GameResultsPage] Открываем модальное окно подписки на канал');
              setIsChannelSubscriptionModalOpen(true);
            }, 500);
          } else {
            if (isChannelSubscriptionModalOpen) {
              console.log('[GameResultsPage] Модальное окно уже открыто');
            } else {
              console.log('[GameResultsPage] ❌ Условия не выполнены. channelSubscriptionBoosted !== false:', channelSubscriptionBoostedData);
            }
          }
          */
          console.log('[GameResultsPage] Модальное окно подписки на канал временно скрыто');
        } else {
          console.warn('[GameResultsPage] Ответ startDraw не успешен или нет value:', {
            isSuccess: drawResponse.isSuccess,
            hasValue: !!drawResponse.value,
            error: drawResponse.error,
          });
        }
      } catch (err) {
        console.error('[GameResultsPage] Ошибка при получении channelSubscriptionBoosted из startDraw:', err);
      }
    };
    
    checkChannelSubscription();
  }, [drawId, isDataLoaded, isChannelSubscriptionModalOpen]);

  // Проверка подписки на канал при возврате пользователя в приложение
  useEffect(() => {
    // Проверяем только если пользователь нажал на кнопку подписки
    if (!userClickedSubscribeRef.current) {
      return;
    }

    if (!participatingId || !score) {
      return;
    }

    const handleVisibilityChange = async () => {
      // Отслеживаем, когда страница становится скрытой
      if (document.visibilityState === 'hidden') {
        wasHiddenRef.current = true;
        console.log('[GameResultsPage] Страница скрыта, пользователь ушел');
        return;
      }

      // Проверяем, когда пользователь возвращается в приложение (вкладка становится видимой)
      // И только если страница была скрыта и проверка еще не выполнена
      if (document.visibilityState === 'visible' && wasHiddenRef.current && !subscriptionCheckedRef.current) {
        console.log('[GameResultsPage] Пользователь вернулся в приложение, проверяем подписку на канал');
        
        // Небольшая задержка, чтобы дать время приложению полностью загрузиться
        setTimeout(async () => {
          try {
            subscriptionCheckedRef.current = true; // Помечаем, что проверка началась
            
            const checkResponse = await checkChannelSubscriptionBoost(participatingId);
            
            console.log('[GameResultsPage] Результат проверки подписки:', checkResponse);
            
            if (checkResponse.isSuccess && checkResponse.value?.subscribed === true) {
              console.log('[GameResultsPage] ✅ Пользователь подписался на канал! Обновляем счет.');
              
              // Закрываем модальное окно, так как пользователь подписался
              setIsChannelSubscriptionModalOpen(false);
              
              // Увеличиваем счет на 15%
              const increasedScore = score * 1.15;
              
              // Округляем до верхнего десятка
              const roundedScore = Math.ceil(increasedScore / 10) * 10;
              
              console.log('[GameResultsPage] Исходный счет:', score);
              console.log('[GameResultsPage] Увеличенный на 15%:', increasedScore);
              console.log('[GameResultsPage] Округленный до верхнего десятка:', roundedScore);
              
              // Сохраняем обновленный счет
              try {
                const saveResponse = await saveAttempt(participatingId, roundedScore);
                
                if (saveResponse.isSuccess) {
                  console.log('[GameResultsPage] ✅ Счет успешно обновлен после подписки на канал');
                  // Можно обновить отображаемый счет, если нужно
                  // Но обычно это делается через обновление страницы или перезагрузку данных
                } else {
                  console.error('[GameResultsPage] Ошибка при сохранении обновленного счета:', saveResponse.error);
                }
              } catch (saveErr) {
                console.error('[GameResultsPage] Ошибка при сохранении обновленного счета:', saveErr);
              }
            } else {
              console.log('[GameResultsPage] Пользователь еще не подписался на канал');
              subscriptionCheckedRef.current = false; // Разрешаем повторную проверку
              wasHiddenRef.current = false; // Сбрасываем флаг
              // ВРЕМЕННО ОТКЛЮЧЕНО: НЕ закрываем модальное окно - оно должно остаться открытым или показаться снова
              // Показываем модальное окно снова, если оно было закрыто
              // ВРЕМЕННО СКРЫТО - модальное окно не показывается
              /*
              if (!isChannelSubscriptionModalOpen) {
                console.log('[GameResultsPage] Показываем модальное окно снова, так как пользователь не подписался');
                setIsChannelSubscriptionModalOpen(true);
              }
              */
            }
          } catch (err) {
            console.error('[GameResultsPage] Ошибка при проверке подписки на канал:', err);
            subscriptionCheckedRef.current = false; // Разрешаем повторную проверку при ошибке
            wasHiddenRef.current = false; // Сбрасываем флаг
          }
        }, 1000); // Задержка 1 секунда перед проверкой
      }
    };

    // Отслеживаем изменение видимости страницы
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Также отслеживаем фокус окна (на случай, если пользователь вернулся через переключение вкладок)
    const handleFocus = () => {
      if (wasHiddenRef.current && !subscriptionCheckedRef.current) {
        handleVisibilityChange();
      }
    };
    
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [participatingId, score]);

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
                <img 
                  src="/царь_горы.png"
                  alt="Царь горы"
                  className="results-title-image results-title-image-king"
                />
                <img 
                  src="/Stars12.png"
                  alt="Звезды"
                  className="results-stars results-stars-right"
                />
              </div>
            </>
          ) : (
            <img
              src="/resultat.png"
              alt="Твой результат"
              className="results-title-image results-title-image-result"
            />
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
          className="play-again-button more-attempts action-button-base" 
          onClick={() => setIsModalOpen(true)}
        >
          <div className="play-again-text">
            <span className="play-again-main">ЕЩЁ ПОПЫТКИ</span>
          </div>
          <img src="/material-symbols_arrow-back-rounded.svg" alt="" className="play-again-arrow" />
        </button>
      )}

      {/* Модальное окно для подписки на канал */}
      <ChannelSubscriptionModal
        isOpen={isChannelSubscriptionModalOpen}
        onClose={() => setIsChannelSubscriptionModalOpen(false)}
        onSubscribeClick={() => {
          // Помечаем, что пользователь нажал на кнопку подписки
          userClickedSubscribeRef.current = true;
          console.log('[GameResultsPage] Пользователь нажал на кнопку подписки на канал');
        }}
      />

      {/* Модальное окно для получения попыток */}
      <MoreAttemptsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        participatingId={participatingId}
        isViewedAds={isViewedAds}
        onInviteFriends={() => {
          console.log('[GameResultsPage] Нажата кнопка "Пригласить друзей"');
          
          if (!referralLink) {
            console.error('[GameResultsPage] referralLink не найден, невозможно открыть список друзей');
            alert('Ссылка для приглашения друзей недоступна. Попробуйте позже.');
            setIsModalOpen(false);
            return;
          }

          // Проверяем доступность Telegram Web App
          const tg = window.Telegram?.WebApp;
          
          // referralLink должен быть в формате: http://t.me/chest_of_goldbot/game?startapp=84
          console.log('[GameResultsPage] ReferralLink для отправки:', referralLink);
          console.log('[GameResultsPage] Telegram Web App доступен:', !!tg);
          
          // Нормализуем referralLink - убеждаемся, что он в правильном формате
          // referralLink должен быть в формате: https://t.me/chest_of_goldbot?startapp=84
          let normalizedReferralLink = referralLink.trim();
          
          // Если ссылка не начинается с http/https, добавляем https://
          if (!normalizedReferralLink.startsWith('http://') && !normalizedReferralLink.startsWith('https://')) {
            // Если начинается с t.me, добавляем https://
            if (normalizedReferralLink.startsWith('t.me/')) {
              normalizedReferralLink = `https://${normalizedReferralLink}`;
            } else {
              // Иначе предполагаем, что это полный URL без протокола
              normalizedReferralLink = `https://${normalizedReferralLink}`;
            }
          }
          
          // Для открытия диалога выбора контактов в Telegram Mini App
          // Используем формат t.me/share/url (как в примере)
          const shareText = 'Присоединяйся к игре и выиграй призы! 🎮';
          // Правильное формирование URL: сначала кодируем referralLink, потом весь shareUrl
          const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(normalizedReferralLink)}&text=${encodeURIComponent(shareText)}`;
          
          console.log('[GameResultsPage] Нормализованная ссылка:', normalizedReferralLink);
          console.log('[GameResultsPage] ShareUrl для открытия диалога:', shareUrl);
          
          // КРИТИЧЕСКИ ВАЖНО для Telegram Mini App:
          // openTelegramLink открывает ссылку НАПРЯМУЮ в Telegram (не в браузере)
          // openLink может открывать в браузере, поэтому используем openTelegramLink в первую очередь
          // Вызов должен быть СИНХРОННЫМ и НАПРЯМУЮ из обработчика события пользователя
          // НЕ закрываем модальное окно ПЕРЕД вызовом - это может прервать цепочку событий!
          
          // ПРИОРИТЕТ 1: openTelegramLink - открывает напрямую в Telegram (не в браузере)
          if (tg && typeof tg.openTelegramLink === 'function') {
            console.log('[GameResultsPage] Вызываем tg.openTelegramLink с shareUrl (открывает в Telegram, не в браузере)');
            // Прямой вызов без оберток для максимальной надежности в продакшене
            tg.openTelegramLink(shareUrl);
            
            // Закрываем модальное окно ПОСЛЕ успешного вызова
            // Используем небольшую задержку, чтобы дать Telegram время открыть диалог
            setTimeout(() => {
              setIsModalOpen(false);
            }, 300);
            return;
          }
          
          // ПРИОРИТЕТ 2: openLink - может открывать в браузере, но лучше чем ничего
          if (tg && typeof tg.openLink === 'function') {
            console.log('[GameResultsPage] Вызываем tg.openLink с shareUrl (может открыть в браузере)');
            try {
              tg.openLink(shareUrl);
              setTimeout(() => {
                setIsModalOpen(false);
              }, 300);
            } catch (err) {
              console.error('[GameResultsPage] Ошибка в tg.openLink:', err);
              setIsModalOpen(false);
            }
            return;
          }
          
          // Последний fallback: используем location.href
          // В этом случае закрываем модальное окно перед переходом
          console.log('[GameResultsPage] Используем window.location.href как fallback');
          setIsModalOpen(false);
          setTimeout(() => {
            window.location.href = shareUrl;
          }, 100);
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

