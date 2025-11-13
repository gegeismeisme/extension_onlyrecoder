import { Icon } from '@iconify/react';
import type { RegionBounds } from '../../core/types/capture';

interface RegionBadgeProps {
  region?: RegionBounds;
  onClear: () => void;
  clearLabel: string;
}

export function RegionBadge({ region, onClear, clearLabel }: RegionBadgeProps) {
  if (!region) return null;
  const width = Math.round(region.width);
  const height = Math.round(region.height);
  const originX = Math.round(region.x);
  const originY = Math.round(region.y);

  return (
    <div className="mt-5 flex items-center justify-between rounded-2xl border border-outline bg-white/5 px-4 py-3 text-sm text-slate-200">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Region</p>
        <p className="text-base font-semibold text-white">
          {width} × {height}
        </p>
        <p className="text-[0.65rem] text-slate-500">
          ({originX}, {originY})
        </p>
      </div>
      <button
        type="button"
        onClick={onClear}
        aria-label={clearLabel}
        title={clearLabel}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-outline text-slate-300 transition hover:border-danger hover:text-danger"
      >
        <Icon icon="lucide:x" width={18} height={18} />
      </button>
    </div>
  );
}
