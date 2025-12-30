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
    // НЕ вызываем callback ПЕРЕД вызовом openTelegramLink - это может прервать цепочку событий!
    
    // ПРИОРИТЕТ 1: openTelegramLink - открывает ссылку ВНУТРИ Telegram (не в браузере)
    // Это правильный метод для открытия ссылок внутри Telegram Mini App
    if (tg && typeof tg.openTelegramLink === 'function') {
      console.log('[ChannelSubscriptionModal] Вызываем tg.openTelegramLink (открывает внутри Telegram)');
      // Прямой вызов БЕЗ try-catch и БЕЗ предварительных callback'ов для максимальной надежности
      // Вызываем синхронно, как в BalanceModal
      tg.openTelegramLink(channelUrl);
      
      // Вызываем callback, что пользователь нажал на кнопку подписки ПОСЛЕ открытия ссылки
      // Используем небольшую задержку, чтобы не прервать цепочку событий
      setTimeout(() => {
        if (onSubscribeClick) {
          onSubscribeClick();
        }
      }, 100);
      
      // НЕ закрываем модальное окно - оно закроется автоматически при переходе на канал
      // или останется открытым для повторного показа, если пользователь вернется без подписки
      return;
    }
    
    // ПРИОРИТЕТ 2: openLink - может открывать в браузере, но лучше чем ничего
    // Используем только если openTelegramLink недоступен
    if (tg && typeof tg.openLink === 'function') {
      console.log('[ChannelSubscriptionModal] Вызываем tg.openLink (может открыть в браузере)');
      tg.openLink(channelUrl);
      
      // Вызываем callback, что пользователь нажал на кнопку подписки ПОСЛЕ открытия ссылки
      setTimeout(() => {
        if (onSubscribeClick) {
          onSubscribeClick();
        }
      }, 100);
      
      // НЕ закрываем модальное окно - оно закроется автоматически при переходе на канал
      return;
    }
    
    // Fallback: открываем через location.href
    // В этом случае закрываем модальное окно перед переходом, так как это полный переход
    console.log('[ChannelSubscriptionModal] Используем window.location.href как fallback');
    
    // Вызываем callback перед переходом
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

