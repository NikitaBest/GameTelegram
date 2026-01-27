import { useEffect, useState } from 'react';
import { initOfferWallSDK, openOfferWall, hasAvailableTasks } from '../lib/gigaOfferWall';
import './TasksButton.css';

const TasksButton = ({ onVisibilityChange }) => {
  const [hasTasks, setHasTasks] = useState(null); // null = проверка в процессе, true = есть задания, false = нет заданий

  // Функция для проверки наличия заданий
  const checkTasks = async () => {
    try {
      const available = await hasAvailableTasks();
      setHasTasks(available);
      console.log('[TasksButton] Проверка наличия заданий:', available ? '✅ Есть задания' : '❌ Нет заданий');
      
      // Уведомляем родительский компонент об изменении видимости
      // Кнопка видна только если hasTasks === true
      if (onVisibilityChange) {
        onVisibilityChange(available === true);
      }
    } catch (error) {
      console.error('[TasksButton] Ошибка при проверке заданий:', error);
      setHasTasks(false); // При ошибке считаем, что заданий нет
      if (onVisibilityChange) {
        onVisibilityChange(false);
      }
    }
  };

  // Инициализируем SDK и проверяем наличие заданий
  useEffect(() => {
    // Инициализируем SDK
    initOfferWallSDK();

    // Проверяем наличие заданий с задержкой (чтобы SDK успел загрузиться)
    const initialCheck = async () => {
      // Даем время на загрузку SDK (увеличиваем задержку для надежности)
      await new Promise(resolve => setTimeout(resolve, 1500));
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
      // Кнопка видна только если hasTasks === true
      // Если проверка еще не завершена (null) или заданий нет (false) - кнопка скрыта
      onVisibilityChange(hasTasks === true);
    }
  }, [hasTasks, onVisibilityChange]);

  // Не показываем кнопку, если:
  // 1. Проверка еще не завершена (null) - ждем результата
  // 2. Заданий нет (false) - скрываем кнопку
  if (hasTasks !== true) {
    return null;
  }

  // Показываем кнопку только если hasTasks === true (есть задания)
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

