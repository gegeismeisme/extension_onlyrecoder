import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AppConfig, LanguageOption } from '../types/config';
import { DEFAULT_CONFIG } from '../types/config';
import { loadConfig } from '../config';
import { indexedDbStorage } from './db';
import type { CaptureMode, RegionBounds } from '../types/capture';
import type { RecorderStatus } from '../types/recorder';
import { mergeConfig, mergeOverrides } from '../utils/configMerge';

export interface AudioState {
  mic: boolean;
  system: boolean;
}

interface AppState {
  status: RecorderStatus;
  regionMode: boolean;
  captureMode: CaptureMode;
  regionBounds?: RegionBounds;
  audio: AudioState;
  permissions: {
    audio: boolean;
    screen: boolean;
  };
  timeline: {
    startedAt: number | null;
    elapsedMs: number;
  };
  hasSeenOnboarding: boolean;
  onboardingDismissedAt: number | null;
  onboardingStep: number;
  configOverrides: Partial<AppConfig> | null;
  qualityPreset: number;
  language: LanguageOption;
  config: AppConfig;
  exportStatus: 'idle' | 'processing';
  exportStage: string | null;
  hydrateConfig: () => Promise<void>;
  setStatus: (status: RecorderStatus) => void;
  setRegionMode: (enabled: boolean) => void;
  setCaptureMode: (mode: CaptureMode) => void;
  setRegionBounds: (region?: RegionBounds) => void;
  setAudio: (channel: keyof AudioState, enabled: boolean) => void;
  setPermissions: (permissions: { audio?: boolean; screen?: boolean }) => void;
  setTimeline: (timeline: Partial<AppState['timeline']>) => void;
  setOnboardingSeen: () => void;
  resetOnboarding: () => void;
  setOnboardingStep: (step: number) => void;
  updateConfig: (partial: Partial<AppConfig>) => void;
  refreshConfig: () => Promise<void>;
  cycleQuality: () => void;
  setLanguage: (lang: LanguageOption) => void;
  mergeBackgroundState: (
    payload: Partial<Pick<AppState, 'status' | 'regionMode' | 'captureMode'>> & {
      audio?: AudioState;
      regionBounds?: RegionBounds;
      permissions?: AppState['permissions'];
      timeline?: AppState['timeline'];
      exportStatus?: AppState['exportStatus'];
    }
  ) => void;
}

const createInitialState = (): Omit<
  AppState,
  | 'hydrateConfig'
  | 'setStatus'
  | 'setRegionMode'
  | 'setCaptureMode'
  | 'setRegionBounds'
  | 'setAudio'
  | 'setPermissions'
  | 'setTimeline'
  | 'setOnboardingSeen'
  | 'resetOnboarding'
  | 'setOnboardingStep'
  | 'updateConfig'
  | 'refreshConfig'
  | 'cycleQuality'
  | 'setLanguage'
  | 'mergeBackgroundState'
> => ({
  status: 'idle',
  regionMode: false,
  captureMode: 'tab',
  regionBounds: undefined,
  audio: {
    mic: true,
    system: true
  },
  permissions: {
    audio: false,
    screen: false
  },
  timeline: {
    startedAt: null,
    elapsedMs: 0
  },
  hasSeenOnboarding: false,
  onboardingDismissedAt: null,
  onboardingStep: 0,
  configOverrides: null,
  exportStatus: 'idle',
  exportStage: null,
  qualityPreset: 0,
  language: DEFAULT_CONFIG.ui.language,
  config: DEFAULT_CONFIG
});

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...createInitialState(),
      hydrateConfig: async () => {
        let cfg: AppConfig | null = null;
        const runtime = typeof chrome !== 'undefined' ? chrome.runtime : undefined;
        if (runtime?.sendMessage) {
          try {
            const response = (await runtime.sendMessage({ type: 'config:get' })) as
              | { config: AppConfig }
              | undefined;
            if (response?.config) {
              cfg = response.config;
            }
          } catch {
            cfg = null;
          }
        }
        if (!cfg) {
          cfg = await loadConfig();
        }
        const currentLang = get().language;
        set({
          config: cfg,
          language: currentLang === 'auto' ? cfg.ui.language : currentLang
        });
      },
      setStatus: (status) => set({ status }),
      setRegionMode: (enabled) => set({ regionMode: enabled }),
      setCaptureMode: (mode) => set({ captureMode: mode }),
      setRegionBounds: (region) => set({ regionBounds: region }),
      setAudio: (channel, enabled) =>
        set((state) => ({ audio: { ...state.audio, [channel]: enabled } })),
      setPermissions: (permissions) =>
        set((state) => ({
          permissions: { ...state.permissions, ...permissions }
        })),
      setTimeline: (timeline) =>
        set((state) => ({
          timeline: { ...state.timeline, ...timeline }
        })),
      setOnboardingSeen: () =>
        set({
          hasSeenOnboarding: true,
          onboardingDismissedAt: Date.now()
        }),
      resetOnboarding: () =>
        set({
          hasSeenOnboarding: false,
          onboardingDismissedAt: null,
          onboardingStep: 0
        }),
      setOnboardingStep: (step) => set({ onboardingStep: step }),
      updateConfig: (partial) => {
        set((state) => {
          const overrides = mergeOverrides(state.configOverrides, partial);
          const merged = mergeConfig(state.config, partial);
          return {
            configOverrides: overrides,
            config: merged
          };
        });
        const runtime = typeof chrome !== 'undefined' ? chrome.runtime : undefined;
        runtime?.sendMessage({ type: 'config:update', patch: partial }).then((response) => {
          if (response?.config) {
            set({ config: response.config });
          }
        });
      },
      refreshConfig: async () => {
        const runtime = typeof chrome !== 'undefined' ? chrome.runtime : undefined;
        if (!runtime?.sendMessage) {
          await get().hydrateConfig();
          return;
        }
        try {
          const response = (await runtime.sendMessage({ type: 'config:refresh' })) as
            | { config: AppConfig }
            | undefined;
          if (response?.config) {
            set({ config: response.config, configOverrides: null });
          }
        } catch {
          await get().hydrateConfig();
        }
      },
      cycleQuality: () =>
        set((state) => ({
          qualityPreset: (state.qualityPreset + 1) % 3
        })),
      setLanguage: (lang) => set({ language: lang }),
      mergeBackgroundState: (payload) => {
        const next: Partial<AppState> = {};
        if (payload.status) next.status = payload.status;
        if (typeof payload.regionMode === 'boolean') next.regionMode = payload.regionMode;
        if (payload.captureMode) next.captureMode = payload.captureMode;
        if (payload.audio) next.audio = payload.audio;
        if ('regionBounds' in payload) next.regionBounds = payload.regionBounds;
        if (payload.permissions) next.permissions = payload.permissions;
        if (payload.timeline) next.timeline = payload.timeline;
        if (payload.exportStatus) next.exportStatus = payload.exportStatus;
        if ('exportStage' in payload)
          next.exportStage = (payload.exportStage as string | null) ?? null;
        set(next);
      }
    }),
    {
      name: 'onlyrecoder-app',
      storage: createJSONStorage(() => indexedDbStorage),
      partialize: (state) => ({
        language: state.language,
        qualityPreset: state.qualityPreset,
        audio: state.audio,
        permissions: state.permissions,
        timeline: state.timeline,
        hasSeenOnboarding: state.hasSeenOnboarding,
        onboardingDismissedAt: state.onboardingDismissedAt,
        onboardingStep: state.onboardingStep,
        configOverrides: state.configOverrides,
        regionBounds: state.regionBounds,
        captureMode: state.captureMode,
        exportStage: state.exportStage
      })
    }
  )
);
