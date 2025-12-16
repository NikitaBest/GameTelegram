import { useState, useEffect } from 'react';
import { formatTime } from '../utils/mockData';
import './CountdownTimer.css';

const CountdownTimer = ({ initialSeconds, onComplete }) => {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);

  useEffect(() => {
    if (timeLeft <= 0) {
      onComplete?.();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onComplete?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onComplete]);

  const { hours, minutes, seconds } = formatTime(timeLeft);

  return (
    <div className="countdown-container">
      <div className="countdown-label">ДО КОНЦА РОЗЫГРЫША</div>
      <div className="countdown-timer">
        <div className="countdown-box">{hours}</div>
        <span className="countdown-separator">:</span>
        <div className="countdown-box">{minutes}</div>
        <span className="countdown-separator">:</span>
        <div className="countdown-box">{seconds}</div>
      </div>
    </div>
  );
};

export default CountdownTimer;

