import { commandCenterMock } from "../mocks/commandCenter.mock";
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

export const commandCenterClient: CommandCenterReadClient =
  new MockCommandCenterClient();
