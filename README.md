# OnlyRecoder Browser Extension

## 产品概览 · Product Overview
- 这是一款面向 Chrome/Edge/Firefox（Manifest V3 兼容层）的录屏扩展，聚焦“一次录制多标签”、“区域裁剪”、“多音源混录”、“后台持续运行”四个关键词。
- Designed for cross-tab storytelling: capture any active tab, switch freely during a session, or fall back to window/desktop capture when the browser platform requires it.

## 核心能力 · Key Capabilities
- 🌀 **Tab Hop Recording / 标签跳录**：同一浏览器窗口内点击不同标签即可完成多段内容录制；跨浏览器时以窗口为单位切换。
- 🪟 **Region Box / 区域框选**：拉取可视区域后仅录制指定矩形；支持热键重新调整。
- 💎 **Quality Control / 质量控制**：可选自适应/4K 固定分辨率、可调码率（4~20 Mbps）、启用硬件加速的 MediaRecorder。
- 🎚️ **Dual Audio Mix / 双音源混录**：同时捕获麦克风与系统播放流，经 Web Audio 混音后输入录制流；若浏览器受限可通过虚拟声卡兜底。
- ♻️ **Background Service / 后台常驻**：使用 Manifest V3 Service Worker + offscreen document，让录制与导出在后台进行，避免阻塞前台交互。
- ⚙️ **One-glance Config / 一目了然配置**：通过 `config/app.config.json` 提供少量高影响力选项，支持热重载与云同步。
- 🌐 **Bilingual UX / 中英双语**：仅保留 `zh-CN` 与 `en-US` 语言包，根据系统/手动切换，在 UI 中以 tooltip 提示文字，主体以图标呈现。

## 技术栈 & 架构 · Tech Stack & Architecture
| Layer | Choice | Rationale |
| --- | --- | --- |
| Extension Runtime | Manifest V3, cross-browser polyfill (`@extend-chrome/*`) | 统一 Chrome/Edge/Firefox 发布流程 |
| Language | TypeScript + Vite | 快速热更新，良好类型推断 |
| UI | Preact + Tailwind + Lucide Icons | 轻量、图标丰富，可轻松在 popup 与 offscreen 复用 |
| State & Data | Zustand + IndexedDB (idb) | 简洁状态管理，持久化录制偏好 |
| Media | `chrome.tabCapture`, `desktopCapture`, `MediaRecorder`, `OffscreenCanvas`, `Web Audio API` | 满足多标签、区域、音频混录与高质量导出 |
| Localization | `i18next` + message catalog (`_locales/en/messages.json`, `_locales/zh_CN/messages.json`) | Manifest 原生多语言配合前端翻译 |
| Build & QA | Vite + ESLint + Vitest + Playwright | 分层测试（逻辑/交互/e2e） |

### 模块拆分
1. `background/`：service worker，负责任务编排、权限请求、与原生 API 通信。
2. `recorder-engine/`：封装视频/音频捕获、区域遮罩、性能统计。
3. `ui/popup/`：图标式面板，展示状态、控制录制。
4. `ui/offscreen/`：区域框选、可视化指示器。
5. `core/i18n` 与 `core/config`：配置加载、双语切换、同步。

## 录制模式与质量 · Capture Modes & Quality
| 模式 | 说明 | 触发方式 |
| --- | --- | --- |
| Tab Capture | 捕获当前标签；切换标签时通过事件监听自动更新 MediaStream | 默认 |
| Region Capture | 利用 `desktopCapture` + 裁剪遮罩，仅输出选中区域 | 图标「🔳」进入框选 |
| Full Window/Desktop | 需要跨浏览器或多窗口时选择 | 图标「🖥️」 |

- 编码：优先 `video/webm;codecs=vp9`，可选 `H264`；音频 `opus`。
- 后处理：Offscreen Worker 支持帧率/码率重新编码，必要时调用 WASM 版 FFmpeg 导出 MP4。

## 音频策略 · Audio Strategy
1. 获取麦克风 `navigator.mediaDevices.getUserMedia({audio:true})`
2. 获取系统音频（tab/system audio capture）
3. 使用 `AudioContext` 合并并应用增益、压缩、噪声抑制
4. 将混音输出连接至 `MediaStreamDestination` 注入 Recorder
5. 若浏览器限制系统音频：提示用户安装虚拟声卡或启用浏览器内置“共享系统音频”

## 配置与多语言 · Configuration & Localization
```json
{
  "video": { "resolution": "auto", "maxBitrate": 12000, "framerate": 60 },
  "audio": { "mic": true, "system": true, "duckMusicOnMic": true },
  "ui": { "language": "auto", "theme": "dark", "iconSize": 32 },
  "storage": { "autoExport": "Downloads", "keepTempHours": 24 }
}
```
- 所有配置支持 UI 图标切换（例如分辨率用 4K/HD/Auto 图标）。
- `_locales` 仅包含 `en` 与 `zh_CN`，tooltip 文字同步 `i18next`。

## 界面与交互 · Icon-first UI
| 控件 | 图标建议 | 行为 |
| --- | --- | --- |
| 开始/暂停 | `▶ / ⏸` | 长按开启倒计时，单击切换状态 |
| 区域框选 | `🔳` | 进入/退出区域模式 |
| 音频 | `🎙`（麦克风）、`🎧`（系统音） | 点击启用/禁用，长按打开混音滑块 |
| 质量 | `💎` | 弹出圆环菜单选择码率/分辨率 |
| 语言 | `🌐` | 在 zh/EN 之间切换 |
| 设置 | `⚙️` | 极简设置（存储路径、热键、性能模式） |

附加指示：使用色环/发光边框展示当前录制状态；所有提示文字通过 tooltip 呈现，符合 “尽量不用文本型前端显示元素” 的要求。

## 后台与性能 · Background & Performance
- Service Worker 负责长时间录制、文件写入、定时清理临时文件。
- Offscreen document 处理编码，防止阻塞 popup。
- 使用 `requestVideoFrameCallback` + `WebCodecs`（可选）实现高效帧写入。
- 自动降级策略：若检测到 CPU/内存压力，提示切换到 30 fps 或暂停混音。

## 开发与构建 · Development & Build
```bash
# install
pnpm install
# 开发调试（自动加载目标浏览器）
pnpm dev
# 生成发行包
pnpm build
```
- `pnpm dev` 集成 `wext-shipit`，在 Chrome/Edge/Firefox 中热重载。
- Playwright 脚本验证录制按钮与权限流程；Vitest 覆盖核心逻辑。

## 里程碑快照 · Roadmap Snapshot
1. **M1 基础设施**：完成项目脚手架、配置、双语与核心 UI。
2. **M2 录制引擎**：实现 tab capture、区域框选、音频混录、后台导出。
3. **M3 质量与性能**：自适应码率、4K 录制、硬件加速、压力自检。
4. **M4 体验打磨**：快捷键、图标动画、导出历史、远程配置同步。
5. **M5 发布与迭代**：商店打包、崩溃/性能遥测、用户反馈闭环。
