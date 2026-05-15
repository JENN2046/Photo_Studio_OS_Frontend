import { useEffect, useState } from "react";
import { AssetThumb } from "../../components/panels/AssetThumb";
import { GaugeCluster } from "../../components/gauges/GaugeCluster";
import { AppShell } from "../../components/layout/AppShell";
import {
  RuntimeChipList,
  type RuntimeChip
} from "../../components/panels/RuntimeChipList";
import type { AuthRuntimeView } from "../auth/useAuthState";
import { createReadModelHref } from "../read-models/readModelRoutes";
import {
  getCommandCenterApprovalDetail,
  getCommandCenterRiskDetail
} from "./commandCenterViewModel";
import {
  useCommandCenterSnapshot,
  type CommandCenterDebugState,
  type CommandCenterRuntimeView,
  type CommandCenterSnapshotStatus
} from "./useCommandCenterSnapshot";

const loadingStatusLanes = [
  {
    label: "镜像缓存",
    detail: "快照胶囊准备中",
    state: "排队"
  },
  {
    label: "仪表总线",
    detail: "命令舱遥测对齐中",
    state: "同步中"
  },
  {
    label: "运维通道",
    detail: "风险与队列面准备中",
    state: "待命"
  }
] as const;

const errorStatusLanes = [
  {
    label: "读取边界",
    detail: "快照流未稳定",
    state: "停滞"
  },
  {
    label: "风险流",
    detail: "备用遥测不可用",
    state: "观察"
  },
  {
    label: "恢复路径",
    detail: "可重试或检查内部调试覆盖",
    state: "手动"
  }
] as const;

const commandCenterSceneIds = [
  "risk",
  "projects",
  "approvals",
  "activity",
  "inspections"
] as const;

type CommandCenterScene = (typeof commandCenterSceneIds)[number];

function getDebugStateLabel(debugState: CommandCenterDebugState) {
  const labels = {
    live: "实时态",
    loading: "加载态",
    error: "错误态",
    forbidden: "权限不足",
    "invalid-id": "ID 无效"
  } satisfies Record<CommandCenterDebugState, string>;

  return labels[debugState];
}

function getDebugModeLabel(debugState: CommandCenterDebugState) {
  return debugState === "live"
    ? "模拟适配器"
    : `内部调试 / ${getDebugStateLabel(debugState)}`;
}

function getDebugClientLabel(debugState: CommandCenterDebugState) {
  return debugState === "live" ? "模拟适配器" : "调试覆盖";
}

function getCommandCenterStatusLabel(status: CommandCenterSnapshotStatus) {
  const labels = {
    loading: "读取中",
    ready: "已就绪",
    error: "读取失败",
    forbidden: "权限不足",
    "invalid-id": "ID 无效"
  } satisfies Record<CommandCenterSnapshotStatus, string>;

  return labels[status];
}

function formatCommandDate(value: string) {
  const [year, month, day] = value.split("-");
  const monthNumber = Number(month);
  const dayNumber = Number(day);

  if (!year || !monthNumber || !dayNumber) {
    return value;
  }

  return `${monthNumber}月${dayNumber}日`;
}

function formatQueueDue(ageHours: number) {
  const totalMinutes = Math.round(ageHours * 60);

  if (totalMinutes < 60) {
    return `预计 · ${totalMinutes}分钟`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return minutes > 0
    ? `预计 · ${hours}小时 ${minutes}分钟`
    : `预计 · ${hours}小时`;
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

function getApprovalSeverity(state: "waiting" | "blocked" | "cleared") {
  if (state === "blocked") {
    return "高";
  }

  return state === "waiting" ? "中" : "低";
}

function getRecoveryStateLabel(
  debugState: CommandCenterDebugState,
  canRetry: boolean
) {
  if (!canRetry) {
    return "已封闭";
  }

  return debugState === "live" ? "激活" : "调试保持";
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

function getCommandCenterSceneFromHash(): CommandCenterScene | null {
  if (typeof window === "undefined") {
    return null;
  }

  const [routeHash] = window.location.hash.slice(1).split("?");

  return commandCenterSceneIds.includes(routeHash as CommandCenterScene)
    ? (routeHash as CommandCenterScene)
    : null;
}

function useCommandCenterScene() {
  const [scene, setScene] = useState<CommandCenterScene | null>(
    getCommandCenterSceneFromHash
  );

  useEffect(() => {
    const updateScene = () => setScene(getCommandCenterSceneFromHash());

    updateScene();
    window.addEventListener("hashchange", updateScene);

    return () => {
      window.removeEventListener("hashchange", updateScene);
    };
  }, []);

  return scene;
}

function useCommandCenterAnchorScroll(status: CommandCenterSnapshotStatus) {
  useEffect(() => {
    scrollToCurrentHash();
    window.addEventListener("hashchange", scrollToCurrentHash);

    return () => {
      window.removeEventListener("hashchange", scrollToCurrentHash);
    };
  }, [status]);
}

function CommandCenterRuntimeStrip({
  runtime,
  status,
  debugState,
  authRuntime,
  variant = "default"
}: {
  runtime: CommandCenterRuntimeView;
  status: CommandCenterSnapshotStatus;
  debugState: CommandCenterDebugState;
  authRuntime: AuthRuntimeView;
  variant?: "default" | "status";
}) {
  const chips: RuntimeChip[] = [
    {
      key: "source",
      label: "读取源",
      value: runtime.sourceLabel,
      tone: runtime.source
    },
    {
      key: "status",
      label: "运行状态",
      value: getCommandCenterStatusLabel(status),
      tone: runtime.source
    },
    {
      key: "transport",
      label: "传输",
      value: runtime.transportLabel
    },
    {
      key: "auth-session",
      label: "会话",
      value: authRuntime.sessionLabel
    },
    {
      key: "auth-role",
      label: "角色",
      value: authRuntime.roleLabel
    },
    {
      key: "auth-access",
      label: "访问权限",
      value: authRuntime.permissionLabel
    },
    {
      key: "boundary",
      label: "写入边界",
      value: runtime.boundaryLabel,
      tone: "readonly"
    }
  ];

  if (debugState !== "live") {
    chips.push({
      key: "debug",
      label: "调试",
      value: getDebugStateLabel(debugState),
      tone: "debug"
    });
  }

  return (
    <section
      className={`command-runtime-strip command-runtime-strip-${variant}`}
      aria-label="命令中心只读运行状态"
    >
      <RuntimeChipList chips={chips} />
    </section>
  );
}

function CommandCenterStateSurface({
  status,
  message,
  onRetry,
  debugState,
  canRetry,
  runtime,
  authRuntime
}: {
  status: Exclude<CommandCenterSnapshotStatus, "ready">;
  message: string;
  onRetry: () => void;
  debugState: CommandCenterDebugState;
  canRetry: boolean;
  runtime: CommandCenterRuntimeView;
  authRuntime: AuthRuntimeView;
}) {
  const isLoading = status === "loading";
  const isForbidden = status === "forbidden";
  const isInvalidId = status === "invalid-id";
  const surfaceTone = isLoading ? "loading" : "error";
  const eyebrow = isLoading
    ? "遥测同步"
    : isForbidden
      ? "权限边界"
      : isInvalidId
        ? "快照缺失"
        : "快照停机";
  const heading = isLoading
    ? "遥测对齐中"
    : isForbidden
      ? "权限不足"
      : isInvalidId
        ? "快照未找到"
        : "只读保留态";
  const summary = isLoading
    ? "命令舱启动前正在对齐只读快照。"
    : isForbidden
      ? "当前角色无法读取命令中心快照，命令舱保持只读封存。"
      : isInvalidId
        ? "请求的命令中心快照不可用，命令舱不做推断补齐。"
        : "快照尚未稳定。命令舱保持只读安全状态。";
  const lanes = isLoading ? loadingStatusLanes : errorStatusLanes;
  const modeLabel = getDebugModeLabel(debugState);
  const actionLabel = canRetry
    ? isLoading
      ? "待机"
      : "调试就绪"
    : "仅观察";
  const messageLabel = isLoading
    ? "同步提示"
    : isForbidden
      ? "权限说明"
      : isInvalidId
        ? "ID 状态"
        : "异常说明";
  const buttonLabel = isLoading ? "重新准备" : "重试";
  const recoveryTitle = canRetry
    ? isLoading
      ? "握手激活"
      : "手动重新准备"
    : "恢复已封存";
  const recoveryDetail = canRetry
    ? isLoading
      ? "只读客户端仍在解析快照。"
      : "当内部调试覆盖未激活时，重试将重启只读客户端。"
    : "该面板在标准运行时仅报告状态。";
  const overrideTitle = debugState === "live" ? "客户端路径" : "调试闩锁";
  const overrideDetail =
    debugState === "live"
      ? "模拟适配器在线。"
      : `内部调试覆盖 / ${getDebugStateLabel(debugState)}`;
  const recoveryState = getRecoveryStateLabel(debugState, canRetry);

  return (
    <AppShell>
      <main className="command-center">
        <section
          className="hero-band status-hero-band"
          aria-label={`命令中心${isLoading ? "加载态" : "只读边界态"}`}
        >
          <div className="status-grid">
            <aside className="status-column" aria-label="只读准备状态">
              <section className="panel status-side-panel">
                <div className="panel-heading">
                  <p className="eyebrow">读取边界</p>
                  <span>{isLoading ? "准备中" : "停留中"}</span>
                </div>
                <div className="status-chip-stack">
                  <span className="status-chip">模式 / {modeLabel}</span>
                  <span className="status-chip">
                    面板 / {isLoading ? "已缓冲" : "降级"}
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
                  <p className="eyebrow">运营影响</p>
                  <span>只读</span>
                </div>
                <div className="status-note-stack">
                  <article>
                    <strong>只读封存</strong>
                    <span>写入路径保持禁用。</span>
                  </article>
                  <article>
                    <strong>无推断补齐</strong>
                    <span>渲染前必须获得快照。</span>
                  </article>
                </div>
              </section>
            </aside>

            <section
              className={`status-command status-command-${surfaceTone} status-command-state-${status}`}
            >
              <div className="status-command-frame">
                <div className="status-command-header">
                  <div>
                    <p className="eyebrow">{eyebrow}</p>
                    <h1>{heading}</h1>
                  </div>
                  <div className="read-only-badge" aria-label="只读模式">
                    <span>{isLoading ? "缓冲" : "保持"}</span>
                    <strong>{modeLabel}</strong>
                  </div>
                </div>

                <p className="status-command-copy">{summary}</p>
                <div
                  className="status-message-bar"
                  role={isLoading ? "status" : "alert"}
                >
                  <span className="status-message-label">{messageLabel}</span>
                  <strong>{message}</strong>
                </div>

                <CommandCenterRuntimeStrip
                  authRuntime={authRuntime}
                  debugState={debugState}
                  runtime={runtime}
                  status={status}
                  variant="status"
                />

                <div className="status-dial-row" aria-label="状态对齐">
                  <article className="status-dial-card">
                    <div className="status-dial status-dial-left">
                      <span className="status-dial-core" />
                    </div>
                    <strong>快照封套</strong>
                    <span>{isLoading ? "正在协商数据边界" : "封套连续性已失效"}</span>
                  </article>
                  <article className="status-dial-card status-dial-card-primary">
                    <div className="status-dial status-dial-primary">
                      <span className="status-dial-core" />
                    </div>
                    <strong>{isLoading ? "舱体同步" : "安全只读降级"}</strong>
                    <span>
                      {isLoading
                        ? "仅当只读模型稳定，仪表才会亮起"
                        : "当前面板维持非破坏性只读姿态"}
                    </span>
                  </article>
                  <article className="status-dial-card">
                    <div className="status-dial status-dial-right">
                      <span className="status-dial-core" />
                    </div>
                    <strong>运维通道</strong>
                    <span>{isLoading ? "预热队列与风险轨迹" : "等待手动恢复路径"}</span>
                  </article>
                </div>

                <div className="status-metric-strip">
                  <article>
                    <span>边界</span>
                    <strong>{isLoading ? "封存" : "已触发"}</strong>
                  </article>
                  <article>
                    <span>客户端</span>
                    <strong>{getDebugClientLabel(debugState)}</strong>
                  </article>
                  <article>
                    <span>动作</span>
                    <strong>{actionLabel}</strong>
                  </article>
                </div>
              </div>
            </section>

            <aside className="status-column" aria-label="恢复与防护说明">
              <section className="panel status-side-panel">
                <div className="panel-heading">
                  <p className="eyebrow">恢复</p>
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
                  <p className="eyebrow">防护</p>
                  <span>内测</span>
                </div>
                <div className="status-note-stack">
                  <article>
                    <strong>写入已锁</strong>
                    <span>状态仅保留在前端边界。</span>
                  </article>
                  <article>
                    <strong>保留仪表锚点</strong>
                    <span>三仪表层级保持不变。</span>
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

export function CommandCenter({
  authRuntime
}: {
  authRuntime: AuthRuntimeView;
}) {
  const { snapshot, status, errorMessage, debugState, canRetry, retry, runtime } =
    useCommandCenterSnapshot();
  const activeScene = useCommandCenterScene();
  useCommandCenterAnchorScroll(status);

  if (status === "loading") {
    return (
      <CommandCenterStateSurface
        authRuntime={authRuntime}
        debugState={debugState}
        canRetry={canRetry}
        message="快照闸门对齐中。"
        onRetry={retry}
        runtime={runtime}
        status="loading"
      />
    );
  }

  if (!snapshot) {
    const boundaryStatus: Exclude<CommandCenterSnapshotStatus, "ready"> =
      status === "ready" ? "error" : status;

    return (
      <CommandCenterStateSurface
        authRuntime={authRuntime}
        debugState={debugState}
        canRetry={canRetry}
        message={errorMessage ?? "未返回命令中心快照"}
        onRetry={retry}
        runtime={runtime}
        status={boundaryStatus}
      />
    );
  }

  const primaryProjectId = snapshot.projects[0]?.id;
  const primaryReviewSessionId = snapshot.reviews[0]?.id;
  const primaryDeliveryId = snapshot.deliveries[0]?.id;
  const assetInboxHref = createReadModelHref("asset-inbox", {
    projectId: primaryProjectId,
    reviewSessionId: primaryReviewSessionId,
    deliveryId: primaryDeliveryId
  });
  const qcRetouchHref = createReadModelHref("qc-retouch", {
    projectId: primaryProjectId,
    reviewSessionId: primaryReviewSessionId,
    deliveryId: primaryDeliveryId
  });
  const reviewGalleryHref = createReadModelHref("review-gallery", {
    reviewSessionId: primaryReviewSessionId,
    projectId: primaryProjectId,
    deliveryId: primaryDeliveryId
  });
  const deliveryReadinessHref = createReadModelHref("delivery-readiness", {
    deliveryId: primaryDeliveryId,
    projectId: primaryProjectId,
    reviewSessionId: primaryReviewSessionId
  });
  const productionContext = [
    { label: "项目", value: primaryProjectId ?? "待选择" },
    { label: "审核", value: primaryReviewSessionId ?? "待选择" },
    { label: "交付", value: primaryDeliveryId ?? "待选择" }
  ] as const;
  const productionRoutes = [
    { label: "素材", href: assetInboxHref },
    { label: "质检", href: qcRetouchHref },
    { label: "审核", href: reviewGalleryHref },
    { label: "交付", href: deliveryReadinessHref }
  ] as const;

  return (
    <AppShell>
      <main className="command-center cockpit-command-center">
        <section
          className="cockpit-frame"
          data-scene={activeScene ?? "overview"}
          aria-label="命令中心总览"
        >
          <div className="cockpit-main">
            <GaugeCluster
              coverage={snapshot.coverage}
              qc={snapshot.qc}
              studio={snapshot.studio}
            />

            <CommandCenterRuntimeStrip
              authRuntime={authRuntime}
              debugState={debugState}
              runtime={runtime}
              status={status}
            />

            <section className="execution-grid" aria-label="只读执行面板">
              <section
                className="panel project-execution-panel"
                id="projects"
                aria-labelledby="projects-title"
              >
                <div className="panel-heading">
                  <p className="eyebrow" id="projects-title">
                    项目执行
                  </p>
                  <a href={assetInboxHref}>素材收件箱</a>
                </div>
                <section
                  className="production-route-strip"
                  aria-label="黄金生产链路入口"
                >
                  <div className="production-route-context">
                    <span className="production-route-kicker">黄金链路</span>
                    {productionContext.map((item) => (
                      <span key={item.label}>
                        <b>{item.label}</b>
                        {item.value}
                      </span>
                    ))}
                  </div>
                  <nav
                    className="production-route-links"
                    aria-label="只读生产链路页面"
                  >
                    {productionRoutes.map((route) => (
                      <a href={route.href} key={route.label}>
                        {route.label}
                      </a>
                    ))}
                  </nav>
                </section>
                <div
                  className="project-table"
                  role="table"
                  aria-label="项目只读列表"
                >
                  <div className="table-row table-head" role="row">
                    <span role="columnheader">项目</span>
                    <span role="columnheader">进度</span>
                    <span role="columnheader">阶段</span>
                    <span role="columnheader">截止</span>
                  </div>
                  {snapshot.projects.map((project) => (
                    <div className="table-row" role="row" key={project.id}>
                      <span className="project-cell" role="cell">
                        <AssetThumb
                          label={`${project.name} 视觉标记`}
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

              <section
                className="panel timeline-panel"
                id="activity"
                aria-labelledby="activity-title"
              >
                <div className="panel-heading">
                  <p className="eyebrow" id="activity-title">
                    活动时间线
                  </p>
                </div>
                <div className="timeline">
                  {snapshot.activityTimeline.map((event, index) => (
                    <article
                      className={`timeline-event timeline-event-${index % 3}`}
                      key={event.id}
                    >
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
                    Agent 巡检
                  </p>
                  <a className="panel-heading-action" href="#inspections">
                    查看全部
                  </a>
                </div>
                <div className="inspection-feed">
                  {snapshot.aiInspectionFeed.map((event) => (
                    <article key={event.id}>
                      <AssetThumb
                        label={`${event.assetId} 巡检标记`}
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

          <aside className="right-rail cockpit-side" aria-label="风险与审批队列">
            <section
              className="panel"
              id="risk"
              aria-labelledby="risk-pulse-title"
            >
              <div className="panel-heading">
                <p className="eyebrow" id="risk-pulse-title">
                  风险雷达
                </p>
                <a className="panel-heading-action" href="#risk">
                  查看详情
                </a>
              </div>
              <div className="signal-list">
                {snapshot.riskPulse.map((risk) => (
                  <article className={`signal signal-${risk.level}`} key={risk.id}>
                    <strong>{risk.label}</strong>
                    <small className="risk-count">{risk.signal}</small>
                  </article>
                ))}
              </div>
              <div className="risk-detail-list" aria-label="风险只读详情">
                {snapshot.riskPulse.map((risk) => {
                  const detail = getCommandCenterRiskDetail(risk);

                  return (
                    <article
                      className={`risk-detail risk-detail-${risk.level}`}
                      key={risk.id}
                    >
                      <div>
                        <span>{risk.id}</span>
                        <strong>{risk.label}</strong>
                      </div>
                      <p>{detail.impact}</p>
                      <dl>
                        <div>
                          <dt>负责人</dt>
                          <dd>{detail.owner}</dd>
                        </div>
                        <div>
                          <dt>建议</dt>
                          <dd>{detail.action}</dd>
                        </div>
                      </dl>
                    </article>
                  );
                })}
              </div>
              <a className="panel-link" href={qcRetouchHref}>
                打开质检 / 精修
              </a>
            </section>

            <section
              className="panel"
              id="approvals"
              aria-labelledby="approval-queue-title"
            >
              <div className="panel-heading">
                <p className="eyebrow" id="approval-queue-title">
                  审批队列
                </p>
                <span className="queue-count">
                  {snapshot.approvalQueue.length}
                </span>
              </div>
              <div className="queue-list">
                {snapshot.approvalQueue.map((item) => (
                  <article className={`queue-item queue-${item.state}`} key={item.id}>
                    <AssetThumb
                      label={`${item.title} 审批标记`}
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
              <div className="approval-detail-list" aria-label="审批只读详情">
                {snapshot.approvalQueue.map((item) => {
                  const detail = getCommandCenterApprovalDetail(item);

                  return (
                    <article
                      className={`approval-detail approval-detail-${item.state}`}
                      key={item.id}
                    >
                      <div className="approval-detail-head">
                        <span>{item.id}</span>
                        <b>{detail.typeLabel}</b>
                        <strong>{detail.stateLabel}</strong>
                      </div>
                      <h3>{item.title}</h3>
                      <p>{detail.impact}</p>
                      <small>下一步：{detail.nextStep}</small>
                    </article>
                  );
                })}
              </div>
              <a className="panel-link" href={reviewGalleryHref}>
                打开审核画廊
              </a>
            </section>

            <div className="side-status-grid" aria-label="只读侧栏状态">
              <a className="side-status-card side-status-alert" href={qcRetouchHref}>
                <strong>巡检预警</strong>
                <span>{snapshot.aiInspectionFeed.length} 项</span>
              </a>
              <a className="side-status-card" href={deliveryReadinessHref}>
                <strong>交付包</strong>
                <span>交付准备</span>
              </a>
            </div>
          </aside>
        </section>
      </main>
    </AppShell>
  );
}
