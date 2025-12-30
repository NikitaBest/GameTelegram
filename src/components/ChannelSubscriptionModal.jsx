import './ChannelSubscriptionModal.css';

const ChannelSubscriptionModal = ({ isOpen, onClose, onSubscribeClick }) => {
  if (!isOpen) return null;

  // Используем несколько форматов ссылок для максимальной совместимости
  const channelUrl = 'https://t.me/+OTBc8GHHdroyNjIy';
  // Формат tg://join для invite-ссылок на каналы (код без +)
  const telegramJoinUrl = 'tg://join?invite=OTBc8GHHdroyNjIy';

  const handleSubscribe = (e) => {
    // КРИТИЧЕСКИ ВАЖНО: предотвращаем всплытие события, чтобы overlay не перехватил клик
    if (e) {
      e.preventDefault();
      e.stopPropagation();
      e.nativeEvent?.stopImmediatePropagation?.();
    }
    
    const tg = window.Telegram?.WebApp;
    
    console.log('[ChannelSubscriptionModal] Открываем ссылку на канал:', channelUrl);
    console.log('[ChannelSubscriptionModal] Telegram Web App доступен:', !!tg);
    console.log('[ChannelSubscriptionModal] Методы доступны:', {
      openTelegramLink: tg && typeof tg.openTelegramLink === 'function',
      openLink: tg && typeof tg.openLink === 'function',
    });
    
    // КРИТИЧЕСКИ ВАЖНО: НЕ вызываем callback ПЕРЕД открытием ссылки
    // Это может прервать цепочку событий и помешать переходу
    
    // Используем openTelegramLink для открытия напрямую в Telegram
    // Для invite-ссылок на каналы пробуем сначала формат tg://join
    if (tg && typeof tg.openTelegramLink === 'function') {
      console.log('[ChannelSubscriptionModal] Вызываем tg.openTelegramLink');
      
      // Пробуем сначала формат tg://join для invite-ссылок
      try {
        console.log('[ChannelSubscriptionModal] Пробуем формат tg://join:', telegramJoinUrl);
        tg.openTelegramLink(telegramJoinUrl);
        
        // Вызываем callback ПОСЛЕ открытия ссылки с задержкой
        setTimeout(() => {
          if (onSubscribeClick) {
            onSubscribeClick();
          }
        }, 500);
        
        // НЕ закрываем модальное окно - оно останется открытым
        return;
      } catch (err) {
        console.error('[ChannelSubscriptionModal] Ошибка в tg://join формате:', err);
        // Пробуем обычный формат https://t.me/+
        try {
          console.log('[ChannelSubscriptionModal] Пробуем формат https://t.me/+:', channelUrl);
          tg.openTelegramLink(channelUrl);
          
          setTimeout(() => {
            if (onSubscribeClick) {
              onSubscribeClick();
            }
          }, 500);
          
          return;
        } catch (err2) {
          console.error('[ChannelSubscriptionModal] Ошибка в https://t.me/+ формате:', err2);
        }
      }
    }
    
    if (tg && typeof tg.openLink === 'function') {
      console.log('[ChannelSubscriptionModal] Вызываем tg.openLink');
      try {
        tg.openLink(channelUrl);
        
        // Вызываем callback ПОСЛЕ открытия ссылки
        setTimeout(() => {
          if (onSubscribeClick) {
            onSubscribeClick();
          }
        }, 500);
        
        // НЕ закрываем модальное окно - оно останется открытым
        return;
      } catch (err) {
        console.error('[ChannelSubscriptionModal] Ошибка в tg.openLink:', err);
      }
    }
    
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

