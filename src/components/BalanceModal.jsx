import './BalanceModal.css';

const BalanceModal = ({ isOpen, onClose, balance = 0, minWithdraw = 15 }) => {
  if (!isOpen) return null;

  const remaining = Math.max(0, minWithdraw - balance);
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
            <img src="/tabler_stars-filled.svg" alt="Звезда" className="balance-star" />
          </div>

          <div className="balance-modal-info">
            <div className="balance-modal-remaining">
              <span>До вывода:</span>
              <span className="remaining-amount">{remaining}</span>
              <img src="/tabler_stars-filled.svg" alt="Звезда" className="balance-star-small" />
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
                // TODO: Логика вывода
                console.log('Вывод средств');
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

