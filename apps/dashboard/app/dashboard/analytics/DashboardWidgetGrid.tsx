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

    // Update local positions
    newWidgets.forEach((w, i) => w.position = i);
    setWidgets(newWidgets);
    setDraggedId(null);
  };

  const statCards = widgets.filter(w => w.type === 'stat_card');
  const lineCharts = widgets.filter(w => w.type === 'line_chart');

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

  return (
    <div className="flex flex-col gap-4 sm:gap-6 w-full">
      {headerActionsNode && createPortal(actionsMenu, headerActionsNode)}

      {/* Stat Cards */}
      {statCards.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {statCards.map((w: any) => (
            <div
              key={w.id}
              draggable={isEditMode}
              onDragStart={(e) => handleDragStart(e, w.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, w.id)}
            >
              <WidgetRenderer widget={w} projectId={projectId} onDelete={handleDelete} isEditMode={isEditMode} />
            </div>
          ))}
        </div>
      )}

      {/* Line Charts */}
      {lineCharts.length > 0 && (
        <div className="flex flex-col gap-4 sm:gap-6 w-full">
          {lineCharts.map((w: any) => (
            <div
              key={w.id}
              className="w-full"
              draggable={isEditMode}
              onDragStart={(e) => handleDragStart(e, w.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, w.id)}
            >
              <WidgetRenderer widget={w} projectId={projectId} onDelete={handleDelete} isEditMode={isEditMode} />
            </div>
          ))}
        </div>
      )}

      <AddWidgetModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        projectId={projectId}
        onAdd={handleAdd}
      />
    </div>
  );
}
