import type {
  ApprovalState,
  ApprovalType,
  CommandCenterSnapshot,
  DeliveryPackageSummary,
  RiskLevel,
  WorkflowStageState,
  WorkflowStatus
} from "./types";

export class ReadModelHttpError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number
  ) {
    super(message);
    this.name = "ReadModelHttpError";
  }
}

interface ApiEnvelope<T> {
  data: T;
  meta?: {
    requestId?: string;
  };
}

export interface BackendReadModelRequestOptions {
  headers?: HeadersInit;
}

export interface BackendCommandCenterV2 {
  generatedAt: string;
  studio: {
    organizationId: string;
    name: string;
    timezone: string;
    mode: string;
  };
  coverage: {
    skuCoveragePercent: number;
    completedSkus: number;
    totalSkus: number;
    missingShotCount: number;
  };
  qc: {
    qcHealthPercent: number;
    passed: number;
    warning: number;
    failed: number;
    pendingAssets: number;
  };
  workflowStages: Array<{
    id: string;
    labelKey: string;
    status: string;
    count: number;
    riskLevel: string;
  }>;
  riskPulse: Array<{
    id: string;
    type: string;
    severity: string;
    titleKey: string;
    count: number;
    consequence: string;
    href: string;
  }>;
  approvalQueue: Array<{
    id: string;
    kind: string;
    titleKey: string;
    subtitle: string;
    priority: string;
    href: string;
    readOnly: boolean;
  }>;
  activityTimeline: Array<{
    id: string;
    at: string;
    actorName?: string;
    action: string;
    entityType: string;
    entityId?: string;
    summary: string;
  }>;
  previews: {
    projects: Array<{ id: string; name: string; status: string }>;
    skus: Array<{ id: string; code: string; name: string; status: string }>;
    assets: Array<{
      id: string;
      originalFilename?: string;
      thumbnailKey?: string;
      status: string;
    }>;
    reviews: Array<{
      id: string;
      title: string;
      status: string;
      pendingCount: number;
    }>;
    deliveries: Array<{ id: string; status: string; itemCount: number }>;
  };
}

export type BackendAssetStatus =
  | "uploaded"
  | "unmatched"
  | "matched"
  | "selected"
  | "retouching"
  | "retouched"
  | "qc_pending"
  | "qc_failed"
  | "qc_passed"
  | "client_pending"
  | "client_approved"
  | "final_exported"
  | "delivered"
  | "archived"
  | "deleted";

export type BackendQcStatus = "passed" | "failed" | "warning";

export type BackendRetouchTaskStatus =
  | "to_assign"
  | "assigned"
  | "in_progress"
  | "internal_review"
  | "revision"
  | "done"
  | "canceled";

export type BackendReviewSessionStatus = "draft" | "published" | "closed";

export type BackendReviewItemStatus =
  | "pending"
  | "approved"
  | "revision_requested"
  | "withdrawn";

export type BackendDeliveryStatus =
  | "preparing"
  | "ready"
  | "delivered"
  | "expired"
  | "failed"
  | "canceled";

export interface BackendSkuReference {
  id: string;
  code: string;
  name: string;
}

export interface BackendShotRequirementReference {
  id: string;
  shotTypeCode: string;
  status: string;
}

export interface BackendAssetInboxQuery {
  page?: number;
  limit?: number;
  status?: BackendAssetStatus;
  skuId?: string;
  shotRequirementId?: string;
  search?: string;
}

export interface BackendAssetInbox {
  generatedAt?: string;
  projectId: string;
  page: number;
  limit: number;
  total: number;
  intake: {
    source: "capture_one_placeholder" | "backend_upload_placeholder";
    status: "not_configured" | "ready" | "warning";
    message: string;
  };
  selectedAssetId?: string;
  items: Array<{
    assetId: string;
    projectId: string;
    status: BackendAssetStatus;
    sku?: BackendSkuReference;
    shotRequirement?: BackendShotRequirementReference;
    file: {
      originalFilename?: string;
      fileExt?: string;
      mimeType?: string;
      fileSizeBytes?: string;
      width?: number;
      height?: number;
      colorSpace?: string;
    };
    keys: {
      thumbnailKey?: string;
      previewKey?: string;
    };
    binding: {
      status: "bound" | "unbound" | "ambiguous";
      matchStatus?: "matched" | "ambiguous" | "failed" | "manually_resolved";
      confidence?: number;
      reason?: string;
    };
    latestQc?: {
      status?: BackendQcStatus;
      failedReasons?: string[];
      notes?: string;
    };
  }>;
}

export interface BackendQcRetouchQueueQuery {
  page?: number;
  limit?: number;
  qcStatus?: BackendQcStatus;
  retouchStatus?: BackendRetouchTaskStatus;
}

export interface BackendQcRetouchQueue {
  generatedAt?: string;
  projectId: string;
  page: number;
  limit: number;
  total: number;
  items: Array<{
    assetId: string;
    assetVersionId?: string;
    previewKey?: string;
    sku?: BackendSkuReference;
    shotRequirement?: BackendShotRequirementReference;
    qc: {
      latestStatus?: BackendQcStatus;
      failedReasons: string[];
      technicalResults: Record<string, unknown>;
      manualResults: Record<string, unknown>;
      nextAction?: "none" | "send_back_to_retouch" | "mark_for_reshoot";
    };
    retouch?: {
      taskId: string;
      status: BackendRetouchTaskStatus;
      assignedTo?: string;
      instructions?: string;
      complexity: "low" | "normal" | "high";
      dueAt?: string;
      revisionCount: number;
    };
  }>;
}

export interface BackendReviewGallery {
  generatedAt?: string;
  reviewSessionId: string;
  title?: string;
  status: BackendReviewSessionStatus;
  expiresAt?: string;
  items: Array<{
    reviewItemId: string;
    assetId: string;
    previewKey?: string;
    sku?: BackendSkuReference;
    shotRequirement?: BackendShotRequirementReference;
    status: BackendReviewItemStatus;
    clientComment?: string;
    issueType?: string;
    reviewedAt?: string;
  }>;
  summary?: {
    pending?: number;
    approved?: number;
    revisionRequested?: number;
    withdrawn?: number;
  };
  publicAccess: {
    enabled: false;
    reason: "storage_auth_and_public_review_not_approved";
  };
}

export interface BackendDeliveryReadiness {
  generatedAt?: string;
  deliveryId: string;
  status: BackendDeliveryStatus;
  packageKey?: string;
  manifestKey?: string;
  expiresAt?: string;
  itemCount: number;
  checklist: {
    hasItems: boolean;
    hasPackageKey: boolean;
    hasManifestKey: boolean;
    allItemsHaveFileKey: boolean;
  };
  blockers: Array<{
    code: string;
    message: string;
  }>;
  externalAccess: {
    enabled: false;
    reason: "storage_auth_and_public_delivery_not_approved";
  };
}

const stageLabels: Record<string, string> = {
  "stage.intake": "客户接入",
  "stage.shoot": "拍摄",
  "stage.asset_intake": "素材入库",
  "stage.retouch": "精修",
  "stage.qc": "质检",
  "stage.review": "客户审核",
  "stage.delivery": "交付"
};

const approvalTypeByKind: Record<string, ApprovalType> = {
  qc_pending: "qc",
  client_review_pending: "review",
  delivery_ready: "delivery"
};

export async function fetchCommandCenterV2Snapshot(
  baseUrl: string,
  headers: HeadersInit = {}
): Promise<CommandCenterSnapshot> {
  return mapCommandCenterV2(
    await fetchReadModel<BackendCommandCenterV2>(
      baseUrl,
      "/command-center/v2",
      { headers }
    )
  );
}

export async function fetchAssetInboxReadModel(
  baseUrl: string,
  projectId: string,
  query: BackendAssetInboxQuery = {},
  options: BackendReadModelRequestOptions = {}
): Promise<BackendAssetInbox> {
  return fetchReadModel(
    baseUrl,
    `/projects/${encodeURIComponent(projectId)}/asset-inbox`,
    options,
    query
  );
}

export async function fetchQcRetouchQueueReadModel(
  baseUrl: string,
  projectId: string,
  query: BackendQcRetouchQueueQuery = {},
  options: BackendReadModelRequestOptions = {}
): Promise<BackendQcRetouchQueue> {
  return fetchReadModel(
    baseUrl,
    `/projects/${encodeURIComponent(projectId)}/qc-retouch-queue`,
    options,
    query
  );
}

export async function fetchReviewGalleryReadModel(
  baseUrl: string,
  reviewSessionId: string,
  options: BackendReadModelRequestOptions = {}
): Promise<BackendReviewGallery> {
  return fetchReadModel(
    baseUrl,
    `/review-sessions/${encodeURIComponent(reviewSessionId)}/gallery`,
    options
  );
}

export async function fetchDeliveryReadinessReadModel(
  baseUrl: string,
  deliveryId: string,
  options: BackendReadModelRequestOptions = {}
): Promise<BackendDeliveryReadiness> {
  return fetchReadModel(
    baseUrl,
    `/deliveries/${encodeURIComponent(deliveryId)}/readiness`,
    options
  );
}

async function fetchReadModel<T>(
  baseUrl: string,
  path: string,
  options: BackendReadModelRequestOptions = {},
  query: object = {}
): Promise<T> {
  const response = await fetch(createReadModelUrl(baseUrl, path, query), {
    headers: options.headers
  });

  if (!response.ok) {
    throw new ReadModelHttpError(
      `Frontend v2 read-model request failed: ${response.status}`,
      response.status
    );
  }

  let envelope: ApiEnvelope<T>;
  try {
    envelope = (await response.json()) as ApiEnvelope<T>;
  } catch {
    throw new ReadModelHttpError(
      "Frontend v2 read-model response could not be parsed",
      0
    );
  }

  if (!envelope || typeof envelope !== "object" || !("data" in envelope)) {
    throw new ReadModelHttpError(
      "Frontend v2 read-model response did not include a data envelope",
      0
    );
  }

  return envelope.data;
}

function createReadModelUrl(
  baseUrl: string,
  path: string,
  query: object
): string {
  const searchParams = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (typeof value === "string" || typeof value === "number") {
      searchParams.set(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  return `${baseUrl.replace(/\/$/, "")}${path}${
    queryString ? `?${queryString}` : ""
  }`;
}

function mapCommandCenterV2(source: BackendCommandCenterV2): CommandCenterSnapshot {
  const firstAssetId = source.previews.assets[0]?.id ?? "backend-v2";
  const readinessPercent = Math.round(
    (source.coverage.skuCoveragePercent * 0.45 +
      source.qc.qcHealthPercent * 0.45 +
      (source.approvalQueue.length === 0 ? 10 : 0)) *
      10
  ) / 10;

  return {
    generatedAt: source.generatedAt,
    studio: {
      name: source.studio.name,
      locationLabel: source.studio.timezone,
      modeLabel: source.studio.mode === "read_only" ? "只读后端 v2" : source.studio.mode,
      operator: source.studio.organizationId,
      readinessPercent,
      activeProjectCount: source.previews.projects.length
    },
    coverage: {
      skuCoveragePercent: source.coverage.skuCoveragePercent,
      completedSkus: source.coverage.completedSkus,
      totalSkus: source.coverage.totalSkus
    },
    qc: {
      qcHealthPercent: source.qc.qcHealthPercent,
      passed: source.qc.passed,
      flagged: source.qc.warning + source.qc.failed,
      pending: source.qc.pendingAssets
    },
    workflowStages: source.workflowStages.map((stage) => ({
      id: stage.id,
      label: stageLabels[stage.labelKey] ?? stage.labelKey,
      status: workflowStatusFromStage(stage.id),
      state: workflowStageState(stage.status),
      count: stage.count,
      detail: `风险等级 ${riskLevel(stage.riskLevel)}`
    })),
    projects: source.previews.projects.map((project) => ({
      id: project.id,
      name: project.name,
      client: "后端项目",
      owner: source.studio.name,
      status: workflowStatus(project.status),
      dueDate: "待设置",
      skuCount: source.coverage.totalSkus,
      assetCount: source.previews.assets.length,
      reviewCount: source.previews.reviews.length,
      deliveryCount: source.previews.deliveries.length,
      riskLevel: source.riskPulse.length > 0 ? "medium" : "low",
      completionPercent: Math.round(source.coverage.skuCoveragePercent)
    })),
    skus: source.previews.skus.map((sku) => ({
      id: sku.id,
      projectId: source.previews.projects[0]?.id ?? "",
      label: sku.name,
      productLine: sku.code,
      status: workflowStatus(sku.status),
      heroAssetId: firstAssetId,
      assetCount: source.previews.assets.length,
      reviewState: approvalStateFromWorkflow(sku.status)
    })),
    assets: source.previews.assets.map((asset) => ({
      id: asset.id,
      skuId: source.previews.skus[0]?.id ?? "",
      fileName: asset.originalFilename ?? asset.id,
      usage: "hero",
      inspectionScore: inspectionScore(asset.status),
      status: workflowStatus(asset.status)
    })),
    reviews: source.previews.reviews.map((review) => ({
      id: review.id,
      projectId: source.previews.projects[0]?.id ?? "",
      label: review.title,
      state: review.pendingCount > 0 ? "waiting" : "cleared",
      reviewer: "客户审核",
      pendingItems: review.pendingCount
    })),
    deliveries: source.previews.deliveries.map((delivery) => ({
      id: delivery.id,
      projectId: source.previews.projects[0]?.id ?? "",
      label: `交付包 ${delivery.id.slice(0, 8)}`,
      status: deliveryStatus(delivery.status),
      assetCount: delivery.itemCount
    })),
    approvalQueue: source.approvalQueue.map((item) => ({
      id: item.id,
      type: approvalTypeByKind[item.kind] ?? "review",
      title: item.subtitle,
      projectId: item.href,
      state: item.priority === "high" ? "blocked" : "waiting",
      ageHours: 0
    })),
    riskPulse: source.riskPulse.map((risk) => ({
      id: risk.id,
      label: risk.consequence,
      level: riskLevel(risk.severity),
      signal: String(risk.count)
    })),
    activityTimeline: source.activityTimeline.map((event) => ({
      id: event.id,
      at: formatActivityTime(event.at),
      actor: event.actorName ?? event.entityType,
      summary: event.summary
    })),
    aiInspectionFeed: source.riskPulse.map((risk) => ({
      id: `agent-${risk.id}`,
      assetId: risk.href,
      score: risk.severity === "high" ? 72 : risk.severity === "medium" ? 84 : 94,
      finding: risk.consequence
    }))
  };
}

function workflowStatusFromStage(stageId: string): WorkflowStatus {
  if (stageId.includes("shoot")) return "shoot";
  if (stageId.includes("retouch") || stageId.includes("qc")) return "retouch";
  if (stageId.includes("review")) return "review";
  if (stageId.includes("delivery")) return "delivery";
  return "intake";
}

function workflowStatus(value: string): WorkflowStatus {
  if (value.includes("complete") || value.includes("approved")) return "complete";
  if (value.includes("shoot") || value.includes("captured")) return "shoot";
  if (value.includes("retouch") || value.includes("qc")) return "retouch";
  if (value.includes("review") || value.includes("client")) return "review";
  if (value.includes("deliver") || value.includes("export")) return "delivery";
  return "intake";
}

function workflowStageState(value: string): WorkflowStageState {
  if (value === "watch") return "watch";
  if (value === "active") return "active";
  return "stable";
}

function riskLevel(value: string): RiskLevel {
  if (value === "high" || value === "critical") return "high";
  if (value === "medium") return "medium";
  return "low";
}

function approvalStateFromWorkflow(value: string): ApprovalState {
  if (value.includes("failed") || value.includes("revision")) return "blocked";
  if (value.includes("pending") || value.includes("review")) return "waiting";
  return "cleared";
}

function deliveryStatus(value: string): DeliveryPackageSummary["status"] {
  if (value === "ready" || value === "delivered") return "ready";
  if (value === "preparing") return "draft";
  return "sentinel";
}

function inspectionScore(value: string): number {
  if (value.includes("failed")) return 72;
  if (value.includes("pending") || value.includes("retouch")) return 84;
  return 94;
}

function formatActivityTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return value;
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
