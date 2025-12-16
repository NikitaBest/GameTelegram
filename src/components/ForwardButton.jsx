import './ForwardButton.css';

const ForwardButton = ({ onClick, disabled, text = 'Вперёд!' }) => {
  return (
    <button 
      className={`forward-button ${disabled ? 'disabled' : 'active'}`}
      onClick={onClick}
      disabled={disabled}
    >
      <span className="button-text">{text}</span>
    </button>
  );
};

export default ForwardButton;

