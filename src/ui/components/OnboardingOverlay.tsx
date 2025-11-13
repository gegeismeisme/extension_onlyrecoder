import { Icon } from '@iconify/react';

interface Step {
  icon: string;
  title: string;
  description: string;
}

const steps: Step[] = [
  {
    icon: 'lucide:mouse-pointer-square',
    title: '先点图标，再看提示',
    description: '所有操作藏在图标+浮层里'
  },
  {
    icon: 'lucide:scan-eye',
    title: '框选或全屏',
    description: '点🔳进入区域模式，再拖动选择'
  },
  {
    icon: 'lucide:mic',
    title: '授权音频',
    description: '点音频图标，授予麦克风权限'
  }
];

interface OnboardingOverlayProps {
  step: number;
  onNext: () => void;
  onSkip: () => void;
}

export function OnboardingOverlay({ step, onNext, onSkip }: OnboardingOverlayProps) {
  const current = steps[Math.min(step, steps.length - 1)];
  const isLast = step >= steps.length - 1;

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-5 bg-[#0b0d13]/95 text-center text-white transition">
      <div className="flex items-center gap-3 text-sm text-slate-300 animate-fade-in">
        <Icon icon={current.icon} width={32} height={32} />
        <div>
          <p className="text-base font-semibold">{current.title}</p>
          <p className="text-xs text-slate-500">{current.description}</p>
        </div>
      </div>
      <div className="flex gap-2">
        {steps.map((_, index) => (
          <span
            key={index}
            className={`h-1.5 w-8 rounded-full ${index <= step ? 'bg-primary' : 'bg-outline'}`}
          />
        ))}
      </div>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onSkip}
          className="rounded-full border border-outline px-4 py-2 text-xs uppercase tracking-[0.3em] text-slate-500 transition hover:border-primary/60 hover:text-primary"
        >
          Skip
        </button>
        <button
          type="button"
          onClick={onNext}
          className="rounded-full border border-primary/60 px-6 py-2 text-xs uppercase tracking-[0.3em] text-primary transition hover:border-primary hover:bg-primary/10"
        >
          {isLast ? 'Done' : 'Next'}
        </button>
      </div>
    </div>
  );
}
