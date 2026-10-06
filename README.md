# @novastar-dev/coex

A TypeScript library for controlling NovaStar COEX video wall processors via HTTP API, targeting **COEX firmware v1.5+**.

## Features

- **Full TypeScript support** with strict type checking
- **Promise-based API** with async/await
- **Screen group control** (brightness, color temperature, gamut, blackout, freeze) across controllers
- **Read-back verification** that catches COEX's silent no-ops
- **Comprehensive input validation** using type guards
- **169 tests** with 91%+ coverage
- **MSW 2.x** for API mocking in tests

## Installation

```bash
npm i @novastar-dev/coex
```

Requires Node 22+ (or a browser with `Promise.withResolvers`), which the group
read-back uses.

## Quick Start

```typescript
import { COEX } from "@novastar-dev/coex";

const device = new COEX("192.168.1.100", 8001);

async function main() {
  try {
    // Get available input sources
    const sources = await device.apiInstance.sources();
    console.log("Sources:", sources);

    // Set brightness
    await device.brightness(80);

    // Apply a preset
    await device.apiInstance.applyPreset("screen1", 1);
  } catch (error) {
    console.error("Error:", error);
  }
}

main();
```

## API Overview

### High-Level Methods (on `COEX` class)

| Method | Description |
|--------|-------------|
| `blackout()` | Set display to blackout mode |
| `normal()` | Set display to normal mode |
| `freeze()` | Freeze the current frame |
| `brightness(value)` | Set screen brightness (0-100) |
| `input(name)` | Switch input source by name |
| `summary()` | Get cabinet count |

### Screen API

| Method | Description |
|--------|-------------|
| `screen()` | Get screen information |
| `getScreenProperties()` | Get screen properties |
| `getCabinetCount()` | Get cabinet count |
| `getScreenGroups()` | List screen groups (screens sharing a `screenGroupID`) |
| `displaymode(value, screenIdList?)` | Set display mode (0=normal, 1=blackout, 2=freeze), empty list = all screens |
| `brightness(value, screenIdList?)` | Set brightness, 0-100 percent |
| `screenbrightness(value, screenIds)` | Set brightness for explicit screen IDs |
| `colortemperature(value, screenIdList?)` | Set color temperature (1700-15000K) |
| `gamma(value, screenIdList?)` | Set gamma (1.0-4.0) |
| `switchColorGamut(screenIdList, name)` | Switch color gamut by name (see `getGamutList()`) |
| `getGamutList()` | List gamut names and the active gamut per screen |
| `setMultiBrightness(screens)` | Multi-screen brightness (`POST /api/v1/screen/multi/brightness`), the shape VMP sends |
| `getDisplayState()` | Get display state |
| `getDisplayParams()` | Get display parameters (device values: brightness is 0-1) |
| `switchLayerSource(screenId, layers)` | Switch layer source |
| `setMapping(canvasId, mappingData)` | Set canvas mapping |
| `getScreenList()` | Get all screens |

### Screen Groups

Screens of one wall can be grouped in VMP; the group ID is published as `screenGroupID`
by `GET /api/v1/screen`. Controllers do not talk to each other, so a group spanning two
controllers (e.g. two MX40 Pro) is commanded by driving each controller with the screen
IDs it owns - `ScreenGroup` does that fan-out:

```typescript
import { COEX, ScreenGroup } from "@novastar-dev/coex";

const wall = new ScreenGroup(
  [new COEX("192.168.0.11"), new COEX("192.168.0.22")],
  { groupID: "{c2513ba3-a50a-4e58-811f-95c95ba2b577}" } // omit to address all screens
);

await wall.screens();          // [{ device, screenID, screenName, canvasIDs }, ...]
await wall.gamuts();           // available gamut names + active gamut per screen

await wall.brightness(80);     // 0-100 percent
await wall.colortemperature(6500);
await wall.gamut("Rec.2020");
await wall.blackout();
await wall.freeze();
await wall.normal();
```

Each call sends one request per controller, in parallel, carrying only that
controller's own screen IDs. Afterwards the value is read back from every
controller and a mismatch throws - COEX answers `Success` even for a screen ID the
controller does not own and then applies nothing:

```typescript
await wall.brightness(80);                        // verifies, throws on a silent no-op
await wall.brightness(80, { verify: false });     // skip the read-back (slider scrubbing)
await wall.brightness(80, { timeoutMs: 2500 });   // allow slower controllers
```

Verification tolerances: brightness `±0.02`, color temperature `±1000K` (controllers
snap to their gamut presets), gamut by name, display mode by canvas. Screens that the
controller does not report (no cabinets mapped) are skipped.

### Preset API

| Method | Description |
|--------|-------------|
| `getPreset()` | Get all presets |
| `applyPreset(screenID, sequenceNumber)` | Apply a preset |
| `modifyPreset(screenID, options)` | Modify preset settings |

### Device API

| Method | Description |
|--------|-------------|
| `sources()` | Get available input sources |
| `monitor()` | Get real-time monitoring info |
| `cabinet()` | Get cabinet information |
| `setHdrMode(id, hdrMode)` | Set HDR mode |
| `setInternalSource(options)` | Set internal source |
| `setSendingCardTestPattern(mode, params?)` | Set test pattern |
| `setShadow(inputIdList, type, shadow)` | Adjust shadow |
| `setHighlight(inputIdList, type, value)` | Adjust highlight |
| `setSaturation(inputIdList, value)` | Set saturation |
| `setContrast(inputIdList, value)` | Set contrast |
| `setHue(inputIdList, value)` | Set hue |
| `setEdid(inputId, options)` | Configure EDID |
| `setOutputAudio(enable, source)` | Set output audio |
| `getAudioSettings()` | Get audio settings |
| `controllerIdentify(enable, color)` | Identify controller |
| `getDeviceBackupStatus()` | Get backup status |
| `exportLog()` | Export device logs |
| `setSystemTime(options)` | Set system time |
| `setTimeZone(timezone)` | Set timezone |
| `setControllerName(name)` | Set controller name |
| `getSnmpStatus()` | Get SNMP status |
| `setSnmpOnOff(state)` | Enable/disable SNMP |
| `deviceIdentify(enable)` | Identify device |

### Cabinet API

| Method | Description |
|--------|-------------|
| `setNoDataSignal(idList, sourceType, imageType)` | Set no-data signal behavior |
| `setThermalCompensationOnOff(idList, enable)` | Toggle thermal compensation |
| `setThermalCompensationIntensity(idList, amount)` | Set compensation intensity |
| `setCabinetRgbBrightness(idList, r, g, b)` | Set RGB brightness |
| `setCabinetBrightness(idList, ratio, nit?)` | Set brightness |
| `adjustCabinetColorTemperature(idList, value)` | Adjust color temperature |
| `setReceivingCardTestPattern(idList, mode)` | Set test pattern |
| `enableCabinetMapping(idList, enable)` | Enable/disable mapping |
| `moveCabinet(screenID, canvases)` | Move cabinet |

## Error Handling

All methods throw typed errors with descriptive messages:

```typescript
try {
  await device.brightness(150); // Invalid: 0-100 range
} catch (error) {
  if (error instanceof Error) {
    console.log(error.message); // "brightness must be between 0 and 100"
  }
}
```

## TypeScript

The library exports all relevant types:

```typescript
import {
  COEX,
  ScreenGroup,
  createCoexApi,
  type Screen,
  type Cabinet,
  type Preset,
  type InputSource,
  type ScreenGroupInfo,
  type ApiResponse,
} from "@novastar-dev/coex";
```

## Upgrading from 2.0.4

Screen-level commands used to send payload keys the controllers ignore (`screenIds`,
`colorTemp`, `gamutType`, `canvasIDs`), so they answered `Success` and changed nothing.
2.1.0 sends the keys the controllers act on:

| Method | payload up to 2.0.4 | payload in 2.1.0 |
|--------|-------------|-------------|
| `brightness` / `screenbrightness` | `{brightness, screenIds}`, 0-100 | `{screenIdList, brightness}`, 0-100 (sent as the controller's 0-1) |
| `colortemperature` | `{colorTemp, screenIds}` | `{screenIdList, colorTemperature}`, 1700-15000K |
| `gamma` | `{gamma, screenIds}` | `{screenIdList, gamma}` |
| `switchColorGamut` | `{screenIdList, gamutType: number}` | `{name, screenIdList}` - takes a gamut name, see `getGamutList()` |
| `displaymode` | `{value, canvasIDs}` | `{value, screenIdList}` |

`COEX.brightness()` was reading the screen list from the wrong level of the response
envelope and always threw; it now resolves the screens of its controller.

## Testing

```bash
npm test        # Run tests
npm run test:coverage  # Run with coverage
```

## License

MIT
