import { type ReactNode } from "react";
import { AppShell } from "../../components/layout/AppShell";
import {
  RuntimeChipList,
  type RuntimeChip
} from "../../components/panels/RuntimeChipList";
import type { AuthRuntimeView } from "../auth/useAuthState";
import {
  type BackendAssetInbox,
  type BackendDeliveryReadiness,
  type BackendQcRetouchQueue,
  type BackendReviewGallery,
  fetchAssetInboxReadModel,
  fetchDeliveryReadinessReadModel,
  fetchQcRetouchQueueReadModel,
  fetchReviewGalleryReadModel
} from "../../api/backendReadModels";
import type {
  BackendReadModelDataState,
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
  createMockEmptyAssetInbox,
  createMockEmptyDeliveryReadiness,
  createMockEmptyQcRetouchQueue,
  createMockEmptyReviewGallery,
  createMockPartialAssetInbox,
  createMockPartialDeliveryReadiness,
  createMockPartialQcRetouchQueue,
  createMockPartialReviewGallery,
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
  authRuntime: AuthRuntimeView;
}

type ReadModelDebugState =
  | "live"
  | "loading"
  | "error"
  | "missing-config"
  | "empty"
  | "partial"
  | "stale"
  | "forbidden"
  | "invalid-id";

interface ReadModelFrameProps {
  activeRoute: ReadModelRoute;
  children: ReactNode;
  eyebrow: string;
  title: string;
  deck: string;
  params: URLSearchParams;
  runtime: BackendReadModelRuntimeView;
  status: BackendReadModelState<unknown>["status"];
  authRuntime: AuthRuntimeView;
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
    debugState === "missing-config" ||
    debugState === "empty" ||
    debugState === "partial" ||
    debugState === "stale" ||
    debugState === "forbidden" ||
    debugState === "invalid-id"
  ) {
    return debugState;
  }

  return "live";
}

function selectDebugMock<T>(
  id: string | undefined,
  debugState: ReadModelDebugState,
  factories: {
    empty: (id: string) => T;
    partial: (id: string) => T;
    normal: (id: string) => T;
  }
): T | undefined {
  if (!id) return undefined;
  if (debugState === "empty") return factories.empty(id);
  if (debugState === "partial") return factories.partial(id);
  return factories.normal(id);
}

const staleThresholdMs = 5 * 60 * 1000;

function readyDataState(): BackendReadModelDataState {
  return {
    status: "ready",
    message: "只读模型已加载。",
    canRetry: true,
    transportLabel: "已连接"
  };
}

function backendDataState(
  status: BackendReadModelDataState["status"],
  message: string
): BackendReadModelDataState {
  const transportLabels = {
    ready: "已连接",
    empty: "数据为空",
    partial: "部分数据",
    stale: "数据过期"
  } satisfies Record<BackendReadModelDataState["status"], string>;

  return {
    status,
    message,
    canRetry: status === "ready" || status === "stale",
    transportLabel: transportLabels[status]
  };
}

function isGeneratedAtStale(generatedAt: string | undefined): boolean {
  if (!generatedAt) {
    return false;
  }

  const generatedAtTime = new Date(generatedAt).getTime();

  if (Number.isNaN(generatedAtTime)) {
    return false;
  }

  return Date.now() - generatedAtTime > staleThresholdMs;
}

function classifyAssetInboxData(
  model: BackendAssetInbox
): BackendReadModelDataState {
  if (isGeneratedAtStale(model.generatedAt)) {
    return backendDataState("stale", "素材收件箱数据可能已过期。");
  }

  if (model.total === 0 || model.items.length === 0) {
    return backendDataState("empty", "素材收件箱暂无素材数据。");
  }

  if (
    model.items.some(
      (item) => !item.latestQc || !item.sku || !item.shotRequirement
    )
  ) {
    return backendDataState("partial", "素材收件箱仅返回了部分绑定或 QC 数据。");
  }

  return readyDataState();
}

function classifyQcRetouchData(
  model: BackendQcRetouchQueue
): BackendReadModelDataState {
  if (isGeneratedAtStale(model.generatedAt)) {
    return backendDataState("stale", "质检 / 精修队列数据可能已过期。");
  }

  if (model.total === 0 || model.items.length === 0) {
    return backendDataState("empty", "质检 / 精修队列暂无素材版本。");
  }

  if (
    model.items.some(
      (item) =>
        !item.retouch ||
        Object.keys(item.qc.technicalResults).length === 0 ||
        Object.keys(item.qc.manualResults).length === 0
    )
  ) {
    return backendDataState("partial", "质检 / 精修队列仅返回了部分检查数据。");
  }

  return readyDataState();
}

function classifyReviewGalleryData(
  model: BackendReviewGallery
): BackendReadModelDataState {
  if (isGeneratedAtStale(model.generatedAt)) {
    return backendDataState("stale", "审核画廊数据可能已过期。");
  }

  if (model.items.length === 0) {
    return backendDataState("empty", "审核画廊暂无审核素材。");
  }

  if (!model.summary) {
    return backendDataState("partial", "审核画廊仅返回了部分汇总数据。");
  }

  return readyDataState();
}

function classifyDeliveryReadinessData(
  model: BackendDeliveryReadiness
): BackendReadModelDataState {
  if (isGeneratedAtStale(model.generatedAt)) {
    return backendDataState("stale", "交付就绪数据可能已过期。");
  }

  if (model.itemCount === 0 || !model.checklist.hasItems) {
    return backendDataState("empty", "交付包暂无交付素材。");
  }

  if (!model.packageKey || !model.manifestKey) {
    return backendDataState("partial", "交付就绪仅返回了部分交付包数据。");
  }

  return readyDataState();
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

  const shouldPreserveData =
    debugState === "empty" ||
    debugState === "partial" ||
    debugState === "stale";
  const baseState = {
    data: shouldPreserveData ? state.data : null,
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

  if (debugState === "empty") {
    return {
      ...baseState,
      status: "empty",
      message: `内部调试：${label} 只读模型返回空数据。`,
      errorMessage: null,
      canRetry: false
    };
  }

  if (debugState === "partial") {
    return {
      ...baseState,
      status: "partial",
      message: `内部调试：${label} 只读模型返回不完整数据。`,
      errorMessage: null,
      canRetry: false
    };
  }

  if (debugState === "stale") {
    return {
      ...baseState,
      status: "stale",
      message: `内部调试：${label} 数据已过期，需要刷新。`,
      errorMessage: null,
      canRetry: true
    };
  }

  if (debugState === "forbidden") {
    return {
      ...baseState,
      status: "forbidden",
      data: null,
      message: "内部调试：当前角色无权访问该只读模型。",
      errorMessage: `Simulated ${label} access denied`,
      canRetry: false
    };
  }

  if (debugState === "invalid-id") {
    return {
      ...baseState,
      status: "invalid-id",
      data: null,
      message: "内部调试：请求的 ID 未找到或不属于当前工作区。",
      errorMessage: `Simulated ${label} invalid context id`,
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
  status,
  authRuntime
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
          authRuntime={authRuntime}
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
  status,
  authRuntime
}: {
  params: URLSearchParams;
  runtime: BackendReadModelRuntimeView;
  status: BackendReadModelState<unknown>["status"];
  authRuntime: AuthRuntimeView;
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
    empty: "数据为空",
    partial: "部分数据",
    stale: "数据过期",
    forbidden: "权限不足",
    "invalid-id": "ID 无效",
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
      key: "auth-source",
      label: "认证源",
      value: authRuntime.sourceLabel,
      tone: authRuntime.source
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
    empty: "该视图暂无数据",
    partial: "该视图仅加载了部分数据",
    stale: "数据可能已过期",
    forbidden: "无权访问该只读模型",
    "invalid-id": "请求的 ID 无效或未找到",
    error: "只读模型不可用"
  } satisfies Record<Exclude<typeof state.status, "ready">, string>;
  const statusLabelByStatus = {
    "missing-config": "后端未配置",
    idle: "等待上下文",
    loading: "读取中",
    empty: "数据为空",
    partial: "部分数据",
    stale: "数据过期",
    forbidden: "权限不足",
    "invalid-id": "ID 无效",
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

export function AssetInboxPage({ params, authRuntime }: ReadModelPageProps) {
  const projectId = getParam(params, "projectId");
  const debugState = getReadModelDebugState(params);
  const mockData = selectDebugMock(projectId, debugState, {
    empty: createMockEmptyAssetInbox,
    partial: createMockPartialAssetInbox,
    normal: createMockAssetInbox
  });
  const baseState = useBackendReadModel({
    enabled: Boolean(projectId),
    idleMessage: "请先选择 projectId 加载素材收件箱。",
    load: ({ baseUrl, options }) =>
      fetchAssetInboxReadModel(baseUrl, projectId, { limit: 24 }, options),
    mockData,
    classifyData: classifyAssetInboxData,
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
      authRuntime={authRuntime}
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

export function QcRetouchQueuePage({ params, authRuntime }: ReadModelPageProps) {
  const projectId = getParam(params, "projectId");
  const debugState = getReadModelDebugState(params);
  const mockData = selectDebugMock(projectId, debugState, {
    empty: createMockEmptyQcRetouchQueue,
    partial: createMockPartialQcRetouchQueue,
    normal: createMockQcRetouchQueue
  });
  const baseState = useBackendReadModel({
    enabled: Boolean(projectId),
    idleMessage: "请先选择 projectId 加载质检 / 精修队列。",
    load: ({ baseUrl, options }) =>
      fetchQcRetouchQueueReadModel(baseUrl, projectId, { limit: 24 }, options),
    mockData,
    classifyData: classifyQcRetouchData,
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
      authRuntime={authRuntime}
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

export function ReviewGalleryPage({ params, authRuntime }: ReadModelPageProps) {
  const reviewSessionId = getParam(params, "reviewSessionId");
  const debugState = getReadModelDebugState(params);
  const mockData = selectDebugMock(reviewSessionId, debugState, {
    empty: createMockEmptyReviewGallery,
    partial: createMockPartialReviewGallery,
    normal: createMockReviewGallery
  });
  const baseState = useBackendReadModel({
    enabled: Boolean(reviewSessionId),
    idleMessage: "请先选择 reviewSessionId 加载审核画廊。",
    load: ({ baseUrl, options }) =>
      fetchReviewGalleryReadModel(baseUrl, reviewSessionId, options),
    mockData,
    classifyData: classifyReviewGalleryData,
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
      authRuntime={authRuntime}
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

export function DeliveryReadinessPage({ params, authRuntime }: ReadModelPageProps) {
  const deliveryId = getParam(params, "deliveryId");
  const debugState = getReadModelDebugState(params);
  const mockData = selectDebugMock(deliveryId, debugState, {
    empty: createMockEmptyDeliveryReadiness,
    partial: createMockPartialDeliveryReadiness,
    normal: createMockDeliveryReadiness
  });
  const baseState = useBackendReadModel({
    enabled: Boolean(deliveryId),
    idleMessage: "请先选择 deliveryId 加载交付就绪。",
    load: ({ baseUrl, options }) =>
      fetchDeliveryReadinessReadModel(baseUrl, deliveryId, options),
    mockData,
    classifyData: classifyDeliveryReadinessData,
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
      authRuntime={authRuntime}
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
