import type {
  CoverageSnapshot,
  QcSnapshot,
  StudioSnapshot
} from "../../api/types";

interface GaugeClusterProps {
  studio: StudioSnapshot;
  coverage: CoverageSnapshot;
  qc: QcSnapshot;
}

const gaugeTicks = Array.from({ length: 17 }, (_, index) => index);

function Gauge({
  label,
  value,
  caption,
  meta,
  emphasis = "secondary"
}: {
  label: string;
  value: number;
  caption: string;
  meta: string;
  emphasis?: "primary" | "secondary";
}) {
  const clampedValue = Math.max(0, Math.min(value, 100));
  const rotation = -128 + (clampedValue / 100) * 256;
  const displayValue = `${clampedValue}%`;

  return (
    <article className={`gauge gauge-${emphasis}`}>
      <div className="gauge-dial">
        <div className="gauge-face-copy">
          <span>{label}</span>
          <strong>{displayValue}</strong>
          {emphasis === "primary" ? (
            <em>
              On track
              <i aria-hidden="true" />
            </em>
          ) : null}
        </div>
        <svg
          viewBox="0 0 180 128"
          role="img"
          aria-label={`${label}: ${displayValue}`}
        >
          <g className="gauge-ticks">
            {gaugeTicks.map((tick) => {
              const angle = -128 + tick * 16;
              const isMajor = tick % 4 === 0;

              return (
                <line
                  className={isMajor ? "tick-major" : "tick-minor"}
                  key={tick}
                  x1="90"
                  x2="90"
                  y1={isMajor ? "24" : "30"}
                  y2="39"
                  style={{ transform: `rotate(${angle}deg)` }}
                />
              );
            })}
          </g>
          <path
            className="gauge-track"
            d="M26 104a68 68 0 0 1 128 0"
            pathLength="100"
          />
          <path
            className="gauge-line"
            d="M26 104a68 68 0 0 1 128 0"
            pathLength="100"
            style={{ strokeDasharray: `${clampedValue} 100` }}
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
      </div>
      <div className="gauge-readout">
        <small>{caption}</small>
        <em>{meta}</em>
      </div>
    </article>
  );
}

export function GaugeCluster({ studio, coverage, qc }: GaugeClusterProps) {
  return (
    <section className="gauge-cluster" aria-labelledby="gauge-cluster-title">
      <div className="cluster-header">
        <div>
          <p className="eyebrow">{studio.modeLabel}</p>
          <h1 id="gauge-cluster-title">Studio Operations</h1>
        </div>
        <div className="read-only-badge" aria-label="Read-only mode">
          <span>Read-only</span>
          <strong>Mock telemetry</strong>
        </div>
      </div>
      <div className="gauges" aria-label="Studio operation gauges">
        <Gauge
          label="SKU Coverage"
          value={coverage.skuCoveragePercent}
          caption={`${coverage.completedSkus}/${coverage.totalSkus} SKUs covered`}
          meta="Golden path visibility"
        />
        <Gauge
          caption={`${studio.activeProjectCount} active projects`}
          emphasis="primary"
          label="Studio Readiness"
          meta={studio.locationLabel}
          value={studio.readinessPercent}
        />
        <Gauge
          label="QC Health"
          value={qc.qcHealthPercent}
          caption={`${qc.passed} pass / ${qc.flagged} watch`}
          meta={`${qc.pending} pending inspections`}
        />
      </div>
    </section>
  );
}
