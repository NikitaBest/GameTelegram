import { useEffect, useState } from 'react';
import { initOfferWallSDK, hasAvailableTasks } from '../lib/gigaOfferWall';
import TasksRulesModal from './TasksRulesModal';
import RewardDebugModal from './RewardDebugModal';
import './TasksButton.css';

const TasksButton = ({ onVisibilityChange }) => {
  const [hasTasks, setHasTasks] = useState(null); // null = проверка в процессе, true = есть задания, false = нет заданий
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rewardDebugData, setRewardDebugData] = useState(null);
  const [isRewardModalOpen, setIsRewardModalOpen] = useState(false);

  // Функция для проверки наличия заданий
  const checkTasks = async () => {
    console.log('[TasksButton] 🔍 Начинаем проверку наличия заданий...');
    try {
      const available = await hasAvailableTasks();
      console.log('[TasksButton] 📊 Результат проверки:', available, 'тип:', typeof available);
      console.log('[TasksButton] 📊 available === true?', available === true);
      console.log('[TasksButton] 📊 Boolean(available)?', Boolean(available));
      
      setHasTasks(available);
      console.log('[TasksButton] ✅ hasTasks установлен в:', available, available ? '→ ПОКАЗАТЬ кнопку' : '→ СКРЫТЬ кнопку');
      
      // Уведомляем родительский компонент об изменении видимости
      // Кнопка видна только если hasTasks === true
      const shouldShow = available === true;
      console.log('[TasksButton] 📤 Уведомляем родителя: shouldShow =', shouldShow);
      if (onVisibilityChange) {
        onVisibilityChange(shouldShow);
      }
    } catch (error) {
      console.error('[TasksButton] ❌ Ошибка при проверке заданий:', error);
      setHasTasks(false); // При ошибке считаем, что заданий нет
      if (onVisibilityChange) {
        onVisibilityChange(false);
      }
    }
  };

  // Инициализируем SDK и проверяем наличие заданий
  useEffect(() => {
    console.log('[TasksButton] 🚀 Компонент смонтирован, начинаем инициализацию...');
    
    // Инициализируем SDK
    initOfferWallSDK();

    // Проверяем наличие заданий с задержкой (чтобы SDK успел загрузиться)
    const initialCheck = async () => {
      console.log('[TasksButton] ⏳ Ждем загрузки SDK (4 секунды)...');
      // Увеличиваем задержку для надежности - SDK может загружаться асинхронно
      await new Promise(resolve => setTimeout(resolve, 4000));
      
      // Проверяем, что SDK загружен
      if (!window.gigaOfferWallSDK && !window.loadOfferWallSDK) {
        console.warn('[TasksButton] ⚠️ SDK еще не загружен, ждем еще...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
      
      console.log('[TasksButton] ✅ Начинаем проверку заданий...');
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

  // Слушаем кастомное событие с данными награды от GigaPub
  useEffect(() => {
    const handleRewardDebug = (event) => {
      console.log('[TasksButton] 📡 Получено событие gigaOfferWallRewardDebug:', event.detail);
      setRewardDebugData(event.detail);
      setIsRewardModalOpen(true);
    };

    window.addEventListener('gigaOfferWallRewardDebug', handleRewardDebug);

    return () => {
      window.removeEventListener('gigaOfferWallRewardDebug', handleRewardDebug);
    };
  }, []);

  const handleClick = () => {
    console.log('[TasksButton] Клик по кнопке "Задания"');
    setIsModalOpen(true);
  };

  // Уведомляем родительский компонент при изменении состояния
  useEffect(() => {
    const isDev = import.meta.env?.DEV || import.meta.env?.MODE === 'development';
    
    console.log('[TasksButton] 🔄 hasTasks изменился:', hasTasks, 'тип:', typeof hasTasks);
    console.log('[TasksButton] 🔄 hasTasks === true?', hasTasks === true);
    console.log('[TasksButton] 🔄 hasTasks !== true?', hasTasks !== true);
    
    if (onVisibilityChange) {
      // В режиме разработки всегда показываем кнопку для тестирования
      // В продакшене кнопка видна только если hasTasks === true
      const shouldShow = isDev ? true : (hasTasks === true);
      console.log('[TasksButton] 📤 Уведомляем родителя (useEffect): shouldShow =', shouldShow, isDev ? '(режим разработки)' : '');
      onVisibilityChange(shouldShow);
    }
  }, [hasTasks, onVisibilityChange]);

  // В режиме разработки показываем кнопку всегда для тестирования
  const isDev = import.meta.env?.DEV || import.meta.env?.MODE === 'development';
  
  // Не показываем кнопку, если:
  // 1. Проверка еще не завершена (null) - ждем результата
  // 2. Заданий нет (false) - скрываем кнопку
  // ИСКЛЮЧЕНИЕ: В режиме разработки показываем всегда для тестирования
  console.log('[TasksButton] 🎨 Рендер: hasTasks =', hasTasks, 'hasTasks !== true?', hasTasks !== true, 'isDev =', isDev);
  
  if (!isDev && hasTasks !== true) {
    console.log('[TasksButton] 🚫 Кнопка СКРЫТА (hasTasks !== true)');
    return null;
  }
  
  if (isDev) {
    console.log('[TasksButton] ✅ Кнопка ПОКАЗАНА (режим разработки - всегда показываем для тестирования)');
  } else {
    console.log('[TasksButton] ✅ Кнопка ПОКАЗАНА (hasTasks === true)');
  }

  // Показываем кнопку только если hasTasks === true (есть задания)
  return (
    <>
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
      <TasksRulesModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
      <RewardDebugModal
        isOpen={isRewardModalOpen}
        onClose={() => setIsRewardModalOpen(false)}
        rewardData={rewardDebugData}
      />
    </>
  );
};

export default TasksButton;

