import { useCallback, useEffect, useMemo, useState } from 'preact/hooks';
import { IconToggle } from '../components/IconToggle';
import { loadConfig } from '../../core/config';
import { initI18n, t } from '../../core/i18n';
import type { AppConfig, LanguageOption } from '../../core/types/config';

const runtime = typeof chrome !== 'undefined' ? chrome.runtime : undefined;

type RecorderStatus = 'idle' | 'recording' | 'paused';

interface BackgroundState {
  active: boolean;
  paused: boolean;
  regionMode: boolean;
  audio: {
    mic: boolean;
    system: boolean;
  };
}

const initialBgState: BackgroundState = {
  active: false,
  paused: false,
  regionMode: false,
  audio: {
    mic: true,
    system: true
  }
};

export function App() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [language, setLanguage] = useState<LanguageOption>('auto');
  const [bgState, setBgState] = useState<BackgroundState>(initialBgState);
  const [qualityIndex, setQualityIndex] = useState(0);

  const status: RecorderStatus = useMemo(() => {
    if (!bgState.active) return 'idle';
    return bgState.paused ? 'paused' : 'recording';
  }, [bgState.active, bgState.paused]);

  useEffect(() => {
    const boot = async () => {
      const loadedConfig = await loadConfig();
      setConfig(loadedConfig);
      const lang = loadedConfig.ui.language;
      setLanguage(lang);
      await initI18n(lang);
      if (runtime) {
        try {
          const state = (await runtime.sendMessage({ type: 'recorder:status' })) as BackgroundState;
          if (state) {
            setBgState((prev) => ({ ...prev, ...state }));
          }
        } catch (error) {
          console.warn('[popup] unable to query status', error);
        }
      }
    };
    boot();

    const handler = (message: any) => {
      if (message?.type === 'recorder:toggled') {
        setBgState((prev) => ({ ...prev, active: message.active, paused: false }));
      }
      if (message?.type === 'audio:updated') {
        setBgState((prev) => ({ ...prev, audio: message.audio }));
      }
      if (message?.type === 'region:toggle') {
        setBgState((prev) => ({ ...prev, regionMode: message.enabled }));
      }
    };

    runtime?.onMessage.addListener(handler);
    return () => {
      runtime?.onMessage.removeListener(handler);
    };
  }, []);

  const toggleRecording = useCallback(async () => {
    await runtime?.sendMessage({ type: 'recorder:toggle' });
  }, []);

  const toggleRegion = useCallback(async () => {
    await runtime?.sendMessage({ type: 'region:toggle' });
  }, []);

  const toggleAudio = useCallback(
    async (channel: 'mic' | 'system') => {
      const next = !bgState.audio[channel];
      await runtime?.sendMessage({
        type: 'audio:toggle',
        channel,
        enabled: next
      });
      setBgState((prev) => ({
        ...prev,
        audio: { ...prev.audio, [channel]: next }
      }));
    },
    [bgState.audio]
  );

  const switchLanguage = useCallback(async () => {
    const next = language === 'zh-CN' ? 'en' : 'zh-CN';
    setLanguage(next);
    await initI18n(next);
  }, [language]);

  const cycleQuality = useCallback(() => {
    setQualityIndex((prev) => (prev + 1) % 3);
  }, []);

  const qualityLabel = useMemo(() => {
    const presets = ['Auto', 'HD', '4K'];
    return presets[qualityIndex];
  }, [qualityIndex]);

  const statusColor =
    status === 'recording' ? 'bg-danger/30 border-danger text-danger' : 'bg-outline text-white';

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
          active={bgState.regionMode}
          onClick={toggleRegion}
        />
        <IconToggle
          icon="lucide:sparkles"
          label={t('tooltip.quality')}
          active={qualityIndex > 0}
          onClick={cycleQuality}
        >
          {qualityLabel}
        </IconToggle>
        <IconToggle
          icon="lucide:mic"
          label={t('tooltip.mic')}
          active={bgState.audio.mic}
          onClick={() => toggleAudio('mic')}
        />
        <IconToggle
          icon="lucide:headphones"
          label={t('tooltip.system')}
          active={bgState.audio.system}
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
          <span>
            {config
              ? `${config.video.resolution.toUpperCase()} x ${config.video.framerate}fps`
              : 'loading...'}
          </span>
        </div>
      </footer>
    </div>
  );
}
