import './UserRank.css';

const UserRank = ({ userRank }) => {
  return (
    <div className="user-rank">
      <div className="user-rank-content">
        <img
          className="user-icon"
          alt="Leaderboard avatar"
          src="/leaderboard-avatar-default.svg"
        />
        <div className="user-rank-text-wrapper">
          <div className="user-rank-text">{userRank.label}</div>
        </div>
      </div>
    </div>
  );
};

export default UserRank;

