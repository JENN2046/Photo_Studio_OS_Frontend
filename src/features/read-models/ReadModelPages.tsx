import type { ReactNode } from "react";
import { AppShell } from "../../components/layout/AppShell";
import {
  fetchAssetInboxReadModel,
  fetchDeliveryReadinessReadModel,
  fetchQcRetouchQueueReadModel,
  fetchReviewGalleryReadModel
} from "../../api/backendReadModels";
import type { BackendReadModelState } from "./useBackendReadModel";
import { useBackendReadModel } from "./useBackendReadModel";
import {
  createAssetInboxViewModel,
  createDeliveryReadinessViewModel,
  createQcRetouchQueueViewModel,
  createReviewGalleryViewModel,
  type ReadModelViewModel
} from "./readModelViewModels";
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

const routeLabels: Record<ReadModelRoute, string> = {
  "asset-inbox": "Asset Inbox",
  "qc-retouch": "QC / Retouch",
  "review-gallery": "Review Gallery",
  "delivery-readiness": "Delivery Readiness"
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
          <nav className="read-model-tabs" aria-label="Read model surfaces">
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
    "missing-config": "Backend read model not configured",
    idle: idleLabel,
    loading: "Loading read model",
    error: "Read model unavailable"
  } satisfies Record<Exclude<typeof state.status, "ready">, string>;

  return (
    <section className={`read-model-state read-model-state-${state.status}`}>
      <div>
        <strong>{titleByStatus[state.status]}</strong>
        <span>{state.errorMessage ?? state.message}</span>
      </div>
      {state.canRetry ? (
        <button onClick={state.retry} type="button">
          Retry
        </button>
      ) : null}
    </section>
  );
}

function ReadModelDashboard({ viewModel }: { viewModel: ReadModelViewModel }) {
  return (
    <section className="read-model-grid">
      <section className="read-model-metrics" aria-label={`${viewModel.title} metrics`}>
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

      <section className="read-model-table" aria-label={`${viewModel.title} rows`}>
        <div className="read-model-table-head">
          <div>
            <p className="eyebrow">{viewModel.title}</p>
            <strong>{viewModel.subtitle}</strong>
          </div>
          <span>{viewModel.rows.length} rows</span>
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
    </section>
  );
}

export function AssetInboxPage({ params }: ReadModelPageProps) {
  const projectId = getParam(params, "projectId");
  const state = useBackendReadModel({
    enabled: Boolean(projectId),
    idleMessage: "Select a projectId to load Asset Inbox.",
    load: ({ baseUrl, options }) =>
      fetchAssetInboxReadModel(baseUrl, projectId, { limit: 24 }, options),
    deps: [projectId]
  });

  return (
    <ReadModelFrame
      activeRoute="asset-inbox"
      deck="Read-only intake, binding, file metadata, and latest QC state."
      eyebrow="Backend v2 Read Model"
      params={params}
      title="Asset Inbox"
    >
      <ReadModelStateNotice state={state} idleLabel="Project not selected" />
      {state.data ? (
        <ReadModelDashboard
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
    idleMessage: "Select a projectId to load QC / Retouch Queue.",
    load: ({ baseUrl, options }) =>
      fetchQcRetouchQueueReadModel(baseUrl, projectId, { limit: 24 }, options),
    deps: [projectId]
  });

  return (
    <ReadModelFrame
      activeRoute="qc-retouch"
      deck="Read-only QC findings, retouch task posture, assignment, and blocker context."
      eyebrow="Backend v2 Read Model"
      params={params}
      title="QC / Retouch Queue"
    >
      <ReadModelStateNotice state={state} idleLabel="Project not selected" />
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
    idleMessage: "Select a reviewSessionId to load Review Gallery.",
    load: ({ baseUrl, options }) =>
      fetchReviewGalleryReadModel(baseUrl, reviewSessionId, options),
    deps: [reviewSessionId]
  });

  return (
    <ReadModelFrame
      activeRoute="review-gallery"
      deck="Read-only client review gallery state with public access still disabled."
      eyebrow="Backend v2 Read Model"
      params={params}
      title="Review Gallery"
    >
      <ReadModelStateNotice
        state={state}
        idleLabel="Review session not selected"
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
    idleMessage: "Select a deliveryId to load Delivery Readiness.",
    load: ({ baseUrl, options }) =>
      fetchDeliveryReadinessReadModel(baseUrl, deliveryId, options),
    deps: [deliveryId]
  });

  return (
    <ReadModelFrame
      activeRoute="delivery-readiness"
      deck="Read-only delivery checklist, package state, blockers, and external access boundary."
      eyebrow="Backend v2 Read Model"
      params={params}
      title="Delivery Readiness"
    >
      <ReadModelStateNotice state={state} idleLabel="Delivery not selected" />
      {state.data ? (
        <ReadModelDashboard
          viewModel={createDeliveryReadinessViewModel(state.data)}
        />
      ) : null}
    </ReadModelFrame>
  );
}
