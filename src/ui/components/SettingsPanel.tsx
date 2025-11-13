import { IconToggle } from './IconToggle';
import type { AppConfig } from '../../core/types/config';

interface SettingsPanelProps {
  open: boolean;
  config: AppConfig;
  onClose: () => void;
  onUpdate: (patch: Partial<AppConfig>) => void;
  onRefresh: () => void;
}

const resolutionOptions = [
  { label: 'Auto', value: 'auto', icon: 'lucide:sparkles' },
  { label: '1080p', value: '1080p', icon: 'lucide:monitor' },
  { label: '4K', value: '4k', icon: 'lucide:tv' }
] as const;

const bitrateOptions = [
  { label: '4 Mbps', value: 4000 },
  { label: '8 Mbps', value: 8000 },
  { label: '12 Mbps', value: 12000 }
];

const storageOptions = [
  { label: 'Downloads', value: 'Downloads' },
  { label: 'Picker', value: 'Picker' }
] as const;

export function SettingsPanel({ open, config, onClose, onUpdate, onRefresh }: SettingsPanelProps) {
  if (!open) return null;

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/70">
      <div className="w-[320px] rounded-3xl border border-outline bg-[#0f1320] p-4 text-white shadow-2xl">
        <header className="mb-3 flex items-center justify-between">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Config</p>
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-full border border-outline px-3 py-1 text-xs uppercase tracking-[0.3em] text-slate-500 hover:border-primary hover:text-primary"
              onClick={onRefresh}
            >
              Refresh
            </button>
            <button
              type="button"
              className="rounded-full border border-outline px-3 py-1 text-xs uppercase tracking-[0.3em] text-slate-500 hover:border-primary hover:text-primary"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </header>

        <section className="mb-4">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Resolution</p>
          <div className="mt-2 flex gap-2">
            {resolutionOptions.map((option) => (
              <IconToggle
                key={option.value}
                icon={option.icon}
                label={option.label}
                active={config.video.resolution === option.value}
                onClick={() =>
                  onUpdate({ video: { resolution: option.value } as AppConfig['video'] })
                }
                className="h-14 w-14"
              >
                {option.label}
              </IconToggle>
            ))}
          </div>
        </section>

        <section className="mb-4">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Bitrate</p>
          <div className="mt-2 flex gap-2">
            {bitrateOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() =>
                  onUpdate({ video: { maxBitrate: option.value } as AppConfig['video'] })
                }
                className={`rounded-full border px-3 py-1 text-xs ${
                  config.video.maxBitrate === option.value
                    ? 'border-primary text-primary'
                    : 'border-outline text-slate-400'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </section>

        <section className="mb-4 grid grid-cols-2 gap-3">
          <IconToggle
            icon="lucide:mic"
            label="Mic"
            active={config.audio.mic}
            onClick={() => onUpdate({ audio: { mic: !config.audio.mic } as AppConfig['audio'] })}
          />
          <IconToggle
            icon="lucide:headphones"
            label="System"
            active={config.audio.system}
            onClick={() =>
              onUpdate({ audio: { system: !config.audio.system } as AppConfig['audio'] })
            }
          />
        </section>

        <section>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Export</p>
          <div className="mt-2 flex gap-2">
            {storageOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() =>
                  onUpdate({ storage: { autoExport: option.value } as AppConfig['storage'] })
                }
                className={`rounded-full border px-3 py-1 text-xs ${
                  config.storage.autoExport === option.value
                    ? 'border-primary text-primary'
                    : 'border-outline text-slate-400'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
