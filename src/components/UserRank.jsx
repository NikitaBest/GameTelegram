import './UserRank.css';

const UserRank = ({ userRank, userAvatar }) => {
  const isFirstPlace = userRank?.place === 1;
  
  return (
    <div className={`user-rank ${isFirstPlace ? 'place-1' : ''}`}>
      <div className="user-rank-content">
        {userAvatar ? (
          <img
            className="user-icon"
            alt="Аватар пользователя"
            src={userAvatar}
          />
        ) : (
          <img
            className="user-icon"
            alt="Аватар по умолчанию"
            src="/leaderboard-avatar-default.svg"
          />
        )}
        <div className="user-rank-text-wrapper">
          <div className="user-rank-text">{userRank.label}</div>
        </div>
      </div>
    </div>
  );
};

export default UserRank;

