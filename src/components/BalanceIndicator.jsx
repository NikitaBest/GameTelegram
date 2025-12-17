import { useState } from 'react';
import './BalanceIndicator.css';
import BalanceModal from './BalanceModal';

const BalanceIndicator = ({ balance }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="balance-indicator" onClick={() => setIsModalOpen(true)}>
        <div className="balance-icon">
          <img 
            src="/cupleader-1.svg" 
            alt="Cup leader" 
            className="balance-icon-image"
          />
        </div>
        <span className="balance-text">Баланс: {balance}</span>
      </div>

      <BalanceModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        balance={balance}
      />
    </>
  );
};

export default BalanceIndicator;

