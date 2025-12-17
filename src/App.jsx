import { useEffect, useState, useCallback } from 'react'
import DrawPage from './pages/DrawPage'
import PathToTreasuresPage from './pages/PathToTreasuresPage'
import GameResultsPage from './pages/GameResultsPage'
import ActiveDrawsPage from './pages/ActiveDrawsPage'
import LoadingScreen from './components/LoadingScreen'
import { GameContainer } from './game/game cosmos/GameContainer.tsx'
import { useAuth } from './hooks/useAuth'
import { getParsedStartParam } from './utils/urlParams'
import { saveDrawId, getDrawId } from './utils/storage'
import { checkPartnersSubscription } from './api/services/partnersService'
import './App.css'

function App() {
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
  // Приоритет: параметр из URL > сохраненный в localStorage
  const initialDrawId = parsedStartParam.drawId || getDrawId();
  const [drawId, setDrawId] = useState(initialDrawId);
  
  // Сохраняем drawId в localStorage если он есть
  useEffect(() => {
    if (parsedStartParam.drawId) {
      saveDrawId(parsedStartParam.drawId);
      setDrawId(parsedStartParam.drawId);
      if (import.meta.env.DEV) {
        console.log(`Сохранен ID розыгрыша: ${parsedStartParam.drawId}`);
      }
    }
  }, [parsedStartParam.drawId]);
  
  // Определяем начальную страницу на основе параметра tgWebAppStartParam
  const getInitialPage = () => {
    if (parsedStartParam.hasParam && parsedStartParam.drawId) {
      // Если параметр есть и есть ID розыгрыша - открываем страницу с розыгрышем
      console.log(`Открываем розыгрыш с ID: ${parsedStartParam.drawId}`);
      return 'path-to-treasures';
    } else {
      // Если параметра нет - открываем страницу активных розыгрышей
      console.log('Параметр не найден, открываем страницу активных розыгрышей');
      return 'active-draws';
    }
  };

  const [currentPage, setCurrentPage] = useState(getInitialPage);
  const [gameScore, setGameScore] = useState(0);
  const [gameKey, setGameKey] = useState(0); // Для пересоздания компонента игры
  const [participatingId, setParticipatingId] = useState(null); // ID участия из /start
  const [attemptsLeft, setAttemptsLeft] = useState(0); // Оставшиеся попытки
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
        
        // Если есть drawId - проверяем подписки
        if (drawId) {
          await checkAndNavigate(drawId);
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
          <ActiveDrawsPage />
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
              // Проверяем есть ли попытки
              if (attempts !== undefined && attempts <= 0) {
                // Нет попыток - переводим на страницу результатов
                setCurrentPage('results');
              } else {
                // Есть попытки - начинаем игру
                setCurrentPage('game');
              }
            }}
            onParticipatingIdReceived={(id) => setParticipatingId(id)}
            onAttemptsReceived={(attempts) => setAttemptsLeft(attempts)}
          />
        )}
        {currentPage === 'game' && (
          <GameContainer 
            key={gameKey} // Пересоздаём компонент при каждом переходе на игру
            onGameOver={(score) => {
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
      </div>
    </div>
  )
}

export default App
