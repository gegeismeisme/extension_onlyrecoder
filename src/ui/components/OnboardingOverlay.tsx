import { Icon } from '@iconify/react';

interface OnboardingOverlayProps {
  onClose: () => void;
}

export function OnboardingOverlay({ onClose }: OnboardingOverlayProps) {
  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-[#0b0d13]/95 text-center text-white">
      <div className="flex items-center gap-3 text-sm text-slate-300">
        <Icon icon="lucide:mouse-pointer-square" width={32} height={32} />
        <div>
          <p className="text-base font-semibold">先点图标，再看提示</p>
          <p className="text-xs text-slate-500">所有操作都藏在图标与浮层里</p>
        </div>
      </div>
      <div className="flex items-center gap-3 text-sm text-slate-300">
        <Icon icon="lucide:scan-eye" width={32} height={32} />
        <div>
          <p className="text-base font-semibold">框选或全屏</p>
          <p className="text-xs text-slate-500">点🔳进入区域模式，再拖动选择</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="mt-4 rounded-full border border-primary/60 px-6 py-2 text-sm uppercase tracking-[0.3em] text-primary transition hover:border-primary hover:bg-primary/10"
      >
        Got it
      </button>
    </div>
  );
}
