import './ChannelSubscriptionModal.css';
import { checkUserChannelSubscriptionBoost } from '../api/services/attemptService';

const ChannelSubscriptionModal = ({ isOpen, onClose, onSubscribeClick }) => {
  if (!isOpen) return null;

  const handleClose = async () => {
    // При закрытии модального окна делаем запрос на бекенд
    try {
      console.log('[ChannelSubscriptionModal] Закрытие модального окна, отправляем запрос на /user/check-channel-subscription-boost');
      await checkUserChannelSubscriptionBoost();
      console.log('[ChannelSubscriptionModal] Запрос успешно выполнен');
    } catch (error) {
      console.error('[ChannelSubscriptionModal] Ошибка при отправке запроса:', error);
    }
    
    // Закрываем модальное окно
    onClose();
  };


  const handleSubscribe = (e) => {
    // Предотвращаем всплытие события, чтобы overlay не перехватил клик
    if (e) {
      e.stopPropagation();
      e.preventDefault();
      e.nativeEvent?.stopImmediatePropagation?.();
    }
    
    const tg = window.Telegram?.WebApp;
    const channelUrl = 'https://t.me/+OTBc8GHHdroyNjIy';
    // Формат tg://join для invite-ссылок (может работать лучше)
    const telegramJoinUrl = 'tg://join?invite=OTBc8GHHdroyNjIy';
    
    console.log('[ChannelSubscriptionModal] Открываем ссылку на канал:', channelUrl);
    console.log('[ChannelSubscriptionModal] Telegram Web App доступен:', !!tg);
    
    // КРИТИЧЕСКИ ВАЖНО: НЕ вызываем callback ПЕРЕД открытием ссылки
    // Это может прервать цепочку событий и помешать переходу
    
    // Пробуем сначала формат tg://join для invite-ссылок
    if (tg && typeof tg.openTelegramLink === 'function') {
      console.log('[ChannelSubscriptionModal] Вызываем tg.openTelegramLink с tg://join форматом');
      try {
        // Прямой синхронный вызов БЕЗ callback'ов перед ним
        tg.openTelegramLink(telegramJoinUrl);
        
        // Вызываем callback ПОСЛЕ открытия ссылки с задержкой
        setTimeout(() => {
          if (onSubscribeClick) {
            onSubscribeClick();
          }
        }, 500);
        return;
      } catch (err) {
        console.error('[ChannelSubscriptionModal] Ошибка в tg://join формате:', err);
        // Пробуем обычный формат https://t.me/+
        try {
          console.log('[ChannelSubscriptionModal] Пробуем формат https://t.me/+');
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
    
    // Пробуем openLink
    if (tg && typeof tg.openLink === 'function') {
      console.log('[ChannelSubscriptionModal] Вызываем tg.openLink');
      try {
        tg.openLink(channelUrl);
        setTimeout(() => {
          if (onSubscribeClick) {
            onSubscribeClick();
          }
        }, 500);
        return;
      } catch (err) {
        console.error('[ChannelSubscriptionModal] Ошибка в tg.openLink:', err);
      }
    }
    
    // Fallback: открываем через location.href
    console.log('[ChannelSubscriptionModal] Используем window.location.href');
    if (onSubscribeClick) {
      onSubscribeClick();
    }
    window.location.href = channelUrl;
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="channel-subscription-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={handleClose}>
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
            onMouseDown={(e) => {
              // Дополнительная защита: предотвращаем всплытие на уровне mousedown
              e.stopPropagation();
            }}
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

