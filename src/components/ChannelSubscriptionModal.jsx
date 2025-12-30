import './ChannelSubscriptionModal.css';

const ChannelSubscriptionModal = ({ isOpen, onClose, onSubscribeClick }) => {
  if (!isOpen) return null;

  const channelUrl = 'https://t.me/+OTBc8GHHdroyNjIy';

  const handleSubscribe = () => {
    const tg = window.Telegram?.WebApp;
    
    console.log('[ChannelSubscriptionModal] Открываем ссылку на канал:', channelUrl);
    console.log('[ChannelSubscriptionModal] Telegram Web App доступен:', !!tg);
    
    // КРИТИЧЕСКИ ВАЖНО для Telegram Mini App:
    // Вызов должен быть СИНХРОННЫМ и НАПРЯМУЮ из обработчика события пользователя
    // НЕ вызываем callback и НЕ закрываем модальное окно ПЕРЕД вызовом - это может прервать цепочку событий!
    
    // Для ссылок на каналы используем openLink в первую очередь
    // openTelegramLink может не работать для ссылок на каналы с форматом t.me/+
    if (tg && typeof tg.openLink === 'function') {
      console.log('[ChannelSubscriptionModal] Вызываем tg.openLink (приоритет для ссылок на каналы)');
      try {
        // Вызываем callback ПОСЛЕ успешного открытия ссылки
        tg.openLink(channelUrl);
        
        // Вызываем callback, что пользователь нажал на кнопку подписки
        if (onSubscribeClick) {
          onSubscribeClick();
        }
        
        // Закрываем модальное окно ПОСЛЕ успешного вызова
        // Используем небольшую задержку, чтобы дать Telegram время открыть канал
        setTimeout(() => {
          onClose();
        }, 300);
        return;
      } catch (err) {
        console.error('[ChannelSubscriptionModal] Ошибка в tg.openLink:', err);
      }
    }
    
    // ПРИОРИТЕТ 2: openTelegramLink - может работать для некоторых ссылок
    if (tg && typeof tg.openTelegramLink === 'function') {
      console.log('[ChannelSubscriptionModal] Вызываем tg.openTelegramLink');
      try {
        tg.openTelegramLink(channelUrl);
        
        // Вызываем callback, что пользователь нажал на кнопку подписки
        if (onSubscribeClick) {
          onSubscribeClick();
        }
        
        // Закрываем модальное окно после открытия ссылки
        setTimeout(() => {
          onClose();
        }, 300);
        return;
      } catch (err) {
        console.error('[ChannelSubscriptionModal] Ошибка в tg.openTelegramLink:', err);
      }
    }
    
    // Fallback: открываем через location.href
    // В этом случае вызываем callback и закрываем модальное окно перед переходом
    console.log('[ChannelSubscriptionModal] Используем window.location.href как fallback');
    
    // Вызываем callback, что пользователь нажал на кнопку подписки
    if (onSubscribeClick) {
      onSubscribeClick();
    }
    
    onClose();
    setTimeout(() => {
      window.location.href = channelUrl;
    }, 100);
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

