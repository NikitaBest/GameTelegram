import { Film } from 'lucide-react';
import './MoreAttemptsModal.css';

const MoreAttemptsModal = ({ isOpen, onClose, onInviteFriends, onWatchAd }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <img src="/Close.svg" alt="Закрыть" />
        </button>

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
        <button className="attempt-option watch-ad" onClick={onWatchAd}>
          <div className="attempt-option-left">
            <div className="attempt-bonus">+1 попытка</div>
            <div className="attempt-action">
              <Film size={20} />
              <span>Посмотреть рекламу</span>
            </div>
          </div>
          <div className="attempt-option-arrow">
            <img src="/material-symbols_arrow-back-rounded.svg" alt="Перейти" />
          </div>
        </button>
      </div>
    </div>
  );
};

export default MoreAttemptsModal;
