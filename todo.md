# OnlyRecoder TODO · 计划 & 进度

> 更新频率：每次完成或启动关键任务立即同步；状态使用 `[ ]` 待办 / `[~]` 进行中 / `[x]` 已完成。

## 里程碑燃尽 · Milestone Burn-down
- **M1 Foundation**：45%
- **M2 Capture Engine**：25%
- **M3 Audio & Quality**：0%
- **M4 Background & UX**：10%
- **M5 Release**：5%

## 当前冲刺 · Sprint 0（环境搭建）
| 状态 | 任务 | 说明 |
| --- | --- | --- |
| [x] | 初始化 `pnpm + Vite + Manifest V3` | 脚手架、目录、脚本、构建通过 |
| [x] | 建立 `config/app.config.json` 与类型体系 | 默认值、类型守卫、静态拷贝 |
| [x] | `_locales` + i18next 双语骨架 | zh-CN / en-US 文案切换 |
| [~] | Icon-first 设计规范 | Tailwind 主题 + Icon 组件，等待动画规范 |

## 技术架构 & 配置
- [x] Manifest 权限矩阵（tab/desktop capture、offscreen、commands）
- [x] Zustand + IndexedDB 状态持久化
- [x] 配置面板（图标式）+ 热重载通道（popup gear + backend overrides + config:refresh）

## 录制与渲染引擎
- [~] Tab capture service（streamId 请求 + stop + active tab 跟踪，自动切流实验中）
- [x] 区域框选 overlay（offscreen 拖框 + region store；热键/多显示器待增强）
- [~] 录制状态机（MediaRecorder + 桌面 fallback + 区域裁剪，持续迭代 UI/UX）
- [~] WebM 导出流程 + 下载写入（FFmpeg wasm stub + 队列状态反馈）

## 音频混录
- [ ] 麦克风与系统音采集权限检测
- [ ] Web Audio Graph 混音（增益/压缩/延迟补偿）
- [ ] 图标控制（长按 radial mixer + tooltip 文案）

## UI & 多语言
- [~] Popup 主界面（图标网格 + 状态指示 + 区域 badge + 暂停控制 + 权限提示/计时/申请入口 + 多步 onboarding 动画）
- [x] Tooltip/辅助文案（zh/EN 映射）
- [~] 空状态 + 权限引导（图标提示 + 动画）

## 性能 & 后台
- [~] Service Worker 基础：状态同步、快捷键、tab context 跟踪
- [ ] Offscreen document re-encode + 缩略图
- [ ] 性能探针（CPU/内存监控 + 自动降级）

## QA & 发布
- [x] ESLint/Vitest/Vite build 基线
- [ ] Playwright 自动化：权限 & 区域录制流程
- [ ] 打包脚本（Chrome/Edge/Firefox）+ README/隐私说明

## 阻塞 / 依赖
- 无（已具备 M1/M2 并行开发条件）
