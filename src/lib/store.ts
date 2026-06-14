import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';
import { get as idbGet, set as idbSet, del as idbDel } from 'idb-keyval';
import { nanoid } from 'nanoid';
import type { Page, Project, ProjectTheme, SpotlightPosition, TextLayer } from '../types';
import { RESOLUTION_PRESETS } from './presets';

const DEFAULT_THEME: ProjectTheme = {
  primaryColor: '#6D4AFF',
  secondaryColor: '#B79BFF',
  spotlightPosition: 'top-left',
  spotlightSize: 0.7,
  fontSize: 140,
  fontWeight: 700,
  fontRoundness: 60,
  textColor: '#FFFFFF',
};

// Text shadow is off by default; these are the values used once it's enabled.
const SHADOW_DEFAULTS: Pick<
  TextLayer,
  'shadow' | 'shadowColor' | 'shadowAngle' | 'shadowDistance' | 'shadowSize'
> = {
  shadow: false,
  shadowColor: '#000000',
  shadowAngle: 90,
  shadowDistance: 12,
  shadowSize: 16,
};

function makeHeadline(theme: ProjectTheme): TextLayer {
  return {
    text: 'Your headline here',
    fontSize: theme.fontSize,
    weight: theme.fontWeight,
    roundness: theme.fontRoundness,
    paddingX: 0.06,
    paddingTop: 0.06,
    align: 'left',
    color: theme.textColor,
    letterSpacing: -0.02,
    ...SHADOW_DEFAULTS,
  };
}

function makeSubhead(theme: ProjectTheme): TextLayer {
  return {
    text: 'A short supporting line.',
    fontSize: Math.round(theme.fontSize * 0.45),
    weight: 500,
    roundness: theme.fontRoundness,
    paddingX: 0.06,
    paddingTop: 0.22,
    align: 'left',
    color: theme.textColor,
    letterSpacing: -0.01,
    ...SHADOW_DEFAULTS,
  };
}

export function makePage(theme: ProjectTheme, resolutionId = RESOLUTION_PRESETS[0].id): Page {
  return {
    id: nanoid(),
    name: 'Untitled page',
    resolutionId,
    primaryColor: theme.primaryColor,
    secondaryColor: theme.secondaryColor,
    spotlightPosition: theme.spotlightPosition,
    spotlightSize: theme.spotlightSize,
    dither: true,
    ditherStrength: 0.12,
    headline: makeHeadline(theme),
    subhead: makeSubhead(theme),
    showSubhead: false,
    device: {
      widthRatio: 0.72,
      x: 0.14,
      y: 0.36,
      tiltDeg: 0,
      screenshotDataUrl: null,
      showShadow: true,
      showStatusBar: false,
      statusBarTime: '9:41',
      noSignal: false,
      lowBattery: false,
    },
  };
}

// Persist to IndexedDB instead of localStorage. localStorage's ~5MB quota
// can't hold projects whose pages embed full-res base64 screenshots
// (device.screenshotDataUrl) — a single screenshot can exceed it. IndexedDB
// has an effectively unbounded quota, so import/save of real projects works.
const STORE_KEY = 'shotforge-store';
const idbStorage: StateStorage = {
  getItem: async name => {
    const value = await idbGet(name);
    if (value != null) return value as string;
    // One-time migration: lift any pre-existing localStorage blob into IndexedDB.
    try {
      const legacy = localStorage.getItem(name);
      if (legacy != null) {
        await idbSet(name, legacy);
        localStorage.removeItem(name);
        return legacy;
      }
    } catch {}
    return null;
  },
  setItem: async (name, value) => {
    await idbSet(name, value);
  },
  removeItem: async name => {
    await idbDel(name);
  },
};

function makeProject(name = 'My App'): Project {
  const theme = { ...DEFAULT_THEME };
  return {
    id: nanoid(),
    name,
    createdAt: Date.now(),
    theme,
    pages: [makePage(theme)],
  };
}

interface StoreState {
  projects: Project[];
  activeProjectId: string | null;
  activePageId: string | null;

  createProject: (name?: string) => void;
  deleteProject: (id: string) => void;
  setActiveProject: (id: string) => void;
  renameProject: (id: string, name: string) => void;
  importProject: (project: Project) => void;

  addPage: () => void;
  duplicatePage: (pageId: string) => void;
  deletePage: (pageId: string) => void;
  setActivePage: (pageId: string) => void;
  reorderPages: (orderedIds: string[]) => void;
  updatePage: (pageId: string, patch: Partial<Page>) => void;
  updateDevice: (pageId: string, patch: Partial<Page['device']>) => void;
  updateText: (pageId: string, layer: 'headline' | 'subhead', patch: Partial<TextLayer>) => void;

  updateTheme: (patch: Partial<ProjectTheme>) => void;
  applyThemeToAllPages: () => void;
  applyToAllPages: (aspect: BroadcastAspect) => void;
}

/**
 * A single visual setting that can be broadcast from the active page onto every
 * other page in the same project. Each maps to exactly one control so the
 * "apply to all" buttons are predictable — clicking the one next to Dither
 * copies only the dither toggle, not its strength.
 */
export type BroadcastAspect =
  | 'primaryColor'
  | 'secondaryColor'
  | 'spotlightPosition'
  | 'spotlightSize'
  | 'dither'
  | 'ditherStrength'
  | 'headlineColor'
  | 'headlineSize'
  | 'headlineLetter'
  | 'headlineWeight'
  | 'headlineAlign'
  | 'headlinePadTop'
  | 'headlineShadow'
  | 'headlineShadowColor'
  | 'headlineShadowAngle'
  | 'headlineShadowDistance'
  | 'headlineShadowSize'
  | 'subheadColor'
  | 'subheadSize'
  | 'subheadLetter'
  | 'subheadWeight'
  | 'subheadAlign'
  | 'subheadPadTop'
  | 'subheadShadow'
  | 'subheadShadowColor'
  | 'subheadShadowAngle'
  | 'subheadShadowDistance'
  | 'subheadShadowSize'
  | 'deviceWidth'
  | 'deviceX'
  | 'deviceY'
  | 'deviceTilt';

function broadcastAspect(src: Page, aspect: BroadcastAspect, pg: Page): Page {
  switch (aspect) {
    case 'primaryColor':
      return { ...pg, primaryColor: src.primaryColor };
    case 'secondaryColor':
      return { ...pg, secondaryColor: src.secondaryColor };
    case 'spotlightPosition':
      return { ...pg, spotlightPosition: src.spotlightPosition };
    case 'spotlightSize':
      return { ...pg, spotlightSize: src.spotlightSize };
    case 'dither':
      return { ...pg, dither: src.dither };
    case 'ditherStrength':
      return { ...pg, ditherStrength: src.ditherStrength };
    case 'headlineColor':
      return { ...pg, headline: { ...pg.headline, color: src.headline.color } };
    case 'headlineSize':
      return { ...pg, headline: { ...pg.headline, fontSize: src.headline.fontSize } };
    case 'headlineLetter':
      return { ...pg, headline: { ...pg.headline, letterSpacing: src.headline.letterSpacing } };
    case 'headlineWeight':
      return { ...pg, headline: { ...pg.headline, weight: src.headline.weight } };
    case 'headlineAlign':
      return { ...pg, headline: { ...pg.headline, align: src.headline.align } };
    case 'headlinePadTop':
      return { ...pg, headline: { ...pg.headline, paddingTop: src.headline.paddingTop } };
    case 'headlineShadow':
      return { ...pg, headline: { ...pg.headline, shadow: src.headline.shadow } };
    case 'headlineShadowColor':
      return { ...pg, headline: { ...pg.headline, shadowColor: src.headline.shadowColor } };
    case 'headlineShadowAngle':
      return { ...pg, headline: { ...pg.headline, shadowAngle: src.headline.shadowAngle } };
    case 'headlineShadowDistance':
      return { ...pg, headline: { ...pg.headline, shadowDistance: src.headline.shadowDistance } };
    case 'headlineShadowSize':
      return { ...pg, headline: { ...pg.headline, shadowSize: src.headline.shadowSize } };
    case 'subheadColor':
      return { ...pg, subhead: { ...pg.subhead, color: src.subhead.color } };
    case 'subheadSize':
      return { ...pg, subhead: { ...pg.subhead, fontSize: src.subhead.fontSize } };
    case 'subheadLetter':
      return { ...pg, subhead: { ...pg.subhead, letterSpacing: src.subhead.letterSpacing } };
    case 'subheadWeight':
      return { ...pg, subhead: { ...pg.subhead, weight: src.subhead.weight } };
    case 'subheadAlign':
      return { ...pg, subhead: { ...pg.subhead, align: src.subhead.align } };
    case 'subheadPadTop':
      return { ...pg, subhead: { ...pg.subhead, paddingTop: src.subhead.paddingTop } };
    case 'subheadShadow':
      return { ...pg, subhead: { ...pg.subhead, shadow: src.subhead.shadow } };
    case 'subheadShadowColor':
      return { ...pg, subhead: { ...pg.subhead, shadowColor: src.subhead.shadowColor } };
    case 'subheadShadowAngle':
      return { ...pg, subhead: { ...pg.subhead, shadowAngle: src.subhead.shadowAngle } };
    case 'subheadShadowDistance':
      return { ...pg, subhead: { ...pg.subhead, shadowDistance: src.subhead.shadowDistance } };
    case 'subheadShadowSize':
      return { ...pg, subhead: { ...pg.subhead, shadowSize: src.subhead.shadowSize } };
    case 'deviceWidth':
      return { ...pg, device: { ...pg.device, widthRatio: src.device.widthRatio } };
    case 'deviceX':
      return { ...pg, device: { ...pg.device, x: src.device.x } };
    case 'deviceY':
      return { ...pg, device: { ...pg.device, y: src.device.y } };
    case 'deviceTilt':
      return { ...pg, device: { ...pg.device, tiltDeg: src.device.tiltDeg } };
    default:
      return pg;
  }
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => {
      const initial = makeProject();
      return {
        projects: [initial],
        activeProjectId: initial.id,
        activePageId: initial.pages[0].id,

        createProject: (name = 'My App') => {
          const project = makeProject(name);
          set(state => ({
            projects: [...state.projects, project],
            activeProjectId: project.id,
            activePageId: project.pages[0].id,
          }));
        },
        deleteProject: id => {
          set(state => {
            const remaining = state.projects.filter(p => p.id !== id);
            const next = remaining[0] ?? makeProject();
            return {
              projects: remaining.length ? remaining : [next],
              activeProjectId: next.id,
              activePageId: next.pages[0]?.id ?? null,
            };
          });
        },
        setActiveProject: id => {
          const proj = get().projects.find(p => p.id === id);
          if (!proj) return;
          set({ activeProjectId: id, activePageId: proj.pages[0]?.id ?? null });
        },
        renameProject: (id, name) => {
          set(state => ({
            projects: state.projects.map(p => (p.id === id ? { ...p, name } : p)),
          }));
        },
        importProject: project => {
          // Always assign fresh IDs on import. Files are often derived by
          // duplicating another project (e.g. an iOS variant of an Android
          // project), so they can carry colliding project/page IDs. Reusing
          // them would make two projects share an id — project selection then
          // resolves to whichever appears first and the dropdown breaks.
          const imported: Project = {
            ...project,
            id: nanoid(),
            pages: project.pages.map(pg => ({ ...pg, id: nanoid() })),
          };
          set(state => ({
            projects: [...state.projects, imported],
            activeProjectId: imported.id,
            activePageId: imported.pages[0]?.id ?? null,
          }));
        },

        addPage: () => {
          const { activeProjectId, projects } = get();
          const project = projects.find(p => p.id === activeProjectId);
          if (!project) return;
          const page = makePage(project.theme);
          set(state => ({
            projects: state.projects.map(p =>
              p.id === activeProjectId ? { ...p, pages: [...p.pages, page] } : p
            ),
            activePageId: page.id,
          }));
        },
        duplicatePage: pageId => {
          const { activeProjectId, projects } = get();
          const project = projects.find(p => p.id === activeProjectId);
          if (!project) return;
          const source = project.pages.find(p => p.id === pageId);
          if (!source) return;
          const copy: Page = JSON.parse(JSON.stringify(source));
          copy.id = nanoid();
          copy.name = `${source.name} copy`;
          const idx = project.pages.findIndex(p => p.id === pageId);
          const newPages = [...project.pages];
          newPages.splice(idx + 1, 0, copy);
          set(state => ({
            projects: state.projects.map(p =>
              p.id === activeProjectId ? { ...p, pages: newPages } : p
            ),
            activePageId: copy.id,
          }));
        },
        deletePage: pageId => {
          const { activeProjectId, projects } = get();
          const project = projects.find(p => p.id === activeProjectId);
          if (!project || project.pages.length <= 1) return;
          const newPages = project.pages.filter(p => p.id !== pageId);
          set(state => ({
            projects: state.projects.map(p =>
              p.id === activeProjectId ? { ...p, pages: newPages } : p
            ),
            activePageId: newPages[0]?.id ?? null,
          }));
        },
        setActivePage: pageId => set({ activePageId: pageId }),
        reorderPages: orderedIds => {
          const { activeProjectId, projects } = get();
          const project = projects.find(p => p.id === activeProjectId);
          if (!project) return;
          const map = new Map(project.pages.map(p => [p.id, p]));
          const reordered = orderedIds.map(id => map.get(id)).filter(Boolean) as Page[];
          set(state => ({
            projects: state.projects.map(p =>
              p.id === activeProjectId ? { ...p, pages: reordered } : p
            ),
          }));
        },
        updatePage: (pageId, patch) => {
          const { activeProjectId } = get();
          set(state => ({
            projects: state.projects.map(p =>
              p.id === activeProjectId
                ? { ...p, pages: p.pages.map(pg => (pg.id === pageId ? { ...pg, ...patch } : pg)) }
                : p
            ),
          }));
        },
        updateDevice: (pageId, patch) => {
          const { activeProjectId } = get();
          set(state => ({
            projects: state.projects.map(p =>
              p.id === activeProjectId
                ? {
                    ...p,
                    pages: p.pages.map(pg =>
                      pg.id === pageId ? { ...pg, device: { ...pg.device, ...patch } } : pg
                    ),
                  }
                : p
            ),
          }));
        },
        updateText: (pageId, layer, patch) => {
          const { activeProjectId } = get();
          set(state => ({
            projects: state.projects.map(p =>
              p.id === activeProjectId
                ? {
                    ...p,
                    pages: p.pages.map(pg =>
                      pg.id === pageId ? { ...pg, [layer]: { ...pg[layer], ...patch } } : pg
                    ),
                  }
                : p
            ),
          }));
        },

        updateTheme: patch => {
          const { activeProjectId } = get();
          set(state => ({
            projects: state.projects.map(p =>
              p.id === activeProjectId ? { ...p, theme: { ...p.theme, ...patch } } : p
            ),
          }));
        },
        applyToAllPages: aspect => {
          const { activeProjectId, activePageId, projects } = get();
          const project = projects.find(p => p.id === activeProjectId);
          const src = project?.pages.find(p => p.id === activePageId);
          if (!project || !src) return;
          set(state => ({
            projects: state.projects.map(p =>
              p.id === activeProjectId
                ? {
                    ...p,
                    pages: p.pages.map(pg =>
                      pg.id === src.id ? pg : broadcastAspect(src, aspect, pg)
                    ),
                  }
                : p
            ),
          }));
        },
        applyThemeToAllPages: () => {
          const { activeProjectId, projects } = get();
          const project = projects.find(p => p.id === activeProjectId);
          if (!project) return;
          const t = project.theme;
          set(state => ({
            projects: state.projects.map(p =>
              p.id === activeProjectId
                ? {
                    ...p,
                    pages: p.pages.map(pg => ({
                      ...pg,
                      primaryColor: t.primaryColor,
                      secondaryColor: t.secondaryColor,
                      spotlightPosition: t.spotlightPosition as SpotlightPosition,
                      spotlightSize: t.spotlightSize,
                      headline: {
                        ...pg.headline,
                        fontSize: t.fontSize,
                        weight: t.fontWeight,
                        roundness: t.fontRoundness,
                        color: t.textColor,
                      },
                      subhead: {
                        ...pg.subhead,
                        roundness: t.fontRoundness,
                        color: t.textColor,
                      },
                    })),
                  }
                : p
            ),
          }));
        },
      };
    },
    {
      name: STORE_KEY,
      version: 1,
      storage: createJSONStorage(() => idbStorage),
    }
  )
);

export function useActiveProject(): Project | null {
  const { projects, activeProjectId } = useStore();
  return projects.find(p => p.id === activeProjectId) ?? null;
}

export function useActivePage(): Page | null {
  const project = useActiveProject();
  const activePageId = useStore(s => s.activePageId);
  return project?.pages.find(p => p.id === activePageId) ?? null;
}
