import './BalanceModal.css';

const BalanceModal = ({ isOpen, onClose, balance = 0, minWithdraw = 15 }) => {
  if (!isOpen) return null;

  // Рассчитываем оставшуюся сумму до вывода и округляем до 2 знаков после запятой
  const remaining = Math.max(0, minWithdraw - balance);
  const remainingRounded = Math.round(remaining * 100) / 100; // Округляем до 2 знаков после запятой
  const canWithdraw = balance >= minWithdraw;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="balance-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <img src="/Close.svg" alt="Закрыть" />
        </button>

        <div className="balance-modal-inner">
          <h2 className="balance-modal-title">Твой баланс</h2>

          <div className="balance-modal-amount">
            <span>{balance}</span>
            <img src="/cupleader-1.svg" alt="Звезда" className="balance-star" />
          </div>

          <div className="balance-modal-info">
            <div className="balance-modal-remaining">
              <span>До вывода:</span>
              <span className="remaining-amount">{remainingRounded.toFixed(2)}</span>
              <img src="/cupleader-1.svg" alt="Звезда" className="balance-star-small" />
            </div>
            <p className="balance-modal-hint">
              Чем выше место в лидерборде тем больше звёзд получите!
            </p>
          </div>

          <button 
            className={`balance-modal-withdraw ${canWithdraw ? '' : 'disabled'}`}
            disabled={!canWithdraw}
            onClick={() => {
              if (canWithdraw) {
                const withdrawUrl = 'https://t.me/chest_of_goldbot?start=stars';
                const tg = window.Telegram?.WebApp;
                
                console.log('[BalanceModal] Открываем ссылку вывода:', withdrawUrl);
                
                // Используем openTelegramLink для открытия напрямую в Telegram
                if (tg && typeof tg.openTelegramLink === 'function') {
                  console.log('[BalanceModal] Вызываем tg.openTelegramLink');
                  tg.openTelegramLink(withdrawUrl);
                  // Закрываем модальное окно после открытия ссылки
                  setTimeout(() => {
                    onClose();
                  }, 300);
                } else if (tg && typeof tg.openLink === 'function') {
                  console.log('[BalanceModal] Вызываем tg.openLink');
                  tg.openLink(withdrawUrl);
                  setTimeout(() => {
                    onClose();
                  }, 300);
                } else {
                  // Fallback: открываем через location.href
                  console.log('[BalanceModal] Используем window.location.href');
                  onClose();
                  setTimeout(() => {
                    window.location.href = withdrawUrl;
                  }, 100);
                }
              }
            }}
          >
            Вывести
          </button>
        </div>
      </div>
    </div>
  );
};

export default BalanceModal;

