import { useEffect } from 'react';
import { initOfferWallSDK, openOfferWall } from '../lib/gigaOfferWall';
import './TasksButton.css';

const TasksButton = () => {
  // Инициализируем SDK при монтировании компонента
  useEffect(() => {
    initOfferWallSDK();
  }, []);

  const handleClick = () => {
    console.log('[TasksButton] Клик по кнопке "Задания"');
    openOfferWall();
  };

  return (
    <div className="tasks-button" onClick={handleClick}>
      <div className="tasks-icon">
        <img 
          src="/CupLeader.svg" 
          alt="Задания" 
          className="tasks-icon-image"
        />
      </div>
      <span className="tasks-text">Задания</span>
    </div>
  );
};

export default TasksButton;

