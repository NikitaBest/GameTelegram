import { useEffect, useState } from 'react'
import DrawPage from './pages/DrawPage'
import PathToTreasuresPage from './pages/PathToTreasuresPage'
import GameResultsPage from './pages/GameResultsPage'
import ActiveDrawsPage from './pages/ActiveDrawsPage'
import { GameContainer } from './game/game cosmos/GameContainer.tsx'
import { useAuth } from './hooks/useAuth'
import { getParsedStartParam } from './utils/urlParams'
import { saveDrawId, getDrawId } from './utils/storage'
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

  // Авторизация при загрузке приложения
  // ВАЖНО: Всегда отправляем запрос login после проверки параметра
  useEffect(() => {
    // Авторизуемся при каждой загрузке приложения (независимо от наличия токена)
    // Это гарантирует, что бекенд получит актуальные данные, включая utm параметр
    login().catch((err) => {
      console.error('Ошибка авторизации при загрузке:', err);
      // В режиме разработки продолжаем работу даже при ошибке авторизации
      if (import.meta.env.DEV) {
        console.warn('Продолжаем работу в режиме разработки без авторизации');
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Выполняем только при монтировании компонента

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
            onStartGame={() => setCurrentPage('game')} 
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
            onPlayAgain={() => {
              setGameKey(prev => prev + 1); // Пересоздаём игру
              setCurrentPage('game');
            }}
            attemptsLeft={1}
          />
        )}
      </div>
    </div>
  )
}

export default App
