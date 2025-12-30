import './ChannelSubscriptionModal.css';

const ChannelSubscriptionModal = ({ isOpen, onClose, onSubscribeClick }) => {
  if (!isOpen) return null;

  const channelUrl = 'https://t.me/+OTBc8GHHdroyNjIy';

  const handleSubscribe = () => {
    const tg = window.Telegram?.WebApp;
    
    console.log('[ChannelSubscriptionModal] Открываем ссылку на канал:', channelUrl);
    console.log('[ChannelSubscriptionModal] Telegram Web App доступен:', !!tg);
    
    // Используем openTelegramLink для открытия напрямую в Telegram
    // Логика точно такая же, как в BalanceModal, где переход работает
    if (tg && typeof tg.openTelegramLink === 'function') {
      console.log('[ChannelSubscriptionModal] Вызываем tg.openTelegramLink');
      tg.openTelegramLink(channelUrl);
      
      // Вызываем callback, что пользователь нажал на кнопку подписки
      // Вызываем синхронно, но после открытия ссылки
      if (onSubscribeClick) {
        onSubscribeClick();
      }
      
      // НЕ закрываем модальное окно - оно останется открытым
      return;
    } else if (tg && typeof tg.openLink === 'function') {
      console.log('[ChannelSubscriptionModal] Вызываем tg.openLink');
      tg.openLink(channelUrl);
      
      // Вызываем callback, что пользователь нажал на кнопку подписки
      if (onSubscribeClick) {
        onSubscribeClick();
      }
      
      // НЕ закрываем модальное окно - оно останется открытым
      return;
    } else {
      // Fallback: открываем через location.href
      console.log('[ChannelSubscriptionModal] Используем window.location.href');
      
      // Вызываем callback перед переходом
      if (onSubscribeClick) {
        onSubscribeClick();
      }
      
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

