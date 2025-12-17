import { useState, useEffect } from 'react';
import Leaderboard from '../components/Leaderboard';
import BackgroundStars from '../components/BackgroundStars';
import './DrawFinishedPage.css';

const DrawFinishedPage = ({ drawId, onNewDraws }) => {
  return (
    <div className="draw-finished-page">
      <BackgroundStars />
      
      <div className="draw-finished-content">
        {/* Заголовок с изображением */}
        <div className="draw-finished-header">
          <img 
            src="/конец розыгрыша.svg" 
            alt="Розыгрыш завершён" 
            className="draw-finished-image"
          />
          <p className="draw-finished-subtitle">
             Загляни в новые — там тебя ждут призы.
          </p>
        </div>

        {/* Список участников */}
        <div className="draw-finished-leaderboard">
          <Leaderboard drawId={drawId} showPrizes={true} />
        </div>

      </div>

      {/* Кнопка к новым розыгрышам - фиксированная внизу */}
      <div className="draw-finished-button-container">
        <button className="draw-finished-button" onClick={onNewDraws}>
          К новым победам!
        </button>
      </div>
    </div>
  );
};

export default DrawFinishedPage;

