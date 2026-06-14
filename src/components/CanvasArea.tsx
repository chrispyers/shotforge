import { useEffect, useRef, useState } from 'react';
import { useActivePage } from '../lib/store';
import { PageRenderer } from './PageRenderer';
import { getPreset } from '../lib/presets';

export function CanvasArea() {
  const page = useActivePage();
  const containerRef = useRef<HTMLDivElement>(null);
  const [displayWidth, setDisplayWidth] = useState(360);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      if (!page) return;
      const preset = getPreset(page.resolutionId);
      const ratio = preset.height / preset.width;
      const maxByWidth = width - 64;
      const maxByHeight = (height - 64) / ratio;
      setDisplayWidth(Math.max(160, Math.min(maxByWidth, maxByHeight)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [page?.resolutionId]);

  if (!page) return null;
  const preset = getPreset(page.resolutionId);

  return (
    <div ref={containerRef} className="flex-1 flex items-center justify-center overflow-hidden bg-neutral-900">
      <div className="flex flex-col items-center gap-3">
        <div className="text-[11px] text-neutral-500">
          {preset.label} · {preset.width} × {preset.height}
        </div>
        <div className="rounded-2xl overflow-hidden shadow-2xl ring-1 ring-black/40">
          <PageRenderer page={page} displayWidth={displayWidth} />
        </div>
      </div>
    </div>
  );
}
