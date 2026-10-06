// src/group.ts - Screen group control across one or more COEX controllers
//
// A screen group lives in the project data of each controller: screens of the
// same wall share a `screenGroupID` in GET /api/v1/screen. The controllers do
// not talk to each other, so a group spanning two controllers (e.g. two MX40
// Pro) is commanded by sending the same request to every controller, each with
// the screen IDs it owns - the same fan-out VMP performs.
//
// COEX fails silently: a command for a screen the controller does not own is
// answered with `Success` and applied to zero cabinets. Group commands therefore
// read the value back by default and throw when it did not land.

import type { ScreenApi } from "./api/screen.js";
import type { GamutInfo, GroupCommandOptions } from "./types.js";

export type { GroupCommandOptions } from "./types.js";

/** A controller the group can talk to - a `COEX` instance satisfies this. */
export interface GroupDevice {
  readonly ip: string;
  readonly port: number;
  readonly apiInstance: Pick<
    ScreenApi,
    | "getScreenGroups"
    | "getGamutList"
    | "getDisplayParams"
    | "getDisplayState"
    | "brightness"
    | "colortemperature"
    | "switchColorGamut"
    | "displaymode"
  >;
}

export interface GroupScreen {
  device: GroupDevice;
  screenID: string;
  screenName: string;
  canvasIDs: number[];
}

export interface ScreenGroupOptions {
  /**
   * Screen group ID (`screenGroupID` in GET /api/v1/screen).
   * Omit to address every screen of the given controllers.
   */
  groupID?: string;
}

const VERIFY_POLL_MS = 25;
const DEFAULT_VERIFY_TIMEOUT_MS = 1000;
/** The controller reports brightness as a float and may round it. */
const BRIGHTNESS_TOLERANCE = 0.02;
/** The controller snaps color temperature to the gamut presets it knows. */
const COLOR_TEMPERATURE_TOLERANCE = 1000;

function reasonOf(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (error && typeof error === "object" && "error" in error) {
    return String(error.error);
  }
  return JSON.stringify(error);
}

/** Entries of a `{code, data: {list: [...]}}` envelope (screen/displayparams). */
function envelopeList(envelope: unknown): Array<Record<string, unknown>> {
  if (typeof envelope !== "object" || envelope === null || !("data" in envelope)) {
    return [];
  }
  const data = envelope.data;
  if (typeof data !== "object" || data === null || !("list" in data) || !Array.isArray(data.list)) {
    return [];
  }
  return data.list.filter(
    (entry): entry is Record<string, unknown> => typeof entry === "object" && entry !== null,
  );
}

/** canvasID -> displayMode from a `{code, data: {displayState: [...]}}` envelope. */
function displayModes(envelope: unknown): Record<number, number> {
  if (typeof envelope !== "object" || envelope === null || !("data" in envelope)) {
    return {};
  }
  const data = envelope.data;
  if (
    typeof data !== "object" ||
    data === null ||
    !("displayState" in data) ||
    !Array.isArray(data.displayState)
  ) {
    return {};
  }

  const modes: Record<number, number> = {};
  for (const entry of data.displayState) {
    if (
      typeof entry === "object" &&
      entry !== null &&
      "canvasID" in entry &&
      "displayMode" in entry &&
      typeof entry.canvasID === "number" &&
      typeof entry.displayMode === "number"
    ) {
      modes[entry.canvasID] = entry.displayMode;
    }
  }
  return modes;
}

export class ScreenGroup {
  public readonly devices: GroupDevice[];
  public readonly groupID?: string;
  private members?: GroupScreen[];

  constructor(devices: GroupDevice[], options: ScreenGroupOptions = {}) {
    if (!Array.isArray(devices) || devices.length === 0) {
      throw new Error("ScreenGroup requires at least one device");
    }
    this.devices = devices;
    this.groupID = options.groupID;
  }

  /** Screens of the group, resolved once from each controller and cached. */
  async screens(refresh = false): Promise<GroupScreen[]> {
    if (this.members && !refresh) {
      return this.members;
    }

    const found = await Promise.all(
      this.devices.map(async (device) => {
        const groups = await device.apiInstance.getScreenGroups();
        const wanted =
          this.groupID === undefined
            ? groups
            : groups.filter((group) => group.groupID === this.groupID);
        return wanted.flatMap((group) =>
          group.screens.map((screen) => ({
            device,
            screenID: screen.screenID,
            screenName: screen.screenName,
            canvasIDs: screen.canvasIDs,
          })),
        );
      }),
    );

    this.members = found.flat();
    return this.members;
  }

  /** Color gamut names available on the controllers, with the active one. */
  async gamuts(): Promise<GamutInfo[]> {
    const lists = await Promise.all(
      this.devices.map((device) => device.apiInstance.getGamutList()),
    );
    return lists.flat();
  }

  /** Brightness in percent (0-100) for every screen of the group. */
  async brightness(value: number, options: GroupCommandOptions = {}): Promise<void> {
    if (typeof value !== "number" || value < 0 || value > 100) {
      throw new Error("brightness must be between 0 and 100");
    }
    const ratio = value / 100;

    await this.command(
      (api, screens) => api.brightness(value, screens.map((screen) => screen.screenID)),
      options,
      async (api, screens) => {
        const reported = envelopeList(await api.getDisplayParams());
        const mismatches: string[] = [];
        for (const screen of screens) {
          const entry = reported.find((item) => item.screenId === screen.screenID);
          if (entry === undefined) {
            continue; // screen without cabinets reports no display params
          }
          const observed = typeof entry.brightness === "number" ? entry.brightness : undefined;
          if (observed === undefined || Math.abs(observed - ratio) > BRIGHTNESS_TOLERANCE) {
            mismatches.push(`${screen.screenID} brightness ${observed} (requested ${ratio})`);
          }
        }
        return mismatches.length > 0 ? mismatches.join(", ") : undefined;
      },
    );
  }

  /** Color temperature in Kelvin (1700-15000) for every screen of the group. */
  async colortemperature(kelvin: number, options: GroupCommandOptions = {}): Promise<void> {
    await this.command(
      (api, screens) => api.colortemperature(kelvin, screens.map((screen) => screen.screenID)),
      options,
      async (api, screens) => {
        const reported = envelopeList(await api.getDisplayParams());
        const mismatches: string[] = [];
        for (const screen of screens) {
          const entry = reported.find((item) => item.screenId === screen.screenID);
          if (entry === undefined) {
            continue;
          }
          const observed =
            typeof entry.colorTemperature === "number" ? entry.colorTemperature : undefined;
          if (
            observed === undefined ||
            Math.abs(observed - kelvin) > COLOR_TEMPERATURE_TOLERANCE
          ) {
            mismatches.push(`${screen.screenID} color temperature ${observed} (requested ${kelvin})`);
          }
        }
        return mismatches.length > 0 ? mismatches.join(", ") : undefined;
      },
    );
  }

  /** Switch color gamut by name (see `gamuts()`) for every screen of the group. */
  async gamut(name: string, options: GroupCommandOptions = {}): Promise<void> {
    await this.command(
      (api, screens) => api.switchColorGamut(screens.map((screen) => screen.screenID), name),
      options,
      async (api, screens) => {
        const reported = await api.getGamutList();
        const mismatches: string[] = [];
        for (const screen of screens) {
          const entry = reported.find((item) => item.screenId === screen.screenID);
          if (entry === undefined) {
            continue;
          }
          if (entry.currentGamutName !== name) {
            mismatches.push(`${screen.screenID} gamut ${entry.currentGamutName} (requested ${name})`);
          }
        }
        return mismatches.length > 0 ? mismatches.join(", ") : undefined;
      },
    );
  }

  /** Blackout (display mode 1) the whole group. */
  async blackout(options: GroupCommandOptions = {}): Promise<void> {
    await this.displayMode(1, options);
  }

  /** Restore normal display (display mode 0) for the whole group. */
  async normal(options: GroupCommandOptions = {}): Promise<void> {
    await this.displayMode(0, options);
  }

  /** Freeze (display mode 2) the whole group. */
  async freeze(options: GroupCommandOptions = {}): Promise<void> {
    await this.displayMode(2, options);
  }

  private async displayMode(value: number, options: GroupCommandOptions): Promise<void> {
    await this.command(
      (api, screens) => api.displaymode(value, screens.map((screen) => screen.screenID)),
      options,
      async (api, screens) => {
        const modes = displayModes(await api.getDisplayState());
        const mismatches: string[] = [];
        for (const screen of screens) {
          for (const canvasID of screen.canvasIDs) {
            const observed = modes[canvasID];
            if (observed === undefined) {
              continue;
            }
            if (observed !== value) {
              mismatches.push(
                `${screen.screenID} canvas ${canvasID} display mode ${observed} (requested ${value})`,
              );
            }
          }
        }
        return mismatches.length > 0 ? mismatches.join(", ") : undefined;
      },
    );
  }

  /**
   * Send one screen command to every controller, with the screen IDs it owns,
   * then read the value back unless verification is switched off.
   */
  private async command(
    run: (api: GroupDevice["apiInstance"], screens: GroupScreen[]) => Promise<void>,
    options: GroupCommandOptions,
    check: (api: GroupDevice["apiInstance"], screens: GroupScreen[]) => Promise<string | undefined>,
  ): Promise<void> {
    const members = await this.screens();
    if (members.length === 0) {
      throw new Error(
        this.groupID === undefined
          ? "No screens found on the given devices"
          : `No screens found in screen group ${this.groupID}`,
      );
    }

    const screensByDevice = new Map<GroupDevice, GroupScreen[]>();
    for (const member of members) {
      const screens = screensByDevice.get(member.device) ?? [];
      screens.push(member);
      screensByDevice.set(member.device, screens);
    }

    await Promise.all(
      [...screensByDevice].map(async ([device, screens]) => {
        try {
          await run(device.apiInstance, screens);
        } catch (error) {
          throw new Error(
            `Screen group command failed on ${device.ip}:${device.port}: ${reasonOf(error)}`,
          );
        }
      }),
    );

    if (options.verify === false) {
      return;
    }

    const timeoutMs = options.timeoutMs ?? DEFAULT_VERIFY_TIMEOUT_MS;
    const failures = (
      await Promise.all(
        [...screensByDevice].map(async ([device, screens]) => {
          const deadline = Date.now() + timeoutMs;
          for (;;) {
            let mismatch: string | undefined;
            try {
              mismatch = await check(device.apiInstance, screens);
            } catch (error) {
              mismatch = `read-back failed: ${reasonOf(error)}`;
            }
            if (mismatch === undefined) {
              return undefined;
            }
            if (Date.now() >= deadline) {
              return `${device.ip}:${device.port} ${mismatch} after ${timeoutMs}ms`;
            }
            const { promise, resolve } = Promise.withResolvers<void>();
            setTimeout(resolve, VERIFY_POLL_MS);
            await promise;
          }
        }),
      )
    ).filter((failure): failure is string => failure !== undefined);

    if (failures.length > 0) {
      throw new Error(`Screen group command was not applied: ${failures.join("; ")}`);
    }
  }
}
