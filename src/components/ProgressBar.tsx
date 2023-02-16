import { useMemo } from "react";
import { Link } from "react-router-dom";

export interface ProgressBarProps {
  progress: number;
  predictions: number[];
  size: number;
}

export const ProgressBar = ({ progress, predictions, size }: ProgressBarProps) => {
  const positiveMarkers = useMemo(
    () => (
      <>
        {predictions.map((pred) => (
          <Link
            to="/display-patterns"
            state={{ pred }}
            key={`marker-${pred}`}
            style={{
              cursor: "pointer",
              position: "absolute",
              height: "100%",
              width: `${100 / size}%`,
              left: `${(100 * pred) / size}%`,
              backgroundColor: "red",
            }}
          />
        ))}
      </>
    ),
    [predictions]
  );

  return (
    <div className="pb-container">
      <p style={{ width: "5ch", textAlign: "right" }}>{Math.floor(progress * 100)}%</p>
      <div className="pb-track">
        <div style={{ position: "relative", height: "100%", width: "100%" }}>
          {positiveMarkers}
          <div className="pb-thumb" style={{ transform: `scaleX(${1 - progress})` }} />
        </div>
      </div>
    </div>
  );
};

export default ProgressBar;
