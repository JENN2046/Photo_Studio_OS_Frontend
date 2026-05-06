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

export interface ReadModelViewModel {
  title: string;
  subtitle: string;
  metrics: ReadModelMetric[];
  rows: ReadModelRow[];
}

function formatStatus(value: string | undefined): string {
  if (!value) {
    return "unknown";
  }

  return value.replace(/_/g, " ");
}

function formatBytes(value: string | undefined): string {
  if (!value) {
    return "size pending";
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

function toneFromStatus(value: string | undefined): ReadModelTone {
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
    value.includes("ambiguous")
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
  return sku ? `${sku.code} / ${sku.name}` : "SKU unbound";
}

function formatShotLabel(
  shot: { shotTypeCode: string; status: string } | undefined
): string {
  return shot ? `${shot.shotTypeCode} / ${formatStatus(shot.status)}` : "shot open";
}

export function createAssetInboxViewModel(
  model: BackendAssetInbox
): ReadModelViewModel {
  const unboundCount = model.items.filter(
    (item) => item.binding.status !== "bound"
  ).length;

  return {
    title: "Asset Inbox",
    subtitle: `${model.projectId} / ${model.intake.source}`,
    metrics: [
      {
        label: "Assets",
        value: String(model.total),
        detail: `Page ${model.page} / ${model.limit}`,
        tone: "neutral"
      },
      {
        label: "Intake",
        value: formatStatus(model.intake.status),
        detail: model.intake.message,
        tone: toneFromStatus(model.intake.status)
      },
      {
        label: "Unbound",
        value: String(unboundCount),
        detail: "Read-only matching state",
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

  return {
    title: "QC / Retouch Queue",
    subtitle: `${model.projectId} / read-only queue`,
    metrics: [
      {
        label: "Queue",
        value: String(model.total),
        detail: `Page ${model.page} / ${model.limit}`,
        tone: "neutral"
      },
      {
        label: "QC Failed",
        value: String(failedCount),
        detail: "Latest QC status",
        tone: failedCount > 0 ? "danger" : "good"
      },
      {
        label: "Retouch Active",
        value: String(activeRetouchCount),
        detail: "No task mutation enabled",
        tone: activeRetouchCount > 0 ? "warn" : "good"
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
          ? `${item.retouch.assignedTo} / ${item.retouch.complexity}`
          : `Next action / ${item.qc.nextAction ?? "none"}`,
        status: `${formatStatus(status)} / ${
          item.qc.failedReasons.join(", ") || "clear"
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

  return {
    title: "Review Gallery",
    subtitle: `${model.reviewSessionId} / ${model.title ?? "untitled session"}`,
    metrics: [
      {
        label: "Pending",
        value: String(summary.pending ?? 0),
        detail: "Client decision queue",
        tone: (summary.pending ?? 0) > 0 ? "warn" : "good"
      },
      {
        label: "Approved",
        value: String(summary.approved ?? 0),
        detail: "Read-only approvals",
        tone: "good"
      },
      {
        label: "Public Access",
        value: model.publicAccess.enabled ? "enabled" : "off",
        detail: model.publicAccess.reason,
        tone: "neutral"
      }
    ],
    rows: model.items.map((item) => ({
      id: item.reviewItemId,
      primary: item.assetId,
      secondary: `${formatSkuLabel(item.sku)} / ${formatShotLabel(
        item.shotRequirement
      )}`,
      meta: item.clientComment ?? item.issueType ?? "no client note",
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
      primary: formatStatus(key),
      secondary: value ? "Requirement satisfied" : "Requirement not satisfied",
      meta: "Delivery readiness checklist",
      status: value ? "clear" : "blocked",
      tone: value ? "good" : "danger"
    })
  );

  const blockerRows: ReadModelRow[] = model.blockers.map((blocker) => ({
    id: blocker.code,
    primary: blocker.code,
    secondary: blocker.message,
    meta: "Backend read-only blocker",
    status: "blocked",
    tone: "danger"
  }));

  return {
    title: "Delivery Readiness",
    subtitle: `${model.deliveryId} / ${model.status}`,
    metrics: [
      {
        label: "Status",
        value: formatStatus(model.status),
        detail: `${model.itemCount} delivery items`,
        tone: toneFromStatus(model.status)
      },
      {
        label: "Blockers",
        value: String(model.blockers.length),
        detail: "Read-only blocker list",
        tone: model.blockers.length > 0 ? "danger" : "good"
      },
      {
        label: "External Access",
        value: model.externalAccess.enabled ? "enabled" : "off",
        detail: model.externalAccess.reason,
        tone: "neutral"
      }
    ],
    rows: [...checklistRows, ...blockerRows]
  };
}
