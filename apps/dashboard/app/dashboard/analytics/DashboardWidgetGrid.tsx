'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { WidgetRenderer } from './WidgetRenderer';
import { AddWidgetModal } from './AddWidgetModal';
import { Plus, LayoutGrid, Check, Settings, ChevronDown } from 'lucide-react';

export function DashboardWidgetGrid({ initialWidgets, projectId }: { initialWidgets: any[], projectId: string }) {
  const [widgets, setWidgets] = useState(initialWidgets);
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isDropdownOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsDropdownOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDropdownOpen]);

  const handleAdd = (newWidget: any) => {
    setWidgets([...widgets, newWidget]);
    setModalOpen(false);
  };

  const handleDelete = (id: string) => {
    setWidgets(widgets.filter(w => w.id !== id));
  };

  const toggleEditMode = async () => {
    if (isEditMode) {
      // Save changes
      try {
        await fetch(`/api/projects/${projectId}/widgets/reorder`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderedIds: widgets.map(w => w.id) })
        });
      } catch (err) {
        console.error('Failed to save layout', err);
      }
    }
    setIsEditMode(!isEditMode);
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    if ((e.target as HTMLElement).closest('.resize-handle')) {
      e.preventDefault();
      return;
    }
    if (!isEditMode) {
      e.preventDefault();
      return;
    }
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) return;

    const newWidgets = [...widgets];
    const draggedIndex = newWidgets.findIndex(w => w.id === draggedId);
    const targetIndex = newWidgets.findIndex(w => w.id === targetId);

    const [removed] = newWidgets.splice(draggedIndex, 1);
    newWidgets.splice(targetIndex, 0, removed);

    newWidgets.forEach((w, i) => w.position = i);
    setWidgets(newWidgets);
    setDraggedId(null);
  };

  const headerActionsNode = mounted ? document.getElementById('dashboard-header-actions') : null;

  const actionsMenu = (
    <div className="flex justify-end gap-2 relative" ref={dropdownRef}>
      {isEditMode ? (
        <button 
          onClick={toggleEditMode}
          className="flex items-center gap-2 px-4 py-2 bg-white text-black border border-white rounded-xl text-xs font-mono font-bold hover:bg-neutral-200 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.2)]"
        >
          <Check className="w-4 h-4" />
          Save Layout
        </button>
      ) : (
        <>
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono transition-colors border ${isDropdownOpen ? 'bg-white/10 border-white/20 text-white' : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/80 hover:text-white'}`}
          >
            <Settings className="w-4 h-4" />
            Customize
            <ChevronDown className={`w-3 h-3 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {isDropdownOpen && (
            <div className="absolute top-full right-0 mt-2 w-48 bg-[#111] border border-white/10 rounded-xl overflow-hidden z-50 shadow-2xl flex flex-col p-1">
              <button 
                onClick={() => { setIsDropdownOpen(false); toggleEditMode(); }}
                className="flex items-center gap-3 px-3 py-2.5 text-left text-xs font-mono text-neutral-300 hover:bg-white/5 hover:text-white rounded-lg transition-colors w-full"
              >
                <LayoutGrid className="w-4 h-4" />
                Edit Layout
              </button>
              <button 
                onClick={() => { setIsDropdownOpen(false); setModalOpen(true); }}
                className="flex items-center gap-3 px-3 py-2.5 text-left text-xs font-mono text-[var(--color-accent-green)] hover:bg-[var(--color-accent-green)]/10 rounded-lg transition-colors w-full font-bold mt-1"
              >
                <Plus className="w-4 h-4" />
                Add Widget
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );

  const getColSpanClass = (w: any) => {
    const defaultSpan = w.type === 'stat_card' ? 1 : 6;
    const span = w.config?.colSpan || defaultSpan;
    if (span <= 1) return 'col-span-1';
    if (span === 2) return 'col-span-2';
    if (span === 3) return 'col-span-2 md:col-span-3';
    if (span === 4) return 'col-span-2 md:col-span-4';
    if (span === 5) return 'col-span-2 md:col-span-4 lg:col-span-5';
    return 'col-span-2 md:col-span-4 lg:col-span-5 xl:col-span-6';
  };

  const getRowSpanClass = (w: any) => {
    const defaultSpan = w.type === 'stat_card' ? 1 : 3;
    const span = w.config?.rowSpan || defaultSpan;
    if (span <= 1) return 'row-span-1';
    if (span === 2) return 'row-span-2';
    if (span === 3) return 'row-span-3';
    if (span === 4) return 'row-span-4';
    if (span === 5) return 'row-span-5';
    return `row-span-${Math.min(span, 12)}`; // Tailwind goes up to 12
  };

  const handleResizePreview = (id: string, newColSpan: number, newRowSpan: number) => {
    const wIndex = widgets.findIndex(w => w.id === id);
    if (wIndex === -1) return;
    
    const newWidgets = [...widgets];
    newWidgets[wIndex] = {
      ...newWidgets[wIndex],
      config: { ...newWidgets[wIndex].config, colSpan: newColSpan, rowSpan: newRowSpan }
    };
    setWidgets(newWidgets);
  };

  const handleResizeEnd = async (id: string, finalColSpan: number, finalRowSpan: number) => {
    try {
      await fetch(`/api/projects/${projectId}/widgets/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: { colSpan: finalColSpan, rowSpan: finalRowSpan } })
      });
    } catch (e) {
      console.error('Failed to save widget size', e);
    }
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-6 w-full">
      {headerActionsNode && createPortal(actionsMenu, headerActionsNode)}

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 grid-flow-row-dense auto-rows-[120px] sm:auto-rows-[140px]">
        {widgets.map((w: any) => (
          <div
            key={w.id}
            className={`${getColSpanClass(w)} ${getRowSpanClass(w)} h-full w-full`}
            draggable={isEditMode}
            onDragStart={(e) => handleDragStart(e, w.id)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, w.id)}
          >
            <WidgetRenderer 
              widget={w} 
              projectId={projectId} 
              onDelete={handleDelete} 
              isEditMode={isEditMode} 
              onResizePreview={handleResizePreview}
              onResizeEnd={handleResizeEnd}
            />
          </div>
        ))}
      </div>

      <AddWidgetModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        projectId={projectId}
        onAdd={handleAdd}
      />
    </div>
  );
}
