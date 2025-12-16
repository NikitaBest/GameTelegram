import './TaskList.css';
import TaskItem from './TaskItem';

const TaskList = ({ tasks, onTaskClick }) => {
  return (
    <div className="task-list">
      {tasks.map((task) => (
        <TaskItem 
          key={task.id} 
          task={task} 
          onTaskClick={onTaskClick}
        />
      ))}
    </div>
  );
};

export default TaskList;

