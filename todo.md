# OnlyRecoder TODO · 计划 & 进度

> 更新频率：每次完成或启动关键任务立即同步；状态使用 `[ ] 待办` / `[~] 进行中` / `[x] 已完成`。

## 里程碑燃尽 · Milestone Burn-down
- **M1 Foundation**：架构/配置/i18n/UI 骨架 — 45%
- **M2 Capture Engine**：录制流程/区域框选 — 15%
- **M3 Audio & Quality**：混音、码率、4K — 0%
- **M4 Background & UX**：Service Worker、offscreen、动效 — 10%
- **M5 Release**：打包、自动化、文档 — 5%

## 当前冲刺 · Sprint 0 (环境搭建)
| 状态 | 任务 | 说明 / 负责人 |
| --- | --- | --- |
| [x] | 初始化 `pnpm + Vite + Manifest V3` 工程 | 脚手架、目录、脚本、构建通过 |
| [x] | 建立 `config/app.config.json` 结构与类型 | 默认值、类型守卫、静态拷贝 |
| [x] | 构建 `_locales` + i18next 双语骨架 | zh-CN / en-US 文案与切换逻辑 |
| [~] | 定义 icon-first 设计规范 & 样式基线 | Tailwind 主题 + Icon 组件，等待动画规范 |

## 技术架构 & 配置
- [x] 权限矩阵与 Manifest（tab/desktop capture, offscreen, commands）
- [x] Zustand + IndexedDB 状态持久化封装
- [ ] 配置面板（图标式）+ 热重载通道

## 录制与渲染引擎
- [~] Tab capture service（streamId 请求 + stop + active tab 跟踪，待自动切流）
- [x] 区域框选 overlay（offscreen 拖框 + region store；热键/多显示器待增强）
- [~] 录制状态机（MediaRecorder skeleton + 文件下载，待剪辑/导出 UI）
- [ ] WebM 导出流程 + 下载写入（WASM 后处理、封装信息）

## 音频混录
- [ ] 麦克风与系统音采集权限检测
- [ ] Web Audio Graph 混音（增益/压缩/延迟补偿）
- [ ] 图标控制（长按 radial mixer + tooltip 文案）

## UI & 多语言
- [~] Popup 主界面（图标网格 + 状态指示 + 区域 badge + 暂停控制 + 权限提示/计时/申请入口）
- [x] Tooltip/辅助文案（zh/EN 映射）
- [~] 空状态 + 权限引导（图标提示，待动画/权限检测）

## 性能 & 后台
- [~] Service Worker 基础：状态同步、快捷键、tab context 跟踪
- [ ] Offscreen document re-encode + 缩略图
- [ ] 性能探针（CPU/内存监控 + 自动降级）

## QA & 发布
- [x] ESLint/Vitest/Vite build 基线
- [ ] Playwright 自动化：权限 & 区域录制
- [ ] 打包脚本（Chrome/Edge/Firefox）+ README/隐私说明

## 阻塞 / 依赖
- 无（已具备 M1/M2 并行开发条件）
