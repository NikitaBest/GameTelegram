import BackgroundStars from '../components/BackgroundStars';
import './ActiveDrawsPage.css';

/**
 * Страница активных розыгрышей
 * Отображается, когда пользователь заходит без параметра tgWebAppStartParam
 */
const ActiveDrawsPage = () => {
  // TODO: Здесь будет логика получения списка активных розыгрышей с бекенда
  
  return (
    <div className="active-draws-page">
      <BackgroundStars />
      <div className="active-draws-content">
        <div className="title-block">
          <h1 className="page-title">Активные розыгрыши</h1>
          <p className="page-subtitle">Выберите розыгрыш для участия</p>
        </div>
        
        {/* TODO: Здесь будет список активных розыгрышей */}
        <div className="draws-list">
          <p className="placeholder-text">
            Список активных розыгрышей будет загружен с бекенда
          </p>
        </div>
      </div>
    </div>
  );
};

export default ActiveDrawsPage;

