import type { AppConfig } from '../types/config';
import { DEFAULT_CONFIG } from '../types/config';

const CONFIG_URL = chrome?.runtime
  ? chrome.runtime.getURL('app.config.json')
  : '/app.config.json';

let cachedConfig: AppConfig | null = null;

export async function loadConfig(): Promise<AppConfig> {
  if (cachedConfig) {
    return cachedConfig;
  }

  try {
    const response = await fetch(CONFIG_URL, { cache: 'no-cache' });
    if (!response.ok) {
      throw new Error(`Failed to fetch config: ${response.status}`);
    }
    const config = (await response.json()) as AppConfig;
    cachedConfig = {
      ...DEFAULT_CONFIG,
      ...config,
      video: { ...DEFAULT_CONFIG.video, ...config.video },
      audio: { ...DEFAULT_CONFIG.audio, ...config.audio },
      ui: { ...DEFAULT_CONFIG.ui, ...config.ui },
      storage: { ...DEFAULT_CONFIG.storage, ...config.storage }
    };
    return cachedConfig;
  } catch (error) {
    console.warn('[config] falling back to default config', error);
    cachedConfig = DEFAULT_CONFIG;
    return cachedConfig;
  }
}

export function hydrateConfig(overrides: Partial<AppConfig>) {
  cachedConfig = overrides
    ? {
        ...DEFAULT_CONFIG,
        ...overrides,
        video: { ...DEFAULT_CONFIG.video, ...overrides.video },
        audio: { ...DEFAULT_CONFIG.audio, ...overrides.audio },
        ui: { ...DEFAULT_CONFIG.ui, ...overrides.ui },
        storage: { ...DEFAULT_CONFIG.storage, ...overrides.storage }
      }
    : DEFAULT_CONFIG;
}
