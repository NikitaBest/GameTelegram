import './RewardDebugModal.css';

const RewardDebugModal = ({ isOpen, onClose, rewardData }) => {
  if (!isOpen || !rewardData) return null;

  const { rewardId, userId, projectId, amount, hash, description } = rewardData;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="reward-debug-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <img src="/Close.svg" alt="Закрыть" />
        </button>

        <div className="reward-debug-modal-inner">
          <h2 className="reward-debug-modal-title">Данные награды (для бекенда)</h2>

          <div className="reward-debug-modal-info">
            <p className="reward-debug-modal-hint">
              Это данные, которые фронтенд получает от партнёрки GigaPub и
              <br />
              <strong>будет отправлять на наш бекенд</strong>, когда он будет готов.
            </p>

            <div className="reward-debug-fields">
              <div className="reward-debug-field">
                <span className="reward-debug-label">rewardId:</span>
                <span className="reward-debug-value">{String(rewardId ?? '')}</span>
              </div>
              <div className="reward-debug-field">
                <span className="reward-debug-label">userId:</span>
                <span className="reward-debug-value">{String(userId ?? '')}</span>
              </div>
              <div className="reward-debug-field">
                <span className="reward-debug-label">projectId:</span>
                <span className="reward-debug-value">{String(projectId ?? '')}</span>
              </div>
              <div className="reward-debug-field">
                <span className="reward-debug-label">amount:</span>
                <span className="reward-debug-value">{String(amount ?? '')}</span>
              </div>
              <div className="reward-debug-field">
                <span className="reward-debug-label">hash:</span>
                <span className="reward-debug-value reward-debug-hash">{String(hash ?? '')}</span>
              </div>
              {description && (
                <div className="reward-debug-field">
                  <span className="reward-debug-label">description:</span>
                  <span className="reward-debug-value">{description}</span>
                </div>
              )}
            </div>

            <div className="reward-debug-json-block">
              <div className="reward-debug-json-title">Тело запроса на бекенд:</div>
              <pre className="reward-debug-json">
{`POST /verify-reward
Content-Type: application/json

${JSON.stringify(
  {
    rewardId,
    userId,
    projectId,
    amount,
    hash,
  },
  null,
  2
)}`}
              </pre>
            </div>
          </div>

          <button className="reward-debug-modal-close-btn" onClick={onClose}>
            Понятно
          </button>
        </div>
      </div>
    </div>
  );
};

export default RewardDebugModal;


