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
    
    // Вызываем callback, что пользователь нажал на кнопку подписки
    // Важно: вызываем ДО открытия ссылки, чтобы отследить нажатие
    if (onSubscribeClick) {
      onSubscribeClick();
    }
    
    // ПРИОРИТЕТ 1: openTelegramLink - открывает ссылку ВНУТРИ Telegram (не в браузере)
    // Это правильный метод для открытия ссылок внутри Telegram Mini App
    if (tg && typeof tg.openTelegramLink === 'function') {
      console.log('[ChannelSubscriptionModal] Вызываем tg.openTelegramLink (открывает внутри Telegram)');
      try {
        // Прямой вызов без оберток для максимальной надежности в продакшене
        // НЕ закрываем модальное окно - оно закроется автоматически при переходе на канал
        // или останется открытым для повторного показа, если пользователь вернется без подписки
        tg.openTelegramLink(channelUrl);
        return;
      } catch (err) {
        console.error('[ChannelSubscriptionModal] Ошибка в tg.openTelegramLink:', err);
      }
    }
    
    // ПРИОРИТЕТ 2: openLink - может открывать в браузере, но лучше чем ничего
    // Используем только если openTelegramLink недоступен
    if (tg && typeof tg.openLink === 'function') {
      console.log('[ChannelSubscriptionModal] Вызываем tg.openLink (может открыть в браузере)');
      try {
        // НЕ закрываем модальное окно - оно закроется автоматически при переходе на канал
        tg.openLink(channelUrl);
        return;
      } catch (err) {
        console.error('[ChannelSubscriptionModal] Ошибка в tg.openLink:', err);
      }
    }
    
    // Fallback: открываем через location.href
    // В этом случае закрываем модальное окно перед переходом, так как это полный переход
    console.log('[ChannelSubscriptionModal] Используем window.location.href как fallback');
    
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

