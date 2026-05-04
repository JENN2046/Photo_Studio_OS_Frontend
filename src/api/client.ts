import { commandCenterMock } from "../mocks/commandCenter.mock";
import type { CommandCenterSnapshot } from "./types";

export interface CommandCenterReadClient {
  getSnapshot(): Promise<CommandCenterSnapshot>;
}

export class MockCommandCenterClient implements CommandCenterReadClient {
  async getSnapshot(): Promise<CommandCenterSnapshot> {
    return commandCenterMock;
  }
}

export const commandCenterClient: CommandCenterReadClient =
  new MockCommandCenterClient();
