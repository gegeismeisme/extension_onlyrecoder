# OnlyRecoder TODO · 计划 & 进度

> 更新频率：每次完成/开始关键任务即同步；状态使用 `[ ] 待办` / `[~] 进行中` / `[x] 已完成`。

## 里程碑燃尽 · Milestone Burn-down
- **M1 Foundation**：架构/配置/i18n/UI 骨架 — 0%
- **M2 Capture Engine**：录制流程/区域框选 — 0%
- **M3 Audio & Quality**：混音、码率、4K — 0%
- **M4 Background & UX**：Service Worker、offscreen、动效 — 0%
- **M5 Release**：打包、自动化、文档 — 0%

## 当前冲刺 · Sprint 0 (环境搭建)
| 状态 | 任务 | 说明 / 负责人 |
| --- | --- | --- |
| [ ] | 初始化 `pnpm + Vite + Manifest V3` 工程 | scaffold、目录、CI，Owner: FE |
| [ ] | 建立 `config/app.config.json` 结构与类型 | 默认值、校验、同步策略 |
| [ ] | 构建 `_locales` + i18next 双语骨架 | zh-CN / en-US + 文案示例 |
| [ ] | 定义 icon-first 设计规范 & 样式基线 | 颜色、尺寸、hover/active 状态 |

## 技术架构 & 配置
- [ ] 权限矩阵与 Manifest 配置（tabCapture/desktopCapture/offscren 等）
- [ ] Zustand + IndexedDB 状态持久化封装
- [ ] 配置面板（图标式）+ 热重载通道

## 录制与渲染引擎
- [ ] Tab capture service（监听 `tabs.onActivated` 自动切流）
- [ ] 区域框选 overlay（offscreen + CSS mask + 热键）
- [ ] 录制状态机（start/pause/resume/stop/export）
- [ ] WebM 导出流程 + 下载写入

## 音频混录
- [ ] 麦克风与系统音采集权限检测
- [ ] Web Audio Graph 混音（增益/压缩/延迟补偿）
- [ ] 图标控制（长按 radial mixer + tooltip 文案）

## UI & 多语言
- [ ] Popup 主界面（图标网格 + 状态指示）
- [ ] Tooltip/辅助文案（zh/EN 映射）
- [ ] 空状态 + 权限引导（说明图标 + 动画）

## 性能 & 后台
- [ ] Service Worker 录制队列 + 任务恢复
- [ ] Offscreen document re-encode + 缩略图
- [ ] 性能探针（CPU/内存监控 + 自动降级）

## QA & 发布
- [ ] ESLint/Vitest 基线
- [ ] Playwright 自动化：权限 & 区域录制
- [ ] 打包脚本（Chrome/Edge/Firefox）+ README/隐私说明

## 阻塞 / 依赖
- 无（等待仓库初始化即可开始 M1）。
