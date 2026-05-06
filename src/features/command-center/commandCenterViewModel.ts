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
  intake: "接入",
  shoot: "拍摄",
  retouch: "精修",
  review: "审核",
  delivery: "交付",
  complete: "完成"
};

export const riskLabels: Record<RiskLevel, string> = {
  low: "低风险",
  medium: "需关注",
  high: "高风险"
};

export const approvalLabels: Record<ApprovalState, string> = {
  waiting: "待处理",
  blocked: "阻塞",
  cleared: "已清除"
};

export const approvalTypeLabels: Record<ApprovalType, string> = {
  review: "审核",
  delivery: "交付",
  qc: "质检",
  retouch: "精修"
};

export const stageStateLabels: Record<WorkflowStageState, string> = {
  stable: "稳定",
  active: "进行中",
  watch: "观察"
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
