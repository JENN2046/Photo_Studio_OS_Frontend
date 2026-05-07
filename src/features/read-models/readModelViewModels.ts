import type {
  BackendAssetInbox,
  BackendDeliveryReadiness,
  BackendQcRetouchQueue,
  BackendReviewGallery
} from "../../api/backendReadModels";

export type ReadModelTone = "neutral" | "good" | "warn" | "danger";

export interface ReadModelMetric {
  label: string;
  value: string;
  detail: string;
  tone: ReadModelTone;
}

export interface ReadModelRow {
  id: string;
  primary: string;
  secondary: string;
  meta: string;
  status: string;
  tone: ReadModelTone;
}

export interface ReadModelDetail {
  label: string;
  title: string;
  detail: string;
  tone: ReadModelTone;
}

export interface ReadModelViewModel {
  title: string;
  subtitle: string;
  metrics: ReadModelMetric[];
  rows: ReadModelRow[];
  details: ReadModelDetail[];
}

export function formatStatus(value: string | undefined): string {
  if (!value) {
    return "未知";
  }

  const status = value.replace(/_/g, " ");

  const statusMap: Record<string, string> = {
    none: "无",
    low: "低",
    normal: "普通",
    medium: "中",
    high: "高",
    pending: "待处理",
    queued: "排队中",
    uploaded: "已导入",
    selected: "已选中",
    retouching: "精修中",
    retouched: "已精修",
    "qc pending": "待质检",
    "qc failed": "质检失败",
    "qc passed": "质检通过",
    done: "完成",
    approved: "已批准",
    rejected: "已拒绝",
    failed: "失败",
    passed: "通过",
    flagged: "告警",
    warning: "警告",
    matched: "已匹配",
    unmatched: "未匹配",
    bound: "已绑定",
    ambiguous: "待确认",
    "not configured": "未配置",
    "manually resolved": "人工已处理",
    reading: "读取中",
    preparing: "准备中",
    blocked: "阻塞",
    draft: "草稿",
    sent: "已发送",
    sentinel: "只读哨兵",
    sentry: "哨兵",
    ready: "就绪",
    watch: "观察",
    delivered: "已交付",
    expired: "已过期",
    revision: "待修订",
    clear: "已清除",
    active: "进行中",
    "client pending": "待客户审核",
    "client approved": "客户已批准",
    "final exported": "已最终导出",
    archived: "已归档",
    deleted: "已删除",
    "to assign": "待分配",
    assigned: "已分配",
    canceled: "已取消",
    published: "已发布",
    closed: "已关闭",
    "revision requested": "客户要求返修",
    withdrawn: "已撤回",
    "needs revision": "需要返修",
    "internal review": "内部审核",
    "manual review": "人工复核",
    "delivery ready": "交付就绪",
    "ready for delivery": "可进入交付",
    "not started": "未开始",
    "in progress": "进行中",
    "capture one export": "Capture One 导出",
    "send back to retouch": "退回精修",
    "mark for reshoot": "标记补拍",
    "needs review": "需要复核"
  };

  return statusMap[status.toLowerCase()] ?? status;
}

export function formatReason(value: string | undefined): string {
  if (!value) {
    return "无";
  }

  const reason = value.replace(/_/g, " ");
  const reasonMap: Record<string, string> = {
    "storage auth disabled": "存储授权未启用",
    "storage auth and public review not approved":
      "存储授权与公开审核尚未批准",
    "storage auth and public delivery not approved":
      "存储授权与公开交付尚未批准",
    "public review disabled": "公开审核未启用",
    "public delivery disabled": "公开交付未启用",
    "external access disabled": "外部访问未启用",
    "all items have approved qc": "所有素材均已通过质检",
    "package manifest ready": "交付清单已准备",
    "missing delivery manifest": "缺少交付清单",
    "missing approved qc": "缺少已通过的质检结果",
    "client decision queue": "客户决策队列",
    "no client note": "无客户备注",
    "sku and shot matched": "SKU 与镜头需求已匹配",
    "sku match ambiguous": "SKU 匹配待确认",
    "shot requirement missing": "缺少镜头需求",
    "focus left edge": "左侧边缘焦点异常",
    "color label shift": "标签色彩偏移",
    "shadow balance watch": "阴影层次观察",
    "awaiting client decision": "等待客户确认"
  };

  return reasonMap[reason.toLowerCase()] ?? formatStatus(value);
}

export function formatSource(value: string): string {
  const sourceMap: Record<string, string> = {
    capture_one_placeholder: "Capture One 导出目录",
    capture_one_export: "Capture One 导出目录",
    backend_upload_placeholder: "后端上传占位",
    manual_upload: "人工导入",
    backend_read_model: "后端只读模型"
  };

  return sourceMap[value] ?? formatStatus(value);
}

function formatChecklistKey(value: string): string {
  const checklistMap: Record<string, string> = {
    hasItems: "包含交付素材",
    hasPackageKey: "交付包已生成",
    hasManifestKey: "交付清单已生成",
    allItemsHaveFileKey: "所有素材已关联文件"
  };

  return checklistMap[value] ?? formatStatus(value);
}

function formatShortDateTime(value: string | undefined): string {
  if (!value) {
    return "时间待定";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(date);
}

export function formatBytes(value: string | undefined): string {
  if (!value) {
    return "体积待定";
  }

  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return value;
  }

  if (numericValue >= 1024 * 1024 * 1024) {
    return `${(numericValue / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }

  if (numericValue >= 1024 * 1024) {
    return `${(numericValue / (1024 * 1024)).toFixed(1)} MB`;
  }

  if (numericValue >= 1024) {
    return `${(numericValue / 1024).toFixed(1)} KB`;
  }

  return `${numericValue} B`;
}

export function toneFromStatus(value: string | undefined): ReadModelTone {
  if (!value) {
    return "neutral";
  }

  if (
    value.includes("failed") ||
    value.includes("revision") ||
    value.includes("unmatched") ||
    value.includes("expired")
  ) {
    return "danger";
  }

  if (
    value.includes("pending") ||
    value.includes("warning") ||
    value.includes("preparing") ||
    value.includes("ambiguous") ||
    value.includes("watch")
  ) {
    return "warn";
  }

  if (
    value.includes("approved") ||
    value.includes("passed") ||
    value.includes("ready") ||
    value.includes("delivered") ||
    value.includes("done")
  ) {
    return "good";
  }

  return "neutral";
}

function formatSkuLabel(
  sku: { code: string; name: string } | undefined
): string {
  return sku ? `${sku.code} / ${sku.name}` : "未绑定 SKU";
}

function formatShotLabel(
  shot: { shotTypeCode: string; status: string } | undefined
): string {
  return shot
    ? `${shot.shotTypeCode} / ${formatStatus(shot.status)}`
    : "镜头需求待绑定";
}

export function createAssetInboxViewModel(
  model: BackendAssetInbox
): ReadModelViewModel {
  const unboundCount = model.items.filter(
    (item) => item.binding.status !== "bound"
  ).length;
  const selectedAsset =
    model.items.find((item) => item.assetId === model.selectedAssetId) ??
    model.items[0];

  return {
    title: "素材收件箱",
    subtitle: `${model.projectId} / ${formatSource(model.intake.source)}`,
    metrics: [
      {
        label: "素材数",
        value: String(model.total),
        detail: `第 ${model.page} / ${model.limit} 页`,
        tone: "neutral"
      },
      {
        label: "接入",
        value: formatStatus(model.intake.status),
        detail: formatReason(model.intake.message),
        tone: toneFromStatus(model.intake.status)
      },
      {
        label: "未绑定",
        value: String(unboundCount),
        detail: "只读绑定状态",
        tone: unboundCount > 0 ? "warn" : "good"
      }
    ],
    details: [
      {
        label: "接入来源",
        title: formatSource(model.intake.source),
        detail: `${formatStatus(model.intake.status)} / ${formatReason(
          model.intake.message
        )}`,
        tone: toneFromStatus(model.intake.status)
      },
      {
        label: "选中素材",
        title: selectedAsset?.file.originalFilename ?? "未选择素材",
        detail: selectedAsset
          ? `${formatSkuLabel(selectedAsset.sku)} / ${formatShotLabel(
              selectedAsset.shotRequirement
            )}`
          : "等待项目素材入库",
        tone: selectedAsset
          ? toneFromStatus(selectedAsset.latestQc?.status ?? selectedAsset.status)
          : "neutral"
      },
      {
        label: "绑定风险",
        title: `${unboundCount} 个未绑定`,
        detail:
          unboundCount > 0
            ? "需要人工确认 SKU 或镜头需求。"
            : "当前素材均已绑定生产需求。",
        tone: unboundCount > 0 ? "warn" : "good"
      }
    ],
    rows: model.items.map((item) => ({
      id: item.assetId,
      primary: item.file.originalFilename ?? item.assetId,
      secondary: `${formatSkuLabel(item.sku)} / ${formatShotLabel(
        item.shotRequirement
      )}`,
      meta: `${formatBytes(item.file.fileSizeBytes)} / ${item.file.width ?? "-"}x${
        item.file.height ?? "-"
      }`,
      status: `${formatStatus(item.status)} / ${formatStatus(
        item.latestQc?.status
      )}`,
      tone: toneFromStatus(item.latestQc?.status ?? item.status)
    }))
  };
}

export function createQcRetouchQueueViewModel(
  model: BackendQcRetouchQueue
): ReadModelViewModel {
  const failedCount = model.items.filter(
    (item) => item.qc.latestStatus === "failed"
  ).length;
  const activeRetouchCount = model.items.filter(
    (item) => item.retouch && item.retouch.status !== "done"
  ).length;
  const failedItem = model.items.find(
    (item) => item.qc.latestStatus === "failed"
  );
  const activeRetouchItem = model.items.find(
    (item) => item.retouch && item.retouch.status !== "done"
  );

  return {
    title: "质检 / 精修队列",
    subtitle: `${model.projectId} / 只读队列`,
    metrics: [
      {
        label: "队列",
        value: String(model.total),
        detail: `第 ${model.page} / ${model.limit} 页`,
        tone: "neutral"
      },
      {
        label: "质检失败",
        value: String(failedCount),
        detail: "最新质检状态",
        tone: failedCount > 0 ? "danger" : "good"
      },
      {
        label: "精修进行中",
        value: String(activeRetouchCount),
        detail: "当前仅显示只读状态",
        tone: activeRetouchCount > 0 ? "warn" : "good"
      }
    ],
    details: [
      {
        label: "重点复核",
        title: failedItem?.assetId ?? "暂无失败素材",
        detail:
          failedItem?.qc.failedReasons.map(formatReason).join("、") ??
          "当前没有质检失败项。",
        tone: failedItem ? "danger" : "good"
      },
      {
        label: "精修负责人",
        title: activeRetouchItem?.retouch?.assignedTo ?? "暂无进行中任务",
        detail: activeRetouchItem?.retouch
          ? `${formatStatus(activeRetouchItem.retouch.status)} / ${formatStatus(
              activeRetouchItem.retouch.complexity
            )} / ${formatShortDateTime(activeRetouchItem.retouch.dueAt)}`
          : "精修队列当前无阻塞。",
        tone: activeRetouchItem ? "warn" : "good"
      },
      {
        label: "队列边界",
        title: "只读查看",
        detail: "返修、补拍、审批动作仍保持禁用。",
        tone: "neutral"
      }
    ],
    rows: model.items.map((item) => {
      const status = item.qc.latestStatus ?? item.retouch?.status ?? "queued";

      return {
        id: item.assetId,
        primary: item.assetId,
        secondary: `${formatSkuLabel(item.sku)} / ${formatShotLabel(
          item.shotRequirement
        )}`,
        meta: item.retouch?.assignedTo
          ? `${item.retouch.assignedTo} / ${formatStatus(
              item.retouch.complexity
            )}`
          : `下一动作 / ${formatStatus(item.qc.nextAction ?? "none")}`,
        status: `${formatStatus(status)} / ${
          item.qc.failedReasons.map(formatReason).join("、") || "通过"
        }`,
        tone: toneFromStatus(status)
      };
    })
  };
}

export function createReviewGalleryViewModel(
  model: BackendReviewGallery
): ReadModelViewModel {
  const summary = model.summary ?? {};
  const revisionItem = model.items.find(
    (item) => item.status === "revision_requested"
  );

  return {
    title: "审核画廊",
    subtitle: `${model.reviewSessionId} / ${model.title ?? "未命名会话"}`,
    metrics: [
      {
        label: "待处理",
        value: String(summary.pending ?? 0),
        detail: "待客户审核",
        tone: (summary.pending ?? 0) > 0 ? "warn" : "good"
      },
      {
        label: "已批准",
        value: String(summary.approved ?? 0),
        detail: "只读审批记录",
        tone: "good"
      },
      {
        label: "公开访问",
        value: model.publicAccess.enabled ? "已启用" : "未启用",
        detail: formatReason(model.publicAccess.reason),
        tone: "neutral"
      }
    ],
    details: [
      {
        label: "审核会话",
        title: formatStatus(model.status),
        detail: `到期 ${formatShortDateTime(model.expiresAt)}`,
        tone: toneFromStatus(model.status)
      },
      {
        label: "公开访问",
        title: model.publicAccess.enabled ? "已启用" : "未启用",
        detail: formatReason(model.publicAccess.reason),
        tone: "neutral"
      },
      {
        label: "返修关注",
        title: revisionItem?.assetId ?? "暂无返修项",
        detail: revisionItem?.clientComment ?? "当前没有客户返修意见。",
        tone: revisionItem ? "danger" : "good"
      }
    ],
    rows: model.items.map((item) => ({
      id: item.reviewItemId,
      primary: item.assetId,
      secondary: `${formatSkuLabel(item.sku)} / ${formatShotLabel(
        item.shotRequirement
      )}`,
      meta: item.clientComment ?? formatReason(item.issueType),
      status: formatStatus(item.status),
      tone: toneFromStatus(item.status)
    }))
  };
}

export function createDeliveryReadinessViewModel(
  model: BackendDeliveryReadiness
): ReadModelViewModel {
  const checklistRows: ReadModelRow[] = Object.entries(model.checklist).map(
    ([key, value]) => ({
      id: key,
      primary: formatChecklistKey(key),
      secondary: value ? "已满足要求" : "未满足要求",
      meta: "交付就绪检查项",
      status: value ? "已清除" : "阻塞",
      tone: value ? "good" : "danger"
    })
  );

  const blockerRows: ReadModelRow[] = model.blockers.map((blocker) => ({
    id: blocker.code,
    primary: formatReason(blocker.code),
    secondary: formatReason(blocker.message),
    meta: "后端只读阻断项",
    status: "阻塞",
    tone: "danger"
  }));
  const firstBlocker = model.blockers[0];

  return {
    title: "交付就绪",
    subtitle: `${model.deliveryId} / ${formatStatus(model.status)}`,
    metrics: [
      {
        label: "状态",
        value: formatStatus(model.status),
        detail: `${model.itemCount} 个交付项`,
        tone: toneFromStatus(model.status)
      },
      {
        label: "阻断项",
        value: String(model.blockers.length),
        detail: "只读阻断清单",
        tone: model.blockers.length > 0 ? "danger" : "good"
      },
      {
        label: "外部访问",
        value: model.externalAccess.enabled ? "已启用" : "未启用",
        detail: formatReason(model.externalAccess.reason),
        tone: "neutral"
      }
    ],
    details: [
      {
        label: "交付包",
        title: model.checklist.hasPackageKey ? "交付包已生成" : "交付包待生成",
        detail: model.packageKey ? "模拟交付包路径已就绪。" : "暂无交付包路径。",
        tone: model.checklist.hasPackageKey ? "good" : "warn"
      },
      {
        label: "阻断原因",
        title: firstBlocker ? formatReason(firstBlocker.code) : "暂无阻断",
        detail: firstBlocker
          ? formatReason(firstBlocker.message)
          : "当前交付检查均已清除。",
        tone: firstBlocker ? "danger" : "good"
      },
      {
        label: "外部访问",
        title: model.externalAccess.enabled ? "已启用" : "未启用",
        detail: formatReason(model.externalAccess.reason),
        tone: "neutral"
      }
    ],
    rows: [...checklistRows, ...blockerRows]
  };
}
