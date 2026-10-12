import "./ProgressBar.css";

function ProgressBar({ progress = 0, completedCount = 0, totalCount = 0 }) {
  return <section className="progress-card"><div className="progress-card__top"><div><h2>Progresas</h2><p>{completedCount} atliktos iš {totalCount} užduočių</p></div><span className="progress-card__percentage">{progress}%</span></div>
    <div className="progress-slider" role="progressbar" aria-label="Užduočių progresas" aria-valuemin="0" aria-valuemax="100" aria-valuenow={progress} style={{ "--progress": `${progress}%` }}><span/></div>
  </section>;
}

export default ProgressBar;
