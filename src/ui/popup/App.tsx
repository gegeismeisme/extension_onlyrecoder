import { useCallback, useEffect, useMemo } from 'preact/hooks';
import { IconToggle } from '../components/IconToggle';
import { RegionBadge } from '../components/RegionBadge';
import { initI18n, t } from '../../core/i18n';
import { useAppStore, type AudioState } from '../../core/state/appStore';
import type { RecorderStatus } from '../../core/types/recorder';

const runtime = typeof chrome !== 'undefined' ? chrome.runtime : undefined;

interface BackgroundState {
  active: boolean;
  paused: boolean;
  regionMode: boolean;
  audio: {
    mic: boolean;
    system: boolean;
  };
}

const bgStatusToRecorder = (state: BackgroundState): RecorderStatus => {
  if (!state.active) return 'idle';
  return state.paused ? 'paused' : 'recording';
};

export function App() {
  const config = useAppStore((s) => s.config);
  const language = useAppStore((s) => s.language);
  const status = useAppStore((s) => s.status);
  const regionMode = useAppStore((s) => s.regionMode);
  const captureMode = useAppStore((s) => s.captureMode);
  const regionBounds = useAppStore((s) => s.regionBounds);
  const audio = useAppStore((s) => s.audio);
  const qualityPreset = useAppStore((s) => s.qualityPreset);
  const hydrateConfig = useAppStore((s) => s.hydrateConfig);
  const setLanguage = useAppStore((s) => s.setLanguage);
  const cycleQuality = useAppStore((s) => s.cycleQuality);
  const mergeBackgroundState = useAppStore((s) => s.mergeBackgroundState);

  useEffect(() => {
    const boot = async () => {
      await hydrateConfig();
      if (runtime) {
        try {
          const state = (await runtime.sendMessage({ type: 'recorder:status' })) as BackgroundState;
          if (state) {
            mergeBackgroundState({
              status: bgStatusToRecorder(state),
              regionMode: state.regionMode,
              audio: state.audio
            });
          }
        } catch (error) {
          console.warn('[popup] unable to query status', error);
        }
      }
    };
    boot();

    const handler = (message: any) => {
      if (message?.type === 'recorder:toggled') {
        mergeBackgroundState({ status: message.active ? 'recording' : 'idle' });
      }
      if (message?.type === 'audio:updated') {
        mergeBackgroundState({ audio: message.audio });
      }
      if (message?.type === 'region:toggle') {
        mergeBackgroundState({ regionMode: message.enabled });
      }
      if (message?.type === 'region:selected') {
        mergeBackgroundState({
          regionBounds: message.region,
          captureMode: 'region',
          regionMode: false
        });
      }
      if (message?.type === 'region:cleared') {
        mergeBackgroundState({ regionBounds: undefined, captureMode: 'tab' });
      }
    };

    runtime?.onMessage.addListener(handler);
    return () => {
      runtime?.onMessage.removeListener(handler);
    };
  }, [hydrateConfig, mergeBackgroundState]);

  useEffect(() => {
    initI18n(language).catch((error) => console.warn('[popup] i18n init failed', error));
  }, [language]);

  const toggleRecording = useCallback(async () => {
    const response = (await runtime?.sendMessage({ type: 'recorder:toggle' })) as
      | BackgroundState
      | undefined;
    if (response) {
      mergeBackgroundState({
        status: bgStatusToRecorder(response)
      });
    }
  }, [mergeBackgroundState]);

  const toggleRegion = useCallback(async () => {
    const response = (await runtime?.sendMessage({ type: 'region:toggle' })) as
      | { regionMode: boolean }
      | undefined;
    if (response) {
      mergeBackgroundState({
        regionMode: response.regionMode,
        captureMode: response.regionMode ? 'region' : captureMode
      });
    }
  }, [captureMode, mergeBackgroundState]);

  const toggleAudio = useCallback(
    async (channel: 'mic' | 'system') => {
      const response = (await runtime?.sendMessage({
        type: 'audio:toggle',
        channel,
        enabled: !audio[channel]
      })) as AudioState | undefined;
      if (response) {
        mergeBackgroundState({ audio: response });
      }
    },
    [audio, mergeBackgroundState]
  );

  const switchLanguage = useCallback(() => {
    const next = language === 'zh-CN' ? 'en' : 'zh-CN';
    setLanguage(next);
  }, [language, setLanguage]);

  const clearRegion = useCallback(async () => {
    await runtime?.sendMessage({ type: 'region:clear' });
    mergeBackgroundState({ regionBounds: undefined, captureMode: 'tab', regionMode: false });
  }, [mergeBackgroundState]);

  const qualityLabel = useMemo(() => {
    const presets = ['Auto', 'HD', '4K'];
    return presets[qualityPreset];
  }, [qualityPreset]);

  const statusColor =
    status === 'recording' ? 'bg-danger/30 border-danger text-danger' : 'bg-outline text-white';

  const captureSummary = useMemo(() => {
    if (captureMode === 'region' && regionBounds) {
      return `REG ${Math.round(regionBounds.width)}×${Math.round(regionBounds.height)}`;
    }
    return 'TAB';
  }, [captureMode, regionBounds]);

  const regionToggleActive = regionMode || Boolean(regionBounds);

  return (
    <div className="min-h-[360px] w-[360px] bg-[#0b0d13] p-4 text-white">
      <header className="flex items-center justify-between rounded-2xl border border-outline px-4 py-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Status</p>
          <p className="text-lg font-semibold text-white">{t(`status.${status}`)}</p>
        </div>
        <div className={`rounded-full border px-4 py-1 text-sm ${statusColor}`}>
          {status === 'recording' ? 'REC' : status === 'paused' ? 'PAUSE' : 'IDLE'}
        </div>
      </header>

      <section className="mt-5 grid grid-cols-3 gap-3">
        <IconToggle
          icon={status === 'recording' ? 'lucide:pause' : 'lucide:play'}
          label={status === 'recording' ? t('tooltip.pause') : t('tooltip.start')}
          active={status === 'recording'}
          onClick={toggleRecording}
        />
        <IconToggle
          icon="lucide:scan"
          label={t('tooltip.region')}
          active={regionToggleActive}
          onClick={toggleRegion}
        />
        <IconToggle
          icon="lucide:sparkles"
          label={t('tooltip.quality')}
          active={qualityPreset > 0}
          onClick={cycleQuality}
        >
          {qualityLabel}
        </IconToggle>
        <IconToggle
          icon="lucide:mic"
          label={t('tooltip.mic')}
          active={audio.mic}
          onClick={() => toggleAudio('mic')}
        />
        <IconToggle
          icon="lucide:headphones"
          label={t('tooltip.system')}
          active={audio.system}
          onClick={() => toggleAudio('system')}
        />
        <IconToggle
          icon="lucide:languages"
          label={t('tooltip.language')}
          active={language === 'zh-CN'}
          onClick={switchLanguage}
        />
      </section>

      <footer className="mt-6 rounded-2xl border border-dashed border-outline p-3 text-xs text-slate-400">
        <div className="flex items-center justify-between">
          <span>Config</span>
          <span>{`${config.video.resolution.toUpperCase()} x ${config.video.framerate}fps`}</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-[0.65rem] uppercase tracking-[0.3em] text-slate-500">
          <span>Capture</span>
          <span>{captureSummary}</span>
        </div>
      </footer>

      <RegionBadge
        region={regionBounds}
        onClear={clearRegion}
        clearLabel={t('tooltip.regionClear')}
      />
    </div>
  );
}
