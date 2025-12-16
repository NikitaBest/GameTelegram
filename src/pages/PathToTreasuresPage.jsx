import { useState } from 'react';
import BackgroundStars from '../components/BackgroundStars';
import ProgressBar from '../components/ProgressBar';
import TaskList from '../components/TaskList';
import ForwardButton from '../components/ForwardButton';
import { mockSubscriptionData } from '../utils/mockData';
import './PathToTreasuresPage.css';

const PathToTreasuresPage = ({ onStartGame }) => {
  const [tasks, setTasks] = useState(mockSubscriptionData.tasks);
  
  const completedCount = tasks.filter(task => task.completed).length;
  const allCompleted = completedCount === tasks.length;
  
  const handleTaskClick = (task) => {
    // Пока нет бэкенда: просто отмечаем задачу выполненной по клику
    // без перехода по ссылкам и проверки подписки
    setTasks(prevTasks =>
      prevTasks.map(t =>
        t.id === task.id ? { ...t, completed: true } : t
      )
    );
  };
  
  const handleForwardClick = () => {
    if (allCompleted) {
      // Переход к странице с призами (DrawPage)
      onStartGame?.();
    }
  };
  
  return (
    <div className="path-to-treasures-page">
      <BackgroundStars />
      {/* Дорожка на фоне */}
      <div className="path-background">
        <img src="/Vector 17.svg" alt="" className="path-image" />
      </div>
      <div className="path-content">
        <div className="title-block">
          <h1 className="page-title">{mockSubscriptionData.title}</h1>
          <p className="page-subtitle">{mockSubscriptionData.subtitle}</p>
        </div>
        
        <ProgressBar
          currentStep={completedCount}
          totalSteps={mockSubscriptionData.totalSteps}
        />
        
        <TaskList 
          tasks={tasks} 
          onTaskClick={handleTaskClick}
        />
        
        <ForwardButton 
          onClick={handleForwardClick}
          disabled={!allCompleted}
          text={allCompleted ? 'Начать игру' : 'Вперёд!'}
        />
      </div>
    </div>
  );
};

export default PathToTreasuresPage;

