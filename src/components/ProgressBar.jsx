import './ProgressBar.css';

const ProgressBar = ({ currentStep, totalSteps }) => {
  const steps = Array.from({ length: totalSteps }, (_, i) => i + 1);
  const completedSteps = Math.max(0, Math.min(currentStep, totalSteps));
  const fillPercent = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;
  
  return (
    <div className="progress-bar-container">
      <div className="progress-track">
        <div
          className="progress-track-fill"
          style={{ width: `${fillPercent}%` }}
        />
      </div>
      <div className="progress-bar">
        {steps.map((step, index) => (
          <div
            key={step}
            className="progress-step-wrapper"
            style={{
              left:
                totalSteps > 1
                  ? `${((step - 1) / (totalSteps - 1)) * 100}%`
                  : '50%',
            }}
          >
            <div
              className={`progress-circle ${
                step <= completedSteps ? 'completed' : 'upcoming'
              }`}
            >
              <span className="progress-step-number">{step}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProgressBar;

