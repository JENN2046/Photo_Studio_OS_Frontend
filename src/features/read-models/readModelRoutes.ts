export const readModelRouteIds = [
  "asset-inbox",
  "qc-retouch",
  "review-gallery",
  "delivery-readiness"
] as const;

export type ReadModelRoute = (typeof readModelRouteIds)[number];

export const readModelRouteLabels: Record<ReadModelRoute, string> = {
  "asset-inbox": "素材收件箱",
  "qc-retouch": "质检 / 精修",
  "review-gallery": "审核画廊",
  "delivery-readiness": "交付就绪"
};

export interface ReadModelRouteParams {
  projectId?: string;
  reviewSessionId?: string;
  deliveryId?: string;
}

export function createReadModelHref(
  route: ReadModelRoute,
  params: ReadModelRouteParams
) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      searchParams.set(key, value);
    }
  });

  const query = searchParams.toString();
  return query ? `#${route}?${query}` : `#${route}`;
}

export function getReadModelSharedQuery(params: URLSearchParams): string {
  const next = new URLSearchParams();
  const keys = ["projectId", "reviewSessionId", "deliveryId"] as const;

  keys.forEach((key) => {
    const value = params.get(key)?.trim();

    if (value) {
      next.set(key, value);
    }
  });

  const query = next.toString();
  return query ? `?${query}` : "";
}
