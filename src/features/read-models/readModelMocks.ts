import type {
  BackendAssetInbox,
  BackendDeliveryReadiness,
  BackendQcRetouchQueue,
  BackendReviewGallery
} from "../../api/backendReadModels";

const auroraSku = {
  id: "SKU-AUR-001",
  code: "AUR-CHAIR-0012",
  name: "极光扶手椅"
};

const tableSku = {
  id: "SKU-TBL-003",
  code: "TBL-COFFEE-0031",
  name: "黑曜咖啡桌"
};

const fragranceSku = {
  id: "SKU-NPR-007",
  code: "NPR-45ML-2221",
  name: "黑曜香氛 45ML"
};

const shotRequirements = [
  { id: "SHOT-AUR-HERO", shotTypeCode: "主图", status: "ready" },
  { id: "SHOT-AUR-DETAIL", shotTypeCode: "细节", status: "in_progress" },
  { id: "SHOT-AUR-SCALE", shotTypeCode: "比例", status: "ready" },
  { id: "SHOT-TBL-HERO", shotTypeCode: "主图", status: "ready" },
  { id: "SHOT-TBL-TEXTURE", shotTypeCode: "材质", status: "ready" },
  { id: "SHOT-TBL-LIFESTYLE", shotTypeCode: "场景", status: "in_progress" },
  { id: "SHOT-NPR-HERO", shotTypeCode: "主图", status: "watch" },
  { id: "SHOT-NPR-LABEL", shotTypeCode: "标签", status: "watch" },
  { id: "SHOT-NPR-PACK", shotTypeCode: "包装", status: "ready" }
] as const;

const qcChecks = [
  {
    id: "QC-9012",
    assetId: "AST-9012",
    label: "左侧边缘焦点",
    severity: "warning",
    owner: "精修 A 组",
    nextAction: "send_back_to_retouch"
  },
  {
    id: "QC-9044",
    assetId: "AST-9044",
    label: "细节曝光与裁切",
    severity: "passed",
    owner: "精修 B 组",
    nextAction: "none"
  },
  {
    id: "QC-9091",
    assetId: "AST-9091",
    label: "标签色彩与 SKU 匹配",
    severity: "failed",
    owner: "制片台",
    nextAction: "mark_for_reshoot"
  }
] as const;

export const goldenProductLoopFixture = {
  client: {
    id: "CLIENT-NOIR",
    name: "黑曜品牌工作台"
  },
  project: {
    id: "PRJ-128",
    name: "极光系列产品拍摄",
    producer: "运营值班"
  },
  skus: [auroraSku, tableSku, fragranceSku],
  shotRequirements,
  assetCount: 6,
  qcChecks,
  review: {
    id: "REV-441",
    title: "极光系列客户二审"
  },
  delivery: {
    id: "DEL-220",
    title: "极光系列交付包"
  }
} as const;

type AssetInboxItem = BackendAssetInbox["items"][number];
type AssetInboxItemTemplate = Omit<AssetInboxItem, "projectId">;

const assetTemplates: AssetInboxItemTemplate[] = [
  {
    assetId: "AST-9012",
    status: "matched",
    sku: auroraSku,
    shotRequirement: shotRequirements[0],
    file: {
      originalFilename: "AUR-CHAIR-0012_0342.CR3",
      fileExt: "CR3",
      fileSizeBytes: "48234496",
      width: 6720,
      height: 4480,
      colorSpace: "Adobe RGB"
    },
    keys: {
      thumbnailKey: "mock/aur-chair-hero-thumb",
      previewKey: "mock/aur-chair-hero-preview"
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
    assetId: "AST-9018",
    status: "retouching",
    sku: auroraSku,
    shotRequirement: shotRequirements[1],
    file: {
      originalFilename: "AUR-CHAIR-0012_0410.CR3",
      fileExt: "CR3",
      fileSizeBytes: "45612032",
      width: 6720,
      height: 4480,
      colorSpace: "Adobe RGB"
    },
    keys: {
      thumbnailKey: "mock/aur-chair-detail-thumb",
      previewKey: "mock/aur-chair-detail-preview"
    },
    binding: {
      status: "bound",
      matchStatus: "matched",
      confidence: 0.94,
      reason: "sku_and_shot_matched"
    },
    latestQc: {
      status: "warning",
      failedReasons: ["shadow_balance_watch"],
      notes: "阴影层次需要精修确认。"
    }
  },
  {
    assetId: "AST-9044",
    status: "qc_passed",
    sku: tableSku,
    shotRequirement: shotRequirements[3],
    file: {
      originalFilename: "TBL-COFFEE-0031_0120.CR3",
      fileExt: "CR3",
      fileSizeBytes: "39774208",
      width: 6720,
      height: 4480,
      colorSpace: "Adobe RGB"
    },
    keys: {
      thumbnailKey: "mock/table-hero-thumb",
      previewKey: "mock/table-hero-preview"
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
    assetId: "AST-9051",
    status: "matched",
    sku: tableSku,
    shotRequirement: shotRequirements[4],
    file: {
      originalFilename: "TBL-COFFEE-0031_0157.CR3",
      fileExt: "CR3",
      fileSizeBytes: "38289408",
      width: 6720,
      height: 4480,
      colorSpace: "Adobe RGB"
    },
    keys: {
      thumbnailKey: "mock/table-texture-thumb",
      previewKey: "mock/table-texture-preview"
    },
    binding: {
      status: "bound",
      matchStatus: "matched",
      confidence: 0.91,
      reason: "sku_and_shot_matched"
    },
    latestQc: {
      status: "passed",
      failedReasons: [],
      notes: "材质纹理稳定。"
    }
  },
  {
    assetId: "AST-9091",
    status: "unmatched",
    sku: fragranceSku,
    shotRequirement: shotRequirements[7],
    file: {
      originalFilename: "NPR_45ML_2221.CR3",
      fileExt: "CR3",
      fileSizeBytes: "42196992",
      width: 6720,
      height: 4480,
      colorSpace: "Adobe RGB"
    },
    keys: {
      thumbnailKey: "mock/fragrance-label-thumb",
      previewKey: "mock/fragrance-label-preview"
    },
    binding: {
      status: "ambiguous",
      matchStatus: "ambiguous",
      confidence: 0.61,
      reason: "sku_match_ambiguous"
    },
    latestQc: {
      status: "failed",
      failedReasons: ["color_label_shift", "sku_match_ambiguous"],
      notes: "标签色相偏移，需要确认 SKU。"
    }
  },
  {
    assetId: "AST-9104",
    status: "uploaded",
    sku: fragranceSku,
    shotRequirement: shotRequirements[8],
    file: {
      originalFilename: "NPR-45ML-PACK_0048.CR3",
      fileExt: "CR3",
      fileSizeBytes: "36601856",
      width: 6720,
      height: 4480,
      colorSpace: "Adobe RGB"
    },
    keys: {
      thumbnailKey: "mock/fragrance-pack-thumb",
      previewKey: "mock/fragrance-pack-preview"
    },
    binding: {
      status: "unbound",
      matchStatus: "failed",
      confidence: 0.24,
      reason: "shot_requirement_missing"
    }
  }
];

export function createMockAssetInbox(projectId: string): BackendAssetInbox {
  return {
    projectId,
    page: 1,
    limit: 24,
    total: assetTemplates.length,
    intake: {
      source: "capture_one_placeholder",
      status: "ready",
      message: "capture_one_export"
    },
    selectedAssetId: "AST-9012",
    items: assetTemplates.map((item) => ({
      ...item,
      projectId
    }))
  };
}

export function createMockQcRetouchQueue(
  projectId: string
): BackendQcRetouchQueue {
  return {
    projectId,
    page: 1,
    limit: 24,
    total: qcChecks.length,
    items: [
      {
        assetId: "AST-9012",
        assetVersionId: "AST-9012-V2",
        previewKey: "mock/aur-chair-hero-preview",
        sku: auroraSku,
        shotRequirement: shotRequirements[0],
        qc: {
          latestStatus: "warning",
          failedReasons: ["focus_left_edge"],
          technicalResults: {
            focus: "warning",
            exposure: "passed",
            crop: "passed"
          },
          manualResults: {
            producer: "needs_review",
            retouchLead: "assigned"
          },
          nextAction: "send_back_to_retouch"
        },
        retouch: {
          taskId: "RET-4401",
          status: "in_progress",
          assignedTo: "精修 A 组",
          instructions: "压低左侧高光，检查边缘焦点。",
          complexity: "normal",
          dueAt: "2026-05-07T18:00:00+08:00",
          revisionCount: 1
        }
      },
      {
        assetId: "AST-9044",
        assetVersionId: "AST-9044-V1",
        previewKey: "mock/table-hero-preview",
        sku: tableSku,
        shotRequirement: shotRequirements[3],
        qc: {
          latestStatus: "passed",
          failedReasons: [],
          technicalResults: {
            focus: "passed",
            exposure: "passed",
            crop: "passed"
          },
          manualResults: {
            producer: "approved",
            retouchLead: "approved"
          },
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
        previewKey: "mock/fragrance-label-preview",
        sku: fragranceSku,
        shotRequirement: shotRequirements[7],
        qc: {
          latestStatus: "failed",
          failedReasons: ["color_label_shift", "sku_match_ambiguous"],
          technicalResults: {
            color: "failed",
            binding: "ambiguous",
            crop: "warning"
          },
          manualResults: {
            producer: "blocked",
            retouchLead: "needs_review"
          },
          nextAction: "mark_for_reshoot"
        },
        retouch: {
          taskId: "RET-4403",
          status: "internal_review",
          assignedTo: "制片台",
          instructions: "确认标签参考色；若 SKU 仍无法确认则标记补拍。",
          complexity: "high",
          dueAt: "2026-05-07T15:30:00+08:00",
          revisionCount: 2
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
    title: goldenProductLoopFixture.review.title,
    status: "published",
    expiresAt: "2026-05-12T18:00:00+08:00",
    items: [
      {
        reviewItemId: "RVI-9012",
        assetId: "AST-9012",
        previewKey: "mock/aur-chair-hero-preview",
        sku: auroraSku,
        shotRequirement: shotRequirements[0],
        status: "pending",
        issueType: "awaiting_client_decision"
      },
      {
        reviewItemId: "RVI-9044",
        assetId: "AST-9044",
        previewKey: "mock/table-hero-preview",
        sku: tableSku,
        shotRequirement: shotRequirements[3],
        status: "approved",
        clientComment: "可进入交付。"
      },
      {
        reviewItemId: "RVI-9091",
        assetId: "AST-9091",
        previewKey: "mock/fragrance-label-preview",
        sku: fragranceSku,
        shotRequirement: shotRequirements[7],
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
    itemCount: goldenProductLoopFixture.assetCount,
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

// ── Empty mock factories ──

export function createMockEmptyAssetInbox(
  projectId: string
): BackendAssetInbox {
  return {
    projectId,
    page: 1,
    limit: 24,
    total: 0,
    intake: {
      source: "capture_one_placeholder",
      status: "not_configured",
      message: "capture_one_export"
    },
    items: []
  };
}

export function createMockEmptyQcRetouchQueue(
  projectId: string
): BackendQcRetouchQueue {
  return {
    projectId,
    page: 1,
    limit: 24,
    total: 0,
    items: []
  };
}

export function createMockEmptyReviewGallery(
  reviewSessionId: string
): BackendReviewGallery {
  return {
    reviewSessionId,
    title: "空审核会话",
    status: "draft",
    items: [],
    summary: { pending: 0, approved: 0, revisionRequested: 0, withdrawn: 0 },
    publicAccess: {
      enabled: false,
      reason: "storage_auth_and_public_review_not_approved"
    }
  };
}

export function createMockEmptyDeliveryReadiness(
  deliveryId: string
): BackendDeliveryReadiness {
  return {
    deliveryId,
    status: "preparing",
    itemCount: 0,
    checklist: {
      hasItems: false,
      hasPackageKey: false,
      hasManifestKey: false,
      allItemsHaveFileKey: false
    },
    blockers: [],
    externalAccess: {
      enabled: false,
      reason: "storage_auth_and_public_delivery_not_approved"
    }
  };
}

// ── Partial mock factories ──

export function createMockPartialAssetInbox(
  projectId: string
): BackendAssetInbox {
  const [first, second] = assetTemplates;
  if (!first || !second) {
    return createMockEmptyAssetInbox(projectId);
  }

  return {
    projectId,
    page: 1,
    limit: 24,
    total: 2,
    intake: {
      source: "capture_one_placeholder",
      status: "warning",
      message: "capture_one_export"
    },
    selectedAssetId: first.assetId,
    items: [
      { ...first, projectId },
      {
        ...second,
        projectId,
        binding: {
          status: "unbound",
          matchStatus: "failed",
          confidence: 0,
          reason: "shot_requirement_missing"
        },
        latestQc: undefined
      }
    ]
  };
}

export function createMockPartialQcRetouchQueue(
  projectId: string
): BackendQcRetouchQueue {
  return {
    projectId,
    page: 1,
    limit: 24,
    total: 1,
    items: [
      {
        assetId: "AST-9012",
        assetVersionId: "AST-9012-V2",
        previewKey: "mock/aur-chair-hero-preview",
        sku: auroraSku,
        shotRequirement: shotRequirements[0],
        qc: {
          latestStatus: "warning",
          failedReasons: ["focus_left_edge"],
          technicalResults: { focus: "warning" },
          manualResults: {},
          nextAction: "send_back_to_retouch"
        },
        retouch: undefined
      }
    ]
  };
}

export function createMockPartialReviewGallery(
  reviewSessionId: string
): BackendReviewGallery {
  return {
    reviewSessionId,
    title: "部分内容审核",
    status: "published",
    items: [
      {
        reviewItemId: "RVI-9091",
        assetId: "AST-9091",
        previewKey: "mock/fragrance-label-preview",
        sku: fragranceSku,
        shotRequirement: shotRequirements[7],
        status: "revision_requested",
        clientComment: "标签颜色需要回到参考图。"
      }
    ],
    publicAccess: {
      enabled: false,
      reason: "storage_auth_and_public_review_not_approved"
    }
  };
}

export function createMockPartialDeliveryReadiness(
  deliveryId: string
): BackendDeliveryReadiness {
  return {
    deliveryId,
    status: "preparing",
    itemCount: 3,
    checklist: {
      hasItems: true,
      hasPackageKey: false,
      hasManifestKey: false,
      allItemsHaveFileKey: false
    },
    blockers: [
      { code: "missing_approved_qc", message: "missing_approved_qc" },
      { code: "missing_delivery_manifest", message: "missing_delivery_manifest" }
    ],
    externalAccess: {
      enabled: false,
      reason: "storage_auth_and_public_delivery_not_approved"
    }
  };
}
