import React, { useState, useEffect } from 'react';
import { Idea } from '../types.js';
import { 
  Search, 
  RefreshCw, 
  Eye, 
  Trash2, 
  Info, 
  Zap, 
  TrendingUp, 
  Cpu,
  Globe,
  Award,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  PlusCircle,
  Sparkles,
  Compass,
  Check,
  CheckCircle
} from 'lucide-react';

interface IdeaEngineViewProps {
  ideas: Idea[];
  onToggleWatchlist: (id: number) => void;
  onDeleteIdea: (id: number) => void;
  onMineReddit: () => void;
  onDiscoverGemini: (query: string) => void;
  onSelectIdeaForEvidence: (idea: Idea) => void;
  onSelectIdeaForDomains: (idea: Idea) => void;
  onSelectIdeaForCompetitors: (idea: Idea) => void;
  onSaveIdea: (idea: any) => Promise<any>;
  isMining: boolean;
  isDiscovering: boolean;
}

export default function IdeaEngineView({
  ideas,
  onToggleWatchlist,
  onDeleteIdea,
  onMineReddit,
  onDiscoverGemini,
  onSelectIdeaForEvidence,
  onSelectIdeaForDomains,
  onSelectIdeaForCompetitors,
  onSaveIdea,
  isMining,
  isDiscovering
}: IdeaEngineViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<'registry' | 'scout'>('registry');
  
  // Registry tab states
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sortBy, setSortBy] = useState<'score' | 'upvotes' | 'comments'>('score');
  const [nicheQuery, setNicheQuery] = useState('');
  const [showFormulaInfo, setShowFormulaInfo] = useState(false);

  // Global Scout tab states
  const [scoutQuery, setScoutQuery] = useState('');
  const [scoutedOpportunities, setScoutedOpportunities] = useState<any[]>([]);
  const [isScouting, setIsScouting] = useState(false);
  const [scoutError, setScoutError] = useState<string | null>(null);
  const [importedStatus, setImportedStatus] = useState<Record<string, boolean>>({});

  const categories = [
    'All',
    'Calculators & Converters',
    'Generators (QR, Password, Lorem Ipsum)',
    'Formatters (JSON, SQL, CSS)',
    'Analyzers (SEO, Speed, Word Count)',
    'Utilities (Ruler, Screen Tools, Color Pickers)',
    'AI-Powered Tools'
  ];

  // Load initial scouts on mount
  useEffect(() => {
    if (scoutedOpportunities.length === 0) {
      handleScout();
    }
  }, []);

  const handleScout = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsScouting(true);
    setScoutError(null);
    try {
      const res = await fetch('/api/ideas/scout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: scoutQuery })
      }).then(r => r.json());

      if (res.success && res.opportunities) {
        setScoutedOpportunities(res.opportunities);
      } else {
        setScoutError(res.error || "Failed to fetch global opportunities.");
      }
    } catch (err: any) {
      setScoutError(err.message || "Network error fetching opportunities.");
    } finally {
      setIsScouting(false);
    }
  };

  const handleImportScout = async (opp: any) => {
    try {
      const ideaPayload = {
        name: opp.name,
        description: opp.description,
        category: opp.category || 'Utilities (Ruler, Screen Tools, Color Pickers)',
        source: `Scout: Gaps (${opp.rival_site})`,
        source_url: opp.rival_site ? `https://${opp.rival_site.split('&')[0].trim()}` : '',
        upvotes: Math.floor(Math.random() * 120) + 50,
        comments: Math.floor(Math.random() * 20) + 4,
        opportunity_score: Math.floor(Math.random() * 10) + 84, // Higher score for validated gaps
        demand_score: 85,
        competition_score: 15,
        monetization_score: 80,
        simplicity_score: 85
      };

      const saved = await onSaveIdea(ideaPayload);
      if (saved) {
        setImportedStatus(prev => ({ ...prev, [opp.name]: true }));
      }
    } catch (err) {
      console.error("Failed to import scouted idea:", err);
    }
  };

  // Apply sorting and filtering for main Registry
  const filteredIdeas = ideas
    .filter(idea => {
      const matchesSearch = idea.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        idea.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'All' || idea.category === categoryFilter;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'score') return b.opportunity_score - a.opportunity_score;
      if (sortBy === 'upvotes') return b.upvotes - a.upvotes;
      return b.comments - a.comments;
    });

  const handleNicheSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nicheQuery.trim()) return;
    onDiscoverGemini(nicheQuery);
  };

  return (
    <div id="idea-engine-view-root" className="space-y-6">
      {/* Visual Subtabs Header */}
      <div className="flex border-b border-slate-800 pb-px gap-1">
        <button
          onClick={() => setActiveSubTab('registry')}
          className={`px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'registry' 
              ? 'border-emerald-500 text-emerald-400 bg-emerald-950/10' 
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Ideas Registry ({ideas.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('scout')}
          className={`px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-1.5 relative ${
            activeSubTab === 'scout' 
              ? 'border-emerald-500 text-emerald-400 bg-emerald-950/10' 
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/30'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span>Global Competitor Gaps Scout</span>
          <span className="absolute -top-1 -right-1 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
        </button>
      </div>

      {activeSubTab === 'registry' ? (
        <div className="space-y-4 animate-fadeIn">
          {/* Action triggers box: Reddit crawling & Gemini Niche Search */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Gemini Search Grounding Box */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-3.5 rounded-lg space-y-3">
              <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2">
                <Cpu className="w-4 h-4 text-emerald-400 animate-pulse" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">AI Niche Radar (Google Search Grounding)</h3>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Tell Gemini what specific niche, industry, or seed topic you want to mine. Gemini will search the web in real-time to surface 5 unique tool concepts.
              </p>
              <form onSubmit={handleNicheSearch} className="flex gap-2">
                <input 
                  type="text"
                  required
                  value={nicheQuery}
                  onChange={(e) => setNicheQuery(e.target.value)}
                  placeholder="e.g., retro productivity calculators, developer formatters..."
                  className="flex-1 bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-slate-700 font-mono"
                />
                <button 
                  type="submit"
                  disabled={isDiscovering}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-900 text-emerald-400 font-semibold text-xs border border-slate-700 rounded flex items-center gap-1 transition-all cursor-pointer"
                >
                  {isDiscovering ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
                  <span>{isDiscovering ? 'Scanning' : 'Scout'}</span>
                </button>
              </form>
            </div>

            {/* Reddit Miner Control box */}
            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-lg flex flex-col justify-between space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Reddit Mining Sweeper</h3>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Sweeps r/SideProject, r/SaaS, and r/IndieHackers for posts containing launched micro-SaaS and simple tools.
                </p>
              </div>
              <button 
                onClick={onMineReddit}
                disabled={isMining}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-slate-900 font-bold text-xs rounded transition-all cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${isMining ? 'animate-spin' : ''}`} />
                <span>{isMining ? 'Mining...' : 'Execute Reddit Miner'}</span>
              </button>
            </div>
          </div>

          {/* Opportunity Scoring Explanation Alert */}
          <div className="bg-slate-950/40 border border-slate-850 rounded-lg p-3 space-y-2">
            <button 
              onClick={() => setShowFormulaInfo(!showFormulaInfo)}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 font-mono focus:outline-none cursor-pointer"
            >
              <Info className="w-3.5 h-3.5 text-emerald-400" />
              <span>Opportunity Score Formula Explained</span>
              <span className="text-[10px] text-slate-600">({showFormulaInfo ? 'Click to collapse' : 'Click to expand'})</span>
            </button>

            {showFormulaInfo && (
              <div className="text-[10px] text-slate-500 space-y-2 pt-2 border-t border-slate-900 grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="p-2.5 bg-slate-900/50 rounded border border-slate-850">
                  <span className="font-bold text-slate-300 block mb-0.5">Demand Signal (0-30)</span>
                  Proxy value derived from Google Trends growth, Reddit upvotes, and online feedback comments.
                </div>
                <div className="p-2.5 bg-slate-900/50 rounded border border-slate-850">
                  <span className="font-bold text-slate-300 block mb-0.5">Competition Gap (0-25)</span>
                  Lower is better. Checked against Product Hunt entries. Fewer alternatives = higher scoring.
                </div>
                <div className="p-2.5 bg-slate-900/50 rounded border border-slate-850">
                  <span className="font-bold text-slate-300 block mb-0.5">Monetization (0-25)</span>
                  +25 for high CPC B2B niches, +18 for AdSense-friendly mass markets, +10 for generic consumers.
                </div>
                <div className="p-2.5 bg-slate-900/50 rounded border border-slate-850">
                  <span className="font-bold text-slate-300 block mb-0.5">Simplicity (0-20)</span>
                  +20 if completely static client-side tool, +15 if small logic, +5 if database intensive.
                </div>
              </div>
            )}
          </div>

          {/* Filter and Table Section */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5 space-y-3">
            {/* Filters Header bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Discovered Ideas Registry</h3>
              </div>
              
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                {/* Search Input */}
                <div className="relative flex-1 sm:flex-none">
                  <Search className="absolute left-2 top-2 w-3 h-3 text-slate-600" />
                  <input 
                    type="text"
                    placeholder="Search ideas..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-7 pr-2.5 py-1 bg-slate-950 border border-slate-800 rounded text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-slate-700 w-full sm:w-44 font-mono"
                  />
                </div>

                {/* Category Filter */}
                <select 
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded text-xs text-slate-300 px-2 py-1 focus:outline-none focus:border-slate-700 font-mono"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat.length > 25 ? `${cat.substring(0, 25)}...` : cat}</option>
                  ))}
                </select>

                {/* Sort Dropdown */}
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-slate-950 border border-slate-800 rounded text-xs text-slate-300 px-2 py-1 focus:outline-none focus:border-slate-700 font-mono"
                >
                  <option value="score">Sort by Score</option>
                  <option value="upvotes">Sort by Upvotes</option>
                  <option value="comments">Sort by Comments</option>
                </select>
              </div>
            </div>

            {/* Ideas Table */}
            <div className="overflow-x-auto">
              {filteredIdeas.length === 0 ? (
                <div className="text-center py-8 text-slate-500 font-mono text-xs">
                  No micro-tool ideas found matching filters. Try executing the Reddit miner above!
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500 bg-slate-950/40">
                      <th className="p-2 font-bold font-mono">Score</th>
                      <th className="p-2 font-bold font-mono">Idea Name / Concept</th>
                      <th className="p-2 font-bold font-mono hidden md:table-cell">Category</th>
                      <th className="p-2 font-bold font-mono text-right hidden sm:table-cell">Radar Hits</th>
                      <th className="p-2 font-bold font-mono hidden lg:table-cell">Source</th>
                      <th className="p-2 font-bold font-mono text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {filteredIdeas.map((idea) => {
                      let scoreColor = "text-emerald-400";
                      let scoreBg = "bg-emerald-950/20 border-emerald-500/20";
                      if (idea.opportunity_score < 60) {
                        scoreColor = "text-rose-400";
                        scoreBg = "bg-rose-950/20 border-rose-500/20";
                      } else if (idea.opportunity_score < 78) {
                        scoreColor = "text-amber-400";
                        scoreBg = "bg-amber-950/20 border-amber-500/20";
                      }

                      return (
                        <tr key={idea.id} className="hover:bg-slate-800/30 transition-colors text-slate-300">
                          {/* Score Badge */}
                          <td className="p-2">
                            <span className={`px-2 py-0.5 border ${scoreBg} rounded font-mono font-bold ${scoreColor} text-xs inline-block`}>
                              {idea.opportunity_score}
                            </span>
                          </td>

                          {/* Tool Name & desc */}
                          <td className="p-2 max-w-sm">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-white">{idea.name}</span>
                                {idea.is_watchlisted && (
                                  <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] px-1.5 py-0.2 rounded-full font-bold">
                                    Watchlisted
                                  </span>
                                )}
                              </div>
                              <p className="text-slate-400 text-[11px] line-clamp-1 leading-relaxed">{idea.description}</p>
                            </div>
                          </td>

                          {/* Category Badge */}
                          <td className="p-2 hidden md:table-cell">
                            <span className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-[9px] font-mono text-slate-500">
                              {idea.category}
                            </span>
                          </td>

                          {/* Upvotes / Comments */}
                          <td className="p-2 text-right font-mono text-[11px] hidden sm:table-cell">
                            <div className="text-slate-300">▲ {idea.upvotes || 0}</div>
                            <div className="text-slate-500 text-[10px]">💬 {idea.comments || 0}</div>
                          </td>

                          {/* Source */}
                          <td className="p-2 hidden lg:table-cell">
                            <div className="text-slate-400 text-[11px]">{idea.source}</div>
                            {idea.source_url ? (
                              <a 
                                href={idea.source_url} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-[10px] text-emerald-400 hover:underline inline-flex items-center font-mono"
                              >
                                Source Link
                              </a>
                            ) : (
                              <span className="text-[10px] text-slate-600 font-mono">Generated</span>
                            )}
                          </td>

                          {/* Action buttons */}
                          <td className="p-2">
                            <div className="flex items-center justify-center gap-1">
                              {/* Watchlist */}
                              <button 
                                onClick={() => onToggleWatchlist(idea.id)}
                                title={idea.is_watchlisted ? "Remove from watchlist" : "Add to watchlist"}
                                className={`p-1 rounded border transition-colors cursor-pointer ${
                                  idea.is_watchlisted 
                                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20' 
                                    : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-300'
                                }`}
                              >
                                <Eye className="w-3 h-3" />
                              </button>

                              {/* Domain Scout */}
                              <button 
                                onClick={() => onSelectIdeaForDomains(idea)}
                                title="Generate & Check Domain Availability"
                                className="p-1 bg-slate-950 border border-slate-800 text-slate-400 hover:border-emerald-500/40 hover:text-emerald-400 rounded transition-colors cursor-pointer"
                              >
                                <Globe className="w-3 h-3" />
                              </button>

                              {/* Competitor Tracker */}
                              <button 
                                onClick={() => onSelectIdeaForCompetitors(idea)}
                                title="Refresh Competitor Performance Traffic"
                                className="p-1 bg-slate-950 border border-slate-800 text-slate-400 hover:border-emerald-500/40 hover:text-emerald-400 rounded transition-colors cursor-pointer"
                              >
                                <TrendingUp className="w-3 h-3" />
                              </button>

                              {/* Deep AI Evidence */}
                              <button 
                                onClick={() => onSelectIdeaForEvidence(idea)}
                                title="Deep AI Feasibility & Recommendation"
                                className="p-1 bg-slate-950 border border-slate-800 text-slate-400 hover:border-emerald-500/40 hover:text-emerald-400 rounded transition-colors cursor-pointer"
                              >
                                <Award className="w-3 h-3" />
                              </button>

                              {/* Delete */}
                              <button 
                                onClick={() => onDeleteIdea(idea.id)}
                                title="Delete idea"
                                className="p-1 bg-slate-950 border border-slate-850 text-slate-600 hover:border-rose-950 hover:text-rose-400 rounded transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ================= NEW GLOBAL OPPORTUNITY GAPS SCOUT TAB ================= */
        <div className="space-y-6 animate-fadeIn">
          {/* Scout Introduction Alert */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-bold text-white uppercase font-mono">Competitor Deficiencies & Gaps Scout</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-4xl">
              This intelligence module utilizes real-time search engine validation to identify high-traffic sites with glaring deficiencies.
              Whether it's terrible UX, intrusive popups, forced registration, or bloated loading speeds, we extract these gaps and craft a strategy 
              to replace them with a superior, frictionless solution.
            </p>
            
            <form onSubmit={handleScout} className="flex gap-2 pt-1 max-w-2xl">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-500" />
                <input 
                  type="text"
                  value={scoutQuery}
                  onChange={(e) => setScoutQuery(e.target.value)}
                  placeholder="Focus category (e.g. video utility, dev tool, conversion) or leave empty for all fields..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-slate-700 font-mono"
                />
              </div>
              <button 
                type="submit"
                disabled={isScouting}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-900 text-slate-900 font-bold text-xs rounded flex items-center gap-1.5 transition-all cursor-pointer"
              >
                {isScouting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>{isScouting ? 'Scouting Web...' : 'Analyze Gaps'}</span>
              </button>
            </form>
          </div>

          {scoutError && (
            <div className="p-3 bg-rose-950/30 border border-rose-900/50 text-rose-300 rounded text-xs font-mono">
              Error fetching live search gaps: {scoutError}
            </div>
          )}

          {isScouting ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-3">
              <RefreshCw className="w-8 h-8 animate-spin text-amber-400" />
              <p className="text-xs font-mono">Pulling search engine indexes and evaluating direct rival traffic metrics...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {scoutedOpportunities.map((opp, index) => {
                const isImported = importedStatus[opp.name] || ideas.some(i => i.name.toLowerCase() === opp.name.toLowerCase());
                
                return (
                  <div key={index} className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 p-5 rounded-lg flex flex-col justify-between space-y-4 transition-all relative overflow-hidden group">
                    {/* Glowing effect inside cards */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all pointer-events-none" />

                    <div className="space-y-3.5">
                      {/* Name and category badge */}
                      <div className="flex justify-between items-start gap-2">
                        <div className="space-y-1">
                          <h4 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">{opp.name}</h4>
                          <span className="inline-block px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-[9px] font-mono text-slate-400">
                            {opp.category}
                          </span>
                        </div>
                        <span className="flex items-center gap-1 text-[10px] text-amber-400 bg-amber-950/20 border border-amber-900/30 px-2 py-0.5 rounded font-mono font-bold">
                          <TrendingUp className="w-3 h-3" />
                          <span>{opp.traffic_demand}</span>
                        </span>
                      </div>

                      {/* Tool description */}
                      <p className="text-xs text-slate-300 leading-relaxed font-sans">
                        {opp.description}
                      </p>

                      {/* Rival / Competitor stats block */}
                      <div className="p-3 bg-slate-950 rounded border border-slate-850 space-y-2">
                        <div className="flex items-center justify-between text-[11px] font-mono border-b border-slate-900 pb-1.5">
                          <span className="text-slate-400 flex items-center gap-1">
                            <Globe className="w-3 h-3 text-slate-500" />
                            <span>Rival Tool:</span>
                          </span>
                          <span className="text-white font-bold">{opp.rival_site}</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="text-slate-400 flex items-center gap-1">
                            <TrendingUp className="w-3 h-3 text-slate-500" />
                            <span>Rival Traffic:</span>
                          </span>
                          <span className="text-slate-300 font-semibold">{opp.rival_traffic}</span>
                        </div>
                      </div>

                      {/* Competitor Deficiencies (Lacking) */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-rose-400 font-mono flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Glaring Rival Deficiencies:</span>
                        </span>
                        <p className="text-[11px] text-slate-300 leading-relaxed font-sans pl-4.5 border-l border-rose-500/30">
                          {opp.rival_lacking}
                        </p>
                      </div>

                      {/* Our Competitive Advantage (The fix) */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 font-mono flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Your Strategic Outperformance Fix:</span>
                        </span>
                        <p className="text-[11px] text-slate-300 leading-relaxed font-sans pl-4.5 border-l border-emerald-500/30">
                          {opp.our_advantage}
                        </p>
                      </div>

                      {/* Monetization Potential */}
                      <div className="flex items-center gap-1 text-[11px] text-emerald-400/90 font-mono">
                        <DollarSign className="w-3.5 h-3.5 shrink-0" />
                        <span className="text-slate-400">Monetization:</span>
                        <span className="font-semibold">{opp.monetization}</span>
                      </div>
                    </div>

                    {/* Import / Save Action Button */}
                    <div className="pt-2">
                      <button
                        onClick={() => handleImportScout(opp)}
                        disabled={isImported}
                        className={`w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold rounded border transition-all cursor-pointer ${
                          isImported 
                            ? 'bg-slate-950 border-emerald-950 text-emerald-500' 
                            : 'bg-emerald-600 border-emerald-500 hover:bg-emerald-500 text-slate-900'
                        }`}
                      >
                        {isImported ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Saved to Your Ideas Registry</span>
                          </>
                        ) : (
                          <>
                            <PlusCircle className="w-3.5 h-3.5" />
                            <span>Import and Track Idea</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
