export const resources = {
  en: {
    translation: {
      'status.idle': 'Idle',
      'status.recording': 'Recording',
      'status.paused': 'Paused',
      'tooltip.start': 'Start recording',
      'tooltip.pause': 'Pause recording',
      'tooltip.region': 'Select region',
      'tooltip.mic': 'Toggle microphone',
      'tooltip.system': 'Toggle system audio',
      'tooltip.quality': 'Quality presets',
      'tooltip.language': 'Switch language',
      'tooltip.resume': 'Resume recording',
      'tooltip.regionClear': 'Clear region',
      'permission.audio.granted': 'Audio ready',
      'permission.audio.denied': 'Microphone permission blocked',
      'permission.screen.granted': 'Screen capture ready',
      'permission.screen.denied': 'Screen capture blocked'
    }
  },
  'zh-CN': {
    translation: {
      'status.idle': '待命',
      'status.recording': '录制中',
      'status.paused': '已暂停',
      'tooltip.start': '开始录制',
      'tooltip.pause': '暂停录制',
      'tooltip.region': '选择区域',
      'tooltip.mic': '切换麦克风',
      'tooltip.system': '切换系统音频',
      'tooltip.quality': '质量预设',
      'tooltip.language': '切换语言',
      'tooltip.resume': '恢复录制',
      'tooltip.regionClear': '清除区域',
      'permission.audio.granted': '音频权限已就绪',
      'permission.audio.denied': '麦克风权限被拒绝',
      'permission.screen.granted': '屏幕捕获已就绪',
      'permission.screen.denied': '屏幕捕获被拒绝'
    }
  }
};

export type LocaleKey = keyof typeof resources;
