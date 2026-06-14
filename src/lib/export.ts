import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { toPng } from 'html-to-image';
import { createRoot, type Root } from 'react-dom/client';
import { createElement } from 'react';
import type { Page, Project } from '../types';
import { PageRenderer } from '../components/PageRenderer';
import { getPreset } from './presets';

function slugify(input: string) {
  return input.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'page';
}

async function ensureFontsLoaded() {
  if ('fonts' in document) {
    try {
      await (document as any).fonts.ready;
    } catch {}
  }
}

async function renderPageToPngBlob(page: Page): Promise<Blob> {
  const preset = getPreset(page.resolutionId);
  const host = document.createElement('div');
  host.style.position = 'fixed';
  host.style.top = '-100000px';
  host.style.left = '0';
  host.style.width = preset.width + 'px';
  host.style.height = preset.height + 'px';
  host.style.pointerEvents = 'none';
  document.body.appendChild(host);

  let root: Root | null = null;
  try {
    root = createRoot(host);
    await new Promise<void>(resolve => {
      root!.render(createElement(PageRenderer, { page, fullResolution: true }));
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });
    await ensureFontsLoaded();
    // Give layout/images one more tick
    await new Promise(r => setTimeout(r, 50));

    const dataUrl = await toPng(host.firstElementChild as HTMLElement, {
      width: preset.width,
      height: preset.height,
      pixelRatio: 1,
      cacheBust: true,
      style: { margin: '0', padding: '0' },
    });
    const res = await fetch(dataUrl);
    return await res.blob();
  } finally {
    if (root) root.unmount();
    host.remove();
  }
}

export async function exportProjectAsZip(project: Project) {
  const zip = new JSZip();
  for (let i = 0; i < project.pages.length; i++) {
    const page = project.pages[i];
    const blob = await renderPageToPngBlob(page);
    const filename = `${String(i + 1).padStart(2, '0')}-${slugify(page.name)}.png`;
    zip.file(filename, blob);
  }
  const out = await zip.generateAsync({ type: 'blob' });
  saveAs(out, `${slugify(project.name)}-screenshots.zip`);
}

export function exportProjectAsJson(project: Project) {
  const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
  saveAs(blob, `${slugify(project.name)}.shotforge.json`);
}

export async function importProjectFromJson(file: File): Promise<Project> {
  const text = await file.text();
  const parsed = JSON.parse(text);
  if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.pages)) {
    throw new Error('Not a valid Shotforge project file');
  }
  return parsed as Project;
}
