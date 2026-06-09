'use client';

import { useState, useEffect } from 'react';
import AnalyticsCharts from './AnalyticsCharts';
import { StatCard } from './StatCard';
import { X, GripHorizontal } from 'lucide-react';

export function WidgetRenderer({ widget, projectId, onDelete, isEditMode }: { widget: any, projectId: string, onDelete: (id: string) => void, isEditMode?: boolean }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
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
  }, [projectId, widget.id]);

  const handleDelete = async () => {
    if (!confirm('Remove widget?')) return;
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

  if (widget.type === 'stat_card') {
    return (
      <div className={`relative group h-full ${isEditMode ? 'ring-2 ring-white/10 rounded-2xl' : ''}`}>
        {isEditMode && (
          <>
            <div className="absolute top-3 left-3 z-20 text-neutral-500 cursor-grab active:cursor-grabbing">
              <GripHorizontal className="w-4 h-4" />
            </div>
            <button onClick={handleDelete} className="absolute top-2 right-2 z-20 p-1.5 bg-red-500/20 text-red-400 rounded-lg border border-red-500/30 hover:bg-red-500/40 transition-all">
              <X className="w-3 h-3" />
            </button>
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

  // default to line_chart
  return (
    <div className={`bg-[#0A0A0A] border ${isEditMode ? 'border-white/30 ring-2 ring-white/10' : 'border-[var(--color-border-dark)]'} rounded-2xl p-6 sm:p-8 relative overflow-hidden flex flex-col min-h-[360px] sm:min-h-[400px] group`}>
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_20%,transparent_100%)] opacity-50" />
      
      {isEditMode && (
        <>
          <div className="absolute top-6 left-6 z-20 text-neutral-500 cursor-grab active:cursor-grabbing">
            <GripHorizontal className="w-5 h-5" />
          </div>
          <button onClick={handleDelete} className="absolute top-4 right-4 z-20 p-2 bg-red-500/20 text-red-400 rounded-xl border border-red-500/30 hover:bg-red-500/40 transition-all">
            <X className="w-4 h-4" />
          </button>
        </>
      )}

      <div className="flex items-center justify-between mb-6 sm:mb-8 relative z-10">
        <div>
          <h3 className="font-serif text-xl sm:text-2xl font-bold text-white capitalize">{title}</h3>
          <p className="text-xs sm:text-sm font-mono text-neutral-500 mt-1 sm:mt-2">14-DAY TRAILING COUNT • {subtitle}</p>
        </div>
        {!loading && !error && (
          <div className="text-right mr-10">
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
