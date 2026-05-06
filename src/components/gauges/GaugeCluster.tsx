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

const GAUGE_CENTER = 110;
const GAUGE_PIVOT_Y = 145;
const GAUGE_START_ANGLE = -128;
const GAUGE_SWEEP_ANGLE = 236;
const GAUGE_WARNING_START_ANGLE = 74;
const gaugeTicks = Array.from({ length: 49 }, (_, index) => {
  const angle = GAUGE_START_ANGLE + (index / 48) * GAUGE_SWEEP_ANGLE;
  const isMajor = index % 12 === 0;
  const isMid = index % 3 === 0;
  const isDanger = angle >= GAUGE_WARNING_START_ANGLE;
  const outerRadius = 92;
  const innerRadius = isMajor ? 76 : isMid ? 82 : 86;

  return {
    angle,
    isDanger,
    isMajor,
    isMid,
    inner: getGaugePoint(GAUGE_CENTER, GAUGE_CENTER, innerRadius, angle),
    outer: getGaugePoint(GAUGE_CENTER, GAUGE_CENTER, outerRadius, angle)
  };
});
const gaugeNumbers = [
  { label: "0", className: "gauge-number gauge-number-0" },
  { label: "25", className: "gauge-number gauge-number-25" },
  { label: "50", className: "gauge-number gauge-number-50" },
  { label: "75", className: "gauge-number gauge-number-75" },
  { label: "100", className: "gauge-number gauge-number-100" }
] as const;

function getGaugePoint(
  centerX: number,
  centerY: number,
  radius: number,
  angleDegrees: number
) {
  const radians = ((angleDegrees - 90) * Math.PI) / 180;

  return {
    x: centerX + radius * Math.cos(radians),
    y: centerY + radius * Math.sin(radians)
  };
}

function getGaugeArc(radius: number, startAngle: number, endAngle: number) {
  const start = getGaugePoint(GAUGE_CENTER, GAUGE_CENTER, radius, startAngle);
  const end = getGaugePoint(GAUGE_CENTER, GAUGE_CENTER, radius, endAngle);
  const largeArcFlag = Math.abs(endAngle - startAngle) <= 180 ? 0 : 1;

  return [
    "M",
    start.x.toFixed(2),
    start.y.toFixed(2),
    "A",
    radius,
    radius,
    0,
    largeArcFlag,
    1,
    end.x.toFixed(2),
    end.y.toFixed(2)
  ].join(" ");
}

function getGaugeDomId(label: string) {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function getGaugeReferenceImage(label: string, emphasis: "primary" | "secondary") {
  if (emphasis === "primary") {
    return "/reference/gauge-center.png";
  }

  return label === "质检健康度"
    ? "/reference/gauge-right.png"
    : "/reference/gauge-left.png";
}

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
  const needleAngle =
    GAUGE_START_ANGLE + (clampedValue / 100) * GAUGE_SWEEP_ANGLE;
  const needleEnd = getGaugePoint(GAUGE_CENTER, GAUGE_PIVOT_Y, 82, needleAngle);
  const needleTail = getGaugePoint(
    GAUGE_CENTER,
    GAUGE_PIVOT_Y,
    18,
    needleAngle + 180
  );
  const displayValue = `${Number.isInteger(clampedValue) ? clampedValue : clampedValue.toFixed(1)}%`;
  const gaugeDomId = getGaugeDomId(label);
  const faceGradientId = `${gaugeDomId}-face-depth`;
  const grainFilterId = `${gaugeDomId}-face-grain`;
  const glassGradientId = `${gaugeDomId}-glass-sheen`;
  const rimGradientId = `${gaugeDomId}-metal-rim`;
  const shadowFilterId = `${gaugeDomId}-inner-shadow`;
  const referenceImage = getGaugeReferenceImage(label, emphasis);

  return (
    <article className={`gauge gauge-${emphasis} gauge-reference-texture`}>
      <div className="gauge-dial">
        <img
          alt=""
          aria-hidden="true"
          className="gauge-reference-image"
          draggable={false}
          src={referenceImage}
        />
        {emphasis === "primary" ? (
          <span className="gauge-live-dot" aria-hidden="true" />
        ) : null}
        <div className="gauge-numbers" aria-hidden="true">
          {gaugeNumbers.map((number) => (
            <span className={number.className} key={number.label}>
              {number.label}
            </span>
          ))}
        </div>
        <div className="gauge-face-copy">
          {emphasis === "primary" ? (
            <span className="gauge-badge" aria-hidden="true" />
          ) : null}
          <span className="gauge-label">{label}</span>
          <strong>{displayValue}</strong>
          {emphasis === "primary" ? (
            <em>
              正常
              <i aria-hidden="true" />
            </em>
          ) : null}
        </div>
        <svg
          viewBox="0 0 220 220"
          role="img"
          aria-label={`${label}: ${displayValue}`}
        >
          <defs>
            <radialGradient id={faceGradientId} cx="50%" cy="34%" r="72%">
              <stop offset="0%" stopColor="#26313b" />
              <stop offset="34%" stopColor="#111a22" />
              <stop offset="68%" stopColor="#03070c" />
              <stop offset="100%" stopColor="#000103" />
            </radialGradient>
            <linearGradient id={glassGradientId} x1="28%" x2="72%" y1="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.42)" />
              <stop offset="34%" stopColor="rgba(255,255,255,0.12)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </linearGradient>
            <linearGradient id={rimGradientId} x1="10%" x2="90%" y1="4%" y2="96%">
              <stop offset="0%" stopColor="#f7fbff" />
              <stop offset="12%" stopColor="#79828a" />
              <stop offset="26%" stopColor="#111417" />
              <stop offset="43%" stopColor="#e4ebf1" />
              <stop offset="59%" stopColor="#171b20" />
              <stop offset="76%" stopColor="#c7d0d8" />
              <stop offset="100%" stopColor="#05070a" />
            </linearGradient>
            <filter id={grainFilterId} x="-12%" y="-12%" width="124%" height="124%">
              <feTurbulence
                baseFrequency="0.22"
                numOctaves="2"
                result="noise"
                seed="8"
                type="fractalNoise"
              />
              <feColorMatrix
                in="noise"
                result="grain"
                type="matrix"
                values="0 0 0 0 0.72 0 0 0 0 0.78 0 0 0 0 0.84 0 0 0 0.012 0"
              />
              <feBlend in="SourceGraphic" in2="grain" mode="soft-light" />
            </filter>
            <filter id={shadowFilterId} x="-18%" y="-18%" width="136%" height="136%">
              <feDropShadow dx="0" dy="8" floodColor="#000000" floodOpacity="0.72" stdDeviation="7" />
              <feDropShadow dx="0" dy="-2" floodColor="#ffffff" floodOpacity="0.16" stdDeviation="2" />
            </filter>
          </defs>
          <circle
            className="gauge-rim gauge-rim-outer"
            cx={GAUGE_CENTER}
            cy={GAUGE_CENTER}
            r="106"
            stroke={`url(#${rimGradientId})`}
          />
          <circle
            className="gauge-rim gauge-rim-shadow"
            cx={GAUGE_CENTER}
            cy={GAUGE_CENTER}
            r="101"
          />
          <circle
            className="gauge-rim gauge-rim-inner"
            cx={GAUGE_CENTER}
            cy={GAUGE_CENTER}
            r="96"
            stroke={`url(#${rimGradientId})`}
          />
          <circle
            className="gauge-material-face"
            cx={GAUGE_CENTER}
            cy={GAUGE_CENTER}
            fill={`url(#${faceGradientId})`}
            filter={`url(#${grainFilterId})`}
            r="96"
          />
          <circle
            className="gauge-material-cavity"
            cx={GAUGE_CENTER}
            cy={GAUGE_CENTER}
            filter={`url(#${shadowFilterId})`}
            r="86"
          />
          <g className="gauge-scale">
            <path
              className="gauge-track"
              d={getGaugeArc(
                88,
                GAUGE_START_ANGLE,
                GAUGE_START_ANGLE + GAUGE_SWEEP_ANGLE
              )}
            />
            {gaugeTicks.map((tick, index) => (
              <line
                className={[
                  "gauge-tick",
                  tick.isMajor ? "tick-major" : "",
                  tick.isMid ? "tick-mid" : "tick-minor",
                  tick.isDanger ? "tick-danger" : ""
                ]
                  .filter(Boolean)
                  .join(" ")}
                key={`${tick.angle}-${index}`}
                x1={tick.inner.x}
                x2={tick.outer.x}
                y1={tick.inner.y}
                y2={tick.outer.y}
              />
            ))}
            <path
              className="gauge-warning"
              d={getGaugeArc(
                91,
                GAUGE_WARNING_START_ANGLE,
                GAUGE_START_ANGLE + GAUGE_SWEEP_ANGLE
              )}
            />
          </g>
          <line
            className="gauge-needle-tail"
            x1={GAUGE_CENTER}
            y1={GAUGE_PIVOT_Y}
            x2={needleTail.x}
            y2={needleTail.y}
          />
          <line
            className="gauge-needle"
            x1={GAUGE_CENTER}
            y1={GAUGE_PIVOT_Y}
            x2={needleEnd.x}
            y2={needleEnd.y}
          />
          <circle className="gauge-hub-ring" cx={GAUGE_CENTER} cy={GAUGE_PIVOT_Y} r="9" />
          <circle className="gauge-hub" cx={GAUGE_CENTER} cy={GAUGE_PIVOT_Y} r="5" />
          <ellipse
            className="gauge-glass-sheen"
            cx={GAUGE_CENTER}
            cy="66"
            fill={`url(#${glassGradientId})`}
            rx="70"
            ry="31"
          />
          <path
            className="gauge-glass-streak"
            d="M42 74 C66 54 118 45 176 61"
          />
        </svg>
        <div className="gauge-readout">
          <small>{caption}</small>
          <em>{meta}</em>
        </div>
      </div>
    </article>
  );
}

export function GaugeCluster({ studio, coverage, qc }: GaugeClusterProps) {
  return (
    <section className="gauge-cluster" aria-labelledby="gauge-cluster-title">
      <h1 className="sr-only" id="gauge-cluster-title">
        工作室运营
      </h1>
      <div className="gauges" aria-label="工作室运营仪表">
        <Gauge
          label="SKU 覆盖率"
          value={coverage.skuCoveragePercent}
          caption={`${coverage.completedSkus} / ${coverage.totalSkus}`}
          meta="已映射 SKU"
        />
        <Gauge
          caption="项目进度"
          emphasis="primary"
          label="工作室就绪度"
          meta={`进行到第 ${studio.activeProjectCount} / 5 阶段`}
          value={studio.readinessPercent}
        />
        <Gauge
          label="质检健康度"
          value={qc.qcHealthPercent}
          caption={`${qc.passed} / ${qc.passed + qc.flagged}`}
          meta="通过图片"
        />
      </div>
    </section>
  );
}
