import { useEffect } from "react";
import { GaugeCluster } from "../../components/gauges/GaugeCluster";
import { AppShell } from "../../components/layout/AppShell";
import { useCommandCenterSnapshot } from "./useCommandCenterSnapshot";

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
    detail: "Retry or inspect internal debug override",
    state: "Manual"
  }
] as const;

function getDebugModeLabel(debugState: "live" | "loading" | "error") {
  return debugState === "live" ? "Mock adapter" : `Internal debug / ${debugState}`;
}

function getDebugClientLabel(debugState: "live" | "loading" | "error") {
  return debugState === "live" ? "Mock adapter" : "Debug override";
}

function formatCommandDate(value: string) {
  const [year, month, day] = value.split("-");
  const monthLabels = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec"
  ];
  const monthIndex = Number(month) - 1;
  const dayNumber = Number(day);

  if (!year || !month || !day || !monthLabels[monthIndex] || !dayNumber) {
    return value;
  }

  return `${monthLabels[monthIndex].toUpperCase()} ${dayNumber}`;
}

function formatQueueDue(ageHours: number) {
  const totalMinutes = Math.round(ageHours * 60);

  if (totalMinutes < 60) {
    return `Due · ${totalMinutes}m`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return minutes > 0 ? `Due · ${hours}h ${minutes}m` : `Due · ${hours}h`;
}

function getProjectPhaseLabel(projectId: string) {
  const labels: Record<string, string> = {
    "PRJ-128": "3 / 5",
    "PRJ-129": "2 / 4",
    "PRJ-130": "1 / 4",
    "PRJ-131": "1 / 3"
  };

  return labels[projectId] ?? "1 / 3";
}

function createReadModelHref(
  route: "asset-inbox" | "qc-retouch" | "review-gallery" | "delivery-readiness",
  params: Record<string, string | undefined>
) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      searchParams.set(key, value);
    }
  });

  const query = searchParams.toString();
  return query ? `#${route}?${query}` : `#${route}`;
}

function getApprovalSeverity(state: "waiting" | "blocked" | "cleared") {
  if (state === "blocked") {
    return "High";
  }

  return state === "waiting" ? "Med" : "Low";
}

function getRecoveryStateLabel(
  debugState: "live" | "loading" | "error",
  canRetry: boolean
) {
  if (!canRetry) {
    return "sealed";
  }

  return debugState === "live" ? "active" : "debug-held";
}

function getVisualTone(seed: string) {
  const toneIndex =
    Array.from(seed).reduce((total, character) => {
      return total + character.charCodeAt(0);
    }, 0) % 4;

  return `asset-thumb-${toneIndex + 1}`;
}

function getVisualKind(seed: string) {
  const normalizedSeed = seed.toLowerCase();

  if (normalizedSeed.includes("chair") || normalizedSeed.includes("aurora")) {
    return "asset-thumb-chair";
  }

  if (normalizedSeed.includes("sofa") || normalizedSeed.includes("triæpiece")) {
    return "asset-thumb-sofa";
  }

  if (normalizedSeed.includes("coffee") || normalizedSeed.includes("tbl")) {
    return "asset-thumb-tabletop";
  }

  if (normalizedSeed.includes("lamp") || normalizedSeed.includes("lmp") || normalizedSeed.includes("lumen")) {
    return "asset-thumb-lamp";
  }

  if (normalizedSeed.includes("watch") || normalizedSeed.includes("ffcs")) {
    return "asset-thumb-watch";
  }

  if (normalizedSeed.includes("fragrance") || normalizedSeed.includes("npr")) {
    return "asset-thumb-bottle";
  }

  return "asset-thumb-product";
}

function AssetThumb({
  seed,
  label,
  size = "compact"
}: {
  seed: string;
  label: string;
  size?: "compact" | "table";
}) {
  return (
    <span
      aria-label={label}
      className={`asset-thumb asset-thumb-${size} ${getVisualTone(seed)} ${getVisualKind(seed)}`}
      role="img"
    >
      <i />
      <b />
    </span>
  );
}

function scrollToCurrentHash() {
  const targetId = window.location.hash.slice(1);

  if (!targetId) {
    return;
  }

  const target = document.getElementById(decodeURIComponent(targetId));

  if (!target) {
    return;
  }

  window.requestAnimationFrame(() => {
    const targetTop = target.getBoundingClientRect().top + window.scrollY;
    const maxScrollTop =
      document.documentElement.scrollHeight - window.innerHeight;
    const nextScrollTop = Math.min(Math.max(targetTop - 96, 0), maxScrollTop);

    window.scrollTo({
      left: 0,
      top: nextScrollTop,
      behavior: "auto"
    });
  });
}

function useCommandCenterAnchorScroll(status: "loading" | "ready" | "error") {
  useEffect(() => {
    scrollToCurrentHash();
    window.addEventListener("hashchange", scrollToCurrentHash);

    return () => {
      window.removeEventListener("hashchange", scrollToCurrentHash);
    };
  }, [status]);
}

function CommandCenterStateSurface({
  status,
  message,
  onRetry,
  debugState,
  canRetry
}: {
  status: "loading" | "error";
  message: string;
  onRetry: () => void;
  debugState: "live" | "loading" | "error";
  canRetry: boolean;
}) {
  const isLoading = status === "loading";
  const eyebrow = isLoading ? "Telemetry Sync" : "Snapshot Hold";
  const heading = isLoading ? "Telemetry Aligning" : "Read Hold";
  const summary = isLoading
    ? "Read-only snapshot is aligning before the cockpit opens."
    : "Snapshot did not settle. Cockpit remains in a safe read hold.";
  const lanes = isLoading ? loadingStatusLanes : errorStatusLanes;
  const modeLabel = getDebugModeLabel(debugState);
  const actionLabel = canRetry
    ? isLoading
      ? "Stand by"
      : "Debug ready"
    : "Passive";
  const messageLabel = isLoading ? "Sync note" : "Fault note";
  const buttonLabel = isLoading ? "Re-arm" : "Retry";
  const recoveryTitle = canRetry
    ? isLoading
      ? "Handshake active"
      : "Manual re-arm"
    : "Recovery sealed";
  const recoveryDetail = canRetry
    ? isLoading
      ? "Read client is still resolving the snapshot."
      : "Retry re-arms the read client unless the internal debug override is still active."
    : "This surface reports state only in standard runtime.";
  const overrideTitle = debugState === "live" ? "Client path" : "Debug latch";
  const overrideDetail =
    debugState === "live"
      ? "Mock adapter online."
      : `Internal debug override / ${debugState}`;
  const recoveryState = getRecoveryStateLabel(debugState, canRetry);

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
                    <strong>{getDebugClientLabel(debugState)}</strong>
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
                  <span>{recoveryState}</span>
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
                {canRetry ? (
                  <button
                    className="status-action"
                    onClick={onRetry}
                    type="button"
                  >
                    {buttonLabel}
                  </button>
                ) : null}
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

export function CommandCenter() {
  const { snapshot, status, errorMessage, debugState, canRetry, retry } =
    useCommandCenterSnapshot();
  useCommandCenterAnchorScroll(status);

  if (status === "loading") {
    return (
      <CommandCenterStateSurface
        debugState={debugState}
        canRetry={canRetry}
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
        canRetry={canRetry}
        message={errorMessage ?? "No command center snapshot returned"}
        onRetry={retry}
        status="error"
      />
    );
  }

  const primaryProjectId = snapshot.projects[0]?.id;
  const primaryReviewSessionId = snapshot.reviews[0]?.id;
  const primaryDeliveryId = snapshot.deliveries[0]?.id;
  const assetInboxHref = createReadModelHref("asset-inbox", {
    projectId: primaryProjectId
  });
  const qcRetouchHref = createReadModelHref("qc-retouch", {
    projectId: primaryProjectId
  });
  const reviewGalleryHref = createReadModelHref("review-gallery", {
    reviewSessionId: primaryReviewSessionId,
    projectId: primaryProjectId
  });
  const deliveryReadinessHref = createReadModelHref("delivery-readiness", {
    deliveryId: primaryDeliveryId,
    projectId: primaryProjectId,
    reviewSessionId: primaryReviewSessionId
  });

  return (
    <AppShell>
      <main className="command-center cockpit-command-center">
        <section className="cockpit-frame" aria-label="Command center overview">
          <div className="cockpit-main">
            <GaugeCluster
              coverage={snapshot.coverage}
              qc={snapshot.qc}
              studio={snapshot.studio}
            />

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
                  <a href={assetInboxHref}>Asset Inbox</a>
                </div>
                <div className="project-table" role="table" aria-label="Project read-only list">
                  <div className="table-row table-head" role="row">
                    <span role="columnheader">Project</span>
                    <span role="columnheader">Progress</span>
                    <span role="columnheader">Phase</span>
                    <span role="columnheader">Due</span>
                  </div>
                  {snapshot.projects.map((project) => (
                    <div className="table-row" role="row" key={project.id}>
                      <span className="project-cell" role="cell">
                        <AssetThumb
                          label={`${project.name} visual marker`}
                          seed={`${project.id}-${project.name}`}
                          size="table"
                        />
                        <span className="cell-stack">
                          <strong>{project.name}</strong>
                          <small>{project.client}</small>
                        </span>
                      </span>
                      <span className="progress-cell" role="cell">
                        <span>{project.completionPercent}%</span>
                        <span className="progress-meter" aria-hidden="true">
                          <i style={{ width: `${project.completionPercent}%` }} />
                        </span>
                      </span>
                      <span role="cell">{getProjectPhaseLabel(project.id)}</span>
                      <span role="cell">{formatCommandDate(project.dueDate)}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section className="panel timeline-panel" id="activity" aria-labelledby="activity-title">
                <div className="panel-heading">
                  <p className="eyebrow" id="activity-title">
                    Activity Timeline
                  </p>
                </div>
                <div className="timeline">
                  {snapshot.activityTimeline.map((event, index) => (
                    <article className={`timeline-event timeline-event-${index % 3}`} key={event.id}>
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
                  <span>View All</span>
                </div>
                <div className="inspection-feed">
                  {snapshot.aiInspectionFeed.map((event) => (
                    <article key={event.id}>
                      <AssetThumb
                        label={`${event.assetId} inspection marker`}
                        seed={`${event.assetId}-${event.finding}`}
                      />
                      <div>
                        <strong>{event.assetId}</strong>
                        <small>{event.finding}</small>
                      </div>
                      <span className="inspection-score">{event.score}%</span>
                    </article>
                  ))}
                </div>
              </section>
            </section>
          </div>

          <aside className="right-rail cockpit-side" aria-label="Risk and approval queue">
            <section
              className="panel"
              id="risk"
              aria-labelledby="risk-pulse-title"
            >
              <div className="panel-heading">
                <p className="eyebrow" id="risk-pulse-title">
                  Risk Pulse
                </p>
                <span>•••</span>
              </div>
              <div className="signal-list">
                {snapshot.riskPulse.map((risk) => (
                  <article className={`signal signal-${risk.level}`} key={risk.id}>
                    <strong>{risk.label}</strong>
                    <small className="risk-count">{risk.signal}</small>
                  </article>
                ))}
              </div>
              <a className="panel-link" href={qcRetouchHref}>
                Open QC / Retouch
              </a>
            </section>

            <section
              className="panel"
              id="approvals"
              aria-labelledby="approval-queue-title"
            >
              <div className="panel-heading">
                <p className="eyebrow" id="approval-queue-title">
                  Approval Queue
                </p>
                <span className="queue-count">{snapshot.approvalQueue.length}</span>
              </div>
              <div className="queue-list">
                {snapshot.approvalQueue.map((item) => (
                  <article className={`queue-item queue-${item.state}`} key={item.id}>
                    <AssetThumb
                      label={`${item.title} approval marker`}
                      seed={`${item.id}-${item.title}`}
                    />
                    <div>
                      <strong>{item.title}</strong>
                      <span>{item.projectId}</span>
                      <small className={`queue-severity queue-severity-${item.state}`}>
                        {getApprovalSeverity(item.state)}
                      </small>
                    </div>
                    <small className={`state state-${item.state}`}>
                      {formatQueueDue(item.ageHours)}
                    </small>
                  </article>
                ))}
              </div>
              <a className="panel-link" href={reviewGalleryHref}>
                Open Review Gallery
              </a>
            </section>

            <div className="side-status-grid" aria-label="Read-only side status">
              <a className="side-status-card side-status-alert" href={qcRetouchHref}>
                <strong>AI Flagged</strong>
                <span>{snapshot.aiInspectionFeed.length} Items</span>
              </a>
              <a className="side-status-card" href={deliveryReadinessHref}>
                <strong>Storage</strong>
                <span>Delivery</span>
              </a>
            </div>
          </aside>
        </section>
      </main>
    </AppShell>
  );
}
