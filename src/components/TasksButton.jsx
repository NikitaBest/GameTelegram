import { useEffect, useState } from 'react';
import { initOfferWallSDK, openOfferWall, hasAvailableTasks } from '../lib/gigaOfferWall';
import './TasksButton.css';

const TasksButton = ({ onVisibilityChange }) => {
  const [hasTasks, setHasTasks] = useState(null); // null = проверка в процессе, true/false = результат

  // Функция для проверки наличия заданий
  const checkTasks = async () => {
    const available = await hasAvailableTasks();
    setHasTasks(available);
    console.log('[TasksButton] Наличие заданий:', available);
    
    // Уведомляем родительский компонент об изменении видимости
    if (onVisibilityChange) {
      onVisibilityChange(available !== false);
    }
  };

  // Инициализируем SDK и проверяем наличие заданий
  useEffect(() => {
    // Инициализируем SDK
    initOfferWallSDK();

    // Проверяем наличие заданий с задержкой (чтобы SDK успел загрузиться)
    const initialCheck = async () => {
      // Даем время на загрузку SDK
      await new Promise(resolve => setTimeout(resolve, 1000));
      await checkTasks();
    };

    initialCheck();

    // Слушаем события закрытия и обновления OfferWall
    const handleOfferWallClosed = () => {
      console.log('[TasksButton] OfferWall закрыт, проверяем задания заново...');
      setTimeout(checkTasks, 500); // Небольшая задержка для обновления на стороне GigaPub
    };

    const handleOfferWallUpdated = () => {
      console.log('[TasksButton] Задания обновлены, проверяем...');
      checkTasks();
    };

    window.addEventListener('gigaOfferWallClosed', handleOfferWallClosed);
    window.addEventListener('gigaOfferWallUpdated', handleOfferWallUpdated);

    // Периодически проверяем наличие заданий (каждые 30 секунд)
    const interval = setInterval(checkTasks, 30000);

    return () => {
      clearInterval(interval);
      window.removeEventListener('gigaOfferWallClosed', handleOfferWallClosed);
      window.removeEventListener('gigaOfferWallUpdated', handleOfferWallUpdated);
    };
  }, []);

  const handleClick = () => {
    console.log('[TasksButton] Клик по кнопке "Задания"');
    openOfferWall();
  };

  // Уведомляем родительский компонент при изменении состояния
  useEffect(() => {
    if (onVisibilityChange) {
      // Если проверка еще не завершена (null), считаем что кнопка видна
      // Если проверка завершена, передаем результат
      onVisibilityChange(hasTasks !== false);
    }
  }, [hasTasks, onVisibilityChange]);

  // Не показываем кнопку, если заданий нет
  if (hasTasks === false) {
    return null;
  }

  // Показываем кнопку, если задания есть или проверка еще в процессе
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

