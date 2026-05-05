import { useEffect, useState } from "react";
import { commandCenterClient } from "../../api/client";
import type { CommandCenterSnapshot } from "../../api/types";

type SnapshotStatus = "loading" | "ready" | "error";
type CommandCenterDebugState = "live" | "loading" | "error";

interface CommandCenterSnapshotState {
  snapshot: CommandCenterSnapshot | null;
  status: SnapshotStatus;
  errorMessage: string | null;
  debugState: CommandCenterDebugState;
  canRetry: boolean;
  retry: () => void;
}

type CommandCenterSnapshotDataState = Omit<CommandCenterSnapshotState, "retry">;

const baseLoadingState: CommandCenterSnapshotDataState = {
  snapshot: null,
  status: "loading",
  errorMessage: null,
  debugState: "live",
  canRetry: import.meta.env.DEV
};

function getDebugState(): CommandCenterDebugState {
  if (typeof window === "undefined" || !import.meta.env.DEV) {
    return "live";
  }

  const stateParam = new URLSearchParams(window.location.search).get(
    "commandCenterState"
  );

  if (stateParam === "loading" || stateParam === "error") {
    return stateParam;
  }

  return "live";
}

export function useCommandCenterSnapshot(): CommandCenterSnapshotState {
  const [reloadToken, setReloadToken] = useState(0);
  const [state, setState] =
    useState<CommandCenterSnapshotDataState>(baseLoadingState);

  const retry = () => {
    setState(baseLoadingState);
    setReloadToken((current) => current + 1);
  };

  useEffect(() => {
    let isCurrent = true;
    const debugState = getDebugState();

    if (debugState === "loading") {
      setState({
        snapshot: null,
        status: "loading",
        errorMessage: null,
        debugState,
        canRetry: true
      });

      return () => {
        isCurrent = false;
      };
    }

    if (debugState === "error") {
      setState({
        snapshot: null,
        status: "error",
        errorMessage: "Simulated read boundary fault for internal debug",
        debugState,
        canRetry: true
      });

      return () => {
        isCurrent = false;
      };
    }

    commandCenterClient
      .getSnapshot()
      .then((snapshot) => {
        if (!isCurrent) {
          return;
        }

        setState({
          snapshot,
          status: "ready",
          errorMessage: null,
          debugState,
          canRetry: import.meta.env.DEV
        });
      })
      .catch((error: unknown) => {
        if (!isCurrent) {
          return;
        }

        setState({
          snapshot: null,
          status: "error",
          errorMessage:
            error instanceof Error
              ? error.message
              : "Unable to load command center snapshot",
          debugState,
          canRetry: import.meta.env.DEV
        });
      });

    return () => {
      isCurrent = false;
    };
  }, [reloadToken]);

  return {
    ...state,
    retry
  };
}
