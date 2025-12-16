import './TaskItem.css';

const TaskItem = ({ task, onTaskClick }) => {
  // task.completed соответствует partner.subscribed
  const isSubscribed = task.completed;
  
  return (
    <div 
      className={`task-item ${isSubscribed ? 'completed' : 'locked'}`}
      onClick={() => !isSubscribed && onTaskClick?.(task)}
      style={{ cursor: !isSubscribed ? 'pointer' : 'default' }}
    >
      <div className="task-icon">
        {isSubscribed ? (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="10" cy="10" r="10" fill="#4CAF50"/>
            <path d="M6 10L9 13L14 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ) : (
          <img src="/mingcute_lock-fill.svg" alt="Lock" className="task-lock-icon" />
        )}
      </div>
      <div className="task-content">
        <span className="task-title">{task.title}</span>
      </div>
      <div className="task-arrow">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </div>
  );
};

export default TaskItem;

