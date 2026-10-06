// test/api.test.ts
// Tests for COEX API methods using Vitest with MSW 2.x
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { createCoexApi } from "../src/api/index.js";

// Base URL for tests
const BASE_URL = "http://192.168.1.100:8001";

// Create MSW server with all handlers
const server = setupServer(
  // Device handlers
  http.get(`${BASE_URL}/api/v1/device/cabinet`, () =>
    HttpResponse.json({ code: 0, data: [{ id: 1 }, { id: 2 }], message: "Success" })
  ),
  http.get(`${BASE_URL}/api/v1/device/input/sources`, () =>
    HttpResponse.json({ code: 0, data: [{ name: "HDMI1", groupId: "1" }], message: "Success" })
  ),
  http.get(`${BASE_URL}/api/v1/device/monitor/info`, () =>
    HttpResponse.json({ code: 0, data: { temperature: 45 }, message: "Success" })
  ),
  http.put(`${BASE_URL}/api/v1/device/input/:id/hdrmode`, () =>
    HttpResponse.json({ code: 0, data: {}, message: "Success" })
  ),
  http.put(`${BASE_URL}/api/v1/device/input/internalsource`, () =>
    HttpResponse.json({ code: 0, data: {}, message: "Success" })
  ),
  http.put(`${BASE_URL}/api/v1/device/input/pattern/test`, () =>
    HttpResponse.json({ code: 0, data: {}, message: "Success" })
  ),
  http.get(`${BASE_URL}/api/v1/device/input`, () =>
    HttpResponse.json({ code: 0, data: {}, message: "Success" })
  ),
  http.put(`${BASE_URL}/api/v1/device/input/shadow`, () =>
    HttpResponse.json({ code: 0, data: {}, message: "Success" })
  ),
  http.put(`${BASE_URL}/api/v1/device/input/highlight`, () =>
    HttpResponse.json({ code: 0, data: {}, message: "Success" })
  ),
  http.put(`${BASE_URL}/api/v1/device/input/reset`, () =>
    HttpResponse.json({ code: 0, data: {}, message: "Success" })
  ),
  http.put(`${BASE_URL}/api/v1/device/input/saturation`, () =>
    HttpResponse.json({ code: 0, data: {}, message: "Success" })
  ),
  http.put(`${BASE_URL}/api/v1/device/input/contrast`, () =>
    HttpResponse.json({ code: 0, data: {}, message: "Success" })
  ),
  http.put(`${BASE_URL}/api/v1/device/input/hue`, () =>
    HttpResponse.json({ code: 0, data: {}, message: "Success" })
  ),
  http.put(`${BASE_URL}/api/v1/device/input/:inputId/edid`, () =>
    HttpResponse.json({ code: 0, data: {}, message: "Success" })
  ),
  http.post(`${BASE_URL}/api/v1/device/audio`, () =>
    HttpResponse.json({ code: 0, data: {}, message: "Success" })
  ),
  http.get(`${BASE_URL}/api/v1/device/audio`, () =>
    HttpResponse.json({ code: 0, data: { enable: true, source: 1 }, message: "Success" })
  ),
  http.post(`${BASE_URL}/api/v1/device/hw/colorBeacon`, () =>
    HttpResponse.json({ code: 0, data: {}, message: "Success" })
  ),
  http.get(`${BASE_URL}/api/v1/device/backup`, () =>
    HttpResponse.json({ code: 0, data: { master: "M1", backup: "B1" }, message: "Success" })
  ),
  http.post(`${BASE_URL}/api/v1/device/backup/verify`, () =>
    HttpResponse.json({ code: 0, data: {}, message: "Success" })
  ),
  http.get(`${BASE_URL}/api/v1/device/hw/log`, () =>
    HttpResponse.json({ code: 0, data: {}, message: "Success" })
  ),
  http.put(`${BASE_URL}/api/v1/device/hw/systemtime`, () =>
    HttpResponse.json({ code: 0, data: {}, message: "Success" })
  ),
  http.put(`${BASE_URL}/api/v1/device/time/enable`, () =>
    HttpResponse.json({ code: 0, data: {}, message: "Success" })
  ),
  http.post(`${BASE_URL}/api/v1/device/timezone`, () =>
    HttpResponse.json({ code: 0, data: {}, message: "Success" })
  ),
  http.put(`${BASE_URL}/api/v1/device/hw/customname`, () =>
    HttpResponse.json({ code: 0, data: {}, message: "Success" })
  ),
  http.get(`${BASE_URL}/api/v1/device/snmpstate`, () =>
    HttpResponse.json({ code: 0, data: { state: true }, message: "Success" })
  ),
  http.put(`${BASE_URL}/api/v1/device/snmpstate`, () =>
    HttpResponse.json({ code: 0, data: {}, message: "Success" })
  ),
  http.get(`${BASE_URL}/api/v1/device/multifunc-card/detailinfo`, () =>
    HttpResponse.json({ code: 0, data: {}, message: "Success" })
  ),
  http.put(`${BASE_URL}/api/v1/device/hw/mapping`, () =>
    HttpResponse.json({ code: 0, data: {}, message: "Success" })
  ),
  // Screen handlers
  http.get(`${BASE_URL}/api/v1/screen`, () =>
    HttpResponse.json({ code: 0, data: { screens: [] }, message: "Success" })
  ),
  http.get(`${BASE_URL}/api/v1/screen/base/info`, () =>
    HttpResponse.json({ code: 0, data: { width: 1920 }, message: "Success" })
  ),
  http.get(`${BASE_URL}/api/v1/screen/cabinet/count`, () =>
    HttpResponse.json({ code: 0, data: { count: 10 }, message: "Success" })
  ),
  http.put(`${BASE_URL}/api/v1/screen/output/displaymode`, () =>
    HttpResponse.json({ code: 0, data: {}, message: "Success" })
  ),
  http.get(`${BASE_URL}/api/v1/screen/output/display/state`, () =>
    HttpResponse.json({ code: 0, data: { state: 1 }, message: "Success" })
  ),
  http.get(`${BASE_URL}/api/v1/screen/displayparams`, () =>
    HttpResponse.json({ code: 0, data: { brightness: 100 }, message: "Success" })
  ),
  http.put(`${BASE_URL}/api/v1/screen/brightness`, () =>
    HttpResponse.json({ code: 0, data: {}, message: "Success" })
  ),
  http.put(`${BASE_URL}/api/v1/screen/colortemperature`, () =>
    HttpResponse.json({ code: 0, data: {}, message: "Success" })
  ),
  http.put(`${BASE_URL}/api/v1/screen/gamma`, () =>
    HttpResponse.json({ code: 0, data: {}, message: "Success" })
  ),
  http.post(`${BASE_URL}/api/v1/screen/gamma/update`, () =>
    HttpResponse.json({ code: 0, data: {}, message: "Success" })
  ),
  http.put(`${BASE_URL}/api/v1/screen/output/customgamut`, () =>
    HttpResponse.json({ code: 0, data: {}, message: "Success" })
  ),
  http.put(`${BASE_URL}/api/v1/screen/output/gamut`, () =>
    HttpResponse.json({ code: 0, data: {}, message: "Success" })
  ),
  http.post(`${BASE_URL}/api/v1/screen/output/max-brightness`, () =>
    HttpResponse.json({ code: 0, data: {}, message: "Success" })
  ),
  http.put(`${BASE_URL}/api/v1/screen/processing/threedlut/enable`, () =>
    HttpResponse.json({ code: 0, data: {}, message: "Success" })
  ),
  http.put(`${BASE_URL}/api/v1/screen/processing/threedlut/strength`, () =>
    HttpResponse.json({ code: 0, data: {}, message: "Success" })
  ),
  http.put(`${BASE_URL}/api/v1/screen/processing/threedlut/file`, () =>
    HttpResponse.json({ code: 0, data: {}, message: "Success" })
  ),
  http.delete(`${BASE_URL}/api/v1/screen/processing/threedlut/file`, () =>
    HttpResponse.json({ code: 0, data: {}, message: "Success" })
  ),
  http.put(`${BASE_URL}/api/v1/screen/processing/colorcorrect/enable`, () =>
    HttpResponse.json({ code: 0, data: {}, message: "Success" })
  ),
  http.put(`${BASE_URL}/api/v1/screen/processing/colorcorrect/whiteblack`, () =>
    HttpResponse.json({ code: 0, data: {}, message: "Success" })
  ),
  http.put(`${BASE_URL}/api/v1/screen/processing/colorcorrect/data`, () =>
    HttpResponse.json({ code: 0, data: {}, message: "Success" })
  ),
  http.get(`${BASE_URL}/api/v1/screen/schedule/all`, () =>
    HttpResponse.json({ code: 0, data: {}, message: "Success" })
  ),
  http.post(`${BASE_URL}/api/v1/screen/schedule/enable/update`, () =>
    HttpResponse.json({ code: 0, data: {}, message: "Success" })
  ),
  http.post(`${BASE_URL}/api/v1/screen/schedule/brightness-strategy/delete`, () =>
    HttpResponse.json({ code: 0, data: {}, message: "Success" })
  ),
  http.put(`${BASE_URL}/api/v1/screen/layer/input`, () =>
    HttpResponse.json({ code: 0, data: {}, message: "Success" })
  ),
  http.get(`${BASE_URL}/api/v1/screen/output`, () =>
    HttpResponse.json({ code: 0, data: {}, message: "Success" })
  ),
  http.put(`${BASE_URL}/api/v1/screen/output/multimode`, () =>
    HttpResponse.json({ code: 0, data: {}, message: "Success" })
  ),
  http.put(`${BASE_URL}/api/v1/screen/output/bitdepth`, () =>
    HttpResponse.json({ code: 0, data: {}, message: "Success" })
  ),
  http.put(`${BASE_URL}/api/v1/screen/output/sync/source`, () =>
    HttpResponse.json({ code: 0, data: {}, message: "Success" })
  ),
  http.put(`${BASE_URL}/api/v1/screen/output/threed/emitter`, () =>
    HttpResponse.json({ code: 0, data: {}, message: "Success" })
  ),
  http.put(`${BASE_URL}/api/v1/screen/output/threed/enable`, () =>
    HttpResponse.json({ code: 0, data: {}, message: "Success" })
  ),
  http.put(`${BASE_URL}/api/v1/screen/mapping`, () =>
    HttpResponse.json({ code: 0, data: {}, message: "Success" })
  ),
  http.get(`${BASE_URL}/api/v1/screen/list`, () =>
    HttpResponse.json({ code: 0, data: [{ screenID: "screen1" }], message: "Success" })
  ),
  // Cabinet handlers - using path to handle non-standard prefixes
  http.put(`${BASE_URL}/api/v1/device/cabinet/prestoreimage`, () =>
    HttpResponse.json({ code: 0, data: {}, message: "Success" })
  ),
  http.put(`${BASE_URL}/api/v1/device/correctionop/cabinets/thermacal/enable`, () =>
    HttpResponse.json({ code: 0, data: {}, message: "Success" })
  ),
  http.put(`${BASE_URL}/api/v1/device/correctionop/cabinets/thermacal/amount`, () =>
    HttpResponse.json({ code: 0, data: {}, message: "Success" })
  ),
  http.put(`${BASE_URL}/api/v1/device/correctionop/cabinets/thermacal/mode`, () =>
    HttpResponse.json({ code: 0, data: {}, message: "Success" })
  ),
  http.put(`${BASE_URL}/api/v1/device/cabinet/rgb/brightness`, () =>
    HttpResponse.json({ code: 0, data: {}, message: "Success" })
  ),
  http.put(`${BASE_URL}/api/v1/device/cabinet/brightness`, () =>
    HttpResponse.json({ code: 0, data: {}, message: "Success" })
  ),
  http.put(`${BASE_URL}/api/v1/device/cabinet/colortemperature`, () =>
    HttpResponse.json({ code: 0, data: {}, message: "Success" })
  ),
  http.put(`${BASE_URL}/api/v1/device/cabinet/testpattern`, () =>
    HttpResponse.json({ code: 0, data: {}, message: "Success" })
  ),
  http.put(`${BASE_URL}/api/v1/device/cabinet/mapping`, () =>
    HttpResponse.json({ code: 0, data: {}, message: "Success" })
  ),
  http.put(`${BASE_URL}/api/v1/screen/output/canvas/mapping`, () =>
    HttpResponse.json({ code: 0, data: {}, message: "Success" })
  ),
  http.put(`${BASE_URL}/api/v1/device/cabinet/multimode`, () =>
    HttpResponse.json({ code: 0, data: {}, message: "Success" })
  ),
  http.put(`${BASE_URL}/api/v1/screen/cabinets`, () =>
    HttpResponse.json({ code: 0, data: {}, message: "Success" })
  ),
  http.post(`${BASE_URL}/api/v1/device/cabinet/rgbwbrightness`, () =>
    HttpResponse.json({ code: 0, data: {}, message: "Success" })
  ),
  // Preset handlers
  http.get(`${BASE_URL}/api/v1/preset`, () =>
    HttpResponse.json({ code: 0, data: [], message: "Success" })
  ),
  http.post(`${BASE_URL}/api/v1/preset/current/update`, () =>
    HttpResponse.json({ code: 0, data: {}, message: "Success" })
  ),
  http.post(`${BASE_URL}/api/v1/preset/update`, () =>
    HttpResponse.json({ code: 0, data: {}, message: "Success" })
  ),
);

// ==================== Test Setup ====================
beforeAll(() => {
  server.listen({ onUnhandledRequest: "bypass" });
});

afterAll(() => {
  server.close();
});

beforeEach(() => {
  server.resetHandlers();
});

// ==================== Tests ====================
describe("COEX API Tests", () => {
  let api: ReturnType<typeof createCoexApi>;

  beforeEach(() => {
    api = createCoexApi("192.168.1.100", 8001);
  });

  // ==================== Device API ====================
  describe("Device API", () => {
    describe("cabinet", () => {
      it("should get cabinet list", async () => {
        const result = await api.cabinet();
        expect(result).toBeDefined();
      });
    });

    describe("sources", () => {
      it("should get input sources", async () => {
        const result = await api.sources();
        expect(result).toBeDefined();
      });
    });

    describe("monitor", () => {
      it("should get monitor info", async () => {
        const result = await api.monitor();
        expect(result).toBeDefined();
      });
    });

    describe("setHdrMode", () => {
      it("should set HDR mode with valid parameters", async () => {
        await expect(api.setHdrMode(1, 1)).resolves.toBeUndefined();
      });

      it("should reject invalid HDR mode", async () => {
        await expect(api.setHdrMode(1, 99)).rejects.toThrow("Invalid hdrMode");
      });

      it("should reject negative input ID", async () => {
        await expect(api.setHdrMode(-1, 0)).rejects.toThrow("Invalid input source ID");
      });
    });

    describe("setInternalSource", () => {
      it("should set internal source with valid parameters", async () => {
        await expect(
          api.setInternalSource({
            width: 1920,
            height: 1080,
            refreshrate: 60,
            bitdepth: 1,
            isEdidCustom: false,
          })
        ).resolves.toBeUndefined();
      });

      it("should reject invalid width", async () => {
        await expect(
          api.setInternalSource({
            width: 0,
            height: 1080,
            refreshrate: 60,
            bitdepth: 1,
            isEdidCustom: false,
          })
        ).rejects.toThrow("Invalid width");
      });

      it("should reject invalid bitdepth", async () => {
        await expect(
          api.setInternalSource({
            width: 1920,
            height: 1080,
            refreshrate: 60,
            bitdepth: 5,
            isEdidCustom: false,
          })
        ).rejects.toThrow("Invalid bitdepth");
      });
    });

    describe("setSendingCardTestPattern", () => {
      it("should set sending card test pattern", async () => {
        await expect(api.setSendingCardTestPattern(1)).resolves.toBeUndefined();
      });

      it("should set sending card test pattern with params", async () => {
        await expect(
          api.setSendingCardTestPattern(1, { red: 255, green: 0, blue: 0 })
        ).resolves.toBeUndefined();
      });
    });

    describe("getInputData", () => {
      it("should get input data", async () => {
        const result = await api.getInputData();
        expect(result).toBeDefined();
      });
    });

    describe("setShadow", () => {
      it("should set shadow with valid parameters", async () => {
        await expect(api.setShadow([1, 2], 0, 100)).resolves.toBeUndefined();
      });

      it("should reject invalid shadow type", async () => {
        await expect(api.setShadow([1, 2], 5, 100)).rejects.toThrow("Invalid type");
      });

      it("should reject empty idList", async () => {
        await expect(api.setShadow([], 0, 100)).rejects.toThrow("inputIdList must be a non-empty array");
      });
    });

    describe("setHighlight", () => {
      it("should set highlight with valid parameters", async () => {
        await expect(api.setHighlight([1, 2], 1, 150)).resolves.toBeUndefined();
      });

      it("should reject invalid highlight type", async () => {
        await expect(api.setHighlight([1, 2], 5, 150)).rejects.toThrow("Invalid type");
      });

      it("should reject empty idList", async () => {
        await expect(api.setHighlight([], 1, 150)).rejects.toThrow("inputIdList must be a non-empty array");
      });
    });

    describe("resetColorAdjustment", () => {
      it("should reset color adjustment", async () => {
        await expect(api.resetColorAdjustment([1, 2])).resolves.toBeUndefined();
      });

      it("should reset color adjustment with type", async () => {
        await expect(api.resetColorAdjustment([1, 2], 1)).resolves.toBeUndefined();
      });

      it("should reject empty idList", async () => {
        await expect(api.resetColorAdjustment([])).rejects.toThrow("inputIdList must be a non-empty array");
      });
    });

    describe("setSaturation", () => {
      it("should set saturation with valid value", async () => {
        await expect(api.setSaturation([1, 2], 100)).resolves.toBeUndefined();
      });

      it("should reject invalid saturation value", async () => {
        await expect(api.setSaturation([1, 2], 300)).rejects.toThrow("Invalid saturation");
      });

      it("should reject empty idList", async () => {
        await expect(api.setSaturation([], 100)).rejects.toThrow("inputIdList must be a non-empty array");
      });
    });

    describe("setContrast", () => {
      it("should set contrast with valid value", async () => {
        await expect(api.setContrast([1, 2], 120)).resolves.toBeUndefined();
      });

      it("should reject invalid contrast value", async () => {
        await expect(api.setContrast([1, 2], 300)).rejects.toThrow("Invalid contrast");
      });

      it("should reject empty idList", async () => {
        await expect(api.setContrast([], 120)).rejects.toThrow("inputIdList must be a non-empty array");
      });
    });

    describe("setBlackLevel", () => {
      it("should set black level with valid value", async () => {
        await expect(api.setBlackLevel([1, 2], 50)).resolves.toBeUndefined();
      });

      it("should reject invalid black level value", async () => {
        await expect(api.setBlackLevel([1, 2], 300)).rejects.toThrow("Invalid shadow");
      });

      it("should reject empty idList", async () => {
        await expect(api.setBlackLevel([], 50)).rejects.toThrow("inputIdList must be a non-empty array");
      });
    });

    describe("setHue", () => {
      it("should set hue with valid value", async () => {
        await expect(api.setHue([1, 2], 45)).resolves.toBeUndefined();
      });

      it("should reject hue out of range", async () => {
        await expect(api.setHue([1, 2], 200)).rejects.toThrow("Invalid hue");
      });

      it("should reject empty idList", async () => {
        await expect(api.setHue([], 45)).rejects.toThrow("inputIdList must be a non-empty array");
      });
    });

    describe("setEdid", () => {
      it("should set EDID with valid parameters", async () => {
        await expect(
          api.setEdid(1, {
            resolution: { width: 1920, height: 1080 },
            refreshRate: 60,
            isCustom: false,
          })
        ).resolves.toBeUndefined();
      });

      it("should reject negative input ID", async () => {
        await expect(
          api.setEdid(-1, {
            resolution: { width: 1920, height: 1080 },
            refreshRate: 60,
            isCustom: false,
          })
        ).rejects.toThrow("Invalid input source ID");
      });
    });

    describe("setOutputAudio", () => {
      it("should set output audio", async () => {
        await expect(api.setOutputAudio(true, 1)).resolves.toBeUndefined();
      });

      it("should reject non-boolean enable", async () => {
        await expect(api.setOutputAudio("true", 1)).rejects.toThrow("enable must be a boolean");
      });
    });

    describe("getAudioSettings", () => {
      it("should get audio settings", async () => {
        const result = await api.getAudioSettings();
        expect(result).toBeDefined();
      });
    });

    describe("controllerIdentify", () => {
      it("should identify controller with valid color", async () => {
        await expect(api.controllerIdentify(true, { r: 255, g: 0, b: 0 })).resolves.toBeUndefined();
      });

      it("should reject non-boolean enable", async () => {
        await expect(api.controllerIdentify("true", { r: 255, g: 0, b: 0 })).rejects.toThrow("enable must be a boolean");
      });

      it("should reject invalid color values", async () => {
        await expect(api.controllerIdentify(true, { r: 300, g: 0, b: 0 })).rejects.toThrow(
          "Invalid color values"
        );
      });
    });

    describe("getDeviceBackupStatus", () => {
      it("should get device backup status", async () => {
        const result = await api.getDeviceBackupStatus();
        expect(result).toBeDefined();
      });
    });

    describe("primaryBackupVerify", () => {
      it("should verify primary backup", async () => {
        await expect(api.primaryBackupVerify("screen1", 1)).resolves.toBeUndefined();
      });

      it("should reject missing verifyType", async () => {
        await expect(api.primaryBackupVerify("screen1", 0)).rejects.toThrow("verifyType is required");
      });
    });

    describe("exportLog", () => {
      it("should export log", async () => {
        const result = await api.exportLog();
        expect(result).toBeDefined();
      });
    });

    describe("setSystemTime", () => {
      it("should set system time with valid parameters", async () => {
        await expect(
          api.setSystemTime({
            year: 2024,
            month: 6,
            day: 15,
            hour: 12,
            minute: 30,
            second: 0,
            isUTC: false,
          })
        ).resolves.toBeUndefined();
      });

      it("should reject invalid year", async () => {
        await expect(
          api.setSystemTime({
            year: 1969,
            month: 6,
            day: 15,
            hour: 12,
            minute: 30,
            second: 0,
            isUTC: false,
          })
        ).rejects.toThrow("Invalid year");
      });
    });

    describe("setAutoTimeOnOff", () => {
      it("should set auto time on/off", async () => {
        await expect(api.setAutoTimeOnOff(true, 0)).resolves.toBeUndefined();
      });

      it("should reject non-boolean enable", async () => {
        await expect(api.setAutoTimeOnOff("true", 0)).rejects.toThrow("enable must be a boolean");
      });

      it("should reject invalid time source", async () => {
        await expect(api.setAutoTimeOnOff(true, 3)).rejects.toThrow("Invalid timeSource");
      });
    });

    describe("setTimeZone", () => {
      it("should set time zone", async () => {
        await expect(api.setTimeZone("Asia/Shanghai")).resolves.toBeUndefined();
      });
    });

    describe("setControllerName", () => {
      it("should set controller name", async () => {
        await expect(api.setControllerName("My Controller")).resolves.toBeUndefined();
      });

      it("should reject name longer than 255 characters", async () => {
        const longName = "a".repeat(300);
        await expect(api.setControllerName(longName)).rejects.toThrow("255 characters or less");
      });
    });

    describe("getSnmpStatus", () => {
      it("should get SNMP status", async () => {
        const result = await api.getSnmpStatus();
        expect(result).toBeDefined();
      });
    });

    describe("setSnmpOnOff", () => {
      it("should set SNMP on/off", async () => {
        await expect(api.setSnmpOnOff(true)).resolves.toBeUndefined();
      });
    });

    describe("getMultifunctionCardInfo", () => {
      it("should get multifunction card info", async () => {
        const result = await api.getMultifunctionCardInfo();
        expect(result).toBeDefined();
      });
    });

    describe("deviceIdentify", () => {
      it("should identify device", async () => {
        await expect(api.deviceIdentify(true)).resolves.toBeUndefined();
      });

      it("should reject non-boolean enable", async () => {
        await expect(api.deviceIdentify("true")).rejects.toThrow("enable must be a boolean");
      });
    });
  });

  // ==================== Screen API ====================
  describe("Screen API", () => {
    describe("screen", () => {
      it("should get screen info", async () => {
        const result = await api.screen();
        expect(result).toBeDefined();
      });
    });

    describe("getScreenProperties", () => {
      it("should get screen properties", async () => {
        const result = await api.getScreenProperties();
        expect(result).toBeDefined();
      });
    });

    describe("getCabinetCount", () => {
      it("should get cabinet count", async () => {
        const result = await api.getCabinetCount();
        expect(result).toBeDefined();
      });
    });

    describe("displaymode", () => {
      it("should set display mode", async () => {
        await expect(api.displaymode(1)).resolves.toBeUndefined();
      });

      it("should set display mode with screen IDs", async () => {
        await expect(api.displaymode(0, ["screen1"])).resolves.toBeUndefined();
      });
    });

    describe("getDisplayState", () => {
      it("should get display state", async () => {
        const result = await api.getDisplayState();
        expect(result).toBeDefined();
      });
    });

    describe("getDisplayParams", () => {
      it("should get display params", async () => {
        const result = await api.getDisplayParams();
        expect(result).toBeDefined();
      });
    });

    describe("brightness", () => {
      it("should set brightness", async () => {
        await expect(api.brightness(80)).resolves.toBeUndefined();
      });

      it("should set brightness with screen IDs", async () => {
        await expect(api.brightness(80, ["screen1"])).resolves.toBeUndefined();
      });

      it("should reject brightness out of range", async () => {
        await expect(api.brightness(150)).rejects.toThrow("brightness must be between 0 and 100");
      });
    });

    describe("screenbrightness", () => {
      it("should set screen brightness", async () => {
        await expect(api.screenbrightness(80, ["screen1"])).resolves.toBeUndefined();
      });

      it("should reject empty screenIds", async () => {
        await expect(api.screenbrightness(80, [])).rejects.toThrow("screenIds must be a non-empty array");
      });
    });

    describe("colortemperature", () => {
      it("should set color temperature", async () => {
        await expect(api.colortemperature(6500)).resolves.toBeUndefined();
      });

      it("should set color temperature with screen IDs", async () => {
        await expect(api.colortemperature(6500, ["screen1"])).resolves.toBeUndefined();
      });

      it("should reject color temperature out of range", async () => {
        await expect(api.colortemperature(500)).rejects.toThrow("colorTemp must be between 1700 and 15000");
      });
    });

    describe("gamma", () => {
      it("should set gamma", async () => {
        await expect(api.gamma(2.2)).resolves.toBeUndefined();
      });

      it("should set gamma with screen IDs", async () => {
        await expect(api.gamma(2.2, ["screen1"])).resolves.toBeUndefined();
      });

      it("should reject gamma out of range", async () => {
        await expect(api.gamma(5)).rejects.toThrow("gamma must be between 1.0 and 4.0");
      });
    });

    describe("setCustomGamma", () => {
      it("should set custom gamma", async () => {
        await expect(api.setCustomGamma("screen1", [1, 2, 3])).resolves.toBeUndefined();
      });
    });

    describe("setCustomGamut", () => {
      it("should set custom gamut", async () => {
        await expect(api.setCustomGamut(["screen1"], { r: 100, g: 100, b: 100 })).resolves.toBeUndefined();
      });
    });

    describe("switchColorGamut", () => {
      it("should switch color gamut", async () => {
        await expect(api.switchColorGamut(["screen1"], "Rec.2020")).resolves.toBeUndefined();
      });
    });

    describe("setBrightnessLimitOnOff", () => {
      it("should set brightness limit on/off", async () => {
        await expect(api.setBrightnessLimitOnOff(true, ["screen1"])).resolves.toBeUndefined();
      });
    });

    describe("setBrightnessLimitValue", () => {
      it("should set brightness limit value with nit", async () => {
        await expect(api.setBrightnessLimitValue(["screen1"], 2, 500)).resolves.toBeUndefined();
      });

      it("should set brightness limit value with ratio", async () => {
        await expect(api.setBrightnessLimitValue(["screen1"], 3, undefined, 0.8)).resolves.toBeUndefined();
      });

      it("should reject invalid type", async () => {
        await expect(api.setBrightnessLimitValue(["screen1"], 1)).rejects.toThrow("type must be 2 or 3");
      });
    });

    describe("enable3DLut", () => {
      it("should enable 3D LUT", async () => {
        await expect(api.enable3DLut(true, ["screen1"])).resolves.toBeUndefined();
      });
    });

    describe("set3DLutStrength", () => {
      it("should set 3D LUT strength", async () => {
        await expect(api.set3DLutStrength(["screen1"], 80)).resolves.toBeUndefined();
      });

      it("should reject strength out of range", async () => {
        await expect(api.set3DLutStrength(["screen1"], 150)).rejects.toThrow("strength must be between 0 and 100");
      });
    });

    describe("import3DLutFile", () => {
      it("should import 3D LUT file", async () => {
        const blob = new Blob(["test"], { type: "application/octet-stream" });
        await expect(api.import3DLutFile(["screen1"], blob, "test.cube")).resolves.toBeUndefined();
      });
    });

    describe("delete3DLutFile", () => {
      it("should delete 3D LUT file", async () => {
        await expect(api.delete3DLutFile(["screen1"], "test.cube")).resolves.toBeUndefined();
      });
    });

    describe("setColorCorrectionOnOff", () => {
      it("should set color correction on/off", async () => {
        await expect(api.setColorCorrectionOnOff(true, ["screen1"])).resolves.toBeUndefined();
      });
    });

    describe("setColorCorrectionBlackWhite", () => {
      it("should set color correction black white", async () => {
        await expect(api.setColorCorrectionBlackWhite([{ r: 0, g: 0, b: 0 }])).resolves.toBeUndefined();
      });
    });

    describe("setColorCorrectionOtherColors", () => {
      it("should set color correction other colors", async () => {
        await expect(api.setColorCorrectionOtherColors([[{ r: 255, g: 0, b: 0 }]])).resolves.toBeUndefined();
      });
    });

    describe("getAllScheduleInfo", () => {
      it("should get all schedule info", async () => {
        const result = await api.getAllScheduleInfo();
        expect(result).toBeDefined();
      });
    });

    describe("setScheduleOnOff", () => {
      it("should set schedule on/off", async () => {
        await expect(api.setScheduleOnOff("screen1", true)).resolves.toBeUndefined();
      });
    });

    describe("deleteBrightnessStrategy", () => {
      it("should delete brightness strategy", async () => {
        await expect(api.deleteBrightnessStrategy("screen1")).resolves.toBeUndefined();
      });
    });

    describe("switchLayerSource", () => {
      it("should switch layer source", async () => {
        await expect(api.switchLayerSource("screen1", [{ id: 1, source: 1 }])).resolves.toBeUndefined();
      });
    });

    describe("getScreenOutputData", () => {
      it("should get screen output data", async () => {
        const result = await api.getScreenOutputData();
        expect(result).toBeDefined();
      });
    });

    describe("setMultimodeByScreens", () => {
      it("should set multimode by screens", async () => {
        await expect(api.setMultimodeByScreens(["screen1"], 1)).resolves.toBeUndefined();
      });
    });

    describe("setOutputBitDepth", () => {
      it("should set output bit depth", async () => {
        await expect(api.setOutputBitDepth(["screen1"], 1)).resolves.toBeUndefined();
      });

      it("should reject invalid bit depth", async () => {
        await expect(api.setOutputBitDepth(["screen1"], 5)).rejects.toThrow("bitDepth must be one of");
      });
    });

    describe("outputSyncSourceSwitching", () => {
      it("should set output sync source switching", async () => {
        await expect(api.outputSyncSourceSwitching(true)).resolves.toBeUndefined();
      });

      it("should set output sync source switching with source type", async () => {
        await expect(api.outputSyncSourceSwitching(true, 1)).resolves.toBeUndefined();
      });
    });

    describe("enable3DEmitter", () => {
      it("should enable 3D emitter", async () => {
        await expect(api.enable3DEmitter(true, ["screen1"])).resolves.toBeUndefined();
      });
    });

    describe("enable3D", () => {
      it("should enable 3D", async () => {
        await expect(api.enable3D(true, ["screen1"])).resolves.toBeUndefined();
      });
    });

    describe("setMapping", () => {
      it("should set mapping", async () => {
        await expect(
          api.setMapping(1, {
            canvasID: 1,
            cabinets: [],
          })
        ).resolves.toBeUndefined();
      });
    });

    describe("getScreenList", () => {
      it("should get screen list", async () => {
        const result = await api.getScreenList();
        expect(result).toBeDefined();
      });
    });
  });

  // ==================== Cabinet API ====================
  describe("Cabinet API", () => {
    describe("setNoDataSignal", () => {
      it("should set no data signal with valid parameters", async () => {
        await expect(api.setNoDataSignal([1, 2], 1, 0)).resolves.toBeUndefined();
      });

      it("should reject invalid sourceType", async () => {
        await expect(api.setNoDataSignal([1, 2], 5, 0)).rejects.toThrow("sourceType must be a number");
      });

      it("should reject invalid prestoreImageType", async () => {
        await expect(api.setNoDataSignal([1, 2], 1, 5)).rejects.toThrow("prestoreImageType must be 0");
      });

      it("should reject empty idList", async () => {
        await expect(api.setNoDataSignal([], 1, 0)).rejects.toThrow("idList must be a non-empty array");
      });
    });

    describe("setThermalCompensationOnOff", () => {
      it("should set thermal compensation on/off", async () => {
        await expect(api.setThermalCompensationOnOff([1, 2], true)).resolves.toBeUndefined();
      });

      it("should reject non-boolean enable", async () => {
        await expect(api.setThermalCompensationOnOff([1, 2], "true")).rejects.toThrow("enable must be a boolean");
      });
    });

    describe("setThermalCompensationIntensity", () => {
      it("should set thermal compensation intensity", async () => {
        await expect(api.setThermalCompensationIntensity([1, 2], 100)).resolves.toBeUndefined();
      });

      it("should reject intensity out of range", async () => {
        await expect(api.setThermalCompensationIntensity([1, 2], 300)).rejects.toThrow(
          "amount must be a number between 0 and 255"
        );
      });
    });

    describe("setThermalCompensationMode", () => {
      it("should set thermal compensation mode with valid mode", async () => {
        await expect(api.setThermalCompensationMode([1, 2], 0)).resolves.toBeUndefined();
      });

      it("should reject invalid mode", async () => {
        await expect(api.setThermalCompensationMode([1, 2], 5)).rejects.toThrow("mode must be 0");
      });
    });

    describe("setCabinetRgbBrightness", () => {
      it("should set cabinet RGB brightness", async () => {
        await expect(api.setCabinetRgbBrightness([1, 2], 128, 128, 128)).resolves.toBeUndefined();
      });

      it("should reject r out of range", async () => {
        await expect(api.setCabinetRgbBrightness([1, 2], 300, 128, 128)).rejects.toThrow("r must be a number between 0 and 255");
      });

      it("should reject g out of range", async () => {
        await expect(api.setCabinetRgbBrightness([1, 2], 128, 300, 128)).rejects.toThrow("g must be a number between 0 and 255");
      });

      it("should reject b out of range", async () => {
        await expect(api.setCabinetRgbBrightness([1, 2], 128, 128, 300)).rejects.toThrow("b must be a number between 0 and 255");
      });
    });

    describe("setCabinetBrightness", () => {
      it("should set cabinet brightness with ratio", async () => {
        await expect(api.setCabinetBrightness([1, 2], 0.8)).resolves.toBeUndefined();
      });

      it("should set cabinet brightness with nit", async () => {
        await expect(api.setCabinetBrightness([1, 2], 0.8, 500)).resolves.toBeUndefined();
      });

      it("should reject ratio out of range", async () => {
        await expect(api.setCabinetBrightness([1, 2], 2)).rejects.toThrow("ratio must be a number between 0 and 1");
      });

      it("should reject negative nit", async () => {
        await expect(api.setCabinetBrightness([1, 2], 0.8, -1)).rejects.toThrow("nit must be a non-negative number");
      });
    });

    describe("adjustCabinetColorTemperature", () => {
      it("should adjust cabinet color temperature", async () => {
        await expect(api.adjustCabinetColorTemperature([1, 2], 6500)).resolves.toBeUndefined();
      });

      it("should reject value out of range", async () => {
        await expect(api.adjustCabinetColorTemperature([1, 2], 500)).rejects.toThrow(
          "value must be a number between 1700 and 15000"
        );
      });
    });

    describe("setReceivingCardTestPattern", () => {
      it("should set receiving card test pattern with valid mode", async () => {
        await expect(api.setReceivingCardTestPattern([1, 2], 1)).resolves.toBeUndefined();
      });

      it("should reject invalid testmode", async () => {
        await expect(api.setReceivingCardTestPattern([1, 2], 3)).rejects.toThrow("testmode must be one of");
      });
    });

    describe("enableCabinetMapping", () => {
      it("should enable cabinet mapping", async () => {
        await expect(api.enableCabinetMapping([1, 2], true)).resolves.toBeUndefined();
      });
    });

    describe("setMultimodeByCabinets", () => {
      it("should set multimode by cabinets", async () => {
        await expect(api.setMultimodeByCabinets([1, 2], 1)).resolves.toBeUndefined();
      });

      it("should reject negative modeId", async () => {
        await expect(api.setMultimodeByCabinets([1, 2], -1)).rejects.toThrow("modeId must be a non-negative number");
      });
    });

    describe("moveCabinet", () => {
      it("should move cabinet", async () => {
        await expect(
          api.moveCabinet("screen1", [
            {
              canvasID: 1,
              cabinets: [
                {
                  cabinetID: 1,
                  connectID: 1,
                  outputID: 1,
                  position: { x: 0, y: 0 },
                  size: { width: 640, height: 480 },
                  angle: 0,
                },
              ],
            },
          ])
        ).resolves.toBeUndefined();
      });

      it("should reject empty canvases", async () => {
        await expect(api.moveCabinet("screen1", [])).rejects.toThrow("canvases must be a non-empty array");
      });
    });

    describe("setCabinetRgbwBrightness", () => {
      it("should set cabinet RGBW brightness", async () => {
        await expect(api.setCabinetRgbwBrightness([1, 2], 1, 0.5)).resolves.toBeUndefined();
      });

      it("should reject invalid changeType", async () => {
        await expect(api.setCabinetRgbwBrightness([1, 2], 5, 0.5)).rejects.toThrow(
          "changeType must be 1 (W), 2 (R), 3 (G), or 4 (B)"
        );
      });

      it("should reject value out of range", async () => {
        await expect(api.setCabinetRgbwBrightness([1, 2], 1, 2)).rejects.toThrow(
          "value must be a number between 0 and 1"
        );
      });
    });
  });

  // ==================== Preset API ====================
  describe("Preset API", () => {
    describe("getPreset", () => {
      it("should get preset list", async () => {
        const result = await api.getPreset();
        expect(result).toBeDefined();
      });
    });

    describe("applyPreset", () => {
      it("should apply preset with valid parameters", async () => {
        await expect(api.applyPreset("screen1", 1)).resolves.toBeUndefined();
      });

      it("should reject empty screenID", async () => {
        await expect(api.applyPreset("", 1)).rejects.toThrow("screenID must be a non-empty string");
      });

      it("should reject invalid sequence number", async () => {
        await expect(api.applyPreset("screen1", -1)).rejects.toThrow("sequenceNumber must be a non-negative integer");
      });
    });

    describe("modifyPreset", () => {
      it("should modify preset with valid parameters", async () => {
        await expect(
          api.modifyPreset("screen1", {
            sequenceNumber: 1,
            name: "Updated Preset",
            sourceData: true,
            processingData: false,
            outputData: true,
            screenData: false,
            effectSwitch: 1,
          })
        ).resolves.toBeUndefined();
      });

      it("should reject empty screen ID", async () => {
        await expect(
          api.modifyPreset("", {
            sequenceNumber: 1,
            name: "Updated Preset",
            sourceData: true,
            processingData: false,
            outputData: true,
            screenData: false,
            effectSwitch: 1,
          })
        ).rejects.toThrow("screenID must be a non-empty string");
      });

      it("should reject invalid sequence number", async () => {
        await expect(
          api.modifyPreset("screen1", {
            sequenceNumber: -1,
            name: "Updated Preset",
            sourceData: true,
            processingData: false,
            outputData: true,
            screenData: false,
            effectSwitch: 1,
          })
        ).rejects.toThrow("sequenceNumber must be a non-negative integer");
      });
    });
  });
});
