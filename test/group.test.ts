// test/group.test.ts
// Tests for screen group control (screens sharing a screenGroupID, possibly across controllers)
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { COEX, ScreenGroup } from "../src/index.js";

const DEVICE_A = "http://127.0.0.1:10001";
const DEVICE_B = "http://127.0.0.1:10005";
const DEVICE_C = "http://127.0.0.1:10006";

const GROUP_1 = "{group-1}";
const GROUP_2 = "{group-2}";
const SCREEN_A = "{screen-a}";
const SCREEN_B = "{screen-b}";
const SCREEN_C = "{screen-c}";
const CANVAS_A = 2048;
const CANVAS_B = 2049;
const CANVAS_C = 2050;

interface FakeDevice {
  screens: Array<{ screenID: string; screenName: string; screenGroupID: string; canvasID: number }>;
  groupName: string;
  brightness: Record<string, number>;
  colorTemperature: Record<string, number>;
  gamut: Record<string, string>;
  displayMode: Record<number, number>;
  /** false = the controller acknowledges writes but silently drops them */
  applies: boolean;
  /** when set, the controller stores this value instead of the requested color temperature */
  colorTemperatureSnap?: number;
}

const freshDevices = (): Record<string, FakeDevice> => ({
  [DEVICE_A]: {
    screens: [{ screenID: SCREEN_A, screenName: "Screen A", screenGroupID: GROUP_1, canvasID: CANVAS_A }],
    groupName: "Wall Group",
    brightness: { [SCREEN_A]: 1 },
    colorTemperature: { [SCREEN_A]: 6504 },
    gamut: { [SCREEN_A]: "Custom" },
    displayMode: { [CANVAS_A]: 0 },
    applies: true,
  },
  [DEVICE_B]: {
    screens: [{ screenID: SCREEN_B, screenName: "Screen B", screenGroupID: GROUP_1, canvasID: CANVAS_B }],
    groupName: "Wall Group",
    brightness: { [SCREEN_B]: 1 },
    colorTemperature: { [SCREEN_B]: 6504 },
    gamut: { [SCREEN_B]: "Custom" },
    displayMode: { [CANVAS_B]: 0 },
    applies: true,
  },
  [DEVICE_C]: {
    screens: [{ screenID: SCREEN_C, screenName: "Screen C", screenGroupID: GROUP_2, canvasID: CANVAS_C }],
    groupName: "Lobby Group",
    brightness: { [SCREEN_C]: 1 },
    colorTemperature: { [SCREEN_C]: 6504 },
    gamut: { [SCREEN_C]: "Custom" },
    displayMode: { [CANVAS_C]: 0 },
    applies: true,
  },
});

let devices = freshDevices();
const writes: Array<{ path: string; body: Record<string, unknown> }> = [];
const reads = { displayparams: 0, displayState: 0, screenOutput: 0 };

const json = (data: unknown) => HttpResponse.json({ code: 0, data, message: "Success" });

function handlersFor(base: string) {
  const device = () => devices[base];
  const owned = (ids: unknown): string[] => {
    const list = Array.isArray(ids) ? ids : [];
    return list.filter(
      (id): id is string => typeof id === "string" && device().screens.some((s) => s.screenID === id),
    );
  };
  const record = async (path: string, request: Request) => {
    const body = (await request.json()) as Record<string, unknown>;
    writes.push({ path, body });
    return { body, applied: device().applies };
  };

  return [
    http.get(`${base}/api/v1/screen`, () =>
      json({
        screens: device().screens.map((screen) => ({
          screenID: screen.screenID,
          screenName: screen.screenName,
          screenGroupID: screen.screenGroupID,
          canvases: [{ canvasID: screen.canvasID }],
        })),
        screenGroups: [
          { screenGroupID: device().screens[0].screenGroupID, name: device().groupName, isShow: true },
        ],
      }),
    ),
    http.get(`${base}/api/v1/screen/displayparams`, () => {
      reads.displayparams += 1;
      return json({
        list: device().screens.map((screen) => ({
          screenId: screen.screenID,
          brightness: device().brightness[screen.screenID],
          colorTemperature: device().colorTemperature[screen.screenID],
          gamma: 2.8,
        })),
      });
    }),
    http.get(`${base}/api/v1/screen/output`, () => {
      reads.screenOutput += 1;
      return json(
        device().screens.map((screen) => ({
          screenId: screen.screenID,
          gamutList: {
            currentGamutName: device().gamut[screen.screenID],
            colorGamutInfoList: [
              { colorGamutInfo: { targetGamut: { name: "Rec.2020" } } },
              { colorGamutInfo: { targetGamut: { name: device().gamut[screen.screenID] } } },
            ],
          },
        })),
      );
    }),
    http.get(`${base}/api/v1/screen/output/display/state`, () => {
      reads.displayState += 1;
      return json({
        mappingState: [],
        displayState: device().screens.map((screen) => ({
          canvasID: screen.canvasID,
          displayMode: device().displayMode[screen.canvasID],
        })),
      });
    }),
    http.put(`${base}/api/v1/screen/brightness`, async ({ request }) => {
      const { body, applied } = await record("screen/brightness", request);
      if (applied) {
        for (const screenID of owned(body.screenIdList)) {
          device().brightness[screenID] = body.brightness as number;
        }
      }
      return json({});
    }),
    http.put(`${base}/api/v1/screen/colortemperature`, async ({ request }) => {
      const { body, applied } = await record("screen/colortemperature", request);
      if (applied) {
        for (const screenID of owned(body.screenIdList)) {
          device().colorTemperature[screenID] =
            device().colorTemperatureSnap ?? (body.colorTemperature as number);
        }
      }
      return json({});
    }),
    http.put(`${base}/api/v1/screen/gamma`, async ({ request }) => {
      await record("screen/gamma", request);
      return json({});
    }),
    http.put(`${base}/api/v1/screen/output/gamut`, async ({ request }) => {
      const { body, applied } = await record("screen/output/gamut", request);
      if (applied) {
        for (const screenID of owned(body.screenIdList)) {
          device().gamut[screenID] = body.name as string;
        }
      }
      return json({});
    }),
    http.put(`${base}/api/v1/screen/output/displaymode`, async ({ request }) => {
      const { body, applied } = await record("screen/output/displaymode", request);
      if (applied) {
        for (const screenID of owned(body.screenIdList)) {
          const screen = device().screens.find((s) => s.screenID === screenID);
          if (screen) {
            device().displayMode[screen.canvasID] = body.value as number;
          }
        }
      }
      return json({});
    }),
    http.post(`${base}/api/v1/screen/multi/brightness`, async ({ request }) => {
      const { body, applied } = await record("screen/multi/brightness", request);
      if (applied) {
        const info = (body.screenBrightnessInfo ?? []) as Array<{ screenID: string; ratio: number }>;
        for (const screen of info) {
          device().brightness[screen.screenID] = screen.ratio;
        }
      }
      return json("");
    }),
  ];
}

const server = setupServer(
  ...handlersFor(DEVICE_A),
  ...handlersFor(DEVICE_B),
  ...handlersFor(DEVICE_C),
);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterAll(() => server.close());
beforeEach(() => {
  server.resetHandlers();
  devices = freshDevices();
  writes.length = 0;
  reads.displayparams = 0;
  reads.displayState = 0;
  reads.screenOutput = 0;
});

const deviceA = () => new COEX("127.0.0.1", 10001);
const deviceB = () => new COEX("127.0.0.1", 10005);
const deviceC = () => new COEX("127.0.0.1", 10006);

const bodies = (path: string) => writes.filter((write) => write.path === path).map((write) => write.body);

describe("screen groups", () => {
  it("groups screens of a controller by screenGroupID, with name and canvas", async () => {
    const groups = await deviceA().apiInstance.getScreenGroups();
    expect(groups).toEqual([
      {
        groupID: GROUP_1,
        name: "Wall Group",
        screens: [{ screenID: SCREEN_A, screenName: "Screen A", canvasIDs: [CANVAS_A] }],
      },
    ]);
  });

  it("keeps separate controllers apart in their own group listing", async () => {
    const groups = await deviceC().apiInstance.getScreenGroups();
    expect(groups[0].groupID).toBe(GROUP_2);
    expect(groups[0].name).toBe("Lobby Group");
    expect(groups[0].screens[0].screenID).toBe(SCREEN_C);
  });

  it("lists available gamut names with the active one", async () => {
    const [gamut] = await deviceB().apiInstance.getGamutList();
    expect(gamut).toEqual({
      screenId: SCREEN_B,
      currentGamutName: "Custom",
      names: ["Rec.2020", "Custom"],
    });
  });
});

describe("ScreenGroup", () => {
  it("rejects construction without devices", () => {
    expect(() => new ScreenGroup([])).toThrow("ScreenGroup requires at least one device");
  });

  it("resolves the screens of the group across controllers", async () => {
    const group = new ScreenGroup([deviceA(), deviceB(), deviceC()], { groupID: GROUP_1 });
    const members = await group.screens();
    expect(members.map((m) => `${m.screenID}@${m.device.port}`)).toEqual([
      `${SCREEN_A}@10001`,
      `${SCREEN_B}@10005`,
    ]);
  });

  it("addresses every screen when no group ID is given", async () => {
    const group = new ScreenGroup([deviceA(), deviceB(), deviceC()]);
    expect(await group.screens()).toHaveLength(3);
  });

  it("sets brightness in percent on every controller, with each controller's own screens", async () => {
    await new ScreenGroup([deviceA(), deviceB()], { groupID: GROUP_1 }).brightness(35);
    expect(bodies("screen/brightness")).toEqual([
      { screenIdList: [SCREEN_A], brightness: 0.35 },
      { screenIdList: [SCREEN_B], brightness: 0.35 },
    ]);
  });

  it("sets color temperature with the screenIdList payload the controller expects", async () => {
    await new ScreenGroup([deviceA()], { groupID: GROUP_1 }).colortemperature(4000);
    expect(bodies("screen/colortemperature")).toEqual([
      { screenIdList: [SCREEN_A], colorTemperature: 4000 },
    ]);
  });

  it("accepts a controller that snaps the color temperature to its own preset", async () => {
    devices[DEVICE_A].colorTemperatureSnap = 6504; // device quantizes 7000K to the nearest gamut preset
    await new ScreenGroup([deviceA()], { groupID: GROUP_1 }).colortemperature(7000);
    expect(devices[DEVICE_A].colorTemperature[SCREEN_A]).toBe(6504);
  });

  it("switches the color gamut by name", async () => {
    await new ScreenGroup([deviceA(), deviceB()], { groupID: GROUP_1 }).gamut("Rec.2020");
    expect(bodies("screen/output/gamut")).toEqual([
      { name: "Rec.2020", screenIdList: [SCREEN_A] },
      { name: "Rec.2020", screenIdList: [SCREEN_B] },
    ]);
  });

  it("blackouts, freezes and restores the whole group", async () => {
    const group = new ScreenGroup([deviceA(), deviceB()], { groupID: GROUP_1 });
    await group.blackout();
    await group.freeze();
    await group.normal();
    expect(bodies("screen/output/displaymode")).toEqual([
      { value: 1, screenIdList: [SCREEN_A] },
      { value: 1, screenIdList: [SCREEN_B] },
      { value: 2, screenIdList: [SCREEN_A] },
      { value: 2, screenIdList: [SCREEN_B] },
      { value: 0, screenIdList: [SCREEN_A] },
      { value: 0, screenIdList: [SCREEN_B] },
    ]);
    expect(devices[DEVICE_A].displayMode[CANVAS_A]).toBe(0);
    expect(devices[DEVICE_B].displayMode[CANVAS_B]).toBe(0);
  });

  it("does not call controllers without screens in the group", async () => {
    await new ScreenGroup([deviceA(), deviceB(), deviceC()], { groupID: GROUP_1 }).blackout();
    expect(writes).toHaveLength(2);
  });

  it("fails when no controller holds the group", async () => {
    const group = new ScreenGroup([deviceC()], { groupID: GROUP_1 });
    await expect(group.brightness(50)).rejects.toThrow("No screens found in screen group {group-1}");
  });

  it("names the controller that rejected a group command", async () => {
    server.use(
      http.put(`${DEVICE_B}/api/v1/screen/brightness`, () =>
        HttpResponse.json({ code: 1, data: null, message: "device locked" }),
      ),
    );
    const group = new ScreenGroup([deviceA(), deviceB()], { groupID: GROUP_1 });
    await expect(group.brightness(50)).rejects.toThrow(
      "Screen group command failed on 127.0.0.1:10005: device locked",
    );
  });

  it("reports the valid gamut names and active gamut of the controllers", async () => {
    const gamuts = await new ScreenGroup([deviceA(), deviceB()], { groupID: GROUP_1 }).gamuts();
    expect(gamuts.map((g) => `${g.screenId}:${g.currentGamutName}`)).toEqual([
      `${SCREEN_A}:Custom`,
      `${SCREEN_B}:Custom`,
    ]);
  });

  describe("read-back verification", () => {
    it("reads the value back on every controller after sending", async () => {
      await new ScreenGroup([deviceA(), deviceB()], { groupID: GROUP_1 }).brightness(42);
      expect(reads.displayparams).toBe(2);
    });

    it("throws when a controller acknowledges but does not apply the write", async () => {
      devices[DEVICE_B].applies = false;
      const group = new ScreenGroup([deviceA(), deviceB()], { groupID: GROUP_1 });
      await expect(group.brightness(42, { timeoutMs: 60 })).rejects.toThrow(
        "Screen group command was not applied: 127.0.0.1:10005 {screen-b} brightness 1 (requested 0.42) after 60ms",
      );
      expect(devices[DEVICE_A].brightness[SCREEN_A]).toBe(0.42);
    });

    it("catches a blackout that never reached the canvas", async () => {
      devices[DEVICE_A].applies = false;
      const group = new ScreenGroup([deviceA()], { groupID: GROUP_1 });
      await expect(group.blackout({ timeoutMs: 60 })).rejects.toThrow(
        "canvas 2048 display mode 0 (requested 1)",
      );
    });

    it("catches a gamut switch that did not stick", async () => {
      devices[DEVICE_A].applies = false;
      await expect(
        new ScreenGroup([deviceA()], { groupID: GROUP_1 }).gamut("Rec.2020", { timeoutMs: 60 }),
      ).rejects.toThrow("gamut Custom (requested Rec.2020)");
    });

    it("skips the read-back when verification is switched off", async () => {
      devices[DEVICE_B].applies = false;
      await expect(
        new ScreenGroup([deviceA(), deviceB()], { groupID: GROUP_1 }).brightness(42, { verify: false }),
      ).resolves.toBeUndefined();
      expect(reads.displayparams).toBe(0);
    });
  });
});

describe("multi/brightness (VMP endpoint)", () => {
  it("sends the payload shape VMP uses", async () => {
    await deviceA().apiInstance.setMultiBrightness([{ screenID: SCREEN_A, brightness: 58 }]);
    expect(bodies("screen/multi/brightness")).toEqual([
      {
        screenBrightnessInfo: [
          {
            screenID: SCREEN_A,
            ratio: 0.58,
            nit: 0,
            cabinetParam: {
              idList: [],
              ratio: 0.58,
              nit: 0,
              brightnessBaseValue: 0,
              ratioCol: false,
            },
          },
        ],
      },
    ]);
  });

  it("carries absolute brightness and a cabinet subset", async () => {
    await deviceA().apiInstance.setMultiBrightness([
      { screenID: SCREEN_A, nit: 1200, cabinetIDs: [1, 2], ratioCol: true, brightnessBaseValue: 50 },
    ]);
    expect(bodies("screen/multi/brightness")).toEqual([
      {
        screenBrightnessInfo: [
          {
            screenID: SCREEN_A,
            ratio: 0,
            nit: 1200,
            cabinetParam: {
              idList: [1, 2],
              ratio: 0,
              nit: 1200,
              brightnessBaseValue: 50,
              ratioCol: true,
            },
          },
        ],
      },
    ]);
  });

  it("requires a brightness or nit per screen", async () => {
    await expect(deviceA().apiInstance.setMultiBrightness([{ screenID: SCREEN_A }])).rejects.toThrow(
      "each screen needs brightness (percent) or nit",
    );
    await expect(deviceA().apiInstance.setMultiBrightness([])).rejects.toThrow(
      "screens must be a non-empty array",
    );
  });
});

describe("screen values", () => {
  it("rejects brightness outside 0-100 percent", async () => {
    const api = deviceA().apiInstance;
    await expect(api.brightness(150)).rejects.toThrow("brightness must be between 0 and 100");
    await expect(api.screenbrightness(150, [SCREEN_A])).rejects.toThrow(
      "brightness must be between 0 and 100",
    );
  });

  it("rejects color temperature outside 1700-15000", async () => {
    await expect(deviceA().apiInstance.colortemperature(500)).rejects.toThrow(
      "colorTemp must be between 1700 and 15000",
    );
  });

  it("requires a gamut name instead of a numeric index", async () => {
    await expect(deviceA().apiInstance.switchColorGamut([SCREEN_A], "")).rejects.toThrow(
      "gamutName must be a non-empty string",
    );
  });

  it("sends gamma with screenIdList", async () => {
    await deviceA().apiInstance.gamma(2.4, [SCREEN_A]);
    expect(bodies("screen/gamma")).toEqual([{ screenIdList: [SCREEN_A], gamma: 2.4 }]);
  });
});
