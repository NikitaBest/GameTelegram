import './PrizeList.css';

const PrizeList = ({ prizes, starsForParticipants }) => {
  return (
    <div className="prize-list">
      {prizes.map((prize, index) => (
        <div key={index} className="prize-item">
          <div className="prize-item-content">
            <div className="prize-icon-wrapper">
              {prize.icon === 'gold' && (
                <div className="trophy-icon trophy-gold" />
              )}
              {prize.icon === 'silver' && prize.place !== '4-10' && (
                <div className="trophy-icon trophy-silver" />
              )}
              {prize.icon === 'bronze' && (
                <div className="trophy-icon trophy-bronze" />
              )}
              {prize.place === '4-10' && (
                <img 
                  src="/4rth-10th-1-7.png" 
                  alt="4-10 place trophy" 
                  className="trophy-icon trophy-4th-10th"
                />
              )}
              {!prize.icon && prize.place !== '4-10' && (
                <div className="trophy-icon trophy-silver" />
              )}
            </div>
            <div className="prize-text-wrapper">
              <div className="prize-label">{prize.label}</div>
            </div>
          </div>
          <div className="prize-amount">
            <span>{prize.amount} {prize.currency}</span>
          </div>
        </div>
      ))}
      
      <div className="stars-participants">
        <div className="stars-content">
          <div className="stars-icon-wrapper">
            <img src="/cupleader-1.svg" alt="Stars Icon" className="stars-icon-image" />
          </div>
          <div className="stars-text">
            <div className="stars-main-text">
              {starsForParticipants.minAmount}+ {starsForParticipants.description}
            </div>
            {starsForParticipants.note && (
              <div className="stars-note">
                {starsForParticipants.note}
              </div>
            )}
          </div>
        </div>
        <div className="stars-badge">
          <img src="/tabler_stars-filled.svg" alt="Star" className="stars-badge-icon" />
        </div>
      </div>
    </div>
  );
};

export default PrizeList;

