import { useMemo, useState, type ReactNode } from "react";
import { AppShell } from "../../components/layout/AppShell";
import {
  fetchAssetInboxReadModel,
  fetchDeliveryReadinessReadModel,
  fetchQcRetouchQueueReadModel,
  fetchReviewGalleryReadModel
} from "../../api/backendReadModels";
import type {
  BackendAssetInbox,
  BackendDeliveryReadiness,
  BackendQcRetouchQueue,
  BackendReviewGallery
} from "../../api/backendReadModels";
import type { BackendReadModelState } from "./useBackendReadModel";
import { useBackendReadModel } from "./useBackendReadModel";
import {
  createAssetInboxViewModel,
  createDeliveryReadinessViewModel,
  createQcRetouchQueueViewModel,
  createReviewGalleryViewModel,
  formatBytes,
  formatReason,
  formatShortDateTime,
  formatSource,
  formatStatus,
  toneFromStatus,
  type ReadModelTone,
  type ReadModelViewModel
} from "./readModelViewModels";
import {
  createMockAssetInbox,
  createMockDeliveryReadiness,
  createMockQcRetouchQueue,
  createMockReviewGallery
} from "./readModelMocks";
import "./readModelPages.css";

export interface ReadModelPageProps {
  params: URLSearchParams;
}

type ReadModelRoute =
  | "asset-inbox"
  | "qc-retouch"
  | "review-gallery"
  | "delivery-readiness";

interface ReadModelFrameProps {
  activeRoute: ReadModelRoute;
  children: ReactNode;
  eyebrow: string;
  title: string;
  deck: string;
  params: URLSearchParams;
}

type AssetInboxItem = BackendAssetInbox["items"][number];
type QcRetouchItem = BackendQcRetouchQueue["items"][number];
type ReviewGalleryItem = BackendReviewGallery["items"][number];
type DeliveryChecklistKey = keyof BackendDeliveryReadiness["checklist"];

const routeLabels: Record<ReadModelRoute, string> = {
  "asset-inbox": "素材收件箱",
  "qc-retouch": "质检 / 精修",
  "review-gallery": "审核画廊",
  "delivery-readiness": "交付就绪"
};

function getParam(params: URLSearchParams, key: string): string {
  return params.get(key)?.trim() ?? "";
}

function getSharedQuery(params: URLSearchParams): string {
  const next = new URLSearchParams();
  const projectId = getParam(params, "projectId");
  const reviewSessionId = getParam(params, "reviewSessionId");
  const deliveryId = getParam(params, "deliveryId");

  if (projectId) {
    next.set("projectId", projectId);
  }

  if (reviewSessionId) {
    next.set("reviewSessionId", reviewSessionId);
  }

  if (deliveryId) {
    next.set("deliveryId", deliveryId);
  }

  const query = next.toString();
  return query ? `?${query}` : "";
}

function ReadModelFrame({
  activeRoute,
  children,
  eyebrow,
  title,
  deck,
  params
}: ReadModelFrameProps) {
  const sharedQuery = getSharedQuery(params);

  return (
    <AppShell>
      <main className="read-model-page" aria-label={title}>
        <section className="read-model-hero">
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <h1>{title}</h1>
            <p>{deck}</p>
          </div>
          <nav className="read-model-tabs" aria-label="只读模型场景">
            {(Object.keys(routeLabels) as ReadModelRoute[]).map((route) => (
              <a
                aria-current={route === activeRoute ? "page" : undefined}
                href={`#${route}${sharedQuery}`}
                key={route}
              >
                {routeLabels[route]}
              </a>
            ))}
          </nav>
        </section>
        {children}
      </main>
    </AppShell>
  );
}

function ReadModelStateNotice<T>({
  state,
  idleLabel
}: {
  state: BackendReadModelState<T>;
  idleLabel: string;
}) {
  if (state.status === "ready") {
    return null;
  }

  const titleByStatus = {
    "missing-config": "后端只读模型未配置",
    idle: idleLabel,
    loading: "只读模型加载中",
    error: "只读模型不可用"
  } satisfies Record<Exclude<typeof state.status, "ready">, string>;

  return (
    <section className={`read-model-state read-model-state-${state.status}`}>
      <div>
        <strong>{titleByStatus[state.status]}</strong>
        <span>{state.errorMessage ?? state.message}</span>
      </div>
      {state.canRetry ? (
        <button onClick={state.retry} type="button">
          重试
        </button>
      ) : null}
    </section>
  );
}

function ReadModelDashboard({ viewModel }: { viewModel: ReadModelViewModel }) {
  return (
    <section className="read-model-grid">
      <section
        className="read-model-metrics"
        aria-label={`${viewModel.title} 指标面板`}
      >
        {viewModel.metrics.map((metric) => (
          <article
            className={`read-model-metric read-model-tone-${metric.tone}`}
            key={metric.label}
          >
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            <small>{metric.detail}</small>
          </article>
        ))}
      </section>

      <section className="read-model-table" aria-label={`${viewModel.title} 明细`}>
        <div className="read-model-table-head">
          <div>
            <p className="eyebrow">{viewModel.title}</p>
            <strong>{viewModel.subtitle}</strong>
          </div>
          <span>{viewModel.rows.length} 条</span>
        </div>
        <div className="read-model-row-list">
          {viewModel.rows.map((row) => (
            <article className="read-model-row" key={row.id}>
              <div>
                <strong>{row.primary}</strong>
                <span>{row.secondary}</span>
              </div>
              <small>{row.meta}</small>
              <b className={`read-model-pill read-model-tone-${row.tone}`}>
                {row.status}
              </b>
            </article>
          ))}
        </div>
      </section>

      <section
        className="read-model-detail-grid"
        aria-label={`${viewModel.title} 只读详情`}
      >
        {viewModel.details.map((detail) => (
          <article
            className={`read-model-detail read-model-tone-${detail.tone}`}
            key={detail.label}
          >
            <span>{detail.label}</span>
            <strong>{detail.title}</strong>
            <small>{detail.detail}</small>
          </article>
        ))}
      </section>
    </section>
  );
}

function formatPercent(value: number | undefined): string {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "待计算";
  }

  return `${Math.round(value * 100)}%`;
}

function formatDimensions(asset: AssetInboxItem): string {
  if (!asset.file.width || !asset.file.height) {
    return "尺寸待定";
  }

  return `${asset.file.width} x ${asset.file.height}`;
}

function assetTone(asset: AssetInboxItem): ReadModelTone {
  return toneFromStatus(asset.latestQc?.status ?? asset.status);
}

function assetShotLabel(asset: {
  shotRequirement?: { shotTypeCode: string; status: string };
}): string {
  return asset.shotRequirement
    ? `${asset.shotRequirement.shotTypeCode} / ${formatStatus(
        asset.shotRequirement.status
      )}`
    : "镜头需求待绑定";
}

function assetSkuLabel(asset: { sku?: { code: string; name: string } }): string {
  return asset.sku ? `${asset.sku.code} / ${asset.sku.name}` : "未绑定 SKU";
}

function AssetInboxWorkspace({
  model,
  viewModel
}: {
  model: BackendAssetInbox;
  viewModel: ReadModelViewModel;
}) {
  const [selectedAssetId, setSelectedAssetId] = useState(
    model.selectedAssetId ?? model.items[0]?.assetId ?? ""
  );
  const selectedAsset = useMemo(
    () =>
      model.items.find((item) => item.assetId === selectedAssetId) ??
      model.items[0],
    [model.items, selectedAssetId]
  );
  const selectedTone = selectedAsset ? assetTone(selectedAsset) : "neutral";
  const boundCount = model.items.filter(
    (item) => item.binding.status === "bound"
  ).length;
  const qcRiskCount = model.items.filter((item) =>
    ["failed", "warning"].includes(item.latestQc?.status ?? "")
  ).length;

  return (
    <section className="asset-inbox-workspace">
      <section
        className="read-model-metrics asset-inbox-metrics"
        aria-label={`${viewModel.title} 指标面板`}
      >
        {viewModel.metrics.map((metric) => (
          <article
            className={`read-model-metric read-model-tone-${metric.tone}`}
            key={metric.label}
          >
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            <small>{metric.detail}</small>
          </article>
        ))}
      </section>

      <section className="asset-inbox-console" aria-label="素材工作台">
        <header className="asset-inbox-intake">
          <div>
            <p className="eyebrow">Capture One Intake</p>
            <strong>{formatSource(model.intake.source)}</strong>
            <span>
              {formatStatus(model.intake.status)} /{" "}
              {formatReason(model.intake.message)}
            </span>
          </div>
          <div className="asset-inbox-intake-stats" aria-label="素材入库统计">
            <span>
              <b>{model.total}</b>
              素材
            </span>
            <span>
              <b>{boundCount}</b>
              已绑定
            </span>
            <span>
              <b>{qcRiskCount}</b>
              QC 风险
            </span>
          </div>
        </header>

        <div className="asset-inbox-body">
          <section className="asset-thumbnail-panel" aria-label="缩略图网格">
            <div className="asset-panel-head">
              <div>
                <p className="eyebrow">Asset Grid</p>
                <strong>{model.projectId}</strong>
              </div>
              <span>{model.items.length} / {model.limit}</span>
            </div>
            <div className="asset-thumbnail-grid">
              {model.items.map((asset) => {
                const tone = assetTone(asset);

                return (
                  <button
                    aria-pressed={asset.assetId === selectedAsset?.assetId}
                    className={`asset-thumbnail read-model-tone-${tone}`}
                    key={asset.assetId}
                    onClick={() => setSelectedAssetId(asset.assetId)}
                    type="button"
                  >
                    <span className="asset-thumbnail-visual" aria-hidden="true">
                      <b>{asset.file.fileExt ?? "RAW"}</b>
                    </span>
                    <span className="asset-thumbnail-copy">
                      <strong>{asset.file.originalFilename ?? asset.assetId}</strong>
                      <small>{assetSkuLabel(asset)}</small>
                      <small>{assetShotLabel(asset)}</small>
                    </span>
                    <i>{formatStatus(asset.latestQc?.status ?? asset.status)}</i>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="asset-preview-panel" aria-label="选中素材预览">
            {selectedAsset ? (
              <>
                <div
                  className={`asset-preview-visual read-model-tone-${selectedTone}`}
                >
                  <span>{selectedAsset.file.fileExt ?? "RAW"}</span>
                  <strong>{selectedAsset.assetId}</strong>
                  <small>{selectedAsset.file.originalFilename}</small>
                </div>
                <div className="asset-preview-copy">
                  <p className="eyebrow">Selected Asset</p>
                  <h2>{selectedAsset.file.originalFilename ?? selectedAsset.assetId}</h2>
                  <span>{assetSkuLabel(selectedAsset)}</span>
                  <span>{assetShotLabel(selectedAsset)}</span>
                </div>
                <div className="asset-preview-actions" aria-label="只读操作状态">
                  <button disabled type="button">
                    上传未启用
                  </button>
                  <button disabled type="button">
                    下载未启用
                  </button>
                </div>
              </>
            ) : (
              <p>暂无素材可预览。</p>
            )}
          </section>
        </div>
      </section>

      {selectedAsset ? (
        <section className="asset-inbox-detail-grid" aria-label="素材只读详情">
          <article
            className={`read-model-detail read-model-tone-${toneFromStatus(
              selectedAsset.binding.status
            )}`}
          >
            <span>绑定状态</span>
            <strong>{formatStatus(selectedAsset.binding.status)}</strong>
            <small>
              {formatReason(selectedAsset.binding.reason)} / 置信度{" "}
              {formatPercent(selectedAsset.binding.confidence)}
            </small>
          </article>
          <article className="read-model-detail read-model-tone-neutral">
            <span>文件信息</span>
            <strong>{formatDimensions(selectedAsset)}</strong>
            <small>
              {formatBytes(selectedAsset.file.fileSizeBytes)} /{" "}
              {selectedAsset.file.colorSpace ?? "色彩空间待定"}
            </small>
          </article>
          <article
            className={`read-model-detail read-model-tone-${toneFromStatus(
              selectedAsset.latestQc?.status
            )}`}
          >
            <span>QC Checklist</span>
            <strong>
              {formatStatus(selectedAsset.latestQc?.status ?? selectedAsset.status)}
            </strong>
            <small>
              {(selectedAsset.latestQc?.failedReasons ?? []).length > 0
                ? selectedAsset.latestQc?.failedReasons
                    ?.map((reason) => formatReason(reason))
                    .join(" / ")
                : selectedAsset.latestQc?.notes ?? "暂未发现质检风险"}
            </small>
          </article>
        </section>
      ) : null}
    </section>
  );
}

const qcResultLabels: Record<string, string> = {
  focus: "焦点",
  exposure: "曝光",
  crop: "裁切",
  color: "色彩",
  binding: "绑定",
  producer: "制片复核",
  retouchLead: "精修负责人"
};

function formatQcResultKey(key: string): string {
  return qcResultLabels[key] ?? formatStatus(key);
}

function formatQcResultValue(value: unknown): string {
  return typeof value === "string" ? formatStatus(value) : String(value);
}

function qcItemTone(item: QcRetouchItem): ReadModelTone {
  return toneFromStatus(item.qc.latestStatus ?? item.retouch?.status);
}

function QcResultList({
  results
}: {
  results: Record<string, unknown>;
}) {
  const entries = Object.entries(results);

  if (entries.length === 0) {
    return <p className="qc-empty-note">暂无检查结果。</p>;
  }

  return (
    <ul className="qc-result-list">
      {entries.map(([key, value]) => (
        <li key={key}>
          <span>{formatQcResultKey(key)}</span>
          <b>{formatQcResultValue(value)}</b>
        </li>
      ))}
    </ul>
  );
}

function QcRetouchWorkspace({
  model,
  viewModel
}: {
  model: BackendQcRetouchQueue;
  viewModel: ReadModelViewModel;
}) {
  const [selectedAssetId, setSelectedAssetId] = useState(
    model.items[0]?.assetId ?? ""
  );
  const selectedItem = useMemo(
    () =>
      model.items.find((item) => item.assetId === selectedAssetId) ??
      model.items[0],
    [model.items, selectedAssetId]
  );
  const failedCount = model.items.filter(
    (item) => item.qc.latestStatus === "failed"
  ).length;
  const warningCount = model.items.filter(
    (item) => item.qc.latestStatus === "warning"
  ).length;
  const activeRetouchCount = model.items.filter(
    (item) => item.retouch && item.retouch.status !== "done"
  ).length;
  const selectedTone = selectedItem ? qcItemTone(selectedItem) : "neutral";
  const failedReasons = selectedItem?.qc.failedReasons ?? [];

  return (
    <section className="qc-retouch-workspace">
      <section
        className="read-model-metrics qc-retouch-metrics"
        aria-label={`${viewModel.title} 指标面板`}
      >
        {viewModel.metrics.map((metric) => (
          <article
            className={`read-model-metric read-model-tone-${metric.tone}`}
            key={metric.label}
          >
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            <small>{metric.detail}</small>
          </article>
        ))}
      </section>

      <section className="qc-retouch-console" aria-label="QC 精修工作台">
        <header className="qc-retouch-summary">
          <div>
            <p className="eyebrow">QC Queue</p>
            <strong>{model.projectId}</strong>
            <span>只读队列 / 不执行退回、补拍或审批写入</span>
          </div>
          <div className="qc-retouch-summary-stats">
            <span>
              <b>{failedCount}</b>
              失败
            </span>
            <span>
              <b>{warningCount}</b>
              警告
            </span>
            <span>
              <b>{activeRetouchCount}</b>
              精修中
            </span>
          </div>
        </header>

        <div className="qc-retouch-body">
          <section className="qc-queue-panel" aria-label="QC 队列">
            <div className="asset-panel-head">
              <div>
                <p className="eyebrow">Retouch Queue</p>
                <strong>{model.items.length} 个素材版本</strong>
              </div>
              <span>{model.page} / {model.limit}</span>
            </div>
            <div className="qc-queue-list">
              {model.items.map((item) => {
                const tone = qcItemTone(item);

                return (
                  <button
                    aria-pressed={item.assetId === selectedItem?.assetId}
                    className={`qc-queue-card read-model-tone-${tone}`}
                    key={item.assetId}
                    onClick={() => setSelectedAssetId(item.assetId)}
                    type="button"
                  >
                    <span>
                      <b>{item.assetId}</b>
                      <i>{formatStatus(item.qc.latestStatus)}</i>
                    </span>
                    <strong>{assetSkuLabel(item)}</strong>
                    <small>{assetShotLabel(item)}</small>
                    <small>
                      {item.retouch?.assignedTo ?? "负责人待定"} /{" "}
                      {formatShortDateTime(item.retouch?.dueAt)}
                    </small>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="qc-selected-panel" aria-label="选中 QC 详情">
            {selectedItem ? (
              <>
                <div
                  className={`qc-preview-visual read-model-tone-${selectedTone}`}
                >
                  <span>{formatStatus(selectedItem.qc.latestStatus)}</span>
                  <strong>{selectedItem.assetId}</strong>
                  <small>{selectedItem.previewKey ?? "预览键待生成"}</small>
                </div>
                <div className="qc-selected-copy">
                  <p className="eyebrow">Selected QC</p>
                  <h2>{assetSkuLabel(selectedItem)}</h2>
                  <span>{assetShotLabel(selectedItem)}</span>
                  <span>
                    负责人：{selectedItem.retouch?.assignedTo ?? "待分配"}
                  </span>
                </div>
                <div className="qc-suggestion-actions">
                  <button disabled type="button">
                    {formatStatus(selectedItem.qc.nextAction)}
                  </button>
                  <button disabled type="button">
                    只读建议
                  </button>
                </div>
              </>
            ) : (
              <p>暂无 QC 项可预览。</p>
            )}
          </section>
        </div>
      </section>

      {selectedItem ? (
        <section className="qc-retouch-detail-grid" aria-label="QC 只读详情">
          <article
            className={`read-model-detail read-model-tone-${toneFromStatus(
              selectedItem.qc.latestStatus
            )}`}
          >
            <span>失败原因</span>
            <strong>
              {failedReasons.length > 0
                ? failedReasons.map((reason) => formatReason(reason)).join(" / ")
                : "未发现失败项"}
            </strong>
            <small>严重度：{formatStatus(selectedItem.qc.latestStatus)}</small>
          </article>
          <article
            className={`read-model-detail read-model-tone-${toneFromStatus(
              selectedItem.retouch?.status
            )}`}
          >
            <span>精修任务</span>
            <strong>{formatStatus(selectedItem.retouch?.status)}</strong>
            <small>
              {selectedItem.retouch?.assignedTo ?? "负责人待定"} / 截止{" "}
              {formatShortDateTime(selectedItem.retouch?.dueAt)}
            </small>
          </article>
          <article className="qc-result-panel read-model-detail read-model-tone-neutral">
            <span>技术检查</span>
            <strong>自动检查结果</strong>
            <QcResultList results={selectedItem.qc.technicalResults} />
          </article>
          <article className="qc-result-panel read-model-detail read-model-tone-neutral">
            <span>人工检查</span>
            <strong>制片与精修复核</strong>
            <QcResultList results={selectedItem.qc.manualResults} />
          </article>
          <article
            className={`read-model-detail qc-retouch-instructions read-model-tone-${selectedTone}`}
          >
            <span>返修说明</span>
            <strong>{selectedItem.retouch?.instructions ?? "暂无返修说明"}</strong>
            <small>
              复杂度：{formatStatus(selectedItem.retouch?.complexity)} / 修订{" "}
              {selectedItem.retouch?.revisionCount ?? 0} 次
            </small>
          </article>
          <article
            className={`read-model-detail read-model-tone-${toneFromStatus(
              selectedItem.qc.nextAction
            )}`}
          >
            <span>建议动作</span>
            <strong>{formatStatus(selectedItem.qc.nextAction)}</strong>
            <small>当前仅展示建议，业务写入未启用。</small>
          </article>
        </section>
      ) : null}
    </section>
  );
}

function reviewItemTone(item: ReviewGalleryItem): ReadModelTone {
  return toneFromStatus(item.status);
}

function ReviewGalleryWorkspace({
  model,
  viewModel
}: {
  model: BackendReviewGallery;
  viewModel: ReadModelViewModel;
}) {
  const [selectedReviewItemId, setSelectedReviewItemId] = useState(
    model.items[0]?.reviewItemId ?? ""
  );
  const selectedItem = useMemo(
    () =>
      model.items.find((item) => item.reviewItemId === selectedReviewItemId) ??
      model.items[0],
    [model.items, selectedReviewItemId]
  );
  const selectedTone = selectedItem ? reviewItemTone(selectedItem) : "neutral";
  const summary = model.summary ?? {};
  const revisionCount =
    summary.revisionRequested ??
    model.items.filter((item) => item.status === "revision_requested").length;

  return (
    <section className="review-gallery-workspace">
      <section
        className="read-model-metrics review-gallery-metrics"
        aria-label={`${viewModel.title} 指标面板`}
      >
        {viewModel.metrics.map((metric) => (
          <article
            className={`read-model-metric read-model-tone-${metric.tone}`}
            key={metric.label}
          >
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            <small>{metric.detail}</small>
          </article>
        ))}
      </section>

      <section className="review-gallery-console" aria-label="审核画廊工作台">
        <header className="review-gallery-summary">
          <div>
            <p className="eyebrow">Review Gallery</p>
            <strong>{model.title ?? model.reviewSessionId}</strong>
            <span>
              {formatStatus(model.status)} / 到期{" "}
              {formatShortDateTime(model.expiresAt)}
            </span>
          </div>
          <div className="review-gallery-summary-stats">
            <span>
              <b>{summary.pending ?? 0}</b>
              待审核
            </span>
            <span>
              <b>{summary.approved ?? 0}</b>
              已批准
            </span>
            <span>
              <b>{revisionCount}</b>
              需返修
            </span>
          </div>
        </header>

        <div className="review-gallery-body">
          <section className="review-gallery-panel" aria-label="审核素材网格">
            <div className="asset-panel-head">
              <div>
                <p className="eyebrow">Client Review Set</p>
                <strong>{model.reviewSessionId}</strong>
              </div>
              <span>{model.items.length} 个审核项</span>
            </div>
            <div className="review-card-grid">
              {model.items.map((item) => {
                const tone = reviewItemTone(item);

                return (
                  <button
                    aria-pressed={
                      item.reviewItemId === selectedItem?.reviewItemId
                    }
                    className={`review-card read-model-tone-${tone}`}
                    key={item.reviewItemId}
                    onClick={() => setSelectedReviewItemId(item.reviewItemId)}
                    type="button"
                  >
                    <span className="review-card-visual" aria-hidden="true">
                      <b>{item.assetId}</b>
                    </span>
                    <span className="review-card-copy">
                      <strong>{assetSkuLabel(item)}</strong>
                      <small>{assetShotLabel(item)}</small>
                      <small>
                        {item.clientComment ?? formatReason(item.issueType)}
                      </small>
                    </span>
                    <i>{formatStatus(item.status)}</i>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="review-selected-panel" aria-label="选中审核项">
            {selectedItem ? (
              <>
                <div
                  className={`review-preview-visual read-model-tone-${selectedTone}`}
                >
                  <span>{formatStatus(selectedItem.status)}</span>
                  <strong>{selectedItem.assetId}</strong>
                  <small>{selectedItem.previewKey ?? "预览键待生成"}</small>
                </div>
                <div className="review-selected-copy">
                  <p className="eyebrow">Selected Review</p>
                  <h2>{assetSkuLabel(selectedItem)}</h2>
                  <span>{assetShotLabel(selectedItem)}</span>
                  <span>
                    {selectedItem.clientComment ??
                      formatReason(selectedItem.issueType)}
                  </span>
                </div>
                <div className="review-actions">
                  <button disabled type="button">
                    公开审核未启用
                  </button>
                  <button disabled type="button">
                    反馈写入未启用
                  </button>
                </div>
              </>
            ) : (
              <p>暂无审核项可预览。</p>
            )}
          </section>
        </div>
      </section>

      {selectedItem ? (
        <section className="review-detail-grid" aria-label="审核只读详情">
          <article
            className={`read-model-detail read-model-tone-${toneFromStatus(
              selectedItem.status
            )}`}
          >
            <span>审核状态</span>
            <strong>{formatStatus(selectedItem.status)}</strong>
            <small>
              {selectedItem.reviewedAt
                ? `客户确认 ${formatShortDateTime(selectedItem.reviewedAt)}`
                : "等待客户确认或反馈"}
            </small>
          </article>
          <article
            className={`read-model-detail read-model-tone-${selectedTone}`}
          >
            <span>客户反馈</span>
            <strong>
              {selectedItem.clientComment ??
                formatReason(selectedItem.issueType) ??
                "暂无客户反馈"}
            </strong>
            <small>当前仅展示反馈摘要，不开放评论写入。</small>
          </article>
          <article className="read-model-detail read-model-tone-neutral">
            <span>公开访问</span>
            <strong>{model.publicAccess.enabled ? "已启用" : "未启用"}</strong>
            <small>{formatReason(model.publicAccess.reason)}</small>
          </article>
        </section>
      ) : null}
    </section>
  );
}

const deliveryChecklistLabels: Record<DeliveryChecklistKey, string> = {
  hasItems: "包含交付素材",
  hasPackageKey: "交付包已生成",
  hasManifestKey: "交付清单已生成",
  allItemsHaveFileKey: "素材文件完整"
};

interface DeliveryArtifact {
  id: string;
  label: string;
  title: string;
  detail: string;
  status: string;
  tone: ReadModelTone;
}

function createDeliveryArtifacts(
  model: BackendDeliveryReadiness
): DeliveryArtifact[] {
  return [
    {
      id: "package",
      label: "交付包",
      title: model.packageKey ? "交付包已生成" : "交付包待生成",
      detail: model.packageKey ?? "暂无交付包路径",
      status: model.checklist.hasPackageKey ? "ready" : "preparing",
      tone: model.checklist.hasPackageKey ? "good" : "warn"
    },
    {
      id: "manifest",
      label: "Manifest",
      title: model.manifestKey ? "交付清单已生成" : "交付清单待生成",
      detail: model.manifestKey ?? "暂无交付清单路径",
      status: model.checklist.hasManifestKey ? "ready" : "preparing",
      tone: model.checklist.hasManifestKey ? "good" : "warn"
    },
    {
      id: "items",
      label: "交付素材",
      title: `${model.itemCount} 个交付项`,
      detail: model.checklist.allItemsHaveFileKey
        ? "所有素材文件已关联。"
        : "仍有素材文件需要人工复核。",
      status: model.checklist.allItemsHaveFileKey ? "ready" : "warning",
      tone: model.checklist.allItemsHaveFileKey ? "good" : "warn"
    }
  ];
}

function DeliveryReadinessWorkspace({
  model,
  viewModel
}: {
  model: BackendDeliveryReadiness;
  viewModel: ReadModelViewModel;
}) {
  const artifacts = useMemo(() => createDeliveryArtifacts(model), [model]);
  const [selectedArtifactId, setSelectedArtifactId] = useState(
    artifacts[0]?.id ?? ""
  );
  const selectedArtifact =
    artifacts.find((artifact) => artifact.id === selectedArtifactId) ??
    artifacts[0];
  const checklistEntries = Object.entries(model.checklist) as Array<
    [DeliveryChecklistKey, boolean]
  >;
  const passedChecklistCount = checklistEntries.filter(([, value]) => value)
    .length;
  const selectedTone = selectedArtifact?.tone ?? "neutral";

  return (
    <section className="delivery-readiness-workspace">
      <section
        className="read-model-metrics delivery-readiness-metrics"
        aria-label={`${viewModel.title} 指标面板`}
      >
        {viewModel.metrics.map((metric) => (
          <article
            className={`read-model-metric read-model-tone-${metric.tone}`}
            key={metric.label}
          >
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            <small>{metric.detail}</small>
          </article>
        ))}
      </section>

      <section className="delivery-readiness-console" aria-label="交付就绪工作台">
        <header className="delivery-readiness-summary">
          <div>
            <p className="eyebrow">Delivery Outbox</p>
            <strong>{model.deliveryId}</strong>
            <span>
              {formatStatus(model.status)} / 到期{" "}
              {formatShortDateTime(model.expiresAt)}
            </span>
          </div>
          <div className="delivery-readiness-summary-stats">
            <span>
              <b>{model.itemCount}</b>
              交付项
            </span>
            <span>
              <b>{passedChecklistCount}</b>
              检查通过
            </span>
            <span>
              <b>{model.blockers.length}</b>
              阻断项
            </span>
          </div>
        </header>

        <div className="delivery-readiness-body">
          <section className="delivery-artifact-panel" aria-label="交付包内容">
            <div className="asset-panel-head">
              <div>
                <p className="eyebrow">Package Contents</p>
                <strong>交付清单与包状态</strong>
              </div>
              <span>{artifacts.length} 组</span>
            </div>
            <div className="delivery-artifact-list">
              {artifacts.map((artifact) => (
                <button
                  aria-pressed={artifact.id === selectedArtifact?.id}
                  className={`delivery-artifact-card read-model-tone-${artifact.tone}`}
                  key={artifact.id}
                  onClick={() => setSelectedArtifactId(artifact.id)}
                  type="button"
                >
                  <span>{artifact.label}</span>
                  <strong>{artifact.title}</strong>
                  <small>{artifact.detail}</small>
                  <i>{formatStatus(artifact.status)}</i>
                </button>
              ))}
            </div>
          </section>

          <section className="delivery-selected-panel" aria-label="选中交付项">
            {selectedArtifact ? (
              <>
                <div
                  className={`delivery-preview-visual read-model-tone-${selectedTone}`}
                >
                  <span>{formatStatus(selectedArtifact.status)}</span>
                  <strong>{selectedArtifact.label}</strong>
                  <small>{selectedArtifact.detail}</small>
                </div>
                <div className="delivery-selected-copy">
                  <p className="eyebrow">Selected Output</p>
                  <h2>{selectedArtifact.title}</h2>
                  <span>{selectedArtifact.detail}</span>
                  <span>
                    外部访问：{model.externalAccess.enabled ? "已启用" : "未启用"}
                  </span>
                </div>
                <div className="delivery-actions">
                  <button disabled type="button">
                    下载未开放
                  </button>
                  <button disabled type="button">
                    外部交付未启用
                  </button>
                </div>
              </>
            ) : (
              <p>暂无交付项可预览。</p>
            )}
          </section>
        </div>
      </section>

      <section className="delivery-detail-grid" aria-label="交付只读详情">
        {checklistEntries.map(([key, value]) => (
          <article
            className={`read-model-detail read-model-tone-${
              value ? "good" : "danger"
            }`}
            key={key}
          >
            <span>就绪检查</span>
            <strong>{deliveryChecklistLabels[key]}</strong>
            <small>{value ? "已满足要求" : "仍需人工处理"}</small>
          </article>
        ))}
        <article
          className={`read-model-detail read-model-tone-${
            model.blockers.length > 0 ? "danger" : "good"
          }`}
        >
          <span>阻断项</span>
          <strong>
            {model.blockers[0]
              ? formatReason(model.blockers[0].code)
              : "暂无阻断"}
          </strong>
          <small>
            {model.blockers[0]
              ? formatReason(model.blockers[0].message)
              : "当前交付检查均已清除。"}
          </small>
        </article>
        <article className="read-model-detail read-model-tone-neutral">
          <span>外部访问</span>
          <strong>{model.externalAccess.enabled ? "已启用" : "未启用"}</strong>
          <small>{formatReason(model.externalAccess.reason)}</small>
        </article>
      </section>
    </section>
  );
}

export function AssetInboxPage({ params }: ReadModelPageProps) {
  const projectId = getParam(params, "projectId");
  const state = useBackendReadModel({
    enabled: Boolean(projectId),
    idleMessage: "请先选择 projectId 加载素材收件箱。",
    load: ({ baseUrl, options }) =>
      fetchAssetInboxReadModel(baseUrl, projectId, { limit: 24 }, options),
    mockData: projectId ? createMockAssetInbox(projectId) : undefined,
    deps: [projectId]
  });

  return (
    <ReadModelFrame
      activeRoute="asset-inbox"
      deck="只读场景：入库、绑定、文件元数据与最新质检状态。"
      eyebrow="v2 只读模型"
      params={params}
      title="素材收件箱"
    >
      <ReadModelStateNotice
        state={state}
        idleLabel="请先选择 projectId"
      />
      {state.data ? (
        <AssetInboxWorkspace
          model={state.data}
          viewModel={createAssetInboxViewModel(state.data)}
        />
      ) : null}
    </ReadModelFrame>
  );
}

export function QcRetouchQueuePage({ params }: ReadModelPageProps) {
  const projectId = getParam(params, "projectId");
  const state = useBackendReadModel({
    enabled: Boolean(projectId),
    idleMessage: "请先选择 projectId 加载质检 / 精修队列。",
    load: ({ baseUrl, options }) =>
      fetchQcRetouchQueueReadModel(baseUrl, projectId, { limit: 24 }, options),
    mockData: projectId ? createMockQcRetouchQueue(projectId) : undefined,
    deps: [projectId]
  });

  return (
    <ReadModelFrame
      activeRoute="qc-retouch"
      deck="只读场景：质检告警、精修状态、负责人与阻塞说明。"
      eyebrow="v2 只读模型"
      params={params}
      title="质检 / 精修队列"
    >
      <ReadModelStateNotice state={state} idleLabel="请先选择 projectId" />
      {state.data ? (
        <QcRetouchWorkspace
          model={state.data}
          viewModel={createQcRetouchQueueViewModel(state.data)}
        />
      ) : null}
    </ReadModelFrame>
  );
}

export function ReviewGalleryPage({ params }: ReadModelPageProps) {
  const reviewSessionId = getParam(params, "reviewSessionId");
  const state = useBackendReadModel({
    enabled: Boolean(reviewSessionId),
    idleMessage: "请先选择 reviewSessionId 加载审核画廊。",
    load: ({ baseUrl, options }) =>
      fetchReviewGalleryReadModel(baseUrl, reviewSessionId, options),
    mockData: reviewSessionId
      ? createMockReviewGallery(reviewSessionId)
      : undefined,
    deps: [reviewSessionId]
  });

  return (
    <ReadModelFrame
      activeRoute="review-gallery"
      deck="只读场景：客户审核素材、评论与修订状态（外部访问仍禁用）。"
      eyebrow="v2 只读模型"
      params={params}
      title="审核画廊"
    >
      <ReadModelStateNotice
        state={state}
        idleLabel="请先选择 reviewSessionId"
      />
      {state.data ? (
        <ReviewGalleryWorkspace
          model={state.data}
          viewModel={createReviewGalleryViewModel(state.data)}
        />
      ) : null}
    </ReadModelFrame>
  );
}

export function DeliveryReadinessPage({ params }: ReadModelPageProps) {
  const deliveryId = getParam(params, "deliveryId");
  const state = useBackendReadModel({
    enabled: Boolean(deliveryId),
    idleMessage: "请先选择 deliveryId 加载交付就绪。",
    load: ({ baseUrl, options }) =>
      fetchDeliveryReadinessReadModel(baseUrl, deliveryId, options),
    mockData: deliveryId
      ? createMockDeliveryReadiness(deliveryId)
      : undefined,
    deps: [deliveryId]
  });

  return (
    <ReadModelFrame
      activeRoute="delivery-readiness"
      deck="只读场景：交付清单、就绪检查、阻断与外部访问边界。"
      eyebrow="v2 只读模型"
      params={params}
      title="交付就绪"
    >
      <ReadModelStateNotice state={state} idleLabel="请先选择 deliveryId" />
      {state.data ? (
        <DeliveryReadinessWorkspace
          model={state.data}
          viewModel={createDeliveryReadinessViewModel(state.data)}
        />
      ) : null}
    </ReadModelFrame>
  );
}
