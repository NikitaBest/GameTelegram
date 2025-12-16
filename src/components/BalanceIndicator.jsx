import './BalanceIndicator.css';

const BalanceIndicator = ({ balance }) => {
  return (
    <div className="balance-indicator">
      <div className="balance-icon">
        <img 
          src="/cupleader-1.svg" 
          alt="Cup leader" 
          className="balance-icon-image"
        />
      </div>
      <span className="balance-text">Баланс: {balance}</span>
    </div>
  );
};

export default BalanceIndicator;

