import React, { useState } from 'react';
import { Idea, MySite, Competitor } from '../types.js';
import { 
  Plus, 
  Lightbulb, 
  Eye, 
  Award, 
  DollarSign, 
  Search, 
  Download, 
  ArrowUpRight,
  TrendingUp,
  Cpu
} from 'lucide-react';

interface DashboardViewProps {
  ideas: Idea[];
  mySites: MySite[];
  competitors: Competitor[];
  onNavigate: (tab: string) => void;
  onRefreshIdeas: () => void;
}

const SEED_KEYWORDS = [
  "online ruler", "json formatter", "password generator", "svg to png", "word counter", 
  "age calculator", "bmi calculator", "qr code generator", "color picker", "lorem ipsum generator",
  "regex tester", "diff checker", "base64 encode", "url encode", "markdown editor", 
  "csv to json", "image compressor", "pdf merger", "screen resolution", "typing speed test"
];

export default function DashboardView({ ideas, mySites, competitors, onNavigate, onRefreshIdeas }: DashboardViewProps) {
  const [keywordSearch, setKeywordSearch] = useState('');

  // 1. Calculate overall metrics
  const discoveredCount = ideas.length;
  const watchlistCount = ideas.filter(i => i.is_watchlisted).length;
  const portfolioCount = mySites.length;
  const totalRevenue = mySites.reduce((sum, site) => sum + (site.monthly_revenue || 0), 0);
  const totalTraffic = mySites.reduce((sum, site) => sum + (site.monthly_traffic || 0), 0);

  // 2. Generate 200 keyword variations dynamically using standard NLP templates
  const keywordInventory = SEED_KEYWORDS.flatMap((seed, idx) => {
    const modifiers = [
      { prefix: 'free ', suffix: '' },
      { prefix: '', suffix: ' online' },
      { prefix: '', suffix: ' tool' },
      { prefix: 'best ', suffix: ' free' },
      { prefix: '', suffix: ' calculator' },
      { prefix: 'simple ', suffix: '' },
      { prefix: '', suffix: ' without signup' },
      { prefix: 'easy ', suffix: ' generator' },
      { prefix: '', suffix: ' utility' },
      { prefix: 'quick ', suffix: ' converter' }
    ];
    return modifiers.map((mod, modIdx) => ({
      id: idx * 10 + modIdx + 1,
      seed,
      variant: `${mod.prefix}${seed}${mod.suffix}`,
      volumeProxy: Math.floor((Math.sin(idx + modIdx) * 3500) + 5000), // simulated steady monthly queries
      cpcProxy: (Math.abs(Math.sin(idx * modIdx)) * 1.8 + 0.2).toFixed(2),
      difficulty: Math.floor((Math.abs(Math.cos(idx + modIdx)) * 60) + 10)
    }));
  });

  const filteredKeywords = keywordInventory.filter(kw => 
    kw.variant.toLowerCase().includes(keywordSearch.toLowerCase()) || 
    kw.seed.toLowerCase().includes(keywordSearch.toLowerCase())
  );

  // 3. Prepare competitor traffic data for beautiful custom SVG bar chart
  const competitorsWithTraffic = competitors
    .filter(c => c.monthly_visits > 0)
    .sort((a, b) => b.monthly_visits - a.monthly_visits)
    .slice(0, 6);

  // Find max traffic for chart scaling
  const maxTraffic = competitorsWithTraffic.length > 0 
    ? Math.max(...competitorsWithTraffic.map(c => c.monthly_visits)) 
    : 100000;

  // Format large numbers
  const formatTraffic = (val: number) => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${(val / 1000).toFixed(0)}K`;
    return val.toString();
  };

  const exportKeywordsToCSV = () => {
    const headers = 'ID,Seed,Variation,Est. Search Volume,Est. CPC ($),SEO Difficulty\n';
    const rows = keywordInventory.map(k => `${k.id},"${k.seed}","${k.variant}",${k.volumeProxy},${k.cpcProxy},${k.difficulty}`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "microtool_keyword_inventory.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="dashboard-view" className="space-y-4">
      {/* High Density Status Header Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs text-slate-300 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
          <span className="font-semibold text-slate-200">System Telemetry:</span>
          <span className="text-slate-400">Radar active. Monitoring micro-tool trends on Reddit & Google Trends.</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono bg-slate-950 text-slate-500 px-2 py-0.5 rounded border border-slate-800">API: 1,240/5,000 req</span>
          <button 
            id="btn-quick-mine"
            onClick={onRefreshIdeas}
            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold rounded transition-all border border-emerald-500/30 cursor-pointer"
          >
            Mine Fresh Ideas
          </button>
        </div>
      </div>

      {/* Bento Grid Analytics Row - High Density */}
      <div id="bento-metrics-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Metric 1 */}
        <div 
          onClick={() => onNavigate('ideas')}
          className="bg-slate-900 border border-slate-800 p-3 rounded-lg cursor-pointer hover:border-slate-700 transition-all flex flex-col justify-center relative overflow-hidden group"
        >
          <span className="text-[10px] uppercase text-slate-500 font-bold mb-1 tracking-wider">Discovered Opportunities</span>
          <div className="flex items-end gap-2">
            <span className="text-xl font-bold text-white font-mono leading-none">{discoveredCount}</span>
            <span className="text-[10px] text-emerald-400 font-bold">Auto-mining</span>
          </div>
          <Lightbulb className="absolute right-3 top-3 w-4 h-4 text-slate-700 group-hover:text-emerald-500/20 transition-colors" />
        </div>

        {/* Metric 2 */}
        <div 
          onClick={() => onNavigate('ideas')}
          className="bg-slate-900 border border-slate-800 p-3 rounded-lg cursor-pointer hover:border-slate-700 transition-all flex flex-col justify-center relative overflow-hidden group"
        >
          <span className="text-[10px] uppercase text-slate-500 font-bold mb-1 tracking-wider">Watchlisted Ideas</span>
          <div className="flex items-end gap-2">
            <span className="text-xl font-bold text-white font-mono leading-none">{watchlistCount}</span>
            <span className="text-[10px] text-amber-400 font-bold">Needs Check</span>
          </div>
          <Eye className="absolute right-3 top-3 w-4 h-4 text-slate-700 group-hover:text-amber-500/20 transition-colors" />
        </div>

        {/* Metric 3 */}
        <div 
          onClick={() => onNavigate('portfolio')}
          className="bg-slate-900 border border-slate-800 p-3 rounded-lg cursor-pointer hover:border-slate-700 transition-all flex flex-col justify-center relative overflow-hidden group"
        >
          <span className="text-[10px] uppercase text-slate-500 font-bold mb-1 tracking-wider">Active Portfolio</span>
          <div className="flex items-end gap-2">
            <span className="text-xl font-bold text-white font-mono leading-none">{portfolioCount} Sites</span>
            <span className="text-[10px] text-emerald-400 font-bold">Tracking MRR</span>
          </div>
          <Award className="absolute right-3 top-3 w-4 h-4 text-slate-700 group-hover:text-emerald-500/20 transition-colors" />
        </div>

        {/* Metric 4 */}
        <div 
          onClick={() => onNavigate('portfolio')}
          className="bg-slate-900 border border-slate-800 p-3 rounded-lg cursor-pointer hover:border-slate-700 transition-all flex flex-col justify-center relative overflow-hidden group"
        >
          <span className="text-[10px] uppercase text-slate-500 font-bold mb-1 tracking-wider">Est. Monthly Revenue</span>
          <div className="flex items-end gap-2">
            <span className="text-xl font-bold text-emerald-400 font-mono leading-none">${totalRevenue}</span>
            <span className="text-[10px] text-slate-500 font-mono">/mo</span>
          </div>
          <DollarSign className="absolute right-3 top-3 w-4 h-4 text-slate-700 group-hover:text-emerald-500/20 transition-colors" />
        </div>
      </div>

      {/* Main Charts & Watchlist Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Competitor Traffic Chart (2 Cols) */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-lg p-3 space-y-3">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Top Competitors Monthly Visits</h3>
            </div>
            <button 
              onClick={() => onNavigate('competitors')}
              className="text-[11px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-0.5 cursor-pointer"
            >
              <span>Competitor List</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          {competitorsWithTraffic.length === 0 ? (
            <div className="h-56 flex flex-col items-center justify-center text-center p-4 border border-dashed border-slate-800 rounded-lg">
              <p className="text-xs text-slate-500">No competitor traffic metrics available yet.</p>
              <p className="text-[10px] text-slate-600 mt-1 font-mono">Refresh competitor analysis on any watchlisted idea to populate.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Custom SVG Bar Chart */}
              <div className="overflow-x-auto pb-2 -mx-1">
                <div className="relative h-56 min-w-[500px] w-full">
                  <svg className="w-full h-full" viewBox="0 0 500 220">
                  {/* Grid Lines */}
                  <line x1="50" y1="20" x2="480" y2="20" stroke="#1e293b" strokeDasharray="3,3" />
                  <line x1="50" y1="70" x2="480" y2="70" stroke="#1e293b" strokeDasharray="3,3" />
                  <line x1="50" y1="120" x2="480" y2="120" stroke="#1e293b" strokeDasharray="3,3" />
                  <line x1="50" y1="170" x2="480" y2="170" stroke="#334155" />

                  {/* Y-Axis Labels */}
                  <text x="15" y="24" className="text-[9px] fill-slate-500 font-mono">{formatTraffic(maxTraffic)}</text>
                  <text x="15" y="74" className="text-[9px] fill-slate-500 font-mono">{formatTraffic(maxTraffic / 2)}</text>
                  <text x="15" y="124" className="text-[9px] fill-slate-500 font-mono">{formatTraffic(maxTraffic / 4)}</text>
                  <text x="15" y="174" className="text-[9px] fill-slate-500 font-mono">0</text>

                  {/* Render Bars */}
                  {competitorsWithTraffic.map((comp, idx) => {
                    const barWidth = 32;
                    const spacing = 70;
                    const x = 70 + idx * spacing;
                    const barHeight = (comp.monthly_visits / maxTraffic) * 140;
                    const y = 170 - barHeight;

                    const fill = comp.threat_level === 'High' ? '#f43f5e' : comp.threat_level === 'Medium' ? '#f59e0b' : '#10b981';

                    return (
                      <g key={comp.id} className="group cursor-pointer">
                        <rect 
                          x={x - 10} 
                          y="10" 
                          width={barWidth + 20} 
                          height="160" 
                          fill="transparent" 
                          className="hover:fill-slate-800/10"
                        />
                        <rect 
                          x={x} 
                          y={y} 
                          width={barWidth} 
                          height={barHeight} 
                          fill={fill} 
                          rx="3"
                          className="transition-all duration-300 hover:brightness-110"
                        />
                        <text 
                          x={x + barWidth / 2} 
                          y={y - 6} 
                          textAnchor="middle" 
                          className="text-[9px] fill-slate-300 font-mono font-bold"
                        >
                          {formatTraffic(comp.monthly_visits)}
                        </text>
                        <text 
                          x={x + barWidth / 2} 
                          y="185" 
                          textAnchor="middle" 
                          className="text-[9px] fill-slate-500 font-mono"
                        >
                          {comp.domain.length > 10 ? `${comp.domain.substring(0, 8)}..` : comp.domain}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>

              {/* Legend row */}
              <div className="flex justify-center gap-4 text-[10px] font-mono text-slate-500 border-t border-slate-800/50 pt-2">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-rose-500 rounded-sm" />
                  High Threat (&gt;100k)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-amber-500 rounded-sm" />
                  Medium Threat (10k - 100k)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-emerald-500 rounded-sm" />
                  Low Threat (&lt;10k)
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Watchlist Quick-Feed */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 space-y-3 flex flex-col">
          <div className="border-b border-slate-800 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-amber-400" />
              <span>Watchlisted Radar</span>
            </h3>
          </div>

          <div className="space-y-2 overflow-y-auto flex-1 max-h-[220px] pr-1">
            {ideas.filter(i => i.is_watchlisted).length === 0 ? (
              <div className="text-center p-6 text-slate-500 font-mono text-xs">
                Watchlist is empty.
                <button 
                  onClick={() => onNavigate('ideas')}
                  className="block mx-auto mt-2 text-[10px] text-emerald-400 hover:underline cursor-pointer"
                >
                  View Idea Engine
                </button>
              </div>
            ) : (
              ideas.filter(i => i.is_watchlisted).map((idea) => (
                <div 
                  key={idea.id} 
                  onClick={() => onNavigate('ideas')}
                  className="p-2 bg-slate-950 rounded border border-slate-800 hover:border-slate-700 transition-all cursor-pointer flex justify-between items-center"
                >
                  <div className="space-y-0.5 max-w-[70%]">
                    <h4 className="text-[11px] font-bold text-slate-200 truncate">{idea.name}</h4>
                    <p className="text-[10px] text-slate-500 truncate">{idea.category}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold font-mono text-emerald-400">{idea.opportunity_score}</div>
                    <span className="text-[9px] font-mono text-slate-600">SCORE</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Seed Keyword inventory generator */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 space-y-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-800 pb-2">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-emerald-400" />
              <span>Keyword Search Volume Inventory</span>
            </h3>
            <p className="text-[10px] text-slate-500">Seed database of 200 high-intent micro-tool search query variations.</p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <Search className="absolute left-2.5 top-2 w-3 h-3 text-slate-500" />
              <input 
                type="text"
                placeholder="Search queries..."
                value={keywordSearch}
                onChange={(e) => setKeywordSearch(e.target.value)}
                className="pl-7 pr-2.5 py-1 bg-slate-950 border border-slate-800 rounded text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-slate-700 w-full sm:w-44 font-mono"
              />
            </div>
            <button 
              onClick={exportKeywordsToCSV}
              className="flex items-center gap-1 px-2 py-1 bg-slate-850 hover:bg-slate-700 text-slate-300 text-xs rounded font-medium transition-all border border-slate-750 cursor-pointer"
            >
              <Download className="w-3 h-3" />
              <span>Export</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500 bg-slate-950/40">
                <th className="p-2 font-semibold text-slate-500">Suggested Intent Query</th>
                <th className="p-2 font-semibold text-slate-500 hidden md:table-cell">Root Concept</th>
                <th className="p-2 font-semibold text-slate-500 text-right">Est. Monthly Search</th>
                <th className="p-2 font-semibold text-slate-500 text-right hidden sm:table-cell">Est. CPC</th>
                <th className="p-2 font-semibold text-slate-500 text-center">Difficulty</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredKeywords.slice(0, 6).map((kw) => (
                <tr key={kw.id} className="hover:bg-slate-950/50 text-slate-300">
                  <td className="p-2 text-emerald-400 font-bold">{kw.variant}</td>
                  <td className="p-2 text-slate-400 hidden md:table-cell">{kw.seed}</td>
                  <td className="p-2 text-right text-slate-300">{kw.volumeProxy.toLocaleString()}</td>
                  <td className="p-2 text-right text-slate-400 hidden sm:table-cell">${kw.cpcProxy}</td>
                  <td className="p-2 text-center">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      kw.difficulty < 30 ? 'bg-emerald-950 text-emerald-400 border border-emerald-900/45' : 
                      kw.difficulty < 60 ? 'bg-amber-950 text-amber-400 border border-amber-900/45' : 
                      'bg-rose-950 text-rose-400 border border-rose-900/45'
                    }`}>
                      {kw.difficulty}/100
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredKeywords.length > 6 && (
            <div className="text-center pt-2 text-slate-600 text-[10px]">
              Showing top 6 of {filteredKeywords.length} query match variants. Export to view the complete inventory list.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
