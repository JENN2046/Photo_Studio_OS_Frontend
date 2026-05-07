import type {
  ApprovalState,
  ApprovalQueueItem,
  ApprovalType,
  CommandCenterSnapshot,
  DeliveryPackageSummary,
  RiskPulseItem,
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

const approvalTypeDetailLabels: Record<ApprovalType, string> = {
  review: "客户审核",
  delivery: "交付确认",
  qc: "质检复核",
  retouch: "精修返工"
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

export interface CommandCenterRiskDetail {
  impact: string;
  owner: string;
  action: string;
}

export interface CommandCenterApprovalDetail {
  typeLabel: string;
  stateLabel: string;
  impact: string;
  nextStep: string;
}

const riskDetailsById: Record<string, CommandCenterRiskDetail> = {
  "RISK-1": {
    impact: "3 张主图需要重新校准高光，可能影响客户二审节奏。",
    owner: "制片台 / Agent 巡检",
    action: "先打开质检 / 精修确认曝光阈值。"
  },
  "RISK-2": {
    impact: "标签与背景色温偏离参考，需要精修复核统一色彩基准。",
    owner: "精修负责人",
    action: "对照参考图复核标签与肤色保护。"
  },
  "RISK-3": {
    impact: "边缘焦点存在波动，需要在进入审核前完成局部检查。",
    owner: "拍摄负责人",
    action: "补查焦点边缘并标记是否需要补拍。"
  }
};

const fallbackRiskDetails: Record<RiskLevel, CommandCenterRiskDetail> = {
  high: {
    impact: "高风险信号可能影响审核或交付节奏。",
    owner: "运营值班",
    action: "打开相关只读页面核对风险来源。"
  },
  medium: {
    impact: "需关注信号需要在进入下一环节前复核。",
    owner: "生产负责人",
    action: "确认是否需要精修、质检或人工复核。"
  },
  low: {
    impact: "低风险信号保留观察，不触发业务写入。",
    owner: "值班观察",
    action: "维持只读跟踪并等待下一次巡检。"
  }
};

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

export function getCommandCenterRiskDetail(
  risk: RiskPulseItem
): CommandCenterRiskDetail {
  return riskDetailsById[risk.id] ?? fallbackRiskDetails[risk.level];
}

export function getCommandCenterApprovalDetail(
  item: ApprovalQueueItem
): CommandCenterApprovalDetail {
  const baseDetail = {
    typeLabel: approvalTypeDetailLabels[item.type],
    stateLabel: approvalLabels[item.state]
  };

  if (item.state === "cleared") {
    return {
      ...baseDetail,
      impact: "当前阻塞已清除，仅保留只读追踪。",
      nextStep: "保持观察，无业务写入。"
    };
  }

  if (item.type === "delivery") {
    return {
      ...baseDetail,
      impact: "交付包仍需人工确认，外部交付保持禁用。",
      nextStep: "打开审核画廊核对交付清单与阻断项。"
    };
  }

  if (item.type === "qc") {
    return {
      ...baseDetail,
      impact: "质检结果会影响审核入口，返修建议仍只读。",
      nextStep: "打开质检 / 精修查看失败原因。"
    };
  }

  if (item.type === "retouch") {
    return {
      ...baseDetail,
      impact: "精修排期需要确认，当前不写入任务状态。",
      nextStep: "确认返修说明与截止时间。"
    };
  }

  return {
    ...baseDetail,
    impact: "客户审核仍待确认，反馈写入保持禁用。",
    nextStep: "打开审核画廊查看待反馈项。"
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
