export type WorkflowStatus =
  | "intake"
  | "shoot"
  | "retouch"
  | "review"
  | "delivery"
  | "complete";

export type RiskLevel = "low" | "medium" | "high" | "unknown";

export type ApprovalState = "waiting" | "blocked" | "cleared";

export type WorkflowStageState = "stable" | "active" | "watch";

export type ApprovalType = "review" | "delivery" | "qc" | "retouch";

export interface StudioSnapshot {
  name: string;
  locationLabel: string;
  modeLabel: string;
  operator: string;
  readinessPercent: number | null;
  activeProjectCount: number | null;
}

export interface CoverageSnapshot {
  skuCoveragePercent: number;
  completedSkus: number;
  totalSkus: number;
}

export interface QcSnapshot {
  qcHealthPercent: number;
  passed: number;
  flagged: number;
  pending: number;
}

export interface WorkflowStageSummary {
  id: string;
  label: string;
  status: WorkflowStatus;
  state: WorkflowStageState;
  count: number;
  detail: string;
}

export interface ProjectSummary {
  id: string;
  name: string;
  client: string | null;
  owner: string | null;
  status: WorkflowStatus;
  sourceStatus?: string;
  dueDate: string | null;
  skuCount: number | null;
  assetCount: number | null;
  reviewCount: number | null;
  deliveryCount: number | null;
  riskLevel: RiskLevel | null;
  completionPercent: number | null;
}

export interface SkuSummary {
  id: string;
  projectId: string | null;
  label: string;
  productLine: string;
  status: WorkflowStatus;
  heroAssetId: string | null;
  assetCount: number | null;
  reviewState: ApprovalState | null;
}

export interface AssetSummary {
  id: string;
  skuId: string | null;
  fileName: string;
  usage: "hero" | "gallery" | "detail" | "lifestyle" | null;
  inspectionScore: number | null;
  status: WorkflowStatus;
}

export interface ReviewSessionSummary {
  id: string;
  projectId: string | null;
  label: string;
  state: ApprovalState;
  reviewer: string | null;
  pendingItems: number;
}

export interface DeliveryPackageSummary {
  id: string;
  projectId: string | null;
  label: string;
  status: "draft" | "ready" | "sentinel";
  assetCount: number;
}

export interface ApprovalQueueItem {
  id: string;
  type: ApprovalType;
  title: string;
  projectId: string | null;
  state: ApprovalState;
  ageHours: number | null;
  priority?: string;
}

export interface RiskPulseItem {
  id: string;
  label: string;
  level: RiskLevel;
  signal: string;
}

export interface ActivityEvent {
  id: string;
  at: string;
  actor: string;
  summary: string;
}

export interface AiInspectionEvent {
  id: string;
  assetId: string;
  score: number;
  finding: string;
}

export interface CommandCenterSnapshot {
  generatedAt: string;
  studio: StudioSnapshot;
  coverage: CoverageSnapshot;
  qc: QcSnapshot;
  workflowStages: WorkflowStageSummary[];
  projects: ProjectSummary[];
  skus: SkuSummary[];
  assets: AssetSummary[];
  reviews: ReviewSessionSummary[];
  deliveries: DeliveryPackageSummary[];
  approvalQueue: ApprovalQueueItem[];
  riskPulse: RiskPulseItem[];
  activityTimeline: ActivityEvent[];
  aiInspectionFeed: AiInspectionEvent[];
}
