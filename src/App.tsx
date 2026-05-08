import { useEffect, useState } from "react";
import { AuthGate } from "./features/auth/AuthGate";
import type { AppRoute } from "./features/auth/authTypes";
import { getPageAccess } from "./features/auth/authTypes";
import { useAuthState } from "./features/auth/useAuthState";
import { CommandCenter } from "./features/command-center/CommandCenter";
import {
  AssetInboxPage,
  DeliveryReadinessPage,
  QcRetouchQueuePage,
  ReviewGalleryPage
} from "./features/read-models/ReadModelPages";

interface ParsedAppRoute {
  route: AppRoute;
  params: URLSearchParams;
}

const readModelRoutes = new Set<AppRoute>([
  "asset-inbox",
  "qc-retouch",
  "review-gallery",
  "delivery-readiness"
]);

function parseAppRoute(): ParsedAppRoute {
  if (typeof window === "undefined") {
    return { route: "command-center", params: new URLSearchParams() };
  }

  const rawHash = window.location.hash.replace(/^#/, "");
  const [hashRoute, hashQuery = ""] = rawHash.split("?");
  const params = new URLSearchParams(hashQuery);

  new URLSearchParams(window.location.search).forEach((value, key) => {
    if (!params.has(key)) {
      params.set(key, value);
    }
  });

  if (readModelRoutes.has(hashRoute as AppRoute)) {
    return { route: hashRoute as AppRoute, params };
  }

  return { route: "command-center", params };
}

function useAppRoute(): ParsedAppRoute {
  const [route, setRoute] = useState(parseAppRoute);

  useEffect(() => {
    const handleRouteChange = () => {
      setRoute(parseAppRoute());
    };

    window.addEventListener("hashchange", handleRouteChange);

    return () => {
      window.removeEventListener("hashchange", handleRouteChange);
    };
  }, []);

  return route;
}

export default function App() {
  const { route, params } = useAppRoute();
  const { auth, runtime } = useAuthState(params);
  const access = getPageAccess(route, auth.role);
  const effectiveSession =
    auth.session === "signed-in" && access === "none"
      ? "forbidden"
      : auth.session;

  const children = () => {
    if (route === "asset-inbox") {
      return <AssetInboxPage params={params} authRuntime={runtime} />;
    }
    if (route === "qc-retouch") {
      return <QcRetouchQueuePage params={params} authRuntime={runtime} />;
    }
    if (route === "review-gallery") {
      return <ReviewGalleryPage params={params} authRuntime={runtime} />;
    }
    if (route === "delivery-readiness") {
      return <DeliveryReadinessPage params={params} authRuntime={runtime} />;
    }
    return <CommandCenter authRuntime={runtime} />;
  };

  return (
    <AuthGate
      auth={{ ...auth, session: effectiveSession }}
      currentRoute={route}
      runtime={runtime}
    >
      {children()}
    </AuthGate>
  );
}
