import { useEffect, useRef, useState } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useActiveProject, useStore } from '../lib/store';
import { PageRenderer } from './PageRenderer';
import type { Page, Project } from '../types';
import { exportProjectAsZip, exportProjectAsJson, importProjectFromJson } from '../lib/export';

export function Sidebar() {
  const project = useActiveProject();
  const projects = useStore(s => s.projects);
  const activePageId = useStore(s => s.activePageId);
  const setActivePage = useStore(s => s.setActivePage);
  const addPage = useStore(s => s.addPage);
  const reorderPages = useStore(s => s.reorderPages);
  const renameProject = useStore(s => s.renameProject);
  const createProject = useStore(s => s.createProject);
  const setActiveProject = useStore(s => s.setActiveProject);
  const deleteProject = useStore(s => s.deleteProject);
  const importProject = useStore(s => s.importProject);
  const [isExporting, setExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  if (!project) return null;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = project.pages.findIndex(p => p.id === active.id);
    const newIndex = project.pages.findIndex(p => p.id === over.id);
    const newOrder = arrayMove(project.pages, oldIndex, newIndex).map(p => p.id);
    reorderPages(newOrder);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportProjectAsZip(project);
    } catch (e) {
      alert('Export failed: ' + (e as Error).message);
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async (file: File) => {
    try {
      const project = await importProjectFromJson(file);
      importProject(project);
    } catch (e) {
      alert('Import failed: ' + (e as Error).message);
    }
  };

  return (
    <aside className="w-72 shrink-0 border-r border-neutral-800 bg-neutral-950 flex flex-col h-full">
      <div className="p-4 border-b border-neutral-800 space-y-3">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-neutral-500 mb-1">Project</div>
          <select
            value={project.id}
            onChange={e => setActiveProject(e.target.value)}
            className="w-full bg-neutral-900 rounded-lg px-2 py-1.5 text-sm border border-neutral-800"
          >
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <input
            value={project.name}
            onChange={e => renameProject(project.id, e.target.value)}
            className="mt-2 w-full bg-neutral-900 rounded-lg px-2 py-1.5 text-sm border border-neutral-800"
          />
          <div className="flex gap-1 mt-2">
            <button
              onClick={() => createProject('New Project')}
              className="flex-1 text-xs px-2 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800"
            >
              + Project
            </button>
            <button
              onClick={() => projects.length > 1 && confirm('Delete project?') && deleteProject(project.id)}
              className="text-xs px-2 py-1.5 rounded-lg bg-neutral-900 hover:bg-red-950 border border-neutral-800"
              disabled={projects.length <= 1}
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between px-4 py-2 border-b border-neutral-800">
        <span className="text-[10px] uppercase tracking-wider text-neutral-500">Pages · {project.pages.length}</span>
        <button
          onClick={addPage}
          className="text-xs px-2 py-1 rounded-md bg-violet-600 hover:bg-violet-500 text-white"
        >
          + Page
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={project.pages.map(p => p.id)} strategy={verticalListSortingStrategy}>
            {project.pages.map((page, idx) => (
              <PageThumb
                key={page.id}
                page={page}
                index={idx}
                active={page.id === activePageId}
                onSelect={() => setActivePage(page.id)}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>

      <div className="p-3 border-t border-neutral-800 space-y-2">
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="w-full text-sm px-3 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-medium"
        >
          {isExporting ? 'Rendering…' : 'Download .zip'}
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => exportProjectAsJson(project)}
            className="flex-1 text-xs px-2 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800"
          >
            Save .json
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 text-xs px-2 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800"
          >
            Import .json
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={e => {
              const f = e.target.files?.[0];
              if (f) handleImport(f);
              e.target.value = '';
            }}
          />
        </div>
      </div>
    </aside>
  );
}

function PageThumb({
  page,
  index,
  active,
  onSelect,
}: {
  page: Page;
  index: number;
  active: boolean;
  onSelect: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: page.id });
  const duplicatePage = useStore(s => s.duplicatePage);
  const deletePage = useStore(s => s.deletePage);
  const project = useActiveProject();

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-xl border ${
        active ? 'border-violet-500 ring-1 ring-violet-500/40' : 'border-neutral-800 hover:border-neutral-700'
      } bg-neutral-900 overflow-hidden`}
    >
      <button onClick={onSelect} className="w-full text-left">
        <div className="flex items-center justify-center bg-neutral-950 p-2" style={{ minHeight: 110 }}>
          <PageRenderer page={page} displayWidth={120} />
        </div>
      </button>
      <div className="flex items-center px-2 py-1.5 gap-1 border-t border-neutral-800">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab text-neutral-500 hover:text-neutral-300 px-1"
          aria-label="Drag"
        >
          ⋮⋮
        </button>
        <span className="text-xs text-neutral-300 flex-1 truncate">
          {index + 1}. {page.name}
        </span>
        <button
          onClick={e => {
            e.stopPropagation();
            duplicatePage(page.id);
          }}
          className="text-xs text-neutral-500 hover:text-neutral-200 px-1"
          title="Duplicate"
        >
          ⎘
        </button>
        <button
          onClick={e => {
            e.stopPropagation();
            if ((project?.pages.length ?? 0) > 1 && confirm('Delete page?')) deletePage(page.id);
          }}
          className="text-xs text-neutral-500 hover:text-red-400 px-1"
          disabled={(project?.pages.length ?? 0) <= 1}
          title="Delete"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
