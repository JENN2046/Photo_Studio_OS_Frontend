import type { CommandCenterSnapshot } from "../api/types";

export const commandCenterMock: CommandCenterSnapshot = {
  generatedAt: "2026-05-05T09:30:00+08:00",
  studio: {
    name: "布鲁克林影棚 A",
    locationLabel: "1号布景 / 02号机位",
    modeLabel: "命令中心 Alpha",
    operator: "运营值班",
    readinessPercent: 82,
    activeProjectCount: 3
  },
  coverage: {
    skuCoveragePercent: 92.7,
    completedSkus: 279,
    totalSkus: 300
  },
  qc: {
    qcHealthPercent: 96.4,
    passed: 1423,
    flagged: 77,
    pending: 0
  },
  workflowStages: [
    {
      id: "PATH-INTAKE",
      label: "客户接入",
      status: "intake",
      state: "stable",
      count: 3,
      detail: "拍摄简报与 SKU 清单已同步"
    },
    {
      id: "PATH-SHOOT",
      label: "拍摄现场",
      status: "shoot",
      state: "watch",
      count: 1,
      detail: "黄水晶丝巾布景正在连续性观察"
    },
    {
      id: "PATH-RETOUCH",
      label: "精修",
      status: "retouch",
      state: "active",
      count: 2,
      detail: "台灯细节图正在进入精修抛光"
    },
    {
      id: "PATH-REVIEW",
      label: "客户审核",
      status: "review",
      state: "active",
      count: 2,
      detail: "客户与制片审批仍待处理"
    },
    {
      id: "PATH-DELIVERY",
      label: "交付",
      status: "delivery",
      state: "stable",
      count: 2,
      detail: "交付包以只读哨兵状态可见"
    }
  ],
  projects: [
    {
      id: "PRJ-128",
      name: "极光系列",
      client: "高端家具",
      owner: "运营值班",
      status: "review",
      dueDate: "2026-05-22",
      skuCount: 18,
      assetCount: 236,
      reviewCount: 4,
      deliveryCount: 2,
      riskLevel: "medium",
      completionPercent: 72
    },
    {
      id: "PRJ-129",
      name: "三件套系列 V2",
      client: "新品发布",
      owner: "精修负责人",
      status: "retouch",
      dueDate: "2026-05-27",
      skuCount: 12,
      assetCount: 144,
      reviewCount: 1,
      deliveryCount: 0,
      riskLevel: "low",
      completionPercent: 48
    },
    {
      id: "PRJ-130",
      name: "黑曜香氛",
      client: "品牌战役",
      owner: "制片台",
      status: "shoot",
      dueDate: "2026-06-02",
      skuCount: 9,
      assetCount: 64,
      reviewCount: 0,
      deliveryCount: 0,
      riskLevel: "high",
      completionPercent: 31
    },
    {
      id: "PRJ-131",
      name: "流明灯具",
      client: "电商目录",
      owner: "拍摄负责人",
      status: "intake",
      dueDate: "2026-06-05",
      skuCount: 6,
      assetCount: 44,
      reviewCount: 0,
      deliveryCount: 0,
      riskLevel: "low",
      completionPercent: 12
    }
  ],
  skus: [
    {
      id: "SKU-AN-014",
      projectId: "PRJ-128",
      label: "黑曜皮革托特包",
      productLine: "包袋",
      status: "review",
      heroAssetId: "AST-9012",
      assetCount: 16,
      reviewState: "waiting"
    },
    {
      id: "SKU-LH-022",
      projectId: "PRJ-129",
      label: "拉丝钢台灯",
      productLine: "灯具",
      status: "retouch",
      heroAssetId: "AST-9050",
      assetCount: 12,
      reviewState: "cleared"
    },
    {
      id: "SKU-CM-007",
      projectId: "PRJ-130",
      label: "黄水晶丝巾",
      productLine: "配饰",
      status: "shoot",
      heroAssetId: "AST-9091",
      assetCount: 8,
      reviewState: "blocked"
    }
  ],
  assets: [
    {
      id: "AST-9012",
      skuId: "SKU-AN-014",
      fileName: "an-tote-hero-03.tif",
      usage: "hero",
      inspectionScore: 94,
      status: "review"
    },
    {
      id: "AST-9050",
      skuId: "SKU-LH-022",
      fileName: "lh-lamp-detail-08.tif",
      usage: "detail",
      inspectionScore: 89,
      status: "retouch"
    },
    {
      id: "AST-9091",
      skuId: "SKU-CM-007",
      fileName: "cm-scarf-lifestyle-02.tif",
      usage: "lifestyle",
      inspectionScore: 76,
      status: "shoot"
    }
  ],
  reviews: [
    {
      id: "REV-441",
      projectId: "PRJ-128",
      label: "客户二审",
      state: "waiting",
      reviewer: "黑曜品牌工作台",
      pendingItems: 14
    },
    {
      id: "REV-442",
      projectId: "PRJ-130",
      label: "制片构图检查",
      state: "blocked",
      reviewer: "内部制片",
      pendingItems: 6
    }
  ],
  deliveries: [
    {
      id: "DEL-220",
      projectId: "PRJ-128",
      label: "平台裁切套装",
      status: "ready",
      assetCount: 86
    },
    {
      id: "DEL-221",
      projectId: "PRJ-128",
      label: "编辑精选交付包",
      status: "sentinel",
      assetCount: 24
    }
  ],
  approvalQueue: [
    {
      id: "APR-801",
      type: "review",
      title: "AUR-CHAIR-0012",
      projectId: "1号布景 / 02号机位",
      state: "blocked",
      ageHours: 0.75
    },
    {
      id: "APR-802",
      type: "qc",
      title: "MOD-SOFA-0045",
      projectId: "1号布景 / 01号机位",
      state: "blocked",
      ageHours: 1.3
    },
    {
      id: "APR-803",
      type: "delivery",
      title: "TBL-COFFEE-0031",
      projectId: "1号布景 / 03号机位",
      state: "waiting",
      ageHours: 2
    },
    {
      id: "APR-804",
      type: "retouch",
      title: "LMP-TBL-0022",
      projectId: "1号布景 / 01号机位",
      state: "cleared",
      ageHours: 3.1
    }
  ],
  riskPulse: [
    {
      id: "RISK-1",
      label: "高曝光片段",
      level: "high",
      signal: "3"
    },
    {
      id: "RISK-2",
      label: "色彩偏移",
      level: "medium",
      signal: "2"
    },
    {
      id: "RISK-3",
      label: "焦点异常",
      level: "low",
      signal: "1"
    }
  ],
  activityTimeline: [
    {
      id: "ACT-1",
      at: "10:35",
      actor: "拍摄完成 · 03号机位",
      summary: "极光系列"
    },
    {
      id: "ACT-2",
      at: "10:22",
      actor: "质检通过 · 145 张",
      summary: "MOD-SOFA-0045"
    },
    {
      id: "ACT-3",
      at: "10:15",
      actor: "Agent 巡检标记 · 焦点",
      summary: "AUR-CHAIR-0012_0342.CR3"
    },
    {
      id: "ACT-4",
      at: "09:58",
      actor: "精修完成 · 第 07 批",
      summary: "三件套系列 V2"
    },
    {
      id: "ACT-5",
      at: "09:41",
      actor: "拍摄开始 · 04号机位",
      summary: "流明灯具"
    }
  ],
  aiInspectionFeed: [
    {
      id: "AI-1",
      assetId: "AUR-CHAIR-0012_0342.CR3",
      score: 94,
      finding: "焦点异常 · 左侧边缘"
    },
    {
      id: "AI-2",
      assetId: "FFCS-V7_1201.CR3",
      score: 86,
      finding: "反光 · 表镜"
    },
    {
      id: "AI-3",
      assetId: "MOD-SOFA-0045_0877.CR3",
      score: 82,
      finding: "曝光偏移 · +1.2 EV"
    },
    {
      id: "AI-4",
      assetId: "NPR_45ML_2221.CR3",
      score: 91,
      finding: "色彩偏移 · 标签"
    }
  ]
};
