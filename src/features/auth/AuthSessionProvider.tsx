import {
  Auth0Provider,
  useAuth0,
  type AppState
} from "@auth0/auth0-react";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import { getAuth0RuntimeConfig } from "./auth0Config";
import type { Role } from "./authTypes";

type BackendAuthRole =
  | "owner"
  | "assistant"
  | "retoucher"
  | "client_reviewer"
  | "client_admin";

interface AuthSessionContextValue {
  accessToken: string | null;
  errorMessage: string | null;
  isAuth0Configured: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => void;
  logout: () => void;
  role: Role | null;
  source: "auth0" | "mock";
}

const mockSession: AuthSessionContextValue = {
  accessToken: null,
  errorMessage: null,
  isAuth0Configured: false,
  isAuthenticated: false,
  isLoading: false,
  login: () => undefined,
  logout: () => undefined,
  role: null,
  source: "mock"
};

const AuthSessionContext =
  createContext<AuthSessionContextValue>(mockSession);

const backendRoleToFrontendRole: Record<BackendAuthRole, Role> = {
  owner: "admin",
  assistant: "operator",
  retoucher: "retoucher",
  client_reviewer: "client",
  client_admin: "delivery_approver"
};

function decodeAccessTokenPayload(token: string): Record<string, unknown> | null {
  const payload = token.split(".")[1];

  if (!payload) {
    return null;
  }

  try {
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      "="
    );
    const json = atob(padded);

    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function getFrontendRoleFromToken(token: string): Role | null {
  const claims = decodeAccessTokenPayload(token);
  const role = claims?.["https://photo-studio-os/role"];

  if (typeof role !== "string") {
    return null;
  }

  return backendRoleToFrontendRole[role as BackendAuthRole] ?? null;
}

function Auth0SessionBridge({ children }: { children: ReactNode }) {
  const config = useMemo(getAuth0RuntimeConfig, []);
  const {
    error,
    getAccessTokenSilently,
    isAuthenticated,
    isLoading,
    loginWithRedirect,
    logout
  } = useAuth0();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isTokenLoading, setIsTokenLoading] = useState(false);
  const [role, setRole] = useState<Role | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);

  useEffect(() => {
    let isCurrent = true;

    if (!config || !isAuthenticated) {
      setAccessToken(null);
      setIsTokenLoading(false);
      setRole(null);
      setTokenError(null);
      return () => {
        isCurrent = false;
      };
    }

    setIsTokenLoading(true);
    getAccessTokenSilently({
      authorizationParams: {
        audience: config.audience
      }
    })
      .then((token) => {
        if (!isCurrent) {
          return;
        }

        setAccessToken(token);
        setIsTokenLoading(false);
        setRole(getFrontendRoleFromToken(token));
        setTokenError(null);
      })
      .catch((nextError: unknown) => {
        if (!isCurrent) {
          return;
        }

        setAccessToken(null);
        setIsTokenLoading(false);
        setRole(null);
        setTokenError(
          nextError instanceof Error
            ? nextError.message
            : "Unable to acquire Auth0 access token"
        );
      });

    return () => {
      isCurrent = false;
    };
  }, [config, getAccessTokenSilently, isAuthenticated]);

  const value = useMemo<AuthSessionContextValue>(
    () => ({
      accessToken,
      errorMessage: error?.message ?? tokenError,
      isAuth0Configured: Boolean(config),
      isAuthenticated,
      isLoading: isLoading || isTokenLoading,
      login: () => {
        if (!config) {
          return;
        }

        void loginWithRedirect({
          appState: {
            returnTo: `${window.location.pathname}${window.location.search}${window.location.hash}`
          },
          authorizationParams: {
            audience: config.audience
          }
        });
      },
      logout: () => {
        void logout({
          logoutParams: {
            returnTo: window.location.origin
          }
        });
      },
      role,
      source: "auth0"
    }),
    [
      accessToken,
      config,
      error?.message,
      isAuthenticated,
      isLoading,
      isTokenLoading,
      loginWithRedirect,
      logout,
      role,
      tokenError
    ]
  );

  return (
    <AuthSessionContext.Provider value={value}>
      {children}
    </AuthSessionContext.Provider>
  );
}

function onRedirectCallback(appState?: AppState) {
  const targetUrl = appState?.returnTo ?? window.location.pathname;
  window.history.replaceState({}, document.title, targetUrl);
}

export function AppAuthSessionProvider({ children }: { children: ReactNode }) {
  const config = getAuth0RuntimeConfig();

  if (!config) {
    return (
      <AuthSessionContext.Provider value={mockSession}>
        {children}
      </AuthSessionContext.Provider>
    );
  }

  return (
    <Auth0Provider
      authorizationParams={{
        audience: config.audience,
        redirect_uri: window.location.origin
      }}
      cacheLocation="memory"
      clientId={config.clientId}
      domain={config.domain}
      onRedirectCallback={onRedirectCallback}
      useRefreshTokens={false}
    >
      <Auth0SessionBridge>{children}</Auth0SessionBridge>
    </Auth0Provider>
  );
}

export function useAuthSession() {
  return useContext(AuthSessionContext);
}
