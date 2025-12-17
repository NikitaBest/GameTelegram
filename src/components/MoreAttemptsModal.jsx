import { useState, useEffect, useRef } from 'react';
import { Film, Loader2 } from 'lucide-react';
import { viewAd } from '../api/services/adService';
import './MoreAttemptsModal.css';

const MoreAttemptsModal = ({ isOpen, onClose, onInviteFriends, onWatchAd, participatingId, onAttemptAdded }) => {
  const [isLoadingAd, setIsLoadingAd] = useState(false);
  const [adError, setAdError] = useState(null);
  const [adReady, setAdReady] = useState(false);
  const showAdFnRef = useRef(null);

  // Регистрируем callback при инициализации Adextra SDK
  useEffect(() => {
    // Функция инициализации - вызывается когда SDK готов
    const onAdextraInit = (showFn) => {
      console.log('Adextra SDK инициализирован, showFn:', typeof showFn);
      showAdFnRef.current = showFn;
      setAdReady(true);
    };

    // Регистрируем callback для инициализации
    if (!window.adextra_onInit_callbacks) {
      window.adextra_onInit_callbacks = [];
    }
    window.adextra_onInit_callbacks.push(onAdextraInit);

    // Проверяем, может SDK уже инициализирован
    if (typeof window.p_adextra === 'function') {
      showAdFnRef.current = window.p_adextra;
      setAdReady(true);
    }

    return () => {
      // Удаляем callback при размонтировании
      if (window.adextra_onInit_callbacks) {
        const index = window.adextra_onInit_callbacks.indexOf(onAdextraInit);
        if (index > -1) {
          window.adextra_onInit_callbacks.splice(index, 1);
        }
      }
    };
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
      // Пробуем разные способы вызова рекламы
      const showFn = showAdFnRef.current || window.p_adextra;
      
      if (typeof showFn === 'function') {
        console.log('Показываем рекламу Adextra...');
        showFn(onSuccess, onError);
      } else {
        // Пробуем найти функцию show в глобальном объекте
        console.log('Ищем альтернативные методы показа рекламы...');
        console.log('window.adextra_onInit_callbacks:', window.adextra_onInit_callbacks);
        console.log('window.adextra_onInit_fallbacks:', window.adextra_onInit_fallbacks);
        
        // Проверяем fallbacks
        if (window.adextra_onInit_fallbacks && window.adextra_onInit_fallbacks.length > 0) {
          console.log('Вызываем fallback...');
          const fallback = window.adextra_onInit_fallbacks[0];
          if (typeof fallback === 'function') {
            fallback();
          }
        }
        
        setAdError('Реклама недоступна. Попробуйте позже.');
        setIsLoadingAd(false);
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

          {/* Посмотреть рекламу */}
          <button 
            className="attempt-option watch-ad" 
            onClick={handleWatchAd}
            disabled={isLoadingAd}
          >
            <div className="attempt-option-left">
              <div className="attempt-bonus">+1 попытка</div>
              <div className="attempt-action">
                {isLoadingAd ? (
                  <Loader2 size={20} className="spinning" />
                ) : (
                  <Film size={20} />
                )}
                <span>{isLoadingAd ? 'Загрузка...' : 'Посмотреть рекламу'}</span>
              </div>
            </div>
            <div className="attempt-option-arrow">
              <img src="/material-symbols_arrow-back-rounded.svg" alt="Перейти" />
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
