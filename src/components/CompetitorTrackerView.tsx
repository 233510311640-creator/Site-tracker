import React, { useState, useEffect } from 'react';
import { Idea, Competitor } from '../types.js';
import { 
  TrendingUp, 
  Plus, 
  RefreshCw, 
  Globe, 
  DollarSign, 
  Sliders, 
  AlertTriangle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Cpu,
  Bookmark
} from 'lucide-react';

interface CompetitorTrackerViewProps {
  ideas: Idea[];
  selectedIdea: Idea | null;
  competitors: Competitor[];
  onRefreshCompetitors: (ideaId: number) => void;
  onAddManualCompetitor: (ideaId: number, domain: string) => void;
  isRefreshing: boolean;
}

export default function CompetitorTrackerView({
  ideas,
  selectedIdea,
  competitors,
  onRefreshCompetitors,
  onAddManualCompetitor,
  isRefreshing
}: CompetitorTrackerViewProps) {
  const [currentIdea, setCurrentIdea] = useState<Idea | null>(selectedIdea);
  const [manualDomain, setManualDomain] = useState('');
  const [expandedCompetitorId, setExpandedCompetitorId] = useState<number | null>(null);

  // Sync selectedIdea
  useEffect(() => {
    if (selectedIdea) {
      setCurrentIdea(selectedIdea);
    } else if (ideas.length > 0 && !currentIdea) {
      setCurrentIdea(ideas[0]);
    }
  }, [selectedIdea, ideas]);

  const filteredCompetitors = competitors.filter(c => c.idea_id === currentIdea?.id);

  const handleAddManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualDomain.trim() || !currentIdea) return;
    
    // Simple validation
    let domain = manualDomain.trim().toLowerCase();
    domain = domain.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
    
    if (domain) {
      onAddManualCompetitor(currentIdea.id, domain);
      setManualDomain('');
    }
  };

  const formatTraffic = (val: number) => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${(val / 1000).toFixed(0)}K`;
    return val.toString();
  };

  return (
    <div id="competitor-tracker-view" className="space-y-4">
      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column: Selector & Add manual */}
        <div className="lg:col-span-1 space-y-4">
          {/* Selector Card */}
          <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-lg space-y-3">
            <label className="block text-[10px] font-bold text-slate-500 font-mono tracking-wider uppercase">SELECT MICRO-TOOL TARGET</label>
            <select 
              value={currentIdea?.id || ''}
              onChange={(e) => {
                const found = ideas.find(i => i.id === Number(e.target.value));
                if (found) setCurrentIdea(found);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded text-xs text-slate-200 p-2 focus:outline-none focus:border-slate-700 font-mono"
            >
              {ideas.length === 0 ? (
                <option value="">No ideas found</option>
              ) : (
                ideas.map(i => (
                  <option key={i.id} value={i.id}>{i.name}</option>
                ))
              )}
            </select>
          </div>

          {/* Add Manual Competitor */}
          <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-lg space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span>Add Competitor Domain</span>
            </h3>
            <form onSubmit={handleAddManual} className="space-y-2">
              <input 
                type="text"
                required
                value={manualDomain}
                onChange={(e) => setManualDomain(e.target.value)}
                placeholder="e.g. competitortool.com"
                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-slate-700 font-mono"
              />
              <button 
                type="submit"
                disabled={isRefreshing || !currentIdea}
                className="w-full flex items-center justify-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-900 text-emerald-400 border border-slate-700 rounded text-xs font-bold cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Track Rival Domain</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Rival Sites Grid List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5 space-y-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-800 pb-2">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Tracked Competitor Portals</span>
                </h3>
                <p className="text-[10px] text-slate-500">Discovered rivals for "{currentIdea?.name || 'Selected Idea'}"</p>
              </div>

              {currentIdea && (
                <button 
                  onClick={() => onRefreshCompetitors(currentIdea.id)}
                  disabled={isRefreshing}
                  className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-slate-900 font-bold text-xs rounded transition-all cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span>Discover & Scan Rivals</span>
                </button>
              )}
            </div>

            {/* Competitor list representation */}
            {!currentIdea ? (
              <div className="text-center py-8 text-slate-500 font-mono text-xs">
                Select an idea to view tracked competitors.
              </div>
            ) : filteredCompetitors.length === 0 ? (
              <div className="text-center py-8 text-slate-500 font-mono text-xs space-y-2">
                <p>No competitors recorded for this idea yet.</p>
                <button 
                  onClick={() => onRefreshCompetitors(currentIdea.id)}
                  disabled={isRefreshing}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-750 text-emerald-400 border border-slate-700 rounded text-[10px] font-bold cursor-pointer"
                >
                  Click here to auto-scan via Gemini Grounding
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredCompetitors.map((comp) => {
                  const isExpanded = expandedCompetitorId === comp.id;
                  
                  // Threat Badge configurations
                  let threatColor = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
                  if (comp.threat_level === 'High') {
                    threatColor = "text-rose-400 bg-rose-500/10 border-rose-500/20";
                  } else if (comp.threat_level === 'Medium') {
                    threatColor = "text-amber-400 bg-amber-500/10 border-amber-500/20";
                  }

                  return (
                    <div 
                      key={comp.id} 
                      className="bg-slate-950 border border-slate-800 rounded overflow-hidden transition-all hover:border-slate-700"
                    >
                      {/* Accordion Header Row */}
                      <div 
                        onClick={() => setExpandedCompetitorId(isExpanded ? null : comp.id)}
                        className="p-2.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 cursor-pointer select-none"
                      >
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-slate-500 shrink-0" />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-white text-xs hover:text-emerald-400">{comp.domain}</span>
                              <a 
                                href={`https://${comp.domain}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-slate-500 hover:text-slate-300"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono">Country: {comp.top_country}</span>
                          </div>
                        </div>

                        {/* Middle stats summary */}
                        <div className="flex items-center gap-4">
                          <div className="text-left sm:text-right font-mono">
                            <span className="block text-slate-500 text-[9px] font-bold uppercase">TRAFFIC</span>
                            <span className="font-bold text-slate-200 text-xs">{formatTraffic(comp.monthly_visits)} /mo</span>
                          </div>

                          <div className="text-left sm:text-right font-mono">
                            <span className="block text-slate-500 text-[9px] font-bold uppercase">THREAT</span>
                            <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border inline-block ${threatColor}`}>
                              {comp.threat_level.toUpperCase()}
                            </span>
                          </div>
                        </div>

                        {/* Accordion Arrow trigger */}
                        <div className="text-slate-500 ml-auto sm:ml-0">
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </div>
                      </div>

                      {/* Expandable details segment */}
                      {isExpanded && (
                        <div className="p-3 bg-slate-900/40 border-t border-slate-850 space-y-3 text-xs">
                          {/* Bento specs grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="p-2 bg-slate-950 rounded border border-slate-850">
                              <span className="block text-slate-500 text-[9px] font-mono font-bold uppercase">ESTIMATED REVENUE</span>
                              <span className="text-sm font-bold text-emerald-400 font-mono flex items-center mt-0.5">
                                <DollarSign className="w-3.5 h-3.5" />
                                {comp.estimated_revenue ? `${comp.estimated_revenue}/mo` : `$${Math.round(comp.monthly_visits * 0.002)}/mo`}
                              </span>
                              <span className="block text-[8px] text-slate-600 font-mono mt-0.5">Visits * $0.02 RPM logic</span>
                            </div>

                            <div className="p-2 bg-slate-950 rounded border border-slate-850">
                              <span className="block text-slate-500 text-[9px] font-mono font-bold uppercase">ENGAGEMENT RATES</span>
                              <div className="space-y-0.5 mt-0.5 font-mono text-[10px]">
                                <div className="flex justify-between">
                                  <span className="text-slate-400">Bounce:</span>
                                  <span className="text-slate-200 font-bold">{comp.bounce_rate || 45}%</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-400">Rank:</span>
                                  <span className="text-slate-200 font-bold">#{comp.global_rank ? comp.global_rank.toLocaleString() : '—'}</span>
                                </div>
                              </div>
                            </div>

                            <div className="p-2 bg-slate-950 rounded border border-slate-850 flex flex-col justify-between">
                              <div>
                                <span className="block text-slate-500 text-[9px] font-mono font-bold uppercase">SCREENSHOT WORKFLOW</span>
                                <div className="mt-0.5 flex items-center justify-center h-8 border border-dashed border-slate-800 rounded bg-slate-900 text-[9px] text-slate-500 font-mono">
                                  Not Loaded
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Tech stack row */}
                          {comp.tech_stack && comp.tech_stack.length > 0 && (
                            <div className="space-y-1">
                              <span className="text-[9px] font-bold text-slate-500 font-mono block uppercase">DETECTED TECHNOLOGY STACK</span>
                              <div className="flex flex-wrap gap-1">
                                {comp.tech_stack.map((tech) => (
                                  <span key={tech} className="px-1.5 py-0.2 bg-slate-950 border border-slate-850 text-[9px] rounded text-slate-300 font-mono">
                                    {tech}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* SEO Keywords row */}
                          {comp.top_keywords && comp.top_keywords.length > 0 && (
                            <div className="space-y-1">
                              <span className="text-[9px] font-bold text-slate-500 font-mono block uppercase">TOP ORGANIC KEYWORDS</span>
                              <div className="flex flex-wrap gap-1">
                                {comp.top_keywords.map((kw) => (
                                  <span key={kw} className="px-1.5 py-0.2 bg-slate-950 border border-slate-850 text-[9px] rounded text-emerald-400 font-mono">
                                    🔑 {kw}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Screenshot disclaimer info */}
          <div className="bg-slate-950/40 border border-slate-850 p-3 rounded-lg flex items-start gap-2.5">
            <Cpu className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <h4 className="text-[11px] font-bold text-slate-300">Autonomous Crawl Pipeline</h4>
              <p className="text-[10px] text-slate-500 leading-relaxed font-mono">
                Competitor discovery triggers an active Google Search Grounding scrape query to detect organic positioning. Estimated revenue figures utilize CPM industry metrics for utility ad networks.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
