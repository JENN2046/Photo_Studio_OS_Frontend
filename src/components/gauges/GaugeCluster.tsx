import type { ProjectSummary, RiskLevel } from "../../api/types";

interface GaugeClusterProps {
  projects: ProjectSummary[];
}

const riskWeights: Record<RiskLevel, number> = {
  low: 22,
  medium: 54,
  high: 86
};

function Gauge({
  label,
  value,
  caption
}: {
  label: string;
  value: number;
  caption: string;
}) {
  const rotation = -128 + (Math.max(0, Math.min(value, 100)) / 100) * 256;

  return (
    <div className="gauge">
      <svg viewBox="0 0 180 128" role="img" aria-label={`${label}: ${value}`}>
        <path
          className="gauge-track"
          d="M26 104a68 68 0 0 1 128 0"
          pathLength="100"
        />
        <path
          className="gauge-line"
          d="M26 104a68 68 0 0 1 128 0"
          pathLength="100"
          style={{ strokeDasharray: `${value} 100` }}
        />
        <line
          className="gauge-needle"
          x1="90"
          y1="104"
          x2="90"
          y2="38"
          style={{ transform: `rotate(${rotation}deg)` }}
        />
        <circle className="gauge-hub" cx="90" cy="104" r="5" />
      </svg>
      <div className="gauge-readout">
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{caption}</small>
      </div>
    </div>
  );
}

export function GaugeCluster({ projects }: GaugeClusterProps) {
  const completion = Math.round(
    projects.reduce((total, project) => total + project.completionPercent, 0) /
      projects.length
  );
  const risk = Math.round(
    projects.reduce((total, project) => total + riskWeights[project.riskLevel], 0) /
      projects.length
  );
  const throughput = Math.min(
    100,
    Math.round(projects.reduce((total, project) => total + project.assetCount, 0) / 5)
  );

  return (
    <section className="gauge-cluster" aria-labelledby="gauge-cluster-title">
      <div>
        <p className="eyebrow">Command Center Alpha</p>
        <h1 id="gauge-cluster-title">Studio Operations</h1>
      </div>
      <div className="gauges" aria-label="Studio operation gauges">
        <Gauge label="Completion" value={completion} caption="weighted pipeline" />
        <Gauge label="Risk" value={risk} caption="active exposure" />
        <Gauge label="Throughput" value={throughput} caption="asset velocity" />
      </div>
    </section>
  );
}
