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
    // Прямая ссылка на канал (может работать лучше, чем invite-ссылка)
    const channelDirectUrl = 'https://t.me/chest_of_gold';
    // Invite-ссылка (резервный вариант)
    const channelInviteUrl = 'https://t.me/+OTBc8GHHdroyNjIy';
    // Формат tg:// для прямого канала
    const telegramDirectUrl = 'tg://resolve?domain=chest_of_gold';
    // Формат tg://join для invite-ссылок
    const telegramJoinUrl = 'tg://join?invite=OTBc8GHHdroyNjIy';
    
    console.log('[ChannelSubscriptionModal] Открываем ссылку на канал');
    console.log('[ChannelSubscriptionModal] Telegram Web App доступен:', !!tg);
    console.log('[ChannelSubscriptionModal] Пробуем прямую ссылку на канал:', channelDirectUrl);
    
    // КРИТИЧЕСКИ ВАЖНО: НЕ вызываем callback ПЕРЕД открытием ссылки
    // Это может прервать цепочку событий и помешать переходу
    
    // ПРИОРИТЕТ 1: Прямая ссылка на канал через tg://resolve
    if (tg && typeof tg.openTelegramLink === 'function') {
      console.log('[ChannelSubscriptionModal] Вызываем tg.openTelegramLink с tg://resolve');
      try {
        tg.openTelegramLink(telegramDirectUrl);
        setTimeout(() => {
          if (onSubscribeClick) {
            onSubscribeClick();
          }
        }, 500);
        return;
      } catch (err) {
        console.error('[ChannelSubscriptionModal] Ошибка в tg://resolve:', err);
      }
    }
    
    // ПРИОРИТЕТ 2: Прямая ссылка на канал через https://t.me/
    if (tg && typeof tg.openTelegramLink === 'function') {
      console.log('[ChannelSubscriptionModal] Вызываем tg.openTelegramLink с прямой ссылкой на канал');
      try {
        tg.openTelegramLink(channelDirectUrl);
        setTimeout(() => {
          if (onSubscribeClick) {
            onSubscribeClick();
          }
        }, 500);
        return;
      } catch (err) {
        console.error('[ChannelSubscriptionModal] Ошибка в прямой ссылке на канал:', err);
      }
    }
    
    // ПРИОРИТЕТ 3: Invite-ссылка через tg://join
    if (tg && typeof tg.openTelegramLink === 'function') {
      console.log('[ChannelSubscriptionModal] Вызываем tg.openTelegramLink с tg://join');
      try {
        tg.openTelegramLink(telegramJoinUrl);
        setTimeout(() => {
          if (onSubscribeClick) {
            onSubscribeClick();
          }
        }, 500);
        return;
      } catch (err) {
        console.error('[ChannelSubscriptionModal] Ошибка в tg://join:', err);
      }
    }
    
    // ПРИОРИТЕТ 4: Invite-ссылка через https://t.me/+
    if (tg && typeof tg.openTelegramLink === 'function') {
      console.log('[ChannelSubscriptionModal] Вызываем tg.openTelegramLink с invite-ссылкой');
      try {
        tg.openTelegramLink(channelInviteUrl);
        setTimeout(() => {
          if (onSubscribeClick) {
            onSubscribeClick();
          }
        }, 500);
        return;
      } catch (err) {
        console.error('[ChannelSubscriptionModal] Ошибка в invite-ссылке:', err);
      }
    }
    
    // ПРИОРИТЕТ 5: openLink с прямой ссылкой
    if (tg && typeof tg.openLink === 'function') {
      console.log('[ChannelSubscriptionModal] Вызываем tg.openLink с прямой ссылкой');
      try {
        tg.openLink(channelDirectUrl);
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
    
    // ПРИОРИТЕТ 6: openLink с invite-ссылкой
    if (tg && typeof tg.openLink === 'function') {
      console.log('[ChannelSubscriptionModal] Вызываем tg.openLink с invite-ссылкой');
      try {
        tg.openLink(channelInviteUrl);
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
    window.location.href = channelDirectUrl;
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

