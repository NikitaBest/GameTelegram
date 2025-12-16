import { useEffect, useState } from 'react'
import DrawPage from './pages/DrawPage'
import PathToTreasuresPage from './pages/PathToTreasuresPage'
import GameResultsPage from './pages/GameResultsPage'
import { GameContainer } from './game/game cosmos/GameContainer.tsx'
import './App.css'

function App() {
  // Для тестирования: можно переключать страницы
  // В продакшене это будет определяться через роутинг или состояние бекенда
  const [currentPage, setCurrentPage] = useState('path-to-treasures'); // 'path-to-treasures' | 'draw' | 'game' | 'results'
  const [gameScore, setGameScore] = useState(0);
  const [gameKey, setGameKey] = useState(0); // Для пересоздания компонента игры

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

  return (
    <div className="app page-background">
      <div className="app-content">
        {currentPage === 'path-to-treasures' && (
          <PathToTreasuresPage onStartGame={() => setCurrentPage('draw')} />
        )}
        {currentPage === 'draw' && (
          <DrawPage onStartGame={() => setCurrentPage('game')} />
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
