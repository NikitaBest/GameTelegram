import { useEffect, useState } from 'react'
import DrawPage from './pages/DrawPage'
import PathToTreasuresPage from './pages/PathToTreasuresPage'
import GamePage from './game/GamePage'
import './App.css'

function App() {
  // Для тестирования: можно переключать страницы
  // В продакшене это будет определяться через роутинг или состояние бекенда
  const [currentPage, setCurrentPage] = useState('path-to-treasures'); // 'path-to-treasures' | 'draw' | 'game'

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
        {currentPage === 'game' && <GamePage />}
      </div>
    </div>
  )
}

export default App
