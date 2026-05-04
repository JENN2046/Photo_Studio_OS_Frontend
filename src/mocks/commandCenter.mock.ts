import type { CommandCenterSnapshot } from "../api/types";

export const commandCenterMock: CommandCenterSnapshot = {
  generatedAt: "2026-05-04T09:30:00+08:00",
  projects: [
    {
      id: "PRJ-128",
      name: "Atelier Noir Spring Capsule",
      client: "Atelier Noir",
      owner: "Studio Ops",
      status: "review",
      dueDate: "2026-05-12",
      skuCount: 18,
      assetCount: 236,
      reviewCount: 4,
      deliveryCount: 2,
      riskLevel: "medium",
      completionPercent: 72
    },
    {
      id: "PRJ-129",
      name: "Lumen Tabletop Refresh",
      client: "Lumen Home",
      owner: "Retouch Lead",
      status: "retouch",
      dueDate: "2026-05-18",
      skuCount: 12,
      assetCount: 144,
      reviewCount: 1,
      deliveryCount: 0,
      riskLevel: "low",
      completionPercent: 48
    },
    {
      id: "PRJ-130",
      name: "Citrine Editorial Set",
      client: "Citrine Market",
      owner: "Producer Desk",
      status: "shoot",
      dueDate: "2026-05-23",
      skuCount: 9,
      assetCount: 64,
      reviewCount: 0,
      deliveryCount: 0,
      riskLevel: "high",
      completionPercent: 31
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
      title: "Hero crop variance",
      projectId: "PRJ-128",
      state: "waiting",
      ageHours: 7
    },
    {
      id: "APR-802",
      title: "Styling continuity hold",
      projectId: "PRJ-130",
      state: "blocked",
      ageHours: 19
    },
    {
      id: "APR-803",
      title: "Lamp reflection approval",
      projectId: "PRJ-129",
      state: "cleared",
      ageHours: 2
    }
  ],
  riskPulse: [
    {
      id: "RISK-1",
      label: "Client review aging",
      level: "medium",
      signal: "14 pending items over 6h"
    },
    {
      id: "RISK-2",
      label: "Shoot continuity",
      level: "high",
      signal: "Blocked scarf composition pass"
    },
    {
      id: "RISK-3",
      label: "Delivery package drift",
      level: "low",
      signal: "All ready sets remain read-only"
    }
  ],
  activityTimeline: [
    {
      id: "ACT-1",
      at: "09:16",
      actor: "AI Inspection",
      summary: "Flagged scarf lifestyle set for edge shadow variance"
    },
    {
      id: "ACT-2",
      at: "09:04",
      actor: "Retouch Lead",
      summary: "Moved Lumen lamp detail set into polish queue"
    },
    {
      id: "ACT-3",
      at: "08:42",
      actor: "Studio Ops",
      summary: "Prepared Atelier marketplace crop package sentinel"
    }
  ],
  aiInspectionFeed: [
    {
      id: "AI-1",
      assetId: "AST-9012",
      score: 94,
      finding: "Hero tote exposure and contour pass"
    },
    {
      id: "AI-2",
      assetId: "AST-9050",
      score: 89,
      finding: "Lamp metal reflection needs final review"
    },
    {
      id: "AI-3",
      assetId: "AST-9091",
      score: 76,
      finding: "Lifestyle frame has shadow continuity risk"
    }
  ]
};
