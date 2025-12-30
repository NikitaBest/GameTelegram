import './ChannelSubscriptionModal.css';

const ChannelSubscriptionModal = ({ isOpen, onClose, onSubscribeClick }) => {
  if (!isOpen) return null;


  const handleSubscribe = () => {
    const tg = window.Telegram?.WebApp;
    const channelUrl = 'https://t.me/+OTBc8GHHdroyNjIy';
    
    console.log('[ChannelSubscriptionModal] Открываем ссылку на канал:', channelUrl);
    
    // Простой переход по ссылке, как в BalanceModal
    if (tg && typeof tg.openTelegramLink === 'function') {
      console.log('[ChannelSubscriptionModal] Вызываем tg.openTelegramLink');
      tg.openTelegramLink(channelUrl);
      
      // Вызываем callback после открытия ссылки
      setTimeout(() => {
        if (onSubscribeClick) {
          onSubscribeClick();
        }
      }, 300);
    } else if (tg && typeof tg.openLink === 'function') {
      console.log('[ChannelSubscriptionModal] Вызываем tg.openLink');
      tg.openLink(channelUrl);
      
      setTimeout(() => {
        if (onSubscribeClick) {
          onSubscribeClick();
        }
      }, 300);
    } else {
      // Fallback: открываем через location.href
      console.log('[ChannelSubscriptionModal] Используем window.location.href');
      if (onSubscribeClick) {
        onSubscribeClick();
      }
      window.location.href = channelUrl;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="channel-subscription-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <img src="/Close.svg" alt="Закрыть" />
        </button>

        <div className="channel-subscription-modal-inner">
          <h2 className="channel-subscription-modal-title">Улучши место!</h2>

          <div className="channel-subscription-modal-info">
            <p className="channel-subscription-modal-hint">
              Подпишись на наш канал.
              <br />
              и получи +20 очков.
            </p>
          </div>

          <button 
            className="channel-subscription-modal-button"
            onClick={handleSubscribe}
            type="button"
          >
            Подписаться на канал
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChannelSubscriptionModal;

