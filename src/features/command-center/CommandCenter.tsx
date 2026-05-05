import { GaugeCluster } from "../../components/gauges/GaugeCluster";
import { AppShell } from "../../components/layout/AppShell";
import { MetricPanel } from "../../components/panels/MetricPanel";
import { useCommandCenterSnapshot } from "./useCommandCenterSnapshot";
import type {
  ApprovalState,
  ApprovalType,
  RiskLevel,
  WorkflowStageState,
  WorkflowStatus
} from "../../api/types";

const loadingStatusLanes = [
  {
    label: "Mirror Cache",
    detail: "Staging snapshot envelope",
    state: "Buffering"
  },
  {
    label: "Gauge Bus",
    detail: "Aligning cockpit telemetry",
    state: "Syncing"
  },
  {
    label: "Ops Rail",
    detail: "Priming risk and queue surfaces",
    state: "Queued"
  }
] as const;

const errorStatusLanes = [
  {
    label: "Read Boundary",
    detail: "Snapshot stream did not settle",
    state: "Hold"
  },
  {
    label: "Risk Feed",
    detail: "Fallback telemetry unavailable",
    state: "Watch"
  },
  {
    label: "Recovery Path",
    detail: "Retry or inspect local override",
    state: "Manual"
  }
] as const;

function CommandCenterStateSurface({
  status,
  message,
  onRetry,
  debugState
}: {
  status: "loading" | "error";
  message: string;
  onRetry: () => void;
  debugState: "live" | "loading" | "error";
}) {
  const isLoading = status === "loading";
  const eyebrow = isLoading ? "Telemetry Sync" : "Snapshot Hold";
  const heading = isLoading ? "Telemetry Aligning" : "Read Hold";
  const summary = isLoading
    ? "Read-only snapshot is aligning before the cockpit opens."
    : "Snapshot did not settle. Cockpit remains in a safe read hold.";
  const lanes = isLoading ? loadingStatusLanes : errorStatusLanes;
  const modeLabel =
    debugState === "live"
      ? "Mock adapter"
      : `QA / ${debugState}`;
  const actionLabel = isLoading ? "Stand by" : "Retry ready";
  const messageLabel = isLoading ? "Sync note" : "Fault note";
  const buttonLabel = isLoading ? "Re-arm" : "Retry";
  const recoveryTitle = isLoading ? "Handshake active" : "Manual re-arm";
  const recoveryDetail = isLoading
    ? "Read client is still resolving the snapshot."
    : "Retry re-arms the read client unless QA override is still active.";
  const overrideTitle =
    debugState === "live" ? "Client path" : "Override latch";
  const overrideDetail =
    debugState === "live"
      ? "Mock adapter online."
      : `Local state override / ${debugState}`;

  return (
    <AppShell>
      <main className="command-center">
        <section
          className="hero-band status-hero-band"
          aria-label={`Command center ${status}`}
        >
          <div className="status-grid">
            <aside className="status-column" aria-label="Read-only staging">
              <section className="panel status-side-panel">
                <div className="panel-heading">
                  <p className="eyebrow">Read Boundary</p>
                  <span>{isLoading ? "arming" : "hold"}</span>
                </div>
                <div className="status-chip-stack">
                  <span className="status-chip">Mode / {modeLabel}</span>
                  <span className="status-chip">
                    Surface / {isLoading ? "buffered" : "degraded"}
                  </span>
                </div>
                <div className="status-lane-list">
                  {lanes.map((lane) => (
                    <article className="status-lane" key={lane.label}>
                      <strong>{lane.label}</strong>
                      <span>{lane.detail}</span>
                      <small>{lane.state}</small>
                    </article>
                  ))}
                </div>
              </section>

              <section className="panel status-side-panel">
                <div className="panel-heading">
                  <p className="eyebrow">Operator Impact</p>
                  <span>read-only</span>
                </div>
                <div className="status-note-stack">
                  <article>
                    <strong>Surfaces sealed</strong>
                    <span>Write path stays disabled.</span>
                  </article>
                  <article>
                    <strong>No inferred fill</strong>
                    <span>Snapshot is required before render.</span>
                  </article>
                </div>
              </section>
            </aside>

            <section className={`status-command status-command-${status}`}>
              <div className="status-command-frame">
                <div className="status-command-header">
                  <div>
                    <p className="eyebrow">{eyebrow}</p>
                    <h1>{heading}</h1>
                  </div>
                  <div className="read-only-badge" aria-label="Read-only mode">
                    <span>{isLoading ? "Buffering" : "Hold"}</span>
                    <strong>{modeLabel}</strong>
                  </div>
                </div>

                <p className="status-command-copy">{summary}</p>
                <div className="status-message-bar" role={isLoading ? "status" : "alert"}>
                  <span className="status-message-label">{messageLabel}</span>
                  <strong>{message}</strong>
                </div>

                <div className="status-dial-row" aria-label="Status alignment">
                  <article className="status-dial-card">
                    <div className="status-dial status-dial-left">
                      <span className="status-dial-core" />
                    </div>
                    <strong>Snapshot envelope</strong>
                    <span>{isLoading ? "Negotiating payload edges" : "Envelope lost continuity"}</span>
                  </article>
                  <article className="status-dial-card status-dial-card-primary">
                    <div className="status-dial status-dial-primary">
                      <span className="status-dial-core" />
                    </div>
                    <strong>{isLoading ? "Cockpit sync" : "Operator-safe fallback"}</strong>
                    <span>
                      {isLoading
                        ? "Gauges remain dark until read model aligns"
                        : "Surface is held in a non-destructive read-only posture"}
                    </span>
                  </article>
                  <article className="status-dial-card">
                    <div className="status-dial status-dial-right">
                      <span className="status-dial-core" />
                    </div>
                    <strong>Ops rail feed</strong>
                    <span>{isLoading ? "Priming queue and risk rails" : "Waiting for manual recovery path"}</span>
                  </article>
                </div>

                <div className="status-metric-strip">
                  <article>
                    <span>Boundary</span>
                    <strong>{isLoading ? "Sealed" : "Tripped"}</strong>
                  </article>
                  <article>
                    <span>Client</span>
                    <strong>{debugState === "live" ? "Mock adapter" : "QA override"}</strong>
                  </article>
                  <article>
                    <span>Action</span>
                    <strong>{actionLabel}</strong>
                  </article>
                </div>
              </div>
            </section>

            <aside className="status-column" aria-label="Recovery and notes">
              <section className="panel status-side-panel">
                <div className="panel-heading">
                  <p className="eyebrow">Recovery</p>
                  <span>{debugState === "live" ? "active" : "overridden"}</span>
                </div>
                <div className="status-note-stack">
                  <article>
                    <strong>{recoveryTitle}</strong>
                    <span>{recoveryDetail}</span>
                  </article>
                  <article>
                    <strong>{overrideTitle}</strong>
                    <span>{overrideDetail}</span>
                  </article>
                </div>
                <button
                  className="status-action"
                  onClick={onRetry}
                  type="button"
                >
                  {buttonLabel}
                </button>
              </section>

              <section className="panel status-side-panel">
                <div className="panel-heading">
                  <p className="eyebrow">Safeguards</p>
                  <span>alpha</span>
                </div>
                <div className="status-note-stack">
                  <article>
                    <strong>Write path locked</strong>
                    <span>State remains inside the frontend boundary.</span>
                  </article>
                  <article>
                    <strong>Gauge anchor retained</strong>
                    <span>Three-dial hierarchy stays intact.</span>
                  </article>
                </div>
              </section>
            </aside>
          </div>
        </section>
      </main>
    </AppShell>
  );
}

const statusLabels: Record<WorkflowStatus, string> = {
  intake: "Intake",
  shoot: "Shoot",
  retouch: "Retouch",
  review: "Review",
  delivery: "Delivery",
  complete: "Complete"
};

const riskLabels: Record<RiskLevel, string> = {
  low: "Low",
  medium: "Medium",
  high: "High"
};

const approvalLabels: Record<ApprovalState, string> = {
  waiting: "Waiting",
  blocked: "Blocked",
  cleared: "Cleared"
};

const approvalTypeLabels: Record<ApprovalType, string> = {
  review: "Review",
  delivery: "Delivery",
  qc: "QC",
  retouch: "Retouch"
};

const stageStateLabels: Record<WorkflowStageState, string> = {
  stable: "Stable",
  active: "Active",
  watch: "Watch"
};

function getScoreState(score: number): ApprovalState {
  if (score >= 90) {
    return "cleared";
  }

  if (score >= 82) {
    return "waiting";
  }

  return "blocked";
}

function getDeliveryState(status: string): ApprovalState {
  return status === "ready" ? "cleared" : "waiting";
}

export function CommandCenter() {
  const { snapshot, status, errorMessage, debugState, retry } =
    useCommandCenterSnapshot();

  if (status === "loading") {
    return (
      <CommandCenterStateSurface
        debugState={debugState}
        message="Snapshot gate aligning."
        onRetry={retry}
        status="loading"
      />
    );
  }

  if (!snapshot) {
    return (
      <CommandCenterStateSurface
        debugState={debugState}
        message={errorMessage ?? "No command center snapshot returned"}
        onRetry={retry}
        status="error"
      />
    );
  }

  const assetTotal = snapshot.projects.reduce(
    (total, project) => total + project.assetCount,
    0
  );
  const pendingApprovals = snapshot.approvalQueue.filter(
    (item) => item.state !== "cleared"
  ).length;
  const activeReviewItems = snapshot.reviews.reduce(
    (total, review) => total + review.pendingItems,
    0
  );
  const deliveryAssets = snapshot.deliveries.reduce(
    (total, delivery) => total + delivery.assetCount,
    0
  );
  const riskWatchCount = snapshot.riskPulse.filter(
    (risk) => risk.level !== "low"
  ).length;
  const generatedTime = snapshot.generatedAt.slice(11, 16);

  return (
    <AppShell>
      <main className="command-center">
        <section className="hero-band" aria-label="Command center overview">
          <div className="hero-grid">
            <aside className="context-rail" aria-label="Studio context">
              <section className="panel context-panel" aria-labelledby="studio-context-title">
                <div className="panel-heading">
                  <p className="eyebrow" id="studio-context-title">
                    Studio Context
                  </p>
                  <span>{generatedTime}</span>
                </div>
                <div className="studio-stack">
                  <strong>{snapshot.studio.name}</strong>
                  <span>{snapshot.studio.locationLabel}</span>
                </div>
                <dl className="context-list">
                  <div>
                    <dt>Operator</dt>
                    <dd>{snapshot.studio.operator}</dd>
                  </div>
                  <div>
                    <dt>Mode</dt>
                    <dd>{snapshot.studio.modeLabel}</dd>
                  </div>
                  <div>
                    <dt>Assets</dt>
                    <dd>{assetTotal}</dd>
                  </div>
                  <div>
                    <dt>Delivery Set</dt>
                    <dd>{deliveryAssets}</dd>
                  </div>
                </dl>
              </section>

              <section className="panel context-panel" aria-labelledby="workflow-map-title">
                <div className="panel-heading">
                  <p className="eyebrow" id="workflow-map-title">
                    Golden Path
                  </p>
                  <span>{snapshot.workflowStages.length} stages</span>
                </div>
                <div className="workflow-map">
                  {snapshot.workflowStages.map((stage, index) => (
                    <article
                      className={`workflow-stage stage-${stage.state}`}
                      key={stage.id}
                    >
                      <span className="stage-index">{index + 1}</span>
                      <div>
                        <strong>{stage.label}</strong>
                        <small>{stage.detail}</small>
                      </div>
                      <span className={`state state-${stage.state}`}>
                        {stageStateLabels[stage.state]} / {stage.count}
                      </span>
                    </article>
                  ))}
                </div>
              </section>
            </aside>

            <div className="overview-column">
              <GaugeCluster
                coverage={snapshot.coverage}
                qc={snapshot.qc}
                studio={snapshot.studio}
              />
              <div className="metric-grid" aria-label="Read-only studio counters">
                <MetricPanel
                  title="Projects"
                  value={snapshot.projects.length}
                  label="active live tracks"
                />
                <MetricPanel
                  title="Review Load"
                  value={activeReviewItems}
                  label="pending review items"
                />
                <MetricPanel
                  title="Approvals"
                  value={pendingApprovals}
                  label="human decisions"
                />
              </div>
            </div>

            <aside className="right-rail" aria-label="Risk and approval queue">
              <section className="panel" aria-labelledby="risk-pulse-title">
                <div className="panel-heading">
                  <p className="eyebrow" id="risk-pulse-title">
                    Risk Pulse
                  </p>
                  <span>{riskWatchCount} watch signals</span>
                </div>
                <div className="signal-list">
                  {snapshot.riskPulse.map((risk) => (
                    <article className={`signal signal-${risk.level}`} key={risk.id}>
                      <strong>{risk.label}</strong>
                      <span>{risk.signal}</span>
                      <small>{riskLabels[risk.level]}</small>
                    </article>
                  ))}
                </div>
              </section>

              <section className="panel" aria-labelledby="approval-queue-title">
                <div className="panel-heading">
                  <p className="eyebrow" id="approval-queue-title">
                    Approval Queue
                  </p>
                  <span>{snapshot.approvalQueue.length} items</span>
                </div>
                <div className="queue-list">
                  {snapshot.approvalQueue.map((item) => (
                    <article className={`queue-item queue-${item.state}`} key={item.id}>
                      <span className="queue-type">{approvalTypeLabels[item.type]}</span>
                      <div>
                        <strong>{item.title}</strong>
                        <span>{item.projectId}</span>
                      </div>
                      <small className={`state state-${item.state}`}>
                        {approvalLabels[item.state]} / {item.ageHours}h
                      </small>
                    </article>
                  ))}
                </div>
              </section>
            </aside>
          </div>
        </section>

        <section className="execution-grid" aria-label="Read-only execution surfaces">
          <section
            className="panel project-execution-panel"
            id="projects"
            aria-labelledby="projects-title"
          >
            <div className="panel-heading">
              <p className="eyebrow" id="projects-title">
                Project Execution
              </p>
              <span>{snapshot.projects.length} live tracks</span>
            </div>
            <div className="project-table" role="table" aria-label="Project read-only list">
              <div className="table-row table-head" role="row">
                <span role="columnheader">Project</span>
                <span role="columnheader">Flow</span>
                <span role="columnheader">Progress</span>
                <span role="columnheader">Volume</span>
                <span role="columnheader">Due</span>
                <span role="columnheader">Risk</span>
              </div>
              {snapshot.projects.map((project) => (
                <div className="table-row" role="row" key={project.id}>
                  <span className="cell-stack" role="cell">
                    <strong>{project.name}</strong>
                    <small>{project.client}</small>
                  </span>
                  <span className="cell-stack" role="cell">
                    <span className={`status-pill status-${project.status}`}>
                      {statusLabels[project.status]}
                    </span>
                    <small>{project.owner}</small>
                  </span>
                  <span className="progress-cell" role="cell">
                    <span>{project.completionPercent}%</span>
                    <span className="progress-meter" aria-hidden="true">
                      <i style={{ width: `${project.completionPercent}%` }} />
                    </span>
                  </span>
                  <span className="cell-stack" role="cell">
                    <span>{project.skuCount} SKUs</span>
                    <small>{project.assetCount} assets</small>
                  </span>
                  <span role="cell">{project.dueDate}</span>
                  <span role="cell" className={`state risk-${project.riskLevel}`}>
                    {riskLabels[project.riskLevel]}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="panel timeline-panel" id="activity" aria-labelledby="activity-title">
            <div className="panel-heading">
              <p className="eyebrow" id="activity-title">
                Activity Timeline
              </p>
              <span>latest</span>
            </div>
            <div className="timeline">
              {snapshot.activityTimeline.map((event) => (
                <article key={event.id}>
                  <time>{event.at}</time>
                  <div>
                    <strong>{event.actor}</strong>
                    <span>{event.summary}</span>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section
            className="panel inspection-panel"
            id="inspections"
            aria-labelledby="ai-title"
          >
            <div className="panel-heading">
              <p className="eyebrow" id="ai-title">
                AI Inspection Feed
              </p>
              <span>mock assist</span>
            </div>
            <div className="inspection-feed">
              {snapshot.aiInspectionFeed.map((event) => (
                <article key={event.id}>
                  <span>{event.score}</span>
                  <div>
                    <strong>{event.assetId}</strong>
                    <small>{event.finding}</small>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </section>

        <section className="entity-grid" aria-label="Read-only entity surfaces">
          <section className="panel entity-panel" id="skus" aria-labelledby="skus-title">
            <div className="panel-heading">
              <p className="eyebrow" id="skus-title">
                SKU Matrix
              </p>
              <span>{snapshot.skus.length} representative SKUs</span>
            </div>
            <div className="compact-list">
              {snapshot.skus.map((sku) => (
                <article key={sku.id}>
                  <div>
                    <strong>{sku.label}</strong>
                    <span>{sku.id} / {sku.productLine}</span>
                  </div>
                  <small className={`state state-${sku.reviewState}`}>
                    {statusLabels[sku.status]} / {sku.assetCount} assets
                  </small>
                </article>
              ))}
            </div>
          </section>

          <section className="panel entity-panel" id="assets" aria-labelledby="assets-title">
            <div className="panel-heading">
              <p className="eyebrow" id="assets-title">
                Asset Watch
              </p>
              <span>{snapshot.assets.length} sample assets</span>
            </div>
            <div className="compact-list">
              {snapshot.assets.map((asset) => (
                <article key={asset.id}>
                  <div>
                    <strong>{asset.fileName}</strong>
                    <span>{asset.usage} / {asset.skuId}</span>
                  </div>
                  <small className={`state state-${getScoreState(asset.inspectionScore)}`}>
                    Inspection {asset.inspectionScore}
                  </small>
                </article>
              ))}
            </div>
          </section>

          <section className="panel entity-panel" id="reviews" aria-labelledby="reviews-title">
            <div className="panel-heading">
              <p className="eyebrow" id="reviews-title">
                Review Sessions
              </p>
              <span>{snapshot.reviews.length} active</span>
            </div>
            <div className="compact-list">
              {snapshot.reviews.map((review) => (
                <article key={review.id}>
                  <div>
                    <strong>{review.label}</strong>
                    <span>{review.reviewer}</span>
                  </div>
                  <small className={`state state-${review.state}`}>
                    {approvalLabels[review.state]} / {review.pendingItems} pending
                  </small>
                </article>
              ))}
            </div>
          </section>

          <section
            className="panel entity-panel"
            id="deliveries"
            aria-labelledby="deliveries-title"
          >
            <div className="panel-heading">
              <p className="eyebrow" id="deliveries-title">
                Delivery Packages
              </p>
              <span>{snapshot.deliveries.length} packages</span>
            </div>
            <div className="compact-list">
              {snapshot.deliveries.map((delivery) => (
                <article key={delivery.id}>
                  <div>
                    <strong>{delivery.label}</strong>
                    <span>{delivery.projectId}</span>
                  </div>
                  <small className={`state state-${getDeliveryState(delivery.status)}`}>
                    {delivery.status} / {delivery.assetCount} assets
                  </small>
                </article>
              ))}
            </div>
          </section>
        </section>
      </main>
    </AppShell>
  );
}
