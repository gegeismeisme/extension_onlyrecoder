import { Icon } from '@iconify/react';

interface PermissionHintsProps {
  audioReady: boolean;
  regionReady: boolean;
  onRequestAudio?: () => void;
  onRequestScreen?: () => void;
  message?: string | null;
}

export function PermissionHints({
  audioReady,
  regionReady,
  onRequestAudio,
  onRequestScreen,
  message
}: PermissionHintsProps) {
  return (
    <div className="mt-4 rounded-2xl border border-dashed border-outline/80 px-4 py-3 text-xs text-slate-400">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span
            className={`flex h-10 w-10 items-center justify-center rounded-full border transition ${
              audioReady
                ? 'border-success/60 bg-success/10 text-success'
                : 'border-danger/60 bg-danger/10 text-danger cursor-pointer animate-pulse'
            }`}
            title={audioReady ? 'Audio ready' : 'Enable mic/system audio'}
            onClick={!audioReady ? onRequestAudio : undefined}
          >
            <Icon icon="lucide:volume-2" width={18} height={18} />
          </span>
          <span
            className={`flex h-10 w-10 items-center justify-center rounded-full border transition ${
              regionReady
                ? 'border-primary/60 bg-primary/10 text-primary'
                : 'border-outline text-slate-500 cursor-pointer'
            }`}
            onClick={!regionReady ? onRequestScreen : undefined}
            title={regionReady ? 'Region selected' : 'Select region'}
          >
            <Icon icon="lucide:crop" width={18} height={18} />
          </span>
        </div>
        <div className="text-[0.65rem] uppercase tracking-[0.3em] text-slate-500">
          {audioReady && regionReady ? 'Ready' : 'Action'}
        </div>
      </div>
      {message && <p className="mt-2 text-[0.7rem] text-slate-400">{message}</p>}
    </div>
  );
}
