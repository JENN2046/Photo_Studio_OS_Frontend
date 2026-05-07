import { type ReactNode } from "react";
import { AppShell } from "../../components/layout/AppShell";
import {
  RuntimeChipList,
  type RuntimeChip
} from "../../components/panels/RuntimeChipList";
import {
  fetchAssetInboxReadModel,
  fetchDeliveryReadinessReadModel,
  fetchQcRetouchQueueReadModel,
  fetchReviewGalleryReadModel
} from "../../api/backendReadModels";
import type {
  BackendReadModelRuntimeView,
  BackendReadModelState
} from "./useBackendReadModel";
import { useBackendReadModel } from "./useBackendReadModel";
import {
  createAssetInboxViewModel,
  createDeliveryReadinessViewModel,
  createQcRetouchQueueViewModel,
  createReviewGalleryViewModel
} from "./readModelViewModels";
import {
  AssetInboxWorkspace,
  DeliveryReadinessWorkspace,
  QcRetouchWorkspace,
  ReviewGalleryWorkspace
} from "./readModelWorkspaces";
import {
  createMockAssetInbox,
  createMockDeliveryReadiness,
  createMockQcRetouchQueue,
  createMockReviewGallery
} from "./readModelMocks";
import {
  getReadModelSharedQuery,
  readModelRouteIds,
  readModelRouteLabels,
  type ReadModelRoute
} from "./readModelRoutes";
import "./readModelPages.css";

export interface ReadModelPageProps {
  params: URLSearchParams;
}

type ReadModelDebugState = "live" | "loading" | "error" | "missing-config";

interface ReadModelFrameProps {
  activeRoute: ReadModelRoute;
  children: ReactNode;
  eyebrow: string;
  title: string;
  deck: string;
  params: URLSearchParams;
  runtime: BackendReadModelRuntimeView;
  status: BackendReadModelState<unknown>["status"];
}

function getParam(params: URLSearchParams, key: string): string {
  return params.get(key)?.trim() ?? "";
}

function getReadModelDebugState(params: URLSearchParams): ReadModelDebugState {
  if (!import.meta.env.DEV) {
    return "live";
  }

  const debugState = getParam(params, "readModelState");

  if (
    debugState === "loading" ||
    debugState === "error" ||
    debugState === "missing-config"
  ) {
    return debugState;
  }

  return "live";
}

function applyReadModelDebugState<T>({
  label,
  params,
  state
}: {
  label: string;
  params: URLSearchParams;
  state: BackendReadModelState<T>;
}): BackendReadModelState<T> {
  const debugState = getReadModelDebugState(params);

  if (debugState === "live") {
    return state;
  }

  const baseState = {
    data: null,
    runtime: {
      source: "debug",
      sourceLabel: "DEV 调试",
      transportLabel: `${label} 边界态演练`,
      boundaryLabel: "mock-first / read-only"
    },
    retry: state.retry
  } satisfies Pick<BackendReadModelState<T>, "data" | "retry" | "runtime">;

  if (debugState === "loading") {
    return {
      ...baseState,
      status: "loading",
      message: `内部调试：${label} 只读模型保持加载态。`,
      errorMessage: null,
      canRetry: false
    };
  }

  if (debugState === "missing-config") {
    return {
      ...baseState,
      status: "missing-config",
      message: "内部调试：模拟后端只读模型未配置。",
      errorMessage: null,
      canRetry: false
    };
  }

  return {
    ...baseState,
    status: "error",
    message: "内部调试：只读模型请求失败。",
    errorMessage: `Simulated ${label} read-model boundary fault`,
    canRetry: true
  };
}

function ReadModelFrame({
  activeRoute,
  children,
  eyebrow,
  title,
  deck,
  params,
  runtime,
  status
}: ReadModelFrameProps) {
  const sharedQuery = getReadModelSharedQuery(params);

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
            {readModelRouteIds.map((route) => (
              <a
                aria-current={route === activeRoute ? "page" : undefined}
                href={`#${route}${sharedQuery}`}
                key={route}
              >
                {readModelRouteLabels[route]}
              </a>
            ))}
          </nav>
        </section>
        <ReadModelContextBar
          params={params}
          runtime={runtime}
          status={status}
        />
        {children}
      </main>
    </AppShell>
  );
}

function ReadModelContextBar({
  params,
  runtime,
  status
}: {
  params: URLSearchParams;
  runtime: BackendReadModelRuntimeView;
  status: BackendReadModelState<unknown>["status"];
}) {
  const projectId = getParam(params, "projectId");
  const reviewSessionId = getParam(params, "reviewSessionId");
  const deliveryId = getParam(params, "deliveryId");
  const contextItems = [
    { label: "项目", value: projectId },
    { label: "审核会话", value: reviewSessionId },
    { label: "交付包", value: deliveryId }
  ].filter((item) => item.value);
  const statusLabels: Record<typeof status, string> = {
    "missing-config": "后端未配置",
    idle: "等待上下文",
    loading: "读取中",
    ready: "已就绪",
    error: "读取失败"
  };
  const chips: RuntimeChip[] = [
    ...(contextItems.length > 0
      ? contextItems.map((item) => ({
          key: item.label,
          label: item.label,
          value: item.value
        }))
      : [
          {
            key: "context",
            label: "上下文",
            value: "等待选择生产对象"
          }
        ]),
    {
      key: "source",
      label: "读取源",
      value: runtime.sourceLabel
    },
    {
      key: "status",
      label: "运行状态",
      value: statusLabels[status],
      tone: runtime.source
    },
    {
      key: "transport",
      label: "传输",
      value: runtime.transportLabel
    },
    {
      key: "boundary",
      label: "写入边界",
      value: runtime.boundaryLabel,
      tone: "readonly"
    }
  ];

  return (
    <section className="read-model-context-bar" aria-label="生产链路上下文">
      <div>
        <RuntimeChipList chips={chips} />
      </div>
      <a href="#">返回命令中心</a>
    </section>
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
  const statusLabelByStatus = {
    "missing-config": "后端未配置",
    idle: "等待上下文",
    loading: "读取中",
    error: "读取失败"
  } satisfies Record<Exclude<typeof state.status, "ready">, string>;

  return (
    <section
      className={`read-model-state read-model-state-${state.status}`}
      role={state.status === "error" ? "alert" : "status"}
    >
      <div>
        <strong>{titleByStatus[state.status]}</strong>
        <span>{state.errorMessage ?? state.message}</span>
        <small>
          状态 / {statusLabelByStatus[state.status]} · mock-first / read-only
        </small>
      </div>
      {state.canRetry ? (
        <button onClick={state.retry} type="button">
          重试
        </button>
      ) : null}
    </section>
  );
}

export function AssetInboxPage({ params }: ReadModelPageProps) {
  const projectId = getParam(params, "projectId");
  const baseState = useBackendReadModel({
    enabled: Boolean(projectId),
    idleMessage: "请先选择 projectId 加载素材收件箱。",
    load: ({ baseUrl, options }) =>
      fetchAssetInboxReadModel(baseUrl, projectId, { limit: 24 }, options),
    mockData: projectId ? createMockAssetInbox(projectId) : undefined,
    deps: [projectId]
  });
  const state = applyReadModelDebugState({
    label: "Asset Inbox",
    params,
    state: baseState
  });

  return (
    <ReadModelFrame
      activeRoute="asset-inbox"
      deck="只读场景：入库、绑定、文件元数据与最新质检状态。"
      eyebrow="v2 只读模型"
      params={params}
      runtime={state.runtime}
      status={state.status}
      title="素材收件箱"
    >
      <ReadModelStateNotice state={state} idleLabel="请先选择 projectId" />
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
  const baseState = useBackendReadModel({
    enabled: Boolean(projectId),
    idleMessage: "请先选择 projectId 加载质检 / 精修队列。",
    load: ({ baseUrl, options }) =>
      fetchQcRetouchQueueReadModel(baseUrl, projectId, { limit: 24 }, options),
    mockData: projectId ? createMockQcRetouchQueue(projectId) : undefined,
    deps: [projectId]
  });
  const state = applyReadModelDebugState({
    label: "QC / Retouch",
    params,
    state: baseState
  });

  return (
    <ReadModelFrame
      activeRoute="qc-retouch"
      deck="只读场景：质检告警、精修状态、负责人与阻塞说明。"
      eyebrow="v2 只读模型"
      params={params}
      runtime={state.runtime}
      status={state.status}
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
  const baseState = useBackendReadModel({
    enabled: Boolean(reviewSessionId),
    idleMessage: "请先选择 reviewSessionId 加载审核画廊。",
    load: ({ baseUrl, options }) =>
      fetchReviewGalleryReadModel(baseUrl, reviewSessionId, options),
    mockData: reviewSessionId
      ? createMockReviewGallery(reviewSessionId)
      : undefined,
    deps: [reviewSessionId]
  });
  const state = applyReadModelDebugState({
    label: "Review Gallery",
    params,
    state: baseState
  });

  return (
    <ReadModelFrame
      activeRoute="review-gallery"
      deck="只读场景：客户审核素材、评论与修订状态（外部访问仍禁用）。"
      eyebrow="v2 只读模型"
      params={params}
      runtime={state.runtime}
      status={state.status}
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
  const baseState = useBackendReadModel({
    enabled: Boolean(deliveryId),
    idleMessage: "请先选择 deliveryId 加载交付就绪。",
    load: ({ baseUrl, options }) =>
      fetchDeliveryReadinessReadModel(baseUrl, deliveryId, options),
    mockData: deliveryId
      ? createMockDeliveryReadiness(deliveryId)
      : undefined,
    deps: [deliveryId]
  });
  const state = applyReadModelDebugState({
    label: "Delivery Readiness",
    params,
    state: baseState
  });

  return (
    <ReadModelFrame
      activeRoute="delivery-readiness"
      deck="只读场景：交付清单、就绪检查、阻断与外部访问边界。"
      eyebrow="v2 只读模型"
      params={params}
      runtime={state.runtime}
      status={state.status}
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
