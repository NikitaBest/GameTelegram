import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Инициализация Telegram Web App
if (window.Telegram?.WebApp) {
  const tg = window.Telegram.WebApp
  tg.ready()
  tg.expand()
  
  // Отключаем вертикальные свайпы для закрытия приложения
  // Это позволяет использовать свайпы внутри приложения без конфликтов
  if (tg.disableVerticalSwipes) {
    tg.disableVerticalSwipes()
  }
  
  // Настройка цветовой схемы под цвет приложения (синий градиент)
  // Используем основной цвет из градиента приложения: #2C63DB (темно-синий)
  const appPrimaryColor = '#2C63DB'
  tg.setHeaderColor(appPrimaryColor)
  tg.setBackgroundColor(appPrimaryColor)
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
