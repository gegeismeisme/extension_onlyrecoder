import type { AppConfig } from '../types/config';

export const mergeConfig = (base: AppConfig, overrides?: Partial<AppConfig> | null): AppConfig => {
  if (!overrides) return base;

  return {
    ...base,
    ...overrides,
    video: { ...base.video, ...overrides.video },
    audio: { ...base.audio, ...overrides.audio },
    ui: { ...base.ui, ...overrides.ui },
    storage: { ...base.storage, ...overrides.storage }
  };
};

export const mergeOverrides = (
  prev: Partial<AppConfig> | null,
  patch: Partial<AppConfig>
): Partial<AppConfig> => ({
  ...prev,
  ...patch,
  video: { ...(prev?.video ?? {}), ...patch.video },
  audio: { ...(prev?.audio ?? {}), ...patch.audio },
  ui: { ...(prev?.ui ?? {}), ...patch.ui },
  storage: { ...(prev?.storage ?? {}), ...patch.storage }
});
