import { useEffect, useState } from "react";
import { commandCenterClient } from "../../api/client";
import type { CommandCenterSnapshot } from "../../api/types";

type SnapshotStatus = "loading" | "ready" | "error";

interface CommandCenterSnapshotState {
  snapshot: CommandCenterSnapshot | null;
  status: SnapshotStatus;
  errorMessage: string | null;
}

const initialState: CommandCenterSnapshotState = {
  snapshot: null,
  status: "loading",
  errorMessage: null
};

export function useCommandCenterSnapshot(): CommandCenterSnapshotState {
  const [state, setState] =
    useState<CommandCenterSnapshotState>(initialState);

  useEffect(() => {
    let isCurrent = true;

    commandCenterClient
      .getSnapshot()
      .then((snapshot) => {
        if (!isCurrent) {
          return;
        }

        setState({
          snapshot,
          status: "ready",
          errorMessage: null
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
              : "Unable to load command center snapshot"
        });
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  return state;
}
