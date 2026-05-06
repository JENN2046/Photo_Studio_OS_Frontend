import type { CommandCenterSnapshot } from "../api/types";

export const commandCenterMock: CommandCenterSnapshot = {
  generatedAt: "2026-05-05T09:30:00+08:00",
  studio: {
    name: "Brooklyn Studio A",
    locationLabel: "Set 1 / Set 02",
    modeLabel: "Command Center Alpha",
    operator: "Studio Ops",
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
      label: "Client Intake",
      status: "intake",
      state: "stable",
      count: 3,
      detail: "Briefs and SKU manifests mirrored"
    },
    {
      id: "PATH-SHOOT",
      label: "Shoot Floor",
      status: "shoot",
      state: "watch",
      count: 1,
      detail: "Continuity watch on Citrine scarf set"
    },
    {
      id: "PATH-RETOUCH",
      label: "Retouch",
      status: "retouch",
      state: "active",
      count: 2,
      detail: "Lamp detail pass moving through polish"
    },
    {
      id: "PATH-REVIEW",
      label: "Review",
      status: "review",
      state: "active",
      count: 2,
      detail: "Client and producer decisions pending"
    },
    {
      id: "PATH-DELIVERY",
      label: "Delivery",
      status: "delivery",
      state: "stable",
      count: 2,
      detail: "Packages visible as read-only sentinels"
    }
  ],
  projects: [
    {
      id: "PRJ-128",
      name: "Aurora Collection",
      client: "Luxury Furniture",
      owner: "Studio Ops",
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
      name: "Triæpiece Series V2",
      client: "Product Launch",
      owner: "Retouch Lead",
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
      name: "Noir Fragrance",
      client: "Campaign",
      owner: "Producer Desk",
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
      name: "Lumen Lighting",
      client: "E-Commerce",
      owner: "Capture Lead",
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
      label: "Obsidian leather tote",
      productLine: "Bags",
      status: "review",
      heroAssetId: "AST-9012",
      assetCount: 16,
      reviewState: "waiting"
    },
    {
      id: "SKU-LH-022",
      projectId: "PRJ-129",
      label: "Brushed steel lamp",
      productLine: "Lighting",
      status: "retouch",
      heroAssetId: "AST-9050",
      assetCount: 12,
      reviewState: "cleared"
    },
    {
      id: "SKU-CM-007",
      projectId: "PRJ-130",
      label: "Citrine silk scarf",
      productLine: "Accessories",
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
      label: "Client review pass 02",
      state: "waiting",
      reviewer: "Atelier Noir Brand Desk",
      pendingItems: 14
    },
    {
      id: "REV-442",
      projectId: "PRJ-130",
      label: "Producer composition check",
      state: "blocked",
      reviewer: "Internal Producer",
      pendingItems: 6
    }
  ],
  deliveries: [
    {
      id: "DEL-220",
      projectId: "PRJ-128",
      label: "Marketplace crop set",
      status: "ready",
      assetCount: 86
    },
    {
      id: "DEL-221",
      projectId: "PRJ-128",
      label: "Editorial selects package",
      status: "sentinel",
      assetCount: 24
    }
  ],
  approvalQueue: [
    {
      id: "APR-801",
      type: "review",
      title: "AUR-CHAIR-0012",
      projectId: "Set 1 / Set 02",
      state: "blocked",
      ageHours: 0.75
    },
    {
      id: "APR-802",
      type: "qc",
      title: "MOD-SOFA-0045",
      projectId: "Set 1 / Set 01",
      state: "blocked",
      ageHours: 1.3
    },
    {
      id: "APR-803",
      type: "delivery",
      title: "TBL-COFFEE-0031",
      projectId: "Set 1 / Set 03",
      state: "waiting",
      ageHours: 2
    },
    {
      id: "APR-804",
      type: "retouch",
      title: "LMP-TBL-0022",
      projectId: "Set 1 / Set 01",
      state: "cleared",
      ageHours: 3.1
    }
  ],
  riskPulse: [
    {
      id: "RISK-1",
      label: "High Exposure Clips",
      level: "high",
      signal: "3"
    },
    {
      id: "RISK-2",
      label: "Color Deviation",
      level: "medium",
      signal: "2"
    },
    {
      id: "RISK-3",
      label: "Focus Anomalies",
      level: "low",
      signal: "1"
    }
  ],
  activityTimeline: [
    {
      id: "ACT-1",
      at: "10:35 AM",
      actor: "Capture Complete · Set 03",
      summary: "Aurora Collection"
    },
    {
      id: "ACT-2",
      at: "10:22 AM",
      actor: "QC Pass · 145 Images",
      summary: "MOD-SOFA-0045"
    },
    {
      id: "ACT-3",
      at: "10:15 AM",
      actor: "AI Inspection Flag · Focus",
      summary: "AUR-CHAIR-0012_0342.CR3"
    },
    {
      id: "ACT-4",
      at: "09:58 AM",
      actor: "Retouch Complete · Batch 07",
      summary: "TRIÆPIECE SERIES V2"
    },
    {
      id: "ACT-5",
      at: "09:41 AM",
      actor: "Capture Started · Set 04",
      summary: "Lumen Lighting"
    }
  ],
  aiInspectionFeed: [
    {
      id: "AI-1",
      assetId: "AUR-CHAIR-0012_0342.CR3",
      score: 94,
      finding: "Focus Anomaly · Left Edge"
    },
    {
      id: "AI-2",
      assetId: "FFCS-V7_1201.CR3",
      score: 86,
      finding: "Reflection · Watch Crystal"
    },
    {
      id: "AI-3",
      assetId: "MOD-SOFA-0045_0877.CR3",
      score: 82,
      finding: "Exposure Deviation · +1.2 EV"
    },
    {
      id: "AI-4",
      assetId: "NPR_45ML_2221.CR3",
      score: 91,
      finding: "Color Deviation · Label"
    }
  ]
};
