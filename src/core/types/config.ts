export type ResolutionPreset = 'auto' | '1080p' | '4k';

export interface VideoConfig {
  resolution: ResolutionPreset;
  maxBitrate: number;
  framerate: 30 | 60;
}

export interface AudioConfig {
  mic: boolean;
  system: boolean;
  duckMusicOnMic: boolean;
}

export type LanguageOption = 'auto' | 'en' | 'zh-CN';
export type ThemeOption = 'dark' | 'light';

export interface UiConfig {
  language: LanguageOption;
  theme: ThemeOption;
  iconSize: number;
}

export interface StorageConfig {
  autoExport: 'Downloads' | 'Picker';
  keepTempHours: number;
}

export interface AppConfig {
  video: VideoConfig;
  audio: AudioConfig;
  ui: UiConfig;
  storage: StorageConfig;
}

export const DEFAULT_CONFIG: AppConfig = {
  video: {
    resolution: 'auto',
    maxBitrate: 12000,
    framerate: 60
  },
  audio: {
    mic: true,
    system: true,
    duckMusicOnMic: true
  },
  ui: {
    language: 'auto',
    theme: 'dark',
    iconSize: 32
  },
  storage: {
    autoExport: 'Downloads',
    keepTempHours: 24
  }
};
