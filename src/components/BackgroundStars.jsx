import './BackgroundStars.css';

const BackgroundStars = ({ imageSrc = '/Stars.svg' }) => {
  return (
    <div className="background-stars">
      <div className="stars-pattern">
        <img src={imageSrc} alt="" className="stars-pattern-image" />
      </div>
    </div>
  );
};

export default BackgroundStars;

