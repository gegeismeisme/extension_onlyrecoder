import { Icon } from '@iconify/react';
import type { ComponentChildren, JSX } from 'preact';

interface IconToggleProps extends JSX.HTMLAttributes<HTMLButtonElement> {
  icon: string;
  label: string;
  active?: boolean;
  children?: ComponentChildren;
}

export function IconToggle({
  icon,
  label,
  active = false,
  className,
  children,
  ...rest
}: IconToggleProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      {...rest}
      className={`flex h-16 w-16 flex-col items-center justify-center rounded-control border text-xl transition-all ${
        active
          ? 'border-primary bg-primary/20 text-primary shadow-[0_0_12px_rgba(92,108,255,0.45)]'
          : 'border-outline bg-surface text-white hover:border-primary/60 hover:text-primary'
      } ${className ?? ''}`}
    >
      <Icon icon={icon} width={28} height={28} />
      {children && (
        <span className="mt-1 text-[0.65rem] uppercase tracking-widest text-slate-300">
          {children}
        </span>
      )}
    </button>
  );
}
