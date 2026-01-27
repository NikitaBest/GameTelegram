import { openOfferWall } from '../lib/gigaOfferWall';
import './TasksRulesModal.css';

const TasksRulesModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handleStartTasks = () => {
    console.log('[TasksRulesModal] Нажата кнопка "Начать задания"');
    onClose(); // Закрываем модальное окно
    // Небольшая задержка перед открытием OfferWall для плавности
    setTimeout(() => {
      openOfferWall();
    }, 300);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="tasks-rules-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <img src="/Close.svg" alt="Закрыть" />
        </button>

        <div className="tasks-rules-modal-inner">
          <h2 className="tasks-rules-modal-title">Правила заданий</h2>

          <div className="tasks-rules-modal-info">
            <div className="tasks-rules-list">
              <div className="tasks-rule-item">
                <span className="tasks-rule-number">1</span>
                <span className="tasks-rule-text">Выполняйте задания и получайте награды</span>
              </div>
              <div className="tasks-rule-item">
                <span className="tasks-rule-number">2</span>
                <span className="tasks-rule-text">Подписывайтесь на каналы и получайте попытки</span>
              </div>
              <div className="tasks-rule-item">
                <span className="tasks-rule-number">3</span>
                <span className="tasks-rule-text">Скачивайте приложения и получайте звезды</span>
              </div>
              <div className="tasks-rule-item">
                <span className="tasks-rule-number">4</span>
                <span className="tasks-rule-text">Награды начисляются автоматически после выполнения</span>
              </div>
            </div>
            <p className="tasks-rules-modal-hint">
              Чем больше заданий выполните, тем больше наград получите!
            </p>
          </div>

          <button 
            className="tasks-rules-modal-start"
            onClick={handleStartTasks}
          >
            Начать задания
          </button>
        </div>
      </div>
    </div>
  );
};

export default TasksRulesModal;

