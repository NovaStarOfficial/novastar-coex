import ky from "ky";
import type {
  ApiResponse,
  RGBColor,
  LayerSource,
  CanvasConfig,
  ScreenGroupInfo,
  GamutInfo,
  MultiScreenBrightness,
} from "../types.js";

export interface ScreenApi {
  // Screen info and properties
  screen: () => Promise<unknown>;
  getScreenProperties: () => Promise<unknown>;
  getCabinetCount: () => Promise<unknown>;

  // Screen groups (screens sharing a screenGroupID, possibly across devices)
  getScreenGroups: () => Promise<ScreenGroupInfo[]>;

  // Display modes
  displaymode: (value: number, screenIdList?: string[]) => Promise<void>;
  getDisplayState: () => Promise<unknown>;
  getDisplayParams: () => Promise<unknown>;

  // Brightness (percent, matching the rest of the API; the device takes 0-1)
  brightness: (brightness: number, screenIdList?: string[]) => Promise<void>;
  screenbrightness: (brightness: number, screenIds: string[]) => Promise<void>;

  // Color temperature
  colortemperature: (colorTemp: number, screenIdList?: string[]) => Promise<void>;

  // Gamma
  gamma: (gamma: number, screenIdList?: string[]) => Promise<void>;
  setCustomGamma: (screenId: string, gammaTable: number[]) => Promise<void>;

  // Image/Output
  setCustomGamut: (screenIdList: string[], gamutData: RGBColor) => Promise<void>;
  switchColorGamut: (screenIdList: string[], gamutName: string) => Promise<void>;
  getGamutList: () => Promise<GamutInfo[]>;
  setMultiBrightness: (screens: MultiScreenBrightness[]) => Promise<void>;
  setBrightnessLimitOnOff: (state: boolean, screenIdList: string[]) => Promise<void>;
  setBrightnessLimitValue: (
    screenIdList: string[],
    type: unknown,
    nit?: number,
    ratio?: number,
  ) => Promise<void>;

  // 3D LUT
  enable3DLut: (enable: boolean, screenIdList: string[]) => Promise<void>;
  set3DLutStrength: (screenIdList: string[], strength: number) => Promise<void>;
  import3DLutFile: (screenIdList: string[], file: Blob, fileName: string) => Promise<void>;
  delete3DLutFile: (screenIdList: string[], fileName: string) => Promise<void>;

  // Color Correction
  setColorCorrectionOnOff: (enable: boolean, screenIdList: string[]) => Promise<void>;
  setColorCorrectionBlackWhite: (data: RGBColor[]) => Promise<void>;
  setColorCorrectionOtherColors: (data: unknown[][]) => Promise<void>;

  // Schedule
  getAllScheduleInfo: () => Promise<unknown>;
  setScheduleOnOff: (screenId: string, enable: boolean) => Promise<void>;
  deleteBrightnessStrategy: (screenId: string) => Promise<void>;

  // Layer
  switchLayerSource: (screenId: string, layers: LayerSource[]) => Promise<void>;

  // Output
  getScreenOutputData: () => Promise<unknown>;
  setMultimodeByScreens: (screenIdList: string[], modeId: number) => Promise<void>;
  setOutputBitDepth: (screenIdList: string[], bitDepth: unknown) => Promise<void>;
  outputSyncSourceSwitching: (enable: unknown, sourceType?: number) => Promise<void>;
  enable3DEmitter: (enable: unknown, screenIdList: string[]) => Promise<void>;
  enable3D: (enable: unknown, screenIdList: string[]) => Promise<void>;
  setMapping: (canvasId: number, mappingData: CanvasConfig) => Promise<void>;
  getScreenList: () => Promise<unknown>;
}

export function createScreenApi(
  instance: { baseurl: string },
  responseparser: (data: any, path?: string) => Promise<any>,
): ScreenApi {
  const { baseurl } = instance;

  const screenApi: ScreenApi = {
    // Screen info and properties
    screen: async () => {
      const data = await ky.get(`${baseurl}/api/v1/screen`).json();
      return responseparser(data);
    },

    getScreenProperties: async () => {
      const data = await ky.get(`${baseurl}/api/v1/screen/base/info`).json();
      return responseparser(data);
    },

    getCabinetCount: async () => {
      const data = await ky.get(`${baseurl}/api/v1/screen/cabinet/count`).json();
      return responseparser(data);
    },

    // Screen groups - screens sharing a screenGroupID (a group may span devices,
    // so a group only ever contains the screens of the queried controller).
    // Group names come from the screenGroups list of GET /api/v1/screen.
    getScreenGroups: async () => {
      const data = await ky.get(`${baseurl}/api/v1/screen`).json();
      const payload = (await responseparser(data, "data")) as
        | {
            screens?: Array<{
              screenID: string;
              screenName?: string;
              screenGroupID?: string;
              canvases?: Array<{ canvasID?: number }>;
            }>;
            screenGroups?: Array<{ screenGroupID?: string; name?: string }>;
          }
        | undefined;
      if (!Array.isArray(payload?.screens)) {
        throw new Error("Failed to retrieve screen list");
      }

      const names: Record<string, string> = {};
      for (const group of payload.screenGroups ?? []) {
        if (group?.screenGroupID) names[group.screenGroupID] = group.name ?? "";
      }

      const groups: Record<string, ScreenGroupInfo> = {};
      for (const screen of payload.screens) {
        const groupID = screen.screenGroupID ?? "";
        groups[groupID] ??= {
          groupID,
          ...(groupID in names ? { name: names[groupID] } : {}),
          screens: [],
        };
        groups[groupID].screens.push({
          screenID: screen.screenID,
          screenName: screen.screenName ?? "",
          canvasIDs: (screen.canvases ?? [])
            .map((canvas) => canvas?.canvasID)
            .filter((id): id is number => typeof id === "number"),
        });
      }
      return Object.values(groups);
    },

    // Display modes
    displaymode: async (value: number, screenIdList?: string[]) => {
      const data = await ky
        .put(`${baseurl}/api/v1/screen/output/displaymode`, {
          json: { value, screenIdList: screenIdList ?? [] },
        })
        .json();
      await responseparser(data);
    },

    getDisplayState: async () => {
      const data = await ky.get(`${baseurl}/api/v1/screen/output/display/state`).json();
      return responseparser(data);
    },

    getDisplayParams: async () => {
      const data = await ky.get(`${baseurl}/api/v1/screen/displayparams`).json();
      return responseparser(data);
    },

    // Brightness
    brightness: async (brightness: number, screenIdList?: string[]) => {
      if (typeof brightness !== "number" || brightness < 0 || brightness > 100) {
        throw new Error("brightness must be between 0 and 100");
      }
      const data = await ky
        .put(`${baseurl}/api/v1/screen/brightness`, {
          // The controller takes a 0-1 float, the library speaks percent
          json: { screenIdList: screenIdList ?? [], brightness: brightness / 100 },
        })
        .json();
      await responseparser(data);
    },

    screenbrightness: async (brightness: number, screenIds: string[]) => {
      if (!Array.isArray(screenIds) || screenIds.length === 0) {
        throw new Error("screenIds must be a non-empty array");
      }
      await screenApi.brightness(brightness, screenIds);
    },

    // Color temperature
    colortemperature: async (colorTemp: number, screenIdList?: string[]) => {
      if (typeof colorTemp !== "number" || colorTemp < 1700 || colorTemp > 15000) {
        throw new Error("colorTemp must be between 1700 and 15000");
      }
      const data = await ky
        .put(`${baseurl}/api/v1/screen/colortemperature`, {
          json: { screenIdList: screenIdList ?? [], colorTemperature: colorTemp },
        })
        .json();
      await responseparser(data);
    },

    // Gamma
    gamma: async (gamma: number, screenIdList?: string[]) => {
      if (typeof gamma !== "number" || gamma < 1.0 || gamma > 4.0) {
        throw new Error("gamma must be between 1.0 and 4.0");
      }
      const data = await ky
        .put(`${baseurl}/api/v1/screen/gamma`, {
          json: { screenIdList: screenIdList ?? [], gamma },
        })
        .json();
      await responseparser(data);
    },

    setCustomGamma: async (screenId: string, gammaTable: number[]) => {
      const data = await ky
        .post(`${baseurl}/api/v1/screen/gamma/update`, {
          json: { screenId, gammaTable },
        })
        .json();
      await responseparser(data);
    },

    // Image/Output
    setCustomGamut: async (screenIdList: string[], gamutData: RGBColor) => {
      if (!Array.isArray(screenIdList) || screenIdList.length === 0) {
        throw new Error("screenIdList must be a non-empty array");
      }
      if (!gamutData || typeof gamutData !== "object") {
        throw new Error("gamutData must be an RGBColor object");
      }
      if (typeof gamutData.r !== "number" || typeof gamutData.g !== "number" || typeof gamutData.b !== "number") {
        throw new Error("gamutData must have r, g, b number properties");
      }
      const data = await ky
        .put(`${baseurl}/api/v1/screen/output/customgamut`, {
          json: { screenIdList, gamutData },
        })
        .json();
      await responseparser(data);
    },

    switchColorGamut: async (screenIdList: string[], gamutName: string) => {
      if (!Array.isArray(screenIdList) || screenIdList.length === 0) {
        throw new Error("screenIdList must be a non-empty array");
      }
      if (typeof gamutName !== "string" || gamutName.length === 0) {
        throw new Error("gamutName must be a non-empty string, e.g. from getGamutList()");
      }
      const data = await ky
        .put(`${baseurl}/api/v1/screen/output/gamut`, {
          json: { name: gamutName, screenIdList },
        })
        .json();
      await responseparser(data);
    },

    getGamutList: async () => {
      const data = await ky.get(`${baseurl}/api/v1/screen/output`).json();
      const outputs = (await responseparser(data, "data")) as
        | Array<{
            screenId?: string;
            gamutList?: {
              currentGamutName?: string;
              colorGamutInfoList?: Array<{ colorGamutInfo?: { targetGamut?: { name?: string } } }>;
            };
          }>
        | undefined;
      if (!Array.isArray(outputs)) {
        throw new Error("Failed to retrieve screen output data");
      }
      return outputs.map((output) => ({
        screenId: output.screenId ?? "",
        currentGamutName: output.gamutList?.currentGamutName ?? "",
        names: (output.gamutList?.colorGamutInfoList ?? [])
          .map((entry) => entry.colorGamutInfo?.targetGamut?.name)
          .filter((name): name is string => Boolean(name)),
      }));
    },

    // Multi-screen brightness - the shape VMP's own clients send. Only screens of
    // this controller can be addressed; other screen IDs are accepted and ignored.
    setMultiBrightness: async (screens: MultiScreenBrightness[]) => {
      if (!Array.isArray(screens) || screens.length === 0) {
        throw new Error("screens must be a non-empty array");
      }
      const screenBrightnessInfo = screens.map((screen) => {
        if (typeof screen.screenID !== "string" || screen.screenID.length === 0) {
          throw new Error("screenID must be a non-empty string");
        }
        const nit = screen.nit ?? 0;
        if (screen.brightness === undefined && nit <= 0) {
          throw new Error("each screen needs brightness (percent) or nit");
        }
        if (screen.brightness !== undefined && (screen.brightness < 0 || screen.brightness > 100)) {
          throw new Error("brightness must be between 0 and 100");
        }
        const ratio = nit > 0 ? 0 : (screen.brightness ?? 0) / 100;
        return {
          screenID: screen.screenID,
          ratio,
          nit,
          cabinetParam: {
            idList: screen.cabinetIDs ?? [],
            ratio,
            nit,
            brightnessBaseValue: screen.brightnessBaseValue ?? 0,
            ratioCol: screen.ratioCol ?? false,
          },
        };
      });

      const data = await ky
        .post(`${baseurl}/api/v1/screen/multi/brightness`, { json: { screenBrightnessInfo } })
        .json();
      await responseparser(data);
    },

    setBrightnessLimitOnOff: async (state: boolean, screenIdList: string[]) => {
      if (typeof state !== "boolean") {
        throw new Error("state must be a boolean");
      }
      if (!Array.isArray(screenIdList) || screenIdList.length === 0) {
        throw new Error("screenIdList must be a non-empty array");
      }
      const data = await ky
        .post(`${baseurl}/api/v1/screen/output/max-brightness`, {
          json: { state, screenIdList },
        })
        .json();
      await responseparser(data);
    },

    setBrightnessLimitValue: async (
      screenIdList: string[],
      type: unknown,
      nit?: number,
      ratio?: number,
    ) => {
      if (type !== 2 && type !== 3) {
        throw new Error("type must be 2 or 3");
      }
      if (type !== 2 && type !== 3) {
        throw new Error("type must be 2 or 3");
      }
      const data = await ky
        .post(`${baseurl}/api/v1/screen/output/max-brightness`, {
          json: { screenIdList, type, nit, ratio },
        })
        .json();
      await responseparser(data);
    },

    // 3D LUT
    enable3DLut: async (enable: boolean, screenIdList: string[]) => {
      if (typeof enable !== "boolean") {
        throw new Error("enable must be a boolean");
      }
      if (!Array.isArray(screenIdList) || screenIdList.length === 0) {
        throw new Error("screenIdList must be a non-empty array");
      }
      const data = await ky
        .put(`${baseurl}/api/v1/screen/processing/threedlut/enable`, {
          json: { enable, screenIdList },
        })
        .json();
      await responseparser(data);
    },

    set3DLutStrength: async (screenIdList: string[], strength: number) => {
      if (typeof strength !== "number" || strength < 0 || strength > 100) {
        throw new Error("strength must be between 0 and 100");
      }
      const data = await ky
        .put(`${baseurl}/api/v1/screen/processing/threedlut/strength`, {
          json: { screenIdList, strength },
        })
        .json();
      await responseparser(data);
    },

    import3DLutFile: async (screenIdList: string[], file: Blob, fileName: string) => {
      if (!Array.isArray(screenIdList) || screenIdList.length === 0) {
        throw new Error("screenIdList must be a non-empty array");
      }
      if (!(file instanceof Blob)) {
        throw new Error("file must be a Blob");
      }
      if (typeof fileName !== "string" || fileName.length === 0) {
        throw new Error("fileName must be a non-empty string");
      }
      const data = await ky
        .put(`${baseurl}/api/v1/screen/processing/threedlut/file`, {
          body: (() => {
            const formData = new FormData();
            formData.append("file", file, fileName);
            formData.append("screenIdList", JSON.stringify(screenIdList));
            return formData;
          })(),
        })
        .json();
      await responseparser(data);
    },

    delete3DLutFile: async (screenIdList: string[], fileName: string) => {
      if (!Array.isArray(screenIdList) || screenIdList.length === 0) {
        throw new Error("screenIdList must be a non-empty array");
      }
      if (typeof fileName !== "string" || fileName.length === 0) {
        throw new Error("fileName must be a non-empty string");
      }
      const data = await ky
        .delete(`${baseurl}/api/v1/screen/processing/threedlut/file`, {
          json: { screenIdList, fileName },
        })
        .json();
      await responseparser(data);
    },

    // Color Correction
    setColorCorrectionOnOff: async (enable: boolean, screenIdList: string[]) => {
      const data = await ky
        .put(`${baseurl}/api/v1/screen/processing/colorcorrect/enable`, {
          json: { enable, screenIdList },
        })
        .json();
      await responseparser(data);
    },

    setColorCorrectionBlackWhite: async (data: unknown[]) => {
      if (!Array.isArray(data)) {
        throw new Error("data must be an array");
      }
      const response = await ky
        .put(`${baseurl}/api/v1/screen/processing/colorcorrect/whiteblack`, {
          json: { data },
        })
        .json();
      await responseparser(response);
    },

    setColorCorrectionOtherColors: async (data: unknown[][]) => {
      if (!Array.isArray(data)) {
        throw new Error("data must be an array");
      }
      const response = await ky
        .put(`${baseurl}/api/v1/screen/processing/colorcorrect/data`, {
          json: { data },
        })
        .json();
      await responseparser(response);
    },

    // Schedule
    getAllScheduleInfo: async () => {
      const data = await ky.get(`${baseurl}/api/v1/screen/schedule/all`).json();
      return responseparser(data);
    },

    setScheduleOnOff: async (screenId: string, enable: boolean) => {
      const data = await ky
        .post(`${baseurl}/api/v1/screen/schedule/enable/update`, {
          json: { screenId, enable },
        })
        .json();
      await responseparser(data);
    },

    deleteBrightnessStrategy: async (screenId: string) => {
      const data = await ky
        .post(`${baseurl}/api/v1/screen/schedule/brightness-strategy/delete`, {
          json: { screenId },
        })
        .json();
      await responseparser(data);
    },

    // Layer
    switchLayerSource: async (screenId: string, layers: { id: number; source: number }[]) => {
      const data = await ky
        .put(`${baseurl}/api/v1/screen/layer/input`, {
          json: { screenId, layers },
        })
        .json();
      await responseparser(data);
    },

    // Output
    getScreenOutputData: async () => {
      const data = await ky.get(`${baseurl}/api/v1/screen/output`).json();
      return responseparser(data);
    },

    setMultimodeByScreens: async (screenIdList: string[], modeId: number) => {
      const data = await ky
        .put(`${baseurl}/api/v1/screen/output/multimode`, {
          json: { screenIdList, modeId },
        })
        .json();
      await responseparser(data);
    },

    setOutputBitDepth: async (screenIdList: string[], bitDepth: unknown) => {
      const validBitDepths = [0, 1, 2, 255];
      if (typeof bitDepth !== "number" || !validBitDepths.includes(bitDepth)) {
        throw new Error(`bitDepth must be one of: ${validBitDepths.join(", ")}`);
      }
      const data = await ky
        .put(`${baseurl}/api/v1/screen/output/bitdepth`, {
          json: { screenIdList, bitDepth },
        })
        .json();
      await responseparser(data);
    },

    outputSyncSourceSwitching: async (enable: unknown, sourceType?: number) => {
      if (typeof enable !== "boolean") {
        throw new Error("enable must be a boolean");
      }
      const data = await ky
        .put(`${baseurl}/api/v1/screen/output/sync/source`, {
          json: { enable, sourceType },
        })
        .json();
      await responseparser(data);
    },

    enable3DEmitter: async (enable: unknown, screenIdList: string[]) => {
      if (typeof enable !== "boolean") {
        throw new Error("enable must be a boolean");
      }
      if (!Array.isArray(screenIdList) || screenIdList.length === 0) {
        throw new Error("screenIdList must be a non-empty array");
      }
      const data = await ky
        .put(`${baseurl}/api/v1/screen/output/threed/emitter`, {
          json: { enable, screenIdList },
        })
        .json();
      await responseparser(data);
    },

    enable3D: async (enable: unknown, screenIdList: string[]) => {
      if (typeof enable !== "boolean") {
        throw new Error("enable must be a boolean");
      }
      if (!Array.isArray(screenIdList) || screenIdList.length === 0) {
        throw new Error("screenIdList must be a non-empty array");
      }
      const data = await ky
        .put(`${baseurl}/api/v1/screen/output/threed/enable`, {
          json: { enable, screenIdList },
        })
        .json();
      await responseparser(data);
    },

    setMapping: async (canvasId: number, mappingData: CanvasConfig) => {
      if (typeof canvasId !== "number" || canvasId < 0) {
        throw new Error("canvasId must be a non-negative number");
      }
      if (!mappingData || typeof mappingData !== "object") {
        throw new Error("mappingData must be a CanvasConfig object");
      }
      if (!Array.isArray(mappingData.cabinets)) {
        throw new Error("mappingData.cabinets must be an array");
      }
      const data = await ky
        .put(`${baseurl}/api/v1/screen/output/canvas/mapping`, {
          json: { canvasId, mappingData },
        })
        .json();
      await responseparser(data);
    },

    getScreenList: async () => {
      const data = await ky.get(`${baseurl}/api/v1/screen`).json();
      return responseparser(data);
    },
  };

  return screenApi;
}
