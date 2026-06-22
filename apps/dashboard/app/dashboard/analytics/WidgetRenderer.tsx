'use client';

import { useState, useEffect, use } from 'react';
import AnalyticsCharts from './AnalyticsCharts';
import { StatCard } from './StatCard';
import { X, GripHorizontal } from 'lucide-react';

export function WidgetRenderer({ widget, projectId, onDelete, isEditMode, onResizePreview, onResizeEnd, initialDataPromise }: { 
  widget: any, 
  projectId: string, 
  onDelete: (id: string) => void, 
  isEditMode?: boolean, 
  onResizePreview?: (id: string, newColSpan: number, newRowSpan: number) => void,
  onResizeEnd?: (id: string, newColSpan: number, newRowSpan: number) => void,
  initialDataPromise?: Promise<any>
}) {
  const promiseData = initialDataPromise ? use(initialDataPromise) : null;
  
  const [data, setData] = useState<any>(promiseData?.success ? promiseData : null);
  const [loading, setLoading] = useState(!promiseData);
  const [error, setError] = useState(promiseData ? !promiseData.success : false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startColSpan = widget.config?.colSpan || (widget.type === 'stat_card' ? 1 : 6);
    const startRowSpan = widget.config?.rowSpan || (widget.type === 'stat_card' ? 1 : 3);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      
      const colDelta = Math.round(dx / 150);
      const rowDelta = Math.round(dy / 140);
      
      const newColSpan = Math.max(1, Math.min(6, startColSpan + colDelta));
      const newRowSpan = Math.max(1, Math.min(12, startRowSpan + rowDelta));
      
      if (onResizePreview) onResizePreview(widget.id, newColSpan, newRowSpan);
    };

    const handleMouseUp = (upEvent: MouseEvent) => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      
      const dx = upEvent.clientX - startX;
      const dy = upEvent.clientY - startY;
      const colDelta = Math.round(dx / 150);
      const rowDelta = Math.round(dy / 140);
      const finalColSpan = Math.max(1, Math.min(6, startColSpan + colDelta));
      const finalRowSpan = Math.max(1, Math.min(12, startRowSpan + rowDelta));

      if (onResizeEnd) onResizeEnd(widget.id, finalColSpan, finalRowSpan);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  useEffect(() => {
    if (!isConfirmingDelete) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        setIsConfirmingDelete(false);
        handleDelete();
      } else if (e.key === 'Escape') {
        setIsConfirmingDelete(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isConfirmingDelete]);

  useEffect(() => {
    if (initialDataPromise) return; // Data already handled by Suspense block above

    let isMounted = true;
    setLoading(true);
    fetch(`/api/projects/${projectId}/widgets/${widget.id}/data`)
      .then(r => r.json())
      .then(d => {
        if (isMounted) {
          if (d.success) setData(d);
          else setError(true);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setError(true);
          setLoading(false);
        }
      });
    return () => { isMounted = false; };
  }, [projectId, widget.id, initialDataPromise]);

  const handleDelete = async () => {
    try {
      await fetch(`/api/projects/${projectId}/widgets/${widget.id}`, { method: 'DELETE' });
      onDelete(widget.id);
    } catch (e) {
      console.error(e);
    }
  };

  const title = widget.config?.title || (widget.metric === 'custom_event' ? widget.config?.eventName : widget.metric);
  const subtitle = widget.metric === 'custom_event' ? 'CUSTOM EVENT' : widget.metric.toUpperCase();
  const color = widget.config?.color || '#a3e635';

  const confirmModal = isConfirmingDelete ? (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsConfirmingDelete(false)} />
      <div className="relative bg-[#0A0A0A] border border-[var(--color-border-dark)] rounded-2xl w-full max-w-sm overflow-hidden flex flex-col p-6 shadow-2xl">
        <h2 className="text-lg font-sans font-bold text-white mb-2">Remove Widget?</h2>
        <p className="text-sm text-neutral-400 font-mono mb-6">Are you sure you want to remove "{title}" from your dashboard?</p>
        <div className="flex gap-3 justify-end">
          <button onClick={() => setIsConfirmingDelete(false)} className="px-4 py-2 text-xs font-mono text-white/70 hover:text-white transition-colors">Cancel</button>
          <button autoFocus onClick={() => { setIsConfirmingDelete(false); handleDelete(); }} className="px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-xs font-mono font-bold hover:bg-red-500/40 transition-colors focus:ring-2 focus:ring-red-500/50 outline-none">Remove</button>
        </div>
      </div>
    </div>
  ) : null;

  if (widget.type === 'stat_card') {
    return (
      <div className={`relative group h-full ${isEditMode ? 'ring-2 ring-white/10 rounded-2xl' : ''}`}>
        {confirmModal}
        {isEditMode && (
          <>
            <div className="absolute top-3 left-3 z-20 text-neutral-500 cursor-grab active:cursor-grabbing">
              <GripHorizontal className="w-4 h-4" />
            </div>
            <button onClick={() => setIsConfirmingDelete(true)} className="absolute top-2 right-2 z-20 p-1.5 bg-red-500/20 text-red-400 rounded-lg border border-red-500/30 hover:bg-red-500/40 transition-all">
              <X className="w-3 h-3" />
            </button>
            <div 
              className="resize-handle absolute bottom-1 right-1 z-20 p-2 cursor-se-resize text-neutral-500 hover:text-white transition-colors"
              onMouseDown={handleResizeStart}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="21 13 21 21 13 21"></polyline>
                <line x1="21" y1="21" x2="13" y2="13"></line>
              </svg>
            </div>
          </>
        )}
        {loading ? (
          <div className="h-full min-h-[120px] rounded-2xl border border-white/10 bg-[#0A0A0A] flex items-center justify-center animate-pulse">
            <span className="text-xs font-mono text-neutral-600">LOADING...</span>
          </div>
        ) : error ? (
          <div className="h-full min-h-[120px] rounded-2xl border border-red-900/50 bg-[#0A0A0A] flex items-center justify-center">
            <span className="text-xs font-mono text-red-500">ERROR</span>
          </div>
        ) : (
          <StatCard 
            label={title} 
            value={data?.total?.toLocaleString() || '0'} 
            colorHex={color} 
          />
        )}
      </div>
    );
  }

  if (widget.type === 'client_targets') {
    const browserStats = data?.data?.browserStats || [];
    const avgMs = data?.data?.avgMs ?? null;
    const totalBrowserCount = browserStats.reduce((sum: number, b: any) => sum + parseInt(b.count), 0);

    return (
      <div className={`bg-[#0A0A0A] border ${isEditMode ? 'border-white/30 ring-2 ring-white/10' : 'border-[var(--color-border-dark)]'} rounded-2xl p-6 sm:p-8 flex flex-col relative overflow-hidden h-full w-full group`}>
        {confirmModal}
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-indigo-500 opacity-5 blur-[100px] rounded-full pointer-events-none" />
        
        {isEditMode && (
          <>
            <div className="absolute top-6 left-6 z-20 text-neutral-500 cursor-grab active:cursor-grabbing">
              <GripHorizontal className="w-5 h-5" />
            </div>
            <button onClick={() => setIsConfirmingDelete(true)} className="absolute top-4 right-4 z-20 p-2 bg-red-500/20 text-red-400 rounded-xl border border-red-500/30 hover:bg-red-500/40 transition-all">
              <X className="w-4 h-4" />
            </button>
            <div 
              className="resize-handle absolute bottom-2 right-2 z-20 p-2 cursor-se-resize text-neutral-500 hover:text-white transition-colors"
              onMouseDown={handleResizeStart}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="21 13 21 21 13 21"></polyline>
                <line x1="21" y1="21" x2="13" y2="13"></line>
              </svg>
            </div>
          </>
        )}

        <h3 className="font-sans text-xl sm:text-2xl font-bold text-white mb-1 sm:mb-2 relative z-10 text-center sm:text-left pt-6 sm:pt-0">Client Targets</h3>
        <p className="text-xs sm:text-sm font-mono text-neutral-500 mb-6 sm:mb-8 relative z-10 text-center sm:text-left">TOP BROWSERS</p>

        {loading ? (
          <div className="flex-1 flex items-center justify-center animate-pulse">
            <span className="text-xs font-mono text-neutral-600">LOADING...</span>
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center">
            <span className="text-xs font-mono text-red-500">ERROR</span>
          </div>
        ) : (
          <>
            <div className="space-y-4 sm:space-y-6 relative z-10 flex-1">
              {browserStats.length === 0 ? (
                <div className="text-sm font-mono text-neutral-600">No browser data yet...</div>
              ) : browserStats.map((b: any, i: number) => {
                const pct = Math.round((parseInt(b.count) / totalBrowserCount) * 100);
                const colors = ['bg-[var(--color-accent-green)]', 'bg-indigo-400', 'bg-purple-400', 'bg-rose-400', 'bg-amber-400'];
                return (
                  <div key={b.browser} className="group">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs sm:text-sm text-neutral-300 font-medium group-hover:text-white transition-colors truncate mr-2">{b.browser}</span>
                      <span className="text-xs font-mono text-neutral-500 shrink-0">{pct}%</span>
                    </div>
                    <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                      <div className={`h-full rounded-full ${colors[i % colors.length]}`} style={{ width: `${pct}%`, opacity: 0.8 }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {avgMs !== null && (
              <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-[var(--color-border-dark)] relative z-10">
                <div className="text-[10px] font-mono text-neutral-500 uppercase tracking-[0.2em] mb-2 text-center sm:text-left">Avg Session Duration</div>
                <div className="text-2xl sm:text-3xl font-mono font-bold text-white flex items-baseline justify-center sm:justify-start gap-1">
                  {avgMs}<span className="text-sm text-neutral-600 font-normal">s</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  // default to line_chart
  return (
    <div className={`bg-[#0A0A0A] border ${isEditMode ? 'border-white/30 ring-2 ring-white/10' : 'border-[var(--color-border-dark)]'} rounded-2xl p-6 sm:p-8 relative overflow-hidden flex flex-col h-full group`}>
      {confirmModal}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_20%,transparent_100%)] opacity-50" />
      
      {isEditMode && (
        <>
          <div className="absolute top-6 left-6 z-20 text-neutral-500 cursor-grab active:cursor-grabbing">
            <GripHorizontal className="w-5 h-5" />
          </div>
          <button onClick={() => setIsConfirmingDelete(true)} className="absolute top-4 right-4 z-20 p-2 bg-red-500/20 text-red-400 rounded-xl border border-red-500/30 hover:bg-red-500/40 transition-all">
            <X className="w-4 h-4" />
          </button>
          <div 
            className="resize-handle absolute bottom-2 right-2 z-20 p-2 cursor-se-resize text-neutral-500 hover:text-white transition-colors"
            onMouseDown={handleResizeStart}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="21 13 21 21 13 21"></polyline>
              <line x1="21" y1="21" x2="13" y2="13"></line>
            </svg>
          </div>
        </>
      )}

      <div className="flex items-center justify-between mb-6 sm:mb-8 relative z-10">
        <div className="pt-6 sm:pt-0">
          <h3 className="font-sans text-xl sm:text-2xl font-bold text-white capitalize">{title}</h3>
          <p className="text-xs sm:text-sm font-mono text-neutral-500 mt-1 sm:mt-2">14-DAY TRAILING COUNT • {subtitle}</p>
        </div>
        {!loading && !error && (
          <div className="text-right mr-10 hidden sm:block">
            <div className="text-2xl font-bold font-mono text-white">{data?.total?.toLocaleString() || 0}</div>
            <div className="text-[10px] uppercase font-mono text-neutral-500">Total</div>
          </div>
        )}
      </div>

      <div className="flex-1 w-full relative z-10 min-h-[220px]">
        {loading ? (
          <div className="h-full w-full flex items-center justify-center animate-pulse">
             <span className="text-xs font-mono text-neutral-600">LOADING CHART...</span>
          </div>
        ) : error ? (
          <div className="h-full w-full flex items-center justify-center">
             <span className="text-xs font-mono text-red-500">FAILED TO LOAD</span>
          </div>
        ) : (
          <AnalyticsCharts data={data?.data || []} color={color} />
        )}
      </div>
    </div>
  );
}
