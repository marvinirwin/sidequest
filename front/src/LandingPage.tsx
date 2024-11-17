import "./App.css";
import "./index.css";

export const LandingPage = ({ setStarted }: { setStarted: (started: boolean) => void }) => {
  return (
    <div className="landing">
      <button
        onClick={() => setStarted(true)}
        className="start-button"
      >
        I HAVE A PROBLEM
      </button>
    </div>
  );
};
