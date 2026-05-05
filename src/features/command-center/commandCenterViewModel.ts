import type {
  ApprovalState,
  ApprovalType,
  CommandCenterSnapshot,
  DeliveryPackageSummary,
  RiskLevel,
  WorkflowStageState,
  WorkflowStatus
} from "../../api/types";

export const statusLabels: Record<WorkflowStatus, string> = {
  intake: "Intake",
  shoot: "Shoot",
  retouch: "Retouch",
  review: "Review",
  delivery: "Delivery",
  complete: "Complete"
};

export const riskLabels: Record<RiskLevel, string> = {
  low: "Low",
  medium: "Medium",
  high: "High"
};

export const approvalLabels: Record<ApprovalState, string> = {
  waiting: "Waiting",
  blocked: "Blocked",
  cleared: "Cleared"
};

export const approvalTypeLabels: Record<ApprovalType, string> = {
  review: "Review",
  delivery: "Delivery",
  qc: "QC",
  retouch: "Retouch"
};

export const stageStateLabels: Record<WorkflowStageState, string> = {
  stable: "Stable",
  active: "Active",
  watch: "Watch"
};

export interface CommandCenterViewModel {
  assetTotal: number;
  pendingApprovals: number;
  activeReviewItems: number;
  deliveryAssets: number;
  riskWatchCount: number;
  generatedTime: string;
}

export function createCommandCenterViewModel(
  snapshot: CommandCenterSnapshot
): CommandCenterViewModel {
  return {
    assetTotal: snapshot.projects.reduce(
      (total, project) => total + project.assetCount,
      0
    ),
    pendingApprovals: snapshot.approvalQueue.filter(
      (item) => item.state !== "cleared"
    ).length,
    activeReviewItems: snapshot.reviews.reduce(
      (total, review) => total + review.pendingItems,
      0
    ),
    deliveryAssets: snapshot.deliveries.reduce(
      (total, delivery) => total + delivery.assetCount,
      0
    ),
    riskWatchCount: snapshot.riskPulse.filter((risk) => risk.level !== "low")
      .length,
    generatedTime: snapshot.generatedAt.slice(11, 16)
  };
}

export function getScoreState(score: number): ApprovalState {
  if (score >= 90) {
    return "cleared";
  }

  if (score >= 82) {
    return "waiting";
  }

  return "blocked";
}

export function getDeliveryState(
  status: DeliveryPackageSummary["status"]
): ApprovalState {
  return status === "ready" ? "cleared" : "waiting";
}
