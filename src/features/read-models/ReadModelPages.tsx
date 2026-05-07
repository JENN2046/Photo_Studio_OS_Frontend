import { useMemo, useState, type ReactNode } from "react";
import { AppShell } from "../../components/layout/AppShell";
import {
  fetchAssetInboxReadModel,
  fetchDeliveryReadinessReadModel,
  fetchQcRetouchQueueReadModel,
  fetchReviewGalleryReadModel
} from "../../api/backendReadModels";
import type { BackendAssetInbox } from "../../api/backendReadModels";
import type { BackendReadModelState } from "./useBackendReadModel";
import { useBackendReadModel } from "./useBackendReadModel";
import {
  createAssetInboxViewModel,
  createDeliveryReadinessViewModel,
  createQcRetouchQueueViewModel,
  createReviewGalleryViewModel,
  formatBytes,
  formatReason,
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

function assetShotLabel(asset: AssetInboxItem): string {
  return asset.shotRequirement
    ? `${asset.shotRequirement.shotTypeCode} / ${formatStatus(
        asset.shotRequirement.status
      )}`
    : "镜头需求待绑定";
}

function assetSkuLabel(asset: AssetInboxItem): string {
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
        <ReadModelDashboard
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
        <ReadModelDashboard
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
        <ReadModelDashboard
          viewModel={createDeliveryReadinessViewModel(state.data)}
        />
      ) : null}
    </ReadModelFrame>
  );
}
