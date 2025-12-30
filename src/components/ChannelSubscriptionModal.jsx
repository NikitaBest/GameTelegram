import './ChannelSubscriptionModal.css';

const ChannelSubscriptionModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const channelUrl = 'https://t.me/+OTBc8GHHdroyNjIy';

  const handleSubscribe = () => {
    const tg = window.Telegram?.WebApp;
    
    console.log('[ChannelSubscriptionModal] Открываем ссылку на канал:', channelUrl);
    
    // Используем openTelegramLink для открытия напрямую в Telegram
    if (tg && typeof tg.openTelegramLink === 'function') {
      console.log('[ChannelSubscriptionModal] Вызываем tg.openTelegramLink');
      tg.openTelegramLink(channelUrl);
      // Закрываем модальное окно после открытия ссылки
      setTimeout(() => {
        onClose();
      }, 300);
    } else if (tg && typeof tg.openLink === 'function') {
      console.log('[ChannelSubscriptionModal] Вызываем tg.openLink');
      tg.openLink(channelUrl);
      setTimeout(() => {
        onClose();
      }, 300);
    } else {
      // Fallback: открываем через location.href
      console.log('[ChannelSubscriptionModal] Используем window.location.href');
      onClose();
      setTimeout(() => {
        window.location.href = channelUrl;
      }, 100);
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
          >
            Подписаться на канал
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChannelSubscriptionModal;

