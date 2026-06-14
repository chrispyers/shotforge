import { useRef, useState } from 'react';
import { useActivePage, useActiveProject, useStore } from '../lib/store';
import type { BroadcastAspect } from '../lib/store';
import { RESOLUTION_PRESETS, SPOTLIGHT_POSITIONS } from '../lib/presets';
import type { TextLayer } from '../types';

export function ControlPanel() {
  const project = useActiveProject();
  const page = useActivePage();
  const updatePage = useStore(s => s.updatePage);
  const updateDevice = useStore(s => s.updateDevice);
  const updateText = useStore(s => s.updateText);
  const updateTheme = useStore(s => s.updateTheme);
  const applyThemeToAllPages = useStore(s => s.applyThemeToAllPages);
  const applyToAllPages = useStore(s => s.applyToAllPages);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // How many other pages an "apply to all" affects. When there's only one page
  // the buttons are pointless, so we hide them.
  const otherPageCount = (project?.pages.length ?? 0) - 1;
  const applyAll = (aspect: BroadcastAspect) =>
    otherPageCount > 0 ? () => applyToAllPages(aspect) : undefined;

  if (!project || !page) return <aside className="w-80 border-l border-neutral-800" />;

  const onScreenshotPicked = async (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      updateDevice(page.id, { screenshotDataUrl: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const grouped = RESOLUTION_PRESETS.reduce<Record<string, typeof RESOLUTION_PRESETS>>((acc, p) => {
    (acc[p.group] ??= []).push(p);
    return acc;
  }, {});

  return (
    <aside className="w-80 shrink-0 border-l border-neutral-800 bg-neutral-950 overflow-y-auto h-full">
      <Section title="Page">
        <Field label="Name">
          <input
            value={page.name}
            onChange={e => updatePage(page.id, { name: e.target.value })}
            className="input"
          />
        </Field>
        <Field label="Resolution">
          <select
            value={page.resolutionId}
            onChange={e => updatePage(page.id, { resolutionId: e.target.value })}
            className="input"
          >
            {Object.entries(grouped).map(([group, items]) => (
              <optgroup key={group} label={group}>
                {items.map(p => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </Field>
      </Section>

      <Section title="Background">
        <Field label="Primary color" onApplyAll={applyAll('primaryColor')}>
          <ColorRow value={page.primaryColor} onChange={v => updatePage(page.id, { primaryColor: v })} />
        </Field>
        <Field label="Secondary color" onApplyAll={applyAll('secondaryColor')}>
          <ColorRow value={page.secondaryColor} onChange={v => updatePage(page.id, { secondaryColor: v })} />
        </Field>
        <Field label="Spotlight position" onApplyAll={applyAll('spotlightPosition')}>
          <select
            value={page.spotlightPosition}
            onChange={e => updatePage(page.id, { spotlightPosition: e.target.value as any })}
            className="input"
          >
            {SPOTLIGHT_POSITIONS.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </Field>
        <Field label={`Spotlight size · ${Math.round(page.spotlightSize * 100)}%`} onApplyAll={applyAll('spotlightSize')}>
          <input
            type="range"
            min={20}
            max={120}
            value={page.spotlightSize * 100}
            onChange={e => updatePage(page.id, { spotlightSize: Number(e.target.value) / 100 })}
            className="w-full"
          />
        </Field>
        <Field label="Dither (defeats Play Store gradient banding)" onApplyAll={applyAll('dither')}>
          <Toggle
            value={page.dither ?? true}
            onChange={v => updatePage(page.id, { dither: v })}
          />
        </Field>
        {(page.dither ?? true) && (
          <Field label={`Dither strength · ${Math.round((page.ditherStrength ?? 0.12) * 100)}%`} onApplyAll={applyAll('ditherStrength')}>
            <input
              type="range"
              min={0}
              max={25}
              value={Math.round((page.ditherStrength ?? 0.12) * 100)}
              onChange={e => updatePage(page.id, { ditherStrength: Number(e.target.value) / 100 })}
              className="w-full"
            />
          </Field>
        )}
      </Section>

      <Section title="Headline">
        <Field label="Text">
          <textarea
            value={page.headline.text}
            onChange={e => updateText(page.id, 'headline', { text: e.target.value })}
            rows={3}
            className="input resize-none"
          />
        </Field>
        <TextLayerControls
          layer={page.headline}
          onChange={patch => updateText(page.id, 'headline', patch)}
          onApplyColorToAll={applyAll('headlineColor')}
          onApplySizeToAll={applyAll('headlineSize')}
          onApplyLetterToAll={applyAll('headlineLetter')}
          onApplyWeightToAll={applyAll('headlineWeight')}
          onApplyAlignToAll={applyAll('headlineAlign')}
          onApplyPadTopToAll={applyAll('headlinePadTop')}
          onApplyShadowToAll={applyAll('headlineShadow')}
          onApplyShadowColorToAll={applyAll('headlineShadowColor')}
          onApplyShadowAngleToAll={applyAll('headlineShadowAngle')}
          onApplyShadowDistanceToAll={applyAll('headlineShadowDistance')}
          onApplyShadowSizeToAll={applyAll('headlineShadowSize')}
        />
      </Section>

      <Section title="Subhead">
        <Field label="Show subhead">
          <Toggle value={page.showSubhead} onChange={v => updatePage(page.id, { showSubhead: v })} />
        </Field>
        {page.showSubhead && (
          <>
            <Field label="Text">
              <textarea
                value={page.subhead.text}
                onChange={e => updateText(page.id, 'subhead', { text: e.target.value })}
                rows={2}
                className="input resize-none"
              />
            </Field>
            <TextLayerControls
              layer={page.subhead}
              onChange={patch => updateText(page.id, 'subhead', patch)}
              onApplyColorToAll={applyAll('subheadColor')}
              onApplySizeToAll={applyAll('subheadSize')}
              onApplyLetterToAll={applyAll('subheadLetter')}
              onApplyWeightToAll={applyAll('subheadWeight')}
              onApplyAlignToAll={applyAll('subheadAlign')}
              onApplyPadTopToAll={applyAll('subheadPadTop')}
              onApplyShadowToAll={applyAll('subheadShadow')}
              onApplyShadowColorToAll={applyAll('subheadShadowColor')}
              onApplyShadowAngleToAll={applyAll('subheadShadowAngle')}
              onApplyShadowDistanceToAll={applyAll('subheadShadowDistance')}
              onApplyShadowSizeToAll={applyAll('subheadShadowSize')}
            />
          </>
        )}
      </Section>

      <Section title="Device">
        <Field label="Screenshot">
          <div className="flex gap-2 items-center">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 input text-left"
            >
              {page.device.screenshotDataUrl ? 'Replace screenshot' : 'Choose file…'}
            </button>
            {page.device.screenshotDataUrl && (
              <button
                onClick={() => updateDevice(page.id, { screenshotDataUrl: null })}
                className="text-xs px-2 py-1 rounded bg-neutral-900 border border-neutral-800 hover:bg-red-950"
              >
                Clear
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => {
                const f = e.target.files?.[0];
                if (f) onScreenshotPicked(f);
                e.target.value = '';
              }}
            />
          </div>
        </Field>
        <Field label={`Width · ${Math.round(page.device.widthRatio * 100)}%`} onApplyAll={applyAll('deviceWidth')}>
          <input
            type="range"
            min={30}
            max={95}
            value={page.device.widthRatio * 100}
            onChange={e => updateDevice(page.id, { widthRatio: Number(e.target.value) / 100 })}
            className="w-full"
          />
        </Field>
        <Field label={`X · ${Math.round(page.device.x * 100)}%`} onApplyAll={applyAll('deviceX')}>
          <input
            type="range"
            min={-20}
            max={100}
            value={page.device.x * 100}
            onChange={e => updateDevice(page.id, { x: Number(e.target.value) / 100 })}
            className="w-full"
          />
        </Field>
        <Field label={`Y · ${Math.round(page.device.y * 100)}%`} onApplyAll={applyAll('deviceY')}>
          <input
            type="range"
            min={-10}
            max={100}
            value={page.device.y * 100}
            onChange={e => updateDevice(page.id, { y: Number(e.target.value) / 100 })}
            className="w-full"
          />
        </Field>
        <Field label={`Tilt · ${page.device.tiltDeg}°`} onApplyAll={applyAll('deviceTilt')}>
          <input
            type="range"
            min={-25}
            max={25}
            value={page.device.tiltDeg}
            onChange={e => updateDevice(page.id, { tiltDeg: Number(e.target.value) })}
            className="w-full"
          />
        </Field>
        <Field label="Drop shadow">
          <Toggle value={page.device.showShadow} onChange={v => updateDevice(page.id, { showShadow: v })} />
        </Field>
        <Field label="Clean status bar">
          <Toggle value={page.device.showStatusBar} onChange={v => updateDevice(page.id, { showStatusBar: v })} />
        </Field>
        {page.device.showStatusBar && (
          <>
            <Field label="Status bar time">
              <input
                value={page.device.statusBarTime}
                onChange={e => updateDevice(page.id, { statusBarTime: e.target.value })}
                className="input"
              />
            </Field>
            <Field label="Off-grid (no signal, no wifi)">
              <Toggle
                value={page.device.noSignal ?? false}
                onChange={v => updateDevice(page.id, { noSignal: v })}
              />
            </Field>
            <Field label="Low battery">
              <Toggle
                value={page.device.lowBattery ?? false}
                onChange={v => updateDevice(page.id, { lowBattery: v })}
              />
            </Field>
          </>
        )}
      </Section>

      <Section title="Project theme">
        <p className="text-[11px] text-neutral-500 mb-2 leading-snug">
          Defaults applied to new pages. Click apply to push changes to every existing page.
        </p>
        <Field label="Primary">
          <ColorRow value={project.theme.primaryColor} onChange={v => updateTheme({ primaryColor: v })} />
        </Field>
        <Field label="Secondary">
          <ColorRow value={project.theme.secondaryColor} onChange={v => updateTheme({ secondaryColor: v })} />
        </Field>
        <Field label="Text">
          <ColorRow value={project.theme.textColor} onChange={v => updateTheme({ textColor: v })} />
        </Field>
        <Field label={`Font size · ${project.theme.fontSize}`}>
          <input
            type="range"
            min={60}
            max={240}
            value={project.theme.fontSize}
            onChange={e => updateTheme({ fontSize: Number(e.target.value) })}
            className="w-full"
          />
        </Field>
        <Field label={`Font weight · ${project.theme.fontWeight}`}>
          <input
            type="range"
            min={100}
            max={1000}
            step={50}
            value={project.theme.fontWeight}
            onChange={e => updateTheme({ fontWeight: Number(e.target.value) })}
            className="w-full"
          />
        </Field>
        <Field label={`Roundness · ${project.theme.fontRoundness}`}>
          <input
            type="range"
            min={0}
            max={100}
            value={project.theme.fontRoundness}
            onChange={e => updateTheme({ fontRoundness: Number(e.target.value) })}
            className="w-full"
          />
        </Field>
        <button
          onClick={() => {
            if (confirm('Apply theme to every page in this project?')) applyThemeToAllPages();
          }}
          className="w-full text-xs px-3 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 mt-2"
        >
          Apply theme to all pages
        </button>
      </Section>
    </aside>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const storageKey = `shotforge-section-collapsed:${title}`;
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(storageKey) === '1';
    } catch {
      return false;
    }
  });
  const toggle = () => {
    setCollapsed(c => {
      const next = !c;
      try {
        localStorage.setItem(storageKey, next ? '1' : '0');
      } catch {}
      return next;
    });
  };

  return (
    <div className="border-b border-neutral-800">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={!collapsed}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left text-[11px] uppercase tracking-wider text-violet-400 font-bold hover:bg-neutral-900/60 transition-colors"
      >
        <span>{title}</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`shrink-0 transition-transform ${collapsed ? '-rotate-90' : ''}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {!collapsed && <div className="px-4 pb-4 space-y-3">{children}</div>}
    </div>
  );
}

function Field({
  label,
  children,
  onApplyAll,
}: {
  label: string;
  children: React.ReactNode;
  /** When provided, renders an "apply to all pages" button next to the label. */
  onApplyAll?: () => void;
}) {
  return (
    <label className="block">
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="text-[11px] text-neutral-400">{label}</div>
        {onApplyAll && <ApplyAllButton onClick={onApplyAll} />}
      </div>
      {children}
    </label>
  );
}

function ApplyAllButton({ onClick }: { onClick: () => void }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      title="Apply this value to all other pages in this project"
      onClick={e => {
        // Inside a <label>; stop the click from also focusing the field's input.
        e.preventDefault();
        e.stopPropagation();
        onClick();
        setDone(true);
        setTimeout(() => setDone(false), 1100);
      }}
      className={`shrink-0 text-[10px] leading-none px-1.5 py-1 rounded-md border transition-colors ${
        done
          ? 'bg-violet-500/20 border-violet-500/40 text-violet-300'
          : 'bg-neutral-900 border-neutral-800 text-neutral-500 hover:text-neutral-200 hover:border-neutral-700'
      }`}
    >
      {done ? '✓ applied' : 'apply to all'}
    </button>
  );
}

function ColorRow({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-2 items-center">
      <input
        type="color"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="h-8 w-10 rounded bg-transparent border border-neutral-800 cursor-pointer"
      />
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        className="input flex-1 font-mono text-xs"
      />
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`relative w-11 h-6 rounded-full transition-colors ${value ? 'bg-violet-500' : 'bg-neutral-800'}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
          value ? 'translate-x-5' : ''
        }`}
      />
    </button>
  );
}

function TextLayerControls({
  layer,
  onChange,
  onApplyColorToAll,
  onApplySizeToAll,
  onApplyLetterToAll,
  onApplyWeightToAll,
  onApplyAlignToAll,
  onApplyPadTopToAll,
  onApplyShadowToAll,
  onApplyShadowColorToAll,
  onApplyShadowAngleToAll,
  onApplyShadowDistanceToAll,
  onApplyShadowSizeToAll,
}: {
  layer: TextLayer;
  onChange: (patch: Partial<TextLayer>) => void;
  onApplyColorToAll?: () => void;
  onApplySizeToAll?: () => void;
  onApplyLetterToAll?: () => void;
  onApplyWeightToAll?: () => void;
  onApplyAlignToAll?: () => void;
  onApplyPadTopToAll?: () => void;
  onApplyShadowToAll?: () => void;
  onApplyShadowColorToAll?: () => void;
  onApplyShadowAngleToAll?: () => void;
  onApplyShadowDistanceToAll?: () => void;
  onApplyShadowSizeToAll?: () => void;
}) {
  return (
    <>
      <Field label="Color" onApplyAll={onApplyColorToAll}>
        <ColorRow value={layer.color} onChange={v => onChange({ color: v })} />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Align" onApplyAll={onApplyAlignToAll}>
          <select
            value={layer.align}
            onChange={e => onChange({ align: e.target.value as TextLayer['align'] })}
            className="input"
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
        </Field>
        <Field label={`Letter · ${layer.letterSpacing.toFixed(2)}em`} onApplyAll={onApplyLetterToAll}>
          <input
            type="range"
            min={-0.1}
            max={0.1}
            step={0.005}
            value={layer.letterSpacing}
            onChange={e => onChange({ letterSpacing: Number(e.target.value) })}
            className="w-full"
          />
        </Field>
      </div>
      <Field label={`Size · ${layer.fontSize}`} onApplyAll={onApplySizeToAll}>
        <input
          type="range"
          min={40}
          max={260}
          value={layer.fontSize}
          onChange={e => onChange({ fontSize: Number(e.target.value) })}
          className="w-full"
        />
      </Field>
      <Field label={`Weight · ${layer.weight}`} onApplyAll={onApplyWeightToAll}>
        <input
          type="range"
          min={100}
          max={1000}
          step={50}
          value={layer.weight}
          onChange={e => onChange({ weight: Number(e.target.value) })}
          className="w-full"
        />
      </Field>
      <Field label={`Roundness · ${layer.roundness}`}>
        <input
          type="range"
          min={0}
          max={100}
          value={layer.roundness}
          onChange={e => onChange({ roundness: Number(e.target.value) })}
          className="w-full"
        />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label={`Pad X · ${Math.round(layer.paddingX * 100)}%`}>
          <input
            type="range"
            min={0}
            max={30}
            value={layer.paddingX * 100}
            onChange={e => onChange({ paddingX: Number(e.target.value) / 100 })}
            className="w-full"
          />
        </Field>
        <Field label={`Pad top · ${Math.round(layer.paddingTop * 100)}%`} onApplyAll={onApplyPadTopToAll}>
          <input
            type="range"
            min={0}
            max={50}
            value={layer.paddingTop * 100}
            onChange={e => onChange({ paddingTop: Number(e.target.value) / 100 })}
            className="w-full"
          />
        </Field>
      </div>

      <Field label="Shadow" onApplyAll={onApplyShadowToAll}>
        <Toggle
          value={layer.shadow ?? false}
          onChange={v => onChange({ shadow: v })}
        />
      </Field>
      {(layer.shadow ?? false) && (
        <>
          <Field label="Shadow color" onApplyAll={onApplyShadowColorToAll}>
            <ColorRow
              value={layer.shadowColor ?? '#000000'}
              onChange={v => onChange({ shadowColor: v })}
            />
          </Field>
          <Field label={`Shadow position · ${layer.shadowAngle ?? 90}°`} onApplyAll={onApplyShadowAngleToAll}>
            <input
              type="range"
              min={0}
              max={360}
              value={layer.shadowAngle ?? 90}
              onChange={e => onChange({ shadowAngle: Number(e.target.value) })}
              className="w-full"
            />
          </Field>
          <Field label={`Shadow distance · ${layer.shadowDistance ?? 12}`} onApplyAll={onApplyShadowDistanceToAll}>
            <input
              type="range"
              min={0}
              max={120}
              value={layer.shadowDistance ?? 12}
              onChange={e => onChange({ shadowDistance: Number(e.target.value) })}
              className="w-full"
            />
          </Field>
          <Field label={`Shadow size · ${layer.shadowSize ?? 16}`} onApplyAll={onApplyShadowSizeToAll}>
            <input
              type="range"
              min={0}
              max={120}
              value={layer.shadowSize ?? 16}
              onChange={e => onChange({ shadowSize: Number(e.target.value) })}
              className="w-full"
            />
          </Field>
        </>
      )}
    </>
  );
}
