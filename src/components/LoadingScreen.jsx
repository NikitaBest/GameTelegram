import './LoadingScreen.css';

const LoadingScreen = () => {
  return (
    <div className="loading-screen">
      {/* Фоновое изображение */}
      <div className="loading-background">
        <img src="/Задник.svg" alt="" className="loading-bg-image" />
      </div>
      
      {/* Анимированный логотип по центру */}
      <div className="loading-logo-container">
        <img 
          src="/Зам.Скважина 1.png" 
          alt="Загрузка..." 
          className="loading-logo"
        />
      </div>
    </div>
  );
};

export default LoadingScreen;

