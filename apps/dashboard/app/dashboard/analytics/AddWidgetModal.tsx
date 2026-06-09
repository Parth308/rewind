'use client';

import { useState, useEffect } from 'react';
import { X, LayoutTemplate, Activity, MousePointerClick, AlertTriangle } from 'lucide-react';

export function AddWidgetModal({ isOpen, onClose, projectId, onAdd }: { isOpen: boolean, onClose: () => void, projectId: string, onAdd: (w: any) => void }) {
  const [type, setType] = useState('line_chart');
  const [metric, setMetric] = useState('sessions');
  const [eventName, setEventName] = useState('');
  const [color, setColor] = useState('#a3e635');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetch(`/api/projects/${projectId}/events/tags`)
        .then(r => r.json())
        .then(d => { if (d.success) setTags(d.tags); })
        .catch(console.error);
    }
  }, [isOpen, projectId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/widgets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          metric,
          config: {
            eventName: metric === 'custom_event' ? eventName : undefined,
            color
          }
        })
      });
      const data = await res.json();
      if (data.success) {
        onAdd(data.widget);
      } else {
        setError(data.error || 'Failed to create widget');
      }
    } catch (err) {
      console.error(err);
      setError('A network error occurred. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#0A0A0A] border border-[var(--color-border-dark)] rounded-2xl w-full max-w-lg overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <h2 className="text-lg font-serif font-bold text-white">Create New Widget</h2>
          <button onClick={onClose} className="p-1 text-neutral-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6">
          <div>
            <label className="text-xs font-mono text-neutral-400 uppercase tracking-widest block mb-3">Visualization Type</label>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setType('line_chart')} className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${type === 'line_chart' ? 'bg-white/10 border-white/20 text-white' : 'bg-transparent border-white/5 text-neutral-500 hover:bg-white/5'}`}>
                <Activity className="w-6 h-6" />
                <span className="text-xs font-bold">Line Chart</span>
              </button>
              <button type="button" onClick={() => setType('stat_card')} className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${type === 'stat_card' ? 'bg-white/10 border-white/20 text-white' : 'bg-transparent border-white/5 text-neutral-500 hover:bg-white/5'}`}>
                <LayoutTemplate className="w-6 h-6" />
                <span className="text-xs font-bold">Stat Card</span>
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-mono text-neutral-400 uppercase tracking-widest block mb-3">Metric</label>
            <select value={metric} onChange={(e) => setMetric(e.target.value)} className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/30 transition-colors">
              <option value="sessions">Total Sessions</option>
              <option value="events">All DOM Events</option>
              <option value="network">Network Requests</option>
              <option value="rage_clicks">Rage Clicks</option>
              <option value="dead_clicks">Dead Clicks</option>
              <option value="u_turns">U-Turns</option>
              <option value="wild_scrolling">Wild Scrolling</option>
              <option value="errors">Exceptions / Errors</option>
              <option value="console_warn">Console Warnings</option>
              <option value="failed_api">Failed API Calls (4xx+)</option>
              <option value="slow_api">Slow API Calls (&gt;1s)</option>
              <option value="ai_tokens">AI Tokens Consumed</option>
              <option value="custom_event">Specific Custom Event</option>
            </select>
          </div>

          {metric === 'custom_event' && (
            <div>
              <label className="text-xs font-mono text-neutral-400 uppercase tracking-widest block mb-3">Event Name</label>
              <input 
                type="text" 
                required 
                placeholder="e.g. Started Trial" 
                value={eventName} 
                onChange={(e) => setEventName(e.target.value)} 
                list="event-tags-list"
                className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/30 transition-colors"
              />
              <datalist id="event-tags-list">
                {tags.map(t => <option key={t} value={t} />)}
              </datalist>
            </div>
          )}

          <div>
            <label className="text-xs font-mono text-neutral-400 uppercase tracking-widest block mb-3">Accent Color</label>
            <div className="flex gap-3">
              {['#a3e635', '#60a5fa', '#f87171', '#c084fc', '#fbbf24', '#ffffff'].map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full border-2 transition-transform ${color === c ? 'scale-110 border-white' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 mt-4 bg-[var(--color-accent-green)] text-black font-bold font-mono text-sm rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'CREATING...' : 'CREATE WIDGET'}
          </button>
        </form>
      </div>
    </div>
  );
}
