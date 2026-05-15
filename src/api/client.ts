import { commandCenterMock } from "../mocks/commandCenter.mock";
import { fetchCommandCenterV2Snapshot } from "./backendReadModels";
import type { CommandCenterSnapshot } from "./types";

export interface CommandCenterReadClient {
  getSnapshot(): Promise<CommandCenterSnapshot>;
}

function cloneCommandCenterSnapshot(
  snapshot: CommandCenterSnapshot
): CommandCenterSnapshot {
  return structuredClone(snapshot);
}

export class MockCommandCenterClient implements CommandCenterReadClient {
  async getSnapshot(): Promise<CommandCenterSnapshot> {
    return cloneCommandCenterSnapshot(commandCenterMock);
  }
}

interface BackendCommandCenterClientOptions {
  baseUrl: string;
  headers?: HeadersInit;
}

export class BackendCommandCenterClient implements CommandCenterReadClient {
  constructor(private readonly options: BackendCommandCenterClientOptions) {}

  async getSnapshot(): Promise<CommandCenterSnapshot> {
    return fetchCommandCenterV2Snapshot(
      this.options.baseUrl,
      this.options.headers
    );
  }
}

function createCommandCenterClient(): CommandCenterReadClient {
  const backendBaseUrl = import.meta.env.VITE_BACKEND_API_BASE_URL?.trim();

  if (!backendBaseUrl) {
    return new MockCommandCenterClient();
  }

  return new BackendCommandCenterClient({
    baseUrl: backendBaseUrl,
    headers: {
      "x-user-role": import.meta.env.VITE_BACKEND_USER_ROLE ?? "operator",
      "x-user-name":
        import.meta.env.VITE_BACKEND_USER_NAME ?? "Frontend Operator"
    }
  });
}

export const commandCenterClient: CommandCenterReadClient =
  createCommandCenterClient();
