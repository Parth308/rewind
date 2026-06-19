'use client';

import { useState, useEffect } from 'react';
import { Play, Plus, X, BarChart3, Clock, ArrowRight, PlayCircle, Save, FolderOpen, Activity, ChevronRight, Globe } from 'lucide-react';
import { FadeUp } from '@/components/ui/fade-up';
import Link from 'next/link';

interface Step {
  type: 'event' | 'url';
  value: string;
}

interface SavedFunnel {
  id: string;
  name: string;
  steps: Step[];
  timeWindowMs: number;
}

interface FunnelResult {
  step: number;
  type: string;
  value: string;
  totalSessions: number;
  conversionRate: number;
  dropoffCount: number;
  dropoffSessionIds: string[];
}

export default function FunnelsClient({ projectId }: { projectId: string }) {
  const [steps, setSteps] = useState<Step[]>([{ type: 'url', value: '/pricing' }, { type: 'event', value: 'Started Trial' }]);
  const [timeWindow, setTimeWindow] = useState('1800000'); // 30m in ms
  const [availableEvents, setAvailableEvents] = useState<string[]>([]);
  const [savedFunnels, setSavedFunnels] = useState<SavedFunnel[]>([]);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [results, setResults] = useState<FunnelResult[]>([]);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  // Dialog State

  const [errorMsg, setErrorMsg] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveName, setSaveName] = useState('');

  useEffect(() => {
    if (projectId !== 'all') {
      fetch(`/api/projects/${projectId}/events`)
        .then(r => r.json())
        .then(d => { if (d.success) setAvailableEvents(d.events); });

      fetch(`/api/projects/${projectId}/funnels`)
        .then(r => r.json())
        .then(d => { if (d.success) setSavedFunnels(d.funnels); });
    }
  }, [projectId]);

  const addStep = () => setSteps([...steps, { type: 'event', value: '' }]);

  const updateStep = (index: number, key: 'type' | 'value', val: string) => {
    const newSteps = [...steps];
    newSteps[index][key] = val as any;
    setSteps(newSteps);
    setHasAnalyzed(false);
  };

  const removeStep = (index: number) => {
    const newSteps = [...steps];
    newSteps.splice(index, 1);
    setSteps(newSteps);
    setHasAnalyzed(false);
  };

  const loadFunnel = (funnel: any) => {
    const parsedSteps = typeof funnel.steps === 'string' ? JSON.parse(funnel.steps) : funnel.steps;
    setSteps(parsedSteps);
    setTimeWindow(funnel.timeWindowMs.toString());
    setResults([]);
    setHasAnalyzed(false);
    analyze(parsedSteps, funnel.timeWindowMs.toString());
  };

  const openSaveModal = () => {
    if (projectId === 'all') return setErrorMsg('Please select a specific project first.');
    if (steps.some(s => !s.value.trim())) return setErrorMsg('Please fill in all step values.');
    setErrorMsg('');
    setShowSaveModal(true);
  };

  const executeSaveFunnel = async () => {
    if (!saveName.trim()) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/funnels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: saveName,
          steps,
          timeWindowMs: parseInt(timeWindow, 10),
          filters: {}
        })
      });
      const data = await res.json();
      if (data.success) {
        setSavedFunnels([data.funnel, ...savedFunnels]);
        setShowSaveModal(false);
        setSaveName('');
      } else {
        setErrorMsg('Error saving funnel: ' + data.error);
      }
    } catch (e) {
      setErrorMsg('Failed to save funnel due to a network error.');
    } finally {
      setIsSaving(false);
    }
  };

  const analyze = async (stepsOverride?: Step[], timeWindowOverride?: string) => {
    const currentSteps = stepsOverride || steps;
    const currentTimeWindow = timeWindowOverride || timeWindow;

    if (projectId === 'all') return setErrorMsg('Please select a specific project first.');
    if (currentSteps.some(s => !s.value.trim())) return setErrorMsg('Please fill in all step values.');

    setErrorMsg('');
    setIsAnalyzing(true);
    setHasAnalyzed(false);
    try {
      const res = await fetch(`/api/projects/${projectId}/funnels/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          steps: currentSteps,
          timeWindowMs: parseInt(currentTimeWindow, 10),
          filters: {}
        })
      });
      const data = await res.json();
      if (data.success) {
        setHasAnalyzed(true);
        setResults(data.results.map((r: FunnelResult) => ({ ...r, conversionRate: 0 })));
        setTimeout(() => setResults(data.results), 50);
      } else {
        setErrorMsg('Error analyzing funnel: ' + data.error);
      }
    } catch (e) {
      setErrorMsg('Failed to analyze funnel due to a network error.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex flex-col gap-10">

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0A0A0A] border border-[var(--color-border-dark)] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative">
            <div className="p-6">
              <h3 className="font-sans text-2xl font-bold text-white mb-2">Save Funnel</h3>
              <p className="text-sm text-neutral-400 mb-6">Give your funnel a descriptive name to easily access it later.</p>

              <input
                type="text"
                placeholder='e.g. "Pricing to Checkout"'
                value={saveName}
                onChange={e => setSaveName(e.target.value)}
                autoFocus
                className="w-full bg-[#111] hover:bg-[#151515] border border-white/10 focus:border-[var(--color-accent-green)] text-white text-sm font-medium rounded-xl px-5 py-3 outline-none transition-all shadow-inner placeholder:text-neutral-600 mb-6"
              />

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowSaveModal(false)}
                  className="px-5 py-2.5 rounded-lg text-sm font-medium text-neutral-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={executeSaveFunnel}
                  disabled={!saveName.trim() || isSaving}
                  className="px-5 py-2.5 rounded-lg text-sm font-bold bg-[var(--color-accent-green)] text-black disabled:opacity-50 hover:brightness-110 transition-all shadow-[0_0_15px_rgba(163,230,53,0.3)]"
                >
                  {isSaving ? 'Saving...' : 'Save Funnel'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header & Saved Funnels Horizontal Bar */}
      <FadeUp>
        <div className="flex flex-col gap-8 relative z-10">
          <div>
            <h1 className="font-sans text-4xl sm:text-5xl font-bold tracking-tight text-white mb-3">Conversion Funnels.</h1>
            <p className="text-lg text-white/[0.618] max-w-xl">
              Analyze exactly where users drop off in your critical flows. Sequential conversion analysis with true replay correlation.
            </p>
          </div>

          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm flex items-center justify-between">
              <span>{errorMsg}</span>
              <button onClick={() => setErrorMsg('')}><X className="w-4 h-4 hover:text-red-300" /></button>
            </div>
          )}

          {/* Saved Funnels Pill Carousel */}
          {savedFunnels.length > 0 && (
            <div className="flex flex-col gap-3">
              <span className="text-[10px] font-mono tracking-[0.2em] text-neutral-600 mb-1 uppercase font-bold flex items-center gap-2">
                <FolderOpen className="w-4 h-4" /> Saved Funnels
              </span>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x">
                {savedFunnels.map(f => (
                  <button
                    key={f.id}
                    onClick={() => loadFunnel(f)}
                    className="snap-start shrink-0 flex items-center gap-3 px-5 py-2.5 bg-[#0A0A0A] hover:bg-[#111] border border-[var(--color-border-dark)] hover:border-[var(--color-accent-green)]/50 rounded-xl transition-all duration-300 group shadow-sm"
                  >
                    <Activity className="w-4 h-4 text-neutral-500 group-hover:text-[var(--color-accent-green)] transition-colors" />
                    <span className="text-sm font-medium text-neutral-300 group-hover:text-white transition-colors">{f.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </FadeUp>

      {/* Builder Card */}
      <FadeUp delay={0.1}>
        <div className="relative group z-10">
          {/* Subtle animated border glow */}
          <div className="absolute -inset-[1px] bg-gradient-to-b from-white/[0.15] to-transparent rounded-3xl opacity-50 transition-opacity" />

          <div className="relative bg-[#0A0A0A]/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 flex flex-col gap-8 shadow-2xl">

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--color-accent-green)]/10 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-[var(--color-accent-green)]" />
                </div>
                <h2 className="text-2xl font-bold text-white font-sans tracking-tight">Flow Builder</h2>
              </div>

              <div className="flex items-center gap-3 bg-white/[0.03] border border-white/5 rounded-xl p-1">
                <div className="pl-4 pr-2 flex items-center gap-2 text-sm text-neutral-400">
                  <Clock className="w-4 h-4" /> Window
                </div>
                <select
                  className="bg-[#151515] hover:bg-[#1a1a1a] text-white text-sm font-medium rounded-lg px-4 py-2 outline-none cursor-pointer border border-white/10 focus:border-[var(--color-accent-green)] transition-colors appearance-none pr-8 relative"
                  value={timeWindow}
                  onChange={e => setTimeWindow(e.target.value)}
                  style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '16px' }}
                >
                  <option value="900000">15 Minutes</option>
                  <option value="1800000">30 Minutes</option>
                  <option value="3600000">1 Hour</option>
                  <option value="86400000">1 Day</option>
                </select>
              </div>
            </div>

            {/* Steps Container */}
            <div className="flex flex-col gap-4 relative">
              {/* Connecting Line */}
              <div className="absolute left-6 top-8 bottom-8 w-px bg-white/10 -z-10" />

              {steps.map((step, i) => (
                <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-4 relative group/step">
                  <div className="w-12 h-12 rounded-full bg-[#111] border border-white/10 flex items-center justify-center text-sm font-mono text-neutral-400 shrink-0 shadow-lg group-hover/step:border-[var(--color-accent-green)]/50 group-hover/step:text-[var(--color-accent-green)] transition-colors bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a]">
                    {i + 1}
                  </div>

                  <div className="flex-1 flex flex-col sm:flex-row gap-3">
                    <div className="relative">
                      <select
                        className="w-full sm:w-48 bg-[#151515] hover:bg-[#1a1a1a] border border-white/10 focus:border-[var(--color-accent-green)] text-white text-sm font-medium rounded-xl px-5 py-4 outline-none cursor-pointer transition-all shadow-inner appearance-none pr-10"
                        value={step.type}
                        onChange={e => updateStep(i, 'type', e.target.value)}
                        style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.5)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 16px center', backgroundSize: '16px' }}
                      >
                        <option value="event">Did Event</option>
                        <option value="url">Visited URL</option>
                      </select>
                    </div>

                    <div className="flex-1 relative">
                      <input
                        type="text"
                        list={step.type === 'event' ? `events-list-${i}` : undefined}
                        placeholder={step.type === 'event' ? "e.g. Added to Cart" : "e.g. /pricing"}
                        className="w-full bg-[#151515] hover:bg-[#1a1a1a] border border-white/10 focus:border-[var(--color-accent-green)] text-white text-sm font-medium rounded-xl px-5 py-4 outline-none transition-all shadow-inner placeholder:text-neutral-600"
                        value={step.value}
                        onChange={e => updateStep(i, 'value', e.target.value)}
                      />
                      {step.type === 'event' && (
                        <datalist id={`events-list-${i}`}>
                          {availableEvents.map(e => <option key={e} value={e} />)}
                        </datalist>
                      )}
                    </div>
                  </div>

                  {steps.length > 1 && (
                    <button
                      onClick={() => removeStep(i)}
                      className="absolute -right-2 -top-2 sm:relative sm:right-auto sm:top-auto p-3 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-xl opacity-0 group-hover/step:opacity-100 transition-all scale-95 hover:scale-100"
                      title="Remove Step"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 pt-6 mt-4 border-t border-white/10">
              <button
                onClick={addStep}
                className="w-full sm:w-auto flex items-center justify-center gap-2 text-sm font-medium text-neutral-300 hover:text-white px-6 py-3.5 bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Plus className="w-4 h-4" /> Add Next Step
              </button>

              <div className="flex-1" />

              <div className="flex w-full sm:w-auto items-center gap-3">
                <button
                  onClick={openSaveModal}
                  disabled={isSaving}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 text-sm font-bold text-neutral-300 px-6 py-3.5 bg-transparent hover:bg-white/[0.05] border border-transparent hover:border-white/10 rounded-xl transition-all"
                >
                  <Save className="w-4 h-4" /> {isSaving ? 'Saving...' : 'Save Funnel'}
                </button>
                <button
                  onClick={() => analyze()}
                  disabled={isAnalyzing}
                  className="flex-1 sm:flex-none relative group overflow-hidden flex items-center justify-center gap-2 text-sm font-bold text-[#0a0a0a] px-8 py-3.5 rounded-xl bg-[var(--color-accent-green)] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 shadow-[0_0_30px_rgba(163,230,53,0.2)] hover:shadow-[0_0_40px_rgba(163,230,53,0.4)]"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                  <span className="relative flex items-center gap-2">
                    {isAnalyzing ? (
                      <span className="animate-pulse">Computing...</span>
                    ) : (
                      <><Play className="w-4 h-4" /> Analyze Funnel</>
                    )}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </FadeUp>

      {/* Results Section */}
      {hasAnalyzed && results.length === 0 && (
        <FadeUp delay={0.2}>
          <div className="bg-[#050505] border border-white/10 rounded-3xl p-12 text-center shadow-2xl relative z-10 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
              <Activity className="w-8 h-8 text-neutral-600" />
            </div>
            <h3 className="font-sans text-2xl font-bold text-white">No sessions matched this funnel.</h3>
            <p className="text-neutral-500 max-w-md mx-auto">Try widening your time window or removing some steps to see broader drop-off data.</p>
          </div>
        </FadeUp>
      )}

      {results.length > 0 && (
        <FadeUp delay={0.2}>
          <div className="bg-[#050505] border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative z-10">
            {/* Header */}
            <div className="px-8 py-6 border-b border-white/10 bg-[#0A0A0A] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-[var(--color-accent-green)] shadow-[0_0_10px_rgba(163,230,53,0.8)]" />
                <h3 className="font-sans text-2xl font-bold text-white tracking-tight">Conversion Analysis</h3>
                <div className="px-4 py-1 bg-white/5 border border-white/10 rounded-full ml-2">
                  <span className="text-xs font-mono tracking-widest text-neutral-400 uppercase">
                    Base: <strong className="text-white">{results[0]?.totalSessions || 0} Sessions</strong>
                  </span>
                </div>
              </div>
              <button 
                onClick={openSaveModal}
                className="flex items-center gap-2 text-sm font-bold text-[var(--color-accent-green)] hover:text-lime-300 bg-[var(--color-accent-green)]/10 hover:bg-[var(--color-accent-green)]/20 border border-[var(--color-accent-green)]/30 px-5 py-2 rounded-xl transition-all"
              >
                <Save className="w-4 h-4" /> Save this funnel
              </button>
            </div>

            <div className="p-8 md:p-10 flex flex-col gap-12 relative bg-gradient-to-b from-[#0A0A0A] to-[#050505]">
              {/* Connecting vertical line */}
              <div className="absolute left-[3.25rem] md:left-[3.75rem] top-12 bottom-12 w-px bg-gradient-to-b from-white/20 via-white/10 to-transparent -z-10" />

              {results.map((result, i) => (
                <div key={i} className="flex gap-6 md:gap-8 items-start relative group/row">
                  {/* Step Number */}
                  <div className="w-10 h-10 rounded-full bg-black border-2 border-[var(--color-accent-green)] flex items-center justify-center text-sm font-mono font-bold text-[var(--color-accent-green)] shrink-0 z-10 shadow-[0_0_15px_rgba(163,230,53,0.4)]">
                    {i + 1}
                  </div>

                  <div className="flex-1 flex flex-col gap-5 pt-1">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-[11px] font-mono text-neutral-500 uppercase tracking-widest flex items-center gap-2">
                          {result.type === 'event' ? <Activity className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                          {result.type === 'event' ? 'Performed Event' : 'Visited URL'}
                        </span>
                        <span className="text-2xl text-white font-sans font-medium tracking-tight">{result.value}</span>
                      </div>

                      <div className="text-right flex flex-col items-end">
                        <span className="text-4xl font-extrabold font-mono tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-neutral-500">
                          {result.conversionRate}%
                        </span>
                        <span className="text-sm text-neutral-500 font-medium">{result.totalSessions} Sessions passed</span>
                      </div>
                    </div>

                    {/* Funnel Bar */}
                    <div className="w-full h-10 bg-[#111] border border-white/5 rounded-xl overflow-hidden p-1 shadow-inner relative group/bar">
                      <div
                        className="h-full rounded-lg relative overflow-hidden transition-all duration-1000 ease-out"
                        style={{ width: `${result.conversionRate}%` }}
                      >
                        {/* Gradient Fill */}
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 via-[var(--color-accent-green)] to-lime-300 opacity-90" />
                        {/* Shimmer */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover/bar:animate-pulse" />
                      </div>
                    </div>

                    {/* Drop-off Alert Card */}
                    {result.dropoffCount > 0 && (
                      <div className="bg-gradient-to-r from-red-500/10 to-transparent border border-red-500/20 rounded-2xl p-5 mt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-6 hover:border-red-500/40 transition-colors">
                        <div className="flex flex-col gap-1">
                          <span className="text-red-400 text-lg font-bold flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            {result.dropoffCount} Users Abandoned
                          </span>
                          <span className="text-sm text-red-400/70">
                            {i === results.length - 2 ? 'They completed this step but never converted' : `They completed step ${i + 1} but never reached step ${i + 2}`}
                          </span>
                        </div>

                        <div className="flex flex-col gap-2 sm:items-end">
                          <span className="text-[10px] uppercase tracking-widest font-mono text-red-400/50">Watch Replays</span>
                          <div className="flex -space-x-3">
                            {result.dropoffSessionIds.slice(0, 4).map((sid: string) => (
                              <Link
                                key={sid}
                                href={`/dashboard/sessions/${sid}`}
                                className="w-10 h-10 rounded-full bg-[#111] border-2 border-red-900/50 flex items-center justify-center hover:-translate-y-2 hover:border-red-400 hover:bg-red-500/20 transition-all hover:z-20 shadow-xl"
                                title="Watch Drop-off Replay"
                              >
                                <PlayCircle className="w-5 h-5 text-red-400" />
                              </Link>
                            ))}
                            {result.dropoffSessionIds.length > 4 && (
                              <div className="w-10 h-10 rounded-full bg-red-950/50 border-2 border-red-900/50 flex items-center justify-center text-xs text-red-300 font-mono font-bold z-10 shadow-xl backdrop-blur-sm">
                                +{result.dropoffSessionIds.length - 4}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </FadeUp>
      )}
    </div>
  );
}
