# OnlyRecoder 交付计划 · Delivery Plan

## 项目目标 · Goals
- 提供跨标签/窗口录制能力，并支持区域框选与后台导出。
- 双音源混录（麦克风 + 系统），保证高质量输出（最高 4K/60fps，20 Mbps）。
- 前端 UI 以图标为主，文本仅出现在 tooltip（中英双语）。
- 配置简洁：少量高价值开关，可在本地/云端同步。

## 成功准则 · Success Criteria
1. **易用**：打开扩展即可录制，全部操作通过图标完成，工具提示覆盖 zh/EN。
2. **稳定**：长时间录制不中断，后台导出不卡主进程。
3. **质量**：输出至少 1080p/60fps，支持可选 4K；音频无破音/明显延迟。
4. **可维护**：模块化代码、完善脚本与测试、清晰的配置/本地化体系。

## 阶段里程碑 · Phased Milestones
| Milestone | 内容 | 完成定义 |
| --- | --- | --- |
| **M1 - Foundation** | 初始化 Manifest V3 + TypeScript + Vite，建立配置 & i18n 骨架，完成 icon-first UI 线框 | 通过 ESLint/Vitest，popup 能显示状态并切换语言 |
| **M2 - Capture Engine** | 接入 tabCapture/desktopCapture，区域框选叠层，录制流程（开始/暂停/停止/导出） | 成功导出单段 WebM，区域/整页切换可用 |
| **M3 - Audio & Quality** | 混音、降噪、码率/分辨率设置、硬件加速选项 | 同时捕获麦克风与系统音，4K 录制稳定 10+ 分钟 |
| **M4 - Background & UX polish** | Service Worker 调度、offscreen re-encode、图标动画、热键、通知 | 后台导出/清理完成，图标交互符合视觉规范 |
| **M5 - Release** | 商店打包、自动化测试、文档、反馈通道 | 通过 Chrome/Edge/Firefox 预检，提供版本日志 |

## 工作流拆解 · Workstreams
### 1. 技术架构 & 配置
- Manifest/权限策略、构建脚本、`config/app.config.json` 解析。
- IndexedDB + sync storage 备份配置；支持语言、质量、存储路径、性能模式开关。

### 2. 录制与渲染引擎
- Tab/窗口捕获：监听 `tabs.onActivated` 自动切换流。
- 区域框选：offscreen overlay + CSS mask，支持快速重绘。
- 质量：MediaTrackConstraints + MediaRecorder + 可选 WebCodecs。
- 导出：WebM->MP4 转码（可选 FFmpeg WASM），后台写入 Downloads。

### 3. 音频混录
- 同时请求麦克风 & 系统音频；使用 Web Audio Graph 做增益、压缩、延迟补偿。
- 采用图标按钮切换音源状态，长按出现 radial mixer。

### 4. UI & 多语言
- Preact 组件库 + Tailwind，严格使用图标（Lucide/Iconify）+ tooltip。
- i18next + `_locales` 保持 zh/EN 同步；文案存储为 key-value，UI 根据语言切换。
- 提供空状态、权限指引、录制状态条。

### 5. 性能 & 后台
- Service Worker 负责状态机、文件写入、崩溃恢复。
- Offscreen document/worker 处理编码与缩略图。
- Telemetry：采集 CPU/内存占用、失败日志（匿名）。

### 6. QA & 发布
- 单元测试（Vitest）覆盖配置、状态机、i18n。
- Playwright 自动化：权限流程、区域框选、导出。
- 打包脚本生成多浏览器 zip，配套 README/隐私说明。

## 风险与对策 · Risks & Mitigation
| 风险 | 影响 | 对策 |
| --- | --- | --- |
| 浏览器限制系统音频捕获 | 无法录系统声 | 提示系统音频权限或提供虚拟声卡指引 |
| 长时间录制导致内存压力 | 录制失败或掉帧 | 分段写入、后台编码、压力监控自动降档 |
| 图标-only UI 理解度 | 用户不明白功能 | Tooltip + 入门引导 + 颜色状态指示 |
| 4K 编码性能不足 | 视频卡顿 | 检测硬件能力，自动推荐 1080p/30fps |

## 依赖 · Dependencies
- 浏览器：Chrome 116+/Edge 116+/Firefox Manifest V3 Nightly。
- 权限：`tabCapture`, `desktopCapture`, `storage`, `downloads`, `offscreen`.
- 第三方：`@iconify/react`, `zustand`, `i18next`, `idb`, `ffmpeg.wasm`.

## 资源估算 · Effort
- M1-M2：2 周（1 前端 + 1 媒体工程师）
- M3-M4：3 周（含音频/性能优化）
- M5：1 周（QA + 商店审核）

## 下一步 · Next Actions
1. 创建仓库结构与脚本（pnpm + Vite + Manifest scaffolding）。
2. 定义 UI 原子组件与图标规范。
3. 实现配置/语言基础设施，以便后续功能快速集成。
