# OnlyRecoder TODO - Plan & Progress

> Status legend: `[ ]` backlog / `[~]` in progress / `[x]` done. Update after every meaningful change.

## Milestone Burn-down
- **M1 Foundation**: 45%
- **M2 Capture Engine**: 25%
- **M3 Audio & Quality**: 0%
- **M4 Background & UX**: 10%
- **M5 Release**: 5%

## Sprint 0 (Bootstrap)
| Status | Task | Notes |
| --- | --- | --- |
| [x] | Setup `pnpm + Vite + Manifest V3` | Scaffold, scripts, build OK |
| [x] | Define `config/app.config.json` + typings | Defaults, validation, static copy |
| [x] | `_locales` + i18next | zh-CN / en-US switch |
| [~] | Icon-first design baseline | Tailwind theme + icon set, waiting on motion rules |

## Tech & Config
- [x] Manifest permissions (tab/desktop capture, offscreen, commands)
- [x] Zustand + IndexedDB persistence
- [x] Settings panel + hot reload channel

## Capture & Rendering
- [~] Tab capture service (streamId + stop + active tab tracking, auto-switch experiments)
- [x] Region overlay (offscreen drag, store, keyboard pending)
- [~] Recorder state machine (MediaRecorder + desktop fallback + region crop)
- [~] WebM export pipeline (FFmpeg wasm stub + queue telemetry, MP4 beta toggle)

## Audio Mixing
- [ ] Mic/system permission detection UX
- [ ] Web Audio Graph mixing (gain/compression/latency)
- [ ] Icon controls (press-and-hold radial mixer)

## UI & Localization
- [~] Popup grid (icon controls, status badge, region badge, pause, permissions, timeline, onboarding)
- [x] Tooltip / copy (zh & en)
- [~] Empty/permission states (icon hints + animation)

## Performance & Background
- [~] Service worker: state sync, shortcuts, tab context tracking
- [x] Message bus guard (safeSend wrappers + Receiving-end suppression)
- [x] Recording start diagnostics (capture permission trace + user-facing error copy)
- [ ] Offscreen re-encode + thumbnails
- [ ] Performance probe (CPU/memory telemetry + auto-degrade)

## QA & Release
- [x] ESLint / Vitest / Vite baseline
- [ ] Playwright automation (permissions + region flow)
- [ ] Packaging scripts (Chrome/Edge/Firefox) + README/privacy notes

## Blockers / Dependencies
- None (M1/M2 ready for parallel work)
