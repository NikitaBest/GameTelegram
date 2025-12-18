import './TelegramLanding.css'

const TELEGRAM_URL = 'https://t.me/chest_of_gold'

function TelegramLanding() {
  const handleOpenTelegram = () => {
    window.location.href = TELEGRAM_URL
  }

  return (
    <div className="telegram-landing">
      <div className="telegram-landing__card">
        <div className="telegram-landing__title">Открой игру в Telegram</div>
        <div className="telegram-landing__text">
          Это мини-приложение работает внутри Telegram. Открой бота, чтобы участвовать в розыгрышах,
          играть и получать призы.
        </div>

        <button className="telegram-landing__button" onClick={handleOpenTelegram}>
          <img
            src="/vite.svg"
            alt=""
            className="telegram-landing__button-icon"
          />
          <span>Открыть в Telegram</span>
        </button>

        <div className="telegram-landing__hint">
          Если Telegram не установлен, сначала установи приложение и повтори попытку.
        </div>
      </div>
    </div>
  )
}

export default TelegramLanding


