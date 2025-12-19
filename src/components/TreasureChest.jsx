import './TreasureChest.css';

const TreasureChest = ({ prizeFund }) => {
  return (
    <div className="treasure-chest-container">
      <div className="treasure-chest-wrapper">
        {/* Звезды за сундуком */}
        <div className="stars-background">
          <img src="/Stars.png" alt="Stars" className="stars-image" />
        </div>
        
        <div className="treasure-chest">
          <img src="/Сундук.png" alt="Treasure Chest" className="chest-image" />
        </div>
      </div>
    </div>
  );
};

export default TreasureChest;

