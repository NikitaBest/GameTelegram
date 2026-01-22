import { useState, useEffect, useRef } from 'react';
import { Film, Loader2, CheckCircle } from 'lucide-react';
import { viewAd } from '../api/services/adService';
import { initAdProvider, showAd } from '../lib/adProviders';
import './MoreAttemptsModal.css';

// Конфигурация рекламного провайдера
const AD_PROVIDER = 'gigapub';

const MoreAttemptsModal = ({ isOpen, onClose, onInviteFriends, onWatchAd, participatingId, onAttemptAdded, isViewedAds = false }) => {
  const [isLoadingAd, setIsLoadingAd] = useState(false);
  const [adError, setAdError] = useState(null);
  const [adReady, setAdReady] = useState(false);
  const showAdFnRef = useRef(null);

  // Инициализация рекламного провайдера (GigaPub)
  useEffect(() => {
    const cleanup = initAdProvider(AD_PROVIDER, (showFn) => {
      console.log(`${AD_PROVIDER} SDK инициализирован, showFn:`, typeof showFn);
      showAdFnRef.current = showFn;
      setAdReady(true);
    });

    return cleanup;
  }, []);

  // Сброс состояния при открытии
  useEffect(() => {
    if (isOpen) {
      setAdError(null);
      setIsLoadingAd(false);
    }
  }, [isOpen]);

  const handleWatchAd = async () => {
    if (!participatingId) {
      console.error('participatingId не указан');
      setAdError('Ошибка: ID участия не найден');
      return;
    }

    setIsLoadingAd(true);
    setAdError(null);

    // Callback при успешном просмотре рекламы
    const onSuccess = async () => {
      console.log('--Ad Shown Successfully--');
      
      try {
        const response = await viewAd(participatingId);
        if (response.isSuccess) {
          console.log('Попытка добавлена:', response);
          onAttemptAdded?.();
          onClose();
        } else {
          setAdError(response.error || 'Ошибка при добавлении попытки');
        }
      } catch (err) {
        console.error('Ошибка при отправке просмотра рекламы:', err);
        setAdError('Не удалось добавить попытку');
      }
      setIsLoadingAd(false);
    };

    // Callback при ошибке или пропуске рекламы
    const onError = () => {
      console.log('--Ad Failed or Skipped--');
      setAdError('Реклама не была просмотрена');
      setIsLoadingAd(false);
    };

    try {
      // Используем универсальную функцию показа рекламы
      if (showAdFnRef.current) {
        console.log(`Показываем рекламу ${AD_PROVIDER}...`);
        await showAd(AD_PROVIDER, showAdFnRef.current, onSuccess, onError);
      } else {
        // Если SDK еще не загружен, пробуем напрямую через window
        if (AD_PROVIDER === 'gigapub' && typeof window.showGiga === 'function') {
          console.log('Используем window.showGiga напрямую...');
          await showAd(AD_PROVIDER, window.showGiga, onSuccess, onError);
        } else {
        setAdError('Реклама недоступна. Попробуйте позже.');
        setIsLoadingAd(false);
        }
      }
    } catch (err) {
      console.error('Ошибка при показе рекламы:', err);
      setAdError('Произошла ошибка');
      setIsLoadingAd(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <img src="/Close.svg" alt="Закрыть" />
        </button>

        <div className="modal-inner">
          {/* Пригласить друзей */}
          <div className="attempt-group">
            <button className="attempt-option invite-friends" onClick={onInviteFriends}>
              <div className="attempt-option-left">
                <div className="attempt-bonus">+2 попытки</div>
                <div className="attempt-action">
                  <img src="/fa-solid_user-friends.svg" alt="Друзья" className="attempt-icon" />
                  <span>Пригласить друзей</span>
                </div>
              </div>
              <div className="attempt-option-arrow">
                <img src="/material-symbols_arrow-back-rounded.svg" alt="Перейти" />
              </div>
            </button>
            <p className="attempt-note">*Начисляется после перехода и старта игры</p>
          </div>

          {/* Посмотреть рекламу */}
          <button 
            className={`attempt-option watch-ad ${isViewedAds ? 'disabled' : ''}`}
            onClick={handleWatchAd}
            disabled={isLoadingAd || isViewedAds}
          >
            <div className="attempt-option-left">
              <div className="attempt-bonus">+1 попытка</div>
              <div className="attempt-action">
                {isLoadingAd ? (
                  <Loader2 size={20} className="spinning" />
                ) : isViewedAds ? (
                  <CheckCircle size={20} />
                ) : (
                  <Film size={20} />
                )}
                <span>{isLoadingAd ? 'Загрузка...' : isViewedAds ? 'Бонус получен' : 'Посмотреть рекламу'}</span>
              </div>
            </div>
            <div className="attempt-option-arrow">
              {isViewedAds ? (
                <CheckCircle size={24} className="check-icon" />
              ) : (
                <img src="/material-symbols_arrow-back-rounded.svg" alt="Перейти" />
              )}
            </div>
          </button>
          
          {adError && (
            <p className="attempt-error">{adError}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MoreAttemptsModal;
