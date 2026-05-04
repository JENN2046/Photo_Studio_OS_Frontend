import { commandCenterMock } from "../../mocks/commandCenter.mock";
import { GaugeCluster } from "../../components/gauges/GaugeCluster";
import { AppShell } from "../../components/layout/AppShell";
import { MetricPanel } from "../../components/panels/MetricPanel";
import type { ApprovalState, RiskLevel, WorkflowStatus } from "../../api/types";

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

export function CommandCenter() {
  const snapshot = commandCenterMock;
  const assetTotal = snapshot.projects.reduce(
    (total, project) => total + project.assetCount,
    0
  );
  const pendingApprovals = snapshot.approvalQueue.filter(
    (item) => item.state !== "cleared"
  ).length;

  return (
    <AppShell>
      <main className="command-center">
        <section className="hero-band" aria-label="Command center overview">
          <div className="hero-grid">
            <div className="overview-column">
              <GaugeCluster projects={snapshot.projects} />
              <div className="metric-grid" aria-label="Read-only studio counters">
                <MetricPanel title="Projects" value={snapshot.projects.length} label="active" />
                <MetricPanel title="Assets" value={assetTotal} label="tracked" />
                <MetricPanel title="Approvals" value={pendingApprovals} label="pending" />
              </div>
            </div>

            <aside className="right-rail" aria-label="Risk and approval queue">
              <section className="panel" aria-labelledby="risk-pulse-title">
                <div className="panel-heading">
                  <p className="eyebrow" id="risk-pulse-title">
                    Risk Pulse
                  </p>
                  <span>{snapshot.generatedAt.slice(11, 16)}</span>
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
                    <article className="queue-item" key={item.id}>
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
          <section className="panel execution-panel" id="projects" aria-labelledby="projects-title">
            <div className="panel-heading">
              <p className="eyebrow" id="projects-title">
                Project Execution
              </p>
              <span>{snapshot.projects.length} live tracks</span>
            </div>
            <div className="project-table" role="table" aria-label="Project read-only list">
              <div className="table-row table-head" role="row">
                <span role="columnheader">Project</span>
                <span role="columnheader">Owner</span>
                <span role="columnheader">Status</span>
                <span role="columnheader">Due</span>
                <span role="columnheader">Risk</span>
              </div>
              {snapshot.projects.map((project) => (
                <div className="table-row" role="row" key={project.id}>
                  <span role="cell">
                    <strong>{project.name}</strong>
                    <small>{project.client}</small>
                  </span>
                  <span role="cell">{project.owner}</span>
                  <span role="cell">{statusLabels[project.status]}</span>
                  <span role="cell">{project.dueDate}</span>
                  <span role="cell" className={`state risk-${project.riskLevel}`}>
                    {riskLabels[project.riskLevel]}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="panel execution-panel" id="skus" aria-labelledby="skus-title">
            <div className="panel-heading">
              <p className="eyebrow" id="skus-title">
                SKU Matrix
              </p>
              <span>{snapshot.skus.length} representative SKUs</span>
            </div>
            <div className="compact-list">
              {snapshot.skus.map((sku) => (
                <article key={sku.id}>
                  <strong>{sku.label}</strong>
                  <span>{sku.id} / {sku.productLine}</span>
                  <small>{statusLabels[sku.status]} / {sku.assetCount} assets</small>
                </article>
              ))}
            </div>
          </section>

          <section className="panel execution-panel" id="assets" aria-labelledby="assets-title">
            <div className="panel-heading">
              <p className="eyebrow" id="assets-title">
                Asset Watch
              </p>
              <span>{snapshot.assets.length} sample assets</span>
            </div>
            <div className="compact-list">
              {snapshot.assets.map((asset) => (
                <article key={asset.id}>
                  <strong>{asset.fileName}</strong>
                  <span>{asset.usage} / {asset.skuId}</span>
                  <small>Inspection {asset.inspectionScore}</small>
                </article>
              ))}
            </div>
          </section>

          <section className="panel execution-panel" id="reviews" aria-labelledby="reviews-title">
            <div className="panel-heading">
              <p className="eyebrow" id="reviews-title">
                Review Sessions
              </p>
              <span>{snapshot.reviews.length} active</span>
            </div>
            <div className="compact-list">
              {snapshot.reviews.map((review) => (
                <article key={review.id}>
                  <strong>{review.label}</strong>
                  <span>{review.reviewer}</span>
                  <small>{approvalLabels[review.state]} / {review.pendingItems} pending</small>
                </article>
              ))}
            </div>
          </section>

          <section
            className="panel execution-panel"
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
                  <strong>{delivery.label}</strong>
                  <span>{delivery.projectId}</span>
                  <small>{delivery.status} / {delivery.assetCount} assets</small>
                </article>
              ))}
            </div>
          </section>

          <section className="panel execution-panel" aria-labelledby="activity-title">
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

          <section className="panel execution-panel" aria-labelledby="ai-title">
            <div className="panel-heading">
              <p className="eyebrow" id="ai-title">
                AI Inspection Feed
              </p>
              <span>read-only</span>
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
      </main>
    </AppShell>
  );
}
