import { useEffect, useState, useCallback } from 'react'
import DrawPage from './pages/DrawPage'
import PathToTreasuresPage from './pages/PathToTreasuresPage'
import GameResultsPage from './pages/GameResultsPage'
import ActiveDrawsPage from './pages/ActiveDrawsPage'
import DrawFinishedPage from './pages/DrawFinishedPage'
import LoadingScreen from './components/LoadingScreen'
import TelegramLanding from './components/TelegramLanding'
import { GameRouter } from './game/GameRouter'
import { useAuth } from './hooks/useAuth'
import { getParsedStartParam } from './utils/urlParams'
import { saveDrawId, getDrawId } from './utils/storage'
import { checkPartnersSubscription } from './api/services/partnersService'
import { startDraw } from './api/services/drawService'
import { isTelegramWebApp } from './lib/telegram'
import './App.css'

function App() {
  const isTelegram = isTelegramWebApp()

  // Если открыто не в Telegram и это продакшен — сразу переводим в Telegram
  if (!isTelegram && import.meta.env.PROD) {
    window.location.href = 'https://t.me/chest_of_gold'
    return null
  }

  // Парсим параметр при инициализации
  const parsedStartParam = getParsedStartParam();
  
  // Логируем для отладки
  if (import.meta.env.DEV) {
    console.log('Парсинг параметра tgWebAppStartParam:', {
      parsed: parsedStartParam,
      url: window.location.href,
    });
  }
  
  // Состояние для ID текущего розыгрыша
  // ВАЖНО: Используем только drawId из URL параметра при инициализации
  // localStorage используется только для сохранения, но не для определения начальной страницы
  const initialDrawId = parsedStartParam.drawId || null;
  const [drawId, setDrawId] = useState(initialDrawId);
  
  // Сохраняем drawId в localStorage если он есть в URL параметре
  useEffect(() => {
    if (parsedStartParam.drawId) {
      saveDrawId(parsedStartParam.drawId);
      setDrawId(parsedStartParam.drawId);
      if (import.meta.env.DEV) {
        console.log(`Сохранен ID розыгрыша из URL: ${parsedStartParam.drawId}`);
      }
    } else {
      // Если в URL нет drawId, очищаем состояние (но не localStorage, чтобы не терять данные)
      // Это гарантирует, что при открытии без параметра всегда будет страница активных розыгрышей
      if (import.meta.env.DEV) {
        console.log('ID розыгрыша в URL не найден, открываем страницу активных розыгрышей');
      }
    }
  }, [parsedStartParam.drawId]);
  
  // Определяем начальную страницу на основе параметра tgWebAppStartParam
  // ВАЖНО: Если в URL нет drawId, всегда открываем страницу активных розыгрышей
  const getInitialPage = () => {
    if (parsedStartParam.hasParam && parsedStartParam.drawId) {
      // Если параметр есть и есть ID розыгрыша - открываем страницу с розыгрышем
      console.log(`Открываем розыгрыш с ID: ${parsedStartParam.drawId}`);
      return 'path-to-treasures';
    } else {
      // Если параметра нет или нет ID розыгрыша - открываем страницу активных розыгрышей
      console.log('ID розыгрыша в URL не найден, открываем страницу активных розыгрышей');
      return 'active-draws';
    }
  };

  const [currentPage, setCurrentPage] = useState(getInitialPage);
  const [gameScore, setGameScore] = useState(0);
  const [gameKey, setGameKey] = useState(0); // Для пересоздания компонента игры
  const [participatingId, setParticipatingId] = useState(null); // ID участия из /start
  const [attemptsLeft, setAttemptsLeft] = useState(0); // Оставшиеся попытки
  // ВРЕМЕННО для тестирования: в DEV режиме используем gameId = 3 (Ball and Wall)
  // В продакшене должно быть: useState(null)
  const [gameId, setGameId] = useState(import.meta.env.DEV ? 3 : null); // ID игры из бекенда
  const [isAppReady, setIsAppReady] = useState(false); // Флаг готовности приложения
  
  // Авторизация
  const { user, isLoading, isAuthenticated, error, login } = useAuth();

  useEffect(() => {
    // Проверяем наличие Telegram Web App
    if (window.Telegram?.WebApp) {
      const telegram = window.Telegram.WebApp
      
      // Отключаем вертикальные свайпы для закрытия приложения
      if (telegram.disableVerticalSwipes) {
        telegram.disableVerticalSwipes()
      }
      
      // Настройка темы приложения
      if (telegram.colorScheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark')
      } else {
        document.documentElement.setAttribute('data-theme', 'light')
      }
      
      // Обработчик изменения темы
      telegram.onEvent('themeChanged', () => {
        if (telegram.colorScheme === 'dark') {
          document.documentElement.setAttribute('data-theme', 'dark')
        } else {
          document.documentElement.setAttribute('data-theme', 'light')
        }
      })
    }
  }, [])

  // Проверка подписок партнёров и определение начальной страницы
  const checkAndNavigate = useCallback(async (currentDrawId) => {
    if (!currentDrawId) {
      // Нет drawId - открываем активные розыгрыши
      setCurrentPage('active-draws');
      return;
    }

    try {
      // Сначала проверяем активен ли розыгрыш
      console.log(`[checkAndNavigate] Проверка активности розыгрыша с ID: ${currentDrawId}`);
      const drawResponse = await startDraw(currentDrawId);
      
      if (drawResponse.isSuccess && drawResponse.value) {
        const isActive = drawResponse.value.draw?.isActive;
        console.log(`[checkAndNavigate] Статус активности розыгрыша: ${isActive}`);
        
        // Если розыгрыш явно неактивен (false) - показываем страницу завершения
        if (isActive === false) {
          console.log('[checkAndNavigate] Розыгрыш завершён, переход на draw-finished');
          setCurrentPage('draw-finished');
          setDrawId(currentDrawId); // Сохраняем drawId для страницы завершения
          return;
        }
        
        // Если isActive === true или undefined/null (по умолчанию считаем активным)
        console.log('[checkAndNavigate] Розыгрыш активен, проверяем подписки');
        // Продолжаем проверку подписок
      } else {
        // Если запрос не удался, но есть drawId - пробуем открыть страницу партнёров
        // (может быть проблема с авторизацией или сетью)
        console.warn('[checkAndNavigate] Не удалось получить данные розыгрыша:', drawResponse.error);
        console.warn('[checkAndNavigate] Пробуем открыть страницу партнёров');
      }

      // Розыгрыш активен (или статус неизвестен) - проверяем подписки
      const response = await checkPartnersSubscription(currentDrawId);
      
      if (response.isSuccess && response.value) {
        if (response.value.success) {
          // Все подписки выполнены - сразу на главную страницу draw
          console.log('Все подписки выполнены, переход на draw');
          setCurrentPage('draw');
        } else {
          // Есть невыполненные подписки - на страницу партнёров
          console.log('Есть невыполненные подписки, переход на path-to-treasures');
          setCurrentPage('path-to-treasures');
        }
      } else {
        // Ошибка - на страницу партнёров для проверки
        setCurrentPage('path-to-treasures');
      }
    } catch (error) {
      console.error('Ошибка проверки подписок:', error);
      // При ошибке - на страницу партнёров
      setCurrentPage('path-to-treasures');
    }
  }, []);

  // Авторизация при загрузке приложения
  // ВАЖНО: Всегда отправляем запрос login после проверки параметра
  useEffect(() => {
    const initApp = async () => {
      try {
        // Авторизуемся
        await login();
        
        // ВАЖНО: Проверяем drawId только если он есть в URL параметре
        // Если drawId есть только в localStorage, но не в URL - не используем его для навигации
        const drawIdFromUrl = parsedStartParam.drawId;
        if (drawIdFromUrl) {
          // Если есть drawId в URL - проверяем подписки и навигируем
          await checkAndNavigate(drawIdFromUrl);
        } else {
          // Если нет drawId в URL - гарантируем, что открыта страница активных розыгрышей
          setCurrentPage('active-draws');
        }
        
        // Небольшая задержка для плавности
        setTimeout(() => {
          setIsAppReady(true);
        }, 300);
      } catch (err) {
        console.error('Ошибка авторизации при загрузке:', err);
        // В режиме разработки продолжаем работу даже при ошибке авторизации
        if (import.meta.env.DEV) {
          console.warn('Продолжаем работу в режиме разработки без авторизации');
          // Если нет drawId в URL - открываем страницу активных розыгрышей
          if (!parsedStartParam.drawId) {
            setCurrentPage('active-draws');
          }
          setIsAppReady(true);
        }
      }
    };

    initApp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Выполняем только при монтировании компонента

  // Показываем экран загрузки пока приложение не готово
  if (!isAppReady) {
    return <LoadingScreen />;
  }

  return (
    <div className="app page-background">
      <div className="app-content">
        {currentPage === 'active-draws' && (
          <ActiveDrawsPage 
            onSelectDraw={(selectedDrawId) => {
              setDrawId(selectedDrawId);
              saveDrawId(selectedDrawId);
              checkAndNavigate(selectedDrawId);
            }}
          />
        )}
        {currentPage === 'path-to-treasures' && (
          <PathToTreasuresPage 
            drawId={drawId}
            onStartGame={() => setCurrentPage('draw')} 
          />
        )}
        {currentPage === 'draw' && (
          <DrawPage 
            drawId={drawId}
            onStartGame={(attempts) => {
              console.log('[App] Нажата кнопка "Начать игру", попыток:', attempts);
              // Проверяем есть ли попытки
              if (attempts !== undefined && attempts <= 0) {
                // Нет попыток - переводим на страницу результатов
                console.log('[App] Нет попыток, переходим на results');
                setCurrentPage('results');
              } else {
                // Есть попытки - начинаем игру
                console.log('[App] Есть попытки, переходим на game, gameId:', gameId);
                setCurrentPage('game');
              }
            }}
            onParticipatingIdReceived={(id) => setParticipatingId(id)}
            onAttemptsReceived={(attempts) => setAttemptsLeft(attempts)}
            onGameIdReceived={(id) => {
              // В DEV режиме игнорируем gameId из бекенда, используем тестовое значение
              if (import.meta.env.DEV) {
                console.log('[App] В DEV режиме игнорируем gameId из бекенда:', id, ', используем тестовое значение: 2');
                return;
              }
              setGameId(id);
            }}
          />
        )}
        {currentPage === 'game' && (
          <GameRouter 
            key={gameKey} // Пересоздаём компонент при каждом переходе на игру
            gameId={gameId}
            onGameOver={(score) => {
              console.log('[App] Игра завершена с очками:', score);
              setGameScore(score);
              setCurrentPage('results');
            }} 
          />
        )}
        {currentPage === 'results' && (
          <GameResultsPage 
            score={gameScore}
            drawId={drawId}
            participatingId={participatingId}
            onPlayAgain={() => {
              setGameKey(prev => prev + 1); // Пересоздаём игру
              setCurrentPage('game');
            }}
            onGetMoreAttempts={() => {
              // TODO: Логика получения дополнительных попыток
              console.log('Получить ещё попытки');
            }}
            onGoToMain={() => {
              setCurrentPage('draw');
            }}
          />
        )}
        {currentPage === 'draw-finished' && (
          <DrawFinishedPage 
            drawId={drawId}
            onNewDraws={() => {
              setCurrentPage('active-draws');
            }}
          />
        )}
      </div>
    </div>
  )
}

export default App
