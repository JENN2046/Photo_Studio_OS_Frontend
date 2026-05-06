import type {
  BackendAssetInbox,
  BackendDeliveryReadiness,
  BackendQcRetouchQueue,
  BackendReviewGallery
} from "../../api/backendReadModels";

const projectSku = {
  id: "SKU-AUR-001",
  code: "AUR-CHAIR-0012",
  name: "极光扶手椅"
};

const tableSku = {
  id: "SKU-TBL-003",
  code: "TBL-COFFEE-0031",
  name: "黑曜咖啡桌"
};

const heroShot = {
  id: "SHOT-HERO",
  shotTypeCode: "主图",
  status: "ready"
};

const detailShot = {
  id: "SHOT-DETAIL",
  shotTypeCode: "细节",
  status: "in_progress"
};

export function createMockAssetInbox(projectId: string): BackendAssetInbox {
  return {
    projectId,
    page: 1,
    limit: 24,
    total: 4,
    intake: {
      source: "capture_one_placeholder",
      status: "ready",
      message: "capture_one_export"
    },
    selectedAssetId: "AST-9012",
    items: [
      {
        assetId: "AST-9012",
        projectId,
        status: "matched",
        sku: projectSku,
        shotRequirement: heroShot,
        file: {
          originalFilename: "AUR-CHAIR-0012_0342.CR3",
          fileExt: "CR3",
          fileSizeBytes: "48234496",
          width: 6720,
          height: 4480,
          colorSpace: "Adobe RGB"
        },
        keys: {
          thumbnailKey: "mock/aur-chair-thumb",
          previewKey: "mock/aur-chair-preview"
        },
        binding: {
          status: "bound",
          matchStatus: "matched",
          confidence: 0.97,
          reason: "sku_and_shot_matched"
        },
        latestQc: {
          status: "warning",
          failedReasons: ["focus_left_edge"],
          notes: "左侧边缘需要人工复核。"
        }
      },
      {
        assetId: "AST-9044",
        projectId,
        status: "qc_passed",
        sku: tableSku,
        shotRequirement: detailShot,
        file: {
          originalFilename: "TBL-COFFEE-0031_0120.CR3",
          fileExt: "CR3",
          fileSizeBytes: "39774208",
          width: 6720,
          height: 4480,
          colorSpace: "Adobe RGB"
        },
        keys: {
          thumbnailKey: "mock/table-thumb",
          previewKey: "mock/table-preview"
        },
        binding: {
          status: "bound",
          matchStatus: "matched",
          confidence: 0.93,
          reason: "sku_and_shot_matched"
        },
        latestQc: {
          status: "passed",
          failedReasons: [],
          notes: "可进入客户审核。"
        }
      },
      {
        assetId: "AST-9091",
        projectId,
        status: "unmatched",
        file: {
          originalFilename: "NPR_45ML_2221.CR3",
          fileExt: "CR3",
          fileSizeBytes: "42196992",
          width: 6720,
          height: 4480,
          colorSpace: "Adobe RGB"
        },
        keys: {
          thumbnailKey: "mock/fragrance-thumb"
        },
        binding: {
          status: "ambiguous",
          matchStatus: "ambiguous",
          confidence: 0.61,
          reason: "sku_match_ambiguous"
        },
        latestQc: {
          status: "warning",
          failedReasons: ["color_label_shift"],
          notes: "标签色相偏移，需要确认 SKU。"
        }
      },
      {
        assetId: "AST-9104",
        projectId,
        status: "uploaded",
        file: {
          originalFilename: "LMP-TBL-0022_0048.CR3",
          fileExt: "CR3",
          fileSizeBytes: "36601856",
          width: 6720,
          height: 4480,
          colorSpace: "Adobe RGB"
        },
        keys: {
          thumbnailKey: "mock/lamp-thumb"
        },
        binding: {
          status: "unbound",
          matchStatus: "failed",
          confidence: 0.24,
          reason: "shot_requirement_missing"
        }
      }
    ]
  };
}

export function createMockQcRetouchQueue(
  projectId: string
): BackendQcRetouchQueue {
  return {
    projectId,
    page: 1,
    limit: 24,
    total: 3,
    items: [
      {
        assetId: "AST-9012",
        assetVersionId: "AST-9012-V2",
        previewKey: "mock/aur-chair-preview",
        sku: projectSku,
        shotRequirement: heroShot,
        qc: {
          latestStatus: "warning",
          failedReasons: ["focus_left_edge"],
          technicalResults: { focus: "warning", exposure: "passed" },
          manualResults: { producer: "needs_review" },
          nextAction: "send_back_to_retouch"
        },
        retouch: {
          taskId: "RET-4401",
          status: "in_progress",
          assignedTo: "精修 A 组",
          instructions: "压低左侧高光，检查边缘焦点。",
          complexity: "normal",
          dueAt: "2026-05-06T18:00:00+08:00",
          revisionCount: 1
        }
      },
      {
        assetId: "AST-9044",
        assetVersionId: "AST-9044-V1",
        previewKey: "mock/table-preview",
        sku: tableSku,
        shotRequirement: detailShot,
        qc: {
          latestStatus: "passed",
          failedReasons: [],
          technicalResults: { focus: "passed", exposure: "passed" },
          manualResults: { producer: "approved" },
          nextAction: "none"
        },
        retouch: {
          taskId: "RET-4402",
          status: "done",
          assignedTo: "精修 B 组",
          instructions: "细节图已通过。",
          complexity: "low",
          revisionCount: 0
        }
      },
      {
        assetId: "AST-9091",
        assetVersionId: "AST-9091-V1",
        previewKey: "mock/fragrance-preview",
        qc: {
          latestStatus: "failed",
          failedReasons: ["color_label_shift", "sku_match_ambiguous"],
          technicalResults: { color: "failed", binding: "ambiguous" },
          manualResults: { producer: "blocked" },
          nextAction: "mark_for_reshoot"
        }
      }
    ]
  };
}

export function createMockReviewGallery(
  reviewSessionId: string
): BackendReviewGallery {
  return {
    reviewSessionId,
    title: "极光系列客户二审",
    status: "published",
    expiresAt: "2026-05-12T18:00:00+08:00",
    items: [
      {
        reviewItemId: "RVI-9012",
        assetId: "AST-9012",
        previewKey: "mock/aur-chair-preview",
        sku: projectSku,
        shotRequirement: heroShot,
        status: "pending",
        issueType: "awaiting_client_decision"
      },
      {
        reviewItemId: "RVI-9044",
        assetId: "AST-9044",
        previewKey: "mock/table-preview",
        sku: tableSku,
        shotRequirement: detailShot,
        status: "approved",
        clientComment: "可进入交付。"
      },
      {
        reviewItemId: "RVI-9091",
        assetId: "AST-9091",
        previewKey: "mock/fragrance-preview",
        status: "revision_requested",
        clientComment: "标签颜色需要回到参考图。"
      }
    ],
    summary: {
      pending: 1,
      approved: 1,
      revisionRequested: 1,
      withdrawn: 0
    },
    publicAccess: {
      enabled: false,
      reason: "storage_auth_and_public_review_not_approved"
    }
  };
}

export function createMockDeliveryReadiness(
  deliveryId: string
): BackendDeliveryReadiness {
  return {
    deliveryId,
    status: "preparing",
    packageKey: "mock/delivery/aurora-package.zip",
    manifestKey: "mock/delivery/aurora-manifest.json",
    expiresAt: "2026-05-12T18:00:00+08:00",
    itemCount: 86,
    checklist: {
      hasItems: true,
      hasPackageKey: true,
      hasManifestKey: true,
      allItemsHaveFileKey: false
    },
    blockers: [
      {
        code: "missing_approved_qc",
        message: "missing_approved_qc"
      }
    ],
    externalAccess: {
      enabled: false,
      reason: "storage_auth_and_public_delivery_not_approved"
    }
  };
}
