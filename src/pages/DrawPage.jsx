import { useState } from 'react';
import BalanceIndicator from '../components/BalanceIndicator';
import CountdownTimer from '../components/CountdownTimer';
import TreasureChest from '../components/TreasureChest';
import PrizeFundButton from '../components/PrizeFundButton';
import PrizeList from '../components/PrizeList';
import UserRank from '../components/UserRank';
import StartGameButton from '../components/StartGameButton';
import BackgroundStars from '../components/BackgroundStars';
import { mockDrawData } from '../utils/mockData';
import './DrawPage.css';

const DrawPage = ({ onStartGame }) => {
  const [drawData] = useState(mockDrawData);

  const handleCountdownComplete = () => {
    console.log('Розыгрыш завершен');
  };

  const handleStartGame = () => {
    console.log('Начало игры');
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.showAlert('Игра началась!');
    }
  };

  return (
    <div className="draw-page">
      <BackgroundStars />
      <div className="draw-content">
        <BalanceIndicator balance={drawData.balance} />
        
        <CountdownTimer 
          initialSeconds={drawData.timeUntilEnd}
          onComplete={handleCountdownComplete}
        />
        
        <TreasureChest prizeFund={drawData.prizeFund} />
        
        <div className="info-panel-container">
          <PrizeFundButton />
          
          <div className="info-panel">
            <PrizeList 
              prizes={drawData.prizes}
              starsForParticipants={drawData.starsForParticipants}
            />
            
            <UserRank userRank={drawData.userRank} />
          </div>
        </div>
        
        <StartGameButton onClick={onStartGame || handleStartGame} />
      </div>
    </div>
  );
};

export default DrawPage;

