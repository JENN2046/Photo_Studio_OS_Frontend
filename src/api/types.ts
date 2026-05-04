export type WorkflowStatus =
  | "intake"
  | "shoot"
  | "retouch"
  | "review"
  | "delivery"
  | "complete";

export type RiskLevel = "low" | "medium" | "high";

export type ApprovalState = "waiting" | "blocked" | "cleared";

export interface ProjectSummary {
  id: string;
  name: string;
  client: string;
  owner: string;
  status: WorkflowStatus;
  dueDate: string;
  skuCount: number;
  assetCount: number;
  reviewCount: number;
  deliveryCount: number;
  riskLevel: RiskLevel;
  completionPercent: number;
}

export interface SkuSummary {
  id: string;
  projectId: string;
  label: string;
  productLine: string;
  status: WorkflowStatus;
  heroAssetId: string;
  assetCount: number;
  reviewState: ApprovalState;
}

export interface AssetSummary {
  id: string;
  skuId: string;
  fileName: string;
  usage: "hero" | "gallery" | "detail" | "lifestyle";
  inspectionScore: number;
  status: WorkflowStatus;
}

export interface ReviewSessionSummary {
  id: string;
  projectId: string;
  label: string;
  state: ApprovalState;
  reviewer: string;
  pendingItems: number;
}

export interface DeliveryPackageSummary {
  id: string;
  projectId: string;
  label: string;
  status: "draft" | "ready" | "sentinel";
  assetCount: number;
}

export interface ApprovalQueueItem {
  id: string;
  title: string;
  projectId: string;
  state: ApprovalState;
  ageHours: number;
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
