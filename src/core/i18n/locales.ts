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
      'tooltip.language': 'Switch language'
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
      'tooltip.language': '切换语言'
    }
  }
};

export type LocaleKey = keyof typeof resources;
