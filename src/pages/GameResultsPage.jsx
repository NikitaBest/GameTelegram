import { useState } from 'react';
import { RotateCcw, Clock, Bot } from 'lucide-react';
import './GameResultsPage.css';

const GameResultsPage = ({ score, onPlayAgain, attemptsLeft = 1 }) => {
  const [activeTab, setActiveTab] = useState('my-results'); // 'my-results' | 'rating'

  // Моковые данные - в будущем будут приходить с бэкенда
  const userRank = 138;
  const timeUntilFinal = '11:54:27';
  const botUsername = 'chest_of_goldbot';

  return (
    <div className="game-results-page">
      {/* SVG фон за элементами */}
      <div 
        className="background-svg-layer"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 0,
          backgroundImage: 'url(/Задник.svg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />
      
      <div className="results-content">
        {/* Заголовок */}
        <div className="results-title-container">
          <img 
            src="/Frame 1171275345.svg" 
            alt="ТВОЙ РЕЗУЛЬТАТ" 
            className="results-title-image"
          />
        </div>
        <p className="results-subtitle">Отличная работа! Сможешь лучше?</p>

        {/* Табы */}
        <div className="results-tabs">
          <button
            className={`tab-button ${activeTab === 'my-results' ? 'active' : ''}`}
            onClick={() => setActiveTab('my-results')}
          >
            Мои итоги
          </button>
          <button
            className={`tab-button ${activeTab === 'rating' ? 'active' : ''}`}
            onClick={() => setActiveTab('rating')}
          >
            Рейтинг
          </button>
        </div>

        {/* Контент табов */}
        {activeTab === 'my-results' && (
          <div className="results-content-area">
            {/* Карточка с местом и очками */}
            <div className="result-card">
              <div className="result-card-label">Твоё место</div>
              <div className="result-card-rank">{userRank}</div>
              <div className="result-card-score">{score} очков</div>
            </div>

            {/* Карточка с таймером и ботом */}
            <div className="result-card">
              <div className="result-card-timer">
                <Clock className="timer-icon" />
                <span>ДО ФИНАЛА ОСТАЛОСЬ: {timeUntilFinal}</span>
              </div>
              <div className="result-card-bot">
                <Bot className="bot-icon" />
                <span>Результаты придут в бот @{botUsername}</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'rating' && (
          <div className="results-content-area">
            <div className="rating-placeholder">
              <p>Рейтинг будет доступен после финала</p>
            </div>
          </div>
        )}

        {/* Кнопка "ОТЫГРАТЬСЯ!" */}
        <button className="play-again-button" onClick={onPlayAgain}>
          <RotateCcw className="play-again-icon" />
          <div className="play-again-text">
            <span className="play-again-main">ОТЫГРАТЬСЯ!</span>
            <span className="play-again-sub">осталась {attemptsLeft} попытка</span>
          </div>
        </button>
      </div>
    </div>
  );
};

export default GameResultsPage;

