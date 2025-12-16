import './StartGameButton.css';

const StartGameButton = ({ onClick }) => {
  return (
    <button className="start-game-button" onClick={onClick}>
      <div className="button-bg-layer-1" />
      <div className="button-bg-layer-2" />
      <div className="button-bg-layer-3" />
      <span className="button-text">Начать игру</span>
    </button>
  );
};

export default StartGameButton;
