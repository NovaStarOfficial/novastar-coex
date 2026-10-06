// Main entry point for NovaStar COEX API
import ky from "ky";
import { createCoexApi } from "./api/index.js";

// Declare console for Node.js environment
declare const console: {
  log: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
};

// Re-export types
export type {
  ApiResponse,
  Screen,
  Cabinet,
  Preset,
  InputSource,
  ScreenGroupInfo,
  GamutInfo,
  GroupCommandOptions,
  MultiScreenBrightness,
} from "./types.js";
export { ScreenGroup } from "./group.js";
export type { GroupDevice, GroupScreen, ScreenGroupOptions } from "./group.js";

export class COEX {
  private api: ReturnType<typeof createCoexApi>;
  public readonly ip: string;
  public readonly port: number;
  public readonly baseurl: string;
  public debug: boolean;

  constructor(ip: string, port: number = 8001, options: { debug?: boolean } = {}) {
    this.ip = ip;
    this.port = port || 8001;
    this.debug = options.debug || false;
    this.baseurl = `http://${this.ip}:${this.port}`;
    this.api = createCoexApi(this.ip, this.port);
  }

  // Proxy all API methods
  async blackout(): Promise<void> {
    console.log("blackout the screen");
    await this.api.displaymode(1);
  }

  async normal(): Promise<void> {
    console.log("normal the screen");
    await this.api.displaymode(0);
  }

  async freeze(): Promise<void> {
    console.log("freeze the screen");
    await this.api.displaymode(2);
  }

  async brightness(brightnessValue: number): Promise<void> {
    console.log("adjust brightness", brightnessValue);
    const groups = await this.api.getScreenGroups();
    const screenIds = groups.flatMap((group) => group.screens.map((screen) => screen.screenID));
    if (screenIds.length === 0) {
      throw { error: "No screens found to adjust brightness." };
    }
    await this.api.brightness(brightnessValue, screenIds);
  }

  async input(inputName: string): Promise<{ input: string; groupId: string }> {
    const sources = (await this.api.sources()) as unknown[];
    if (!Array.isArray(sources)) {
      throw { error: "Failed to get sources" };
    }
    const lookup: Record<string, string> = {};
    for (const source of sources as Array<{ name?: string; groupId?: string }>) {
      if (source.name) lookup[source.name] = source.groupId || "";
      if (source.groupId) lookup[source.groupId] = source.groupId;
    }
    const groupId = lookup[inputName];
    if (!groupId) {
      throw { error: "Unknown input: " + inputName };
    }

    const response = await ky.put(`${this.baseurl}/api/v1/screen/layer/input`, {
      json: { groupId },
    });
    const data = (await response.json()) as { code?: number; message?: string };
    if (data.code && data.code !== 0) {
      throw { error: data.message };
    }
    return { input: inputName, groupId };
  }

  async summary(): Promise<number> {
    const cabinets = (await this.api.cabinet()) as unknown[];
    if (Array.isArray(cabinets)) {
      console.log("Cabinet count:", cabinets.length);
      return cabinets.length;
    }
    throw { error: "Could not get cabinet count." };
  }

  // Dynamically delegate all other methods to the API
  get apiInstance() {
    return this.api;
  }
}

// Export the factory function as well
export { createCoexApi } from "./api/index.js";
export { createDeviceApi } from "./api/device.js";
export { createScreenApi } from "./api/screen.js";
export { createPresetApi } from "./api/preset.js";
export { createCabinetApi } from "./api/cabinet.js";
