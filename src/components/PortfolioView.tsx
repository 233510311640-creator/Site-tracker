import React, { useState } from 'react';
import { MySite } from '../types.js';
import { 
  Briefcase, 
  Plus, 
  Trash2, 
  Edit, 
  TrendingUp, 
  DollarSign, 
  Award, 
  Settings, 
  AlertCircle,
  Code,
  Globe,
  Upload,
  Check
} from 'lucide-react';

interface PortfolioViewProps {
  mySites: MySite[];
  onAddSite: (site: Omit<MySite, 'id'>) => void;
  onUpdateSite: (id: number, site: Partial<MySite>) => void;
  onDeleteSite: (id: number) => void;
}

export default function PortfolioView({
  mySites,
  onAddSite,
  onUpdateSite,
  onDeleteSite
}: PortfolioViewProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSiteId, setEditingSiteId] = useState<number | null>(null);

  // Form Fields
  const [domain, setDomain] = useState('');
  const [toolName, setToolName] = useState('');
  const [launchDate, setLaunchDate] = useState('');
  const [techStackInput, setTechStackInput] = useState('');
  const [monetization, setMonetization] = useState('AdSense');
  const [monthlyTraffic, setMonthlyTraffic] = useState('0');
  const [monthlyRevenue, setMonthlyRevenue] = useState('0');
  const [githubRepo, setGithubRepo] = useState('');
  const [status, setStatus] = useState<'Active' | 'Under Development' | 'Archived'>('Active');

  // Edit Fields (for inline updates)
  const [editTraffic, setEditTraffic] = useState('');
  const [editRevenue, setEditRevenue] = useState('');

  // CSV Import State
  const [csvRawText, setCsvRawText] = useState('');
  const [showCsvImporter, setShowCsvImporter] = useState(false);
  const [csvImportMessage, setCsvImportMessage] = useState<string | null>(null);

  const handleSubmitAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!domain || !toolName) return;

    onAddSite({
      domain: domain.trim().toLowerCase(),
      tool_name: toolName.trim(),
      launch_date: launchDate || new Date().toISOString().split('T')[0],
      tech_stack: techStackInput.split(',').map(s => s.trim()).filter(Boolean),
      monetization,
      monthly_traffic: Number(monthlyTraffic) || 0,
      monthly_revenue: Number(monthlyRevenue) || 0,
      github_repo: githubRepo.trim(),
      status
    });

    // Reset Form
    setDomain('');
    setToolName('');
    setLaunchDate('');
    setTechStackInput('');
    setMonetization('AdSense');
    setMonthlyTraffic('0');
    setMonthlyRevenue('0');
    setGithubRepo('');
    setStatus('Active');
    setShowAddForm(false);
  };

  const handleUpdateStats = (id: number) => {
    onUpdateSite(id, {
      monthly_traffic: Number(editTraffic) || 0,
      monthly_revenue: Number(editRevenue) || 0
    });
    setEditingSiteId(null);
  };

  const handleImportCSV = (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvRawText.trim()) return;

    try {
      // Parse CSV: Expecting columns: domain, monthly_traffic, monthly_revenue
      const lines = csvRawText.split('\n');
      let successCount = 0;

      lines.forEach(line => {
        const parts = line.split(',').map(p => p.trim());
        if (parts.length >= 3) {
          const targetDomain = parts[0].toLowerCase();
          const traffic = Number(parts[1]);
          const revenue = Number(parts[2]);

          if (targetDomain && !isNaN(traffic) && !isNaN(revenue)) {
            const matchedSite = mySites.find(s => s.domain.toLowerCase() === targetDomain);
            if (matchedSite) {
              onUpdateSite(matchedSite.id, {
                monthly_traffic: traffic,
                monthly_revenue: revenue
              });
              successCount++;
            }
          }
        }
      });

      setCsvImportMessage(`Import Successful! Updated stats for ${successCount} properties.`);
      setCsvRawText('');
      setTimeout(() => setCsvImportMessage(null), 4000);
    } catch (err) {
      setCsvImportMessage("CSV parsing error. Ensure the format is: domain, traffic, revenue");
    }
  };

  // Portfolio calculations
  const totalSites = mySites.length;
  const totalRevenue = mySites.reduce((sum, s) => sum + s.monthly_revenue, 0);
  const totalTraffic = mySites.reduce((sum, s) => sum + s.monthly_traffic, 0);

  // Best/Worst Performing properties
  const sortedByTraffic = [...mySites].sort((a, b) => b.monthly_traffic - a.monthly_traffic);
  const bestPerforming = sortedByTraffic[0] || null;
  const worstPerforming = sortedByTraffic.length > 1 ? sortedByTraffic[sortedByTraffic.length - 1] : null;

  // Generate actionable next steps
  const actionableSuggestions: string[] = [];
  mySites.forEach(site => {
    if (site.status === 'Active' && site.monthly_traffic > 1000 && site.monthly_revenue === 0) {
      actionableSuggestions.push(`"${site.tool_name}" (${site.domain}) has active traffic but $0 revenue. Deploy Google AdSense or Carbon Ads script.`);
    }
    if (site.monthly_traffic < 100 && site.status === 'Active') {
      actionableSuggestions.push(`"${site.tool_name}" gets under 100 visits. Write an SEO optimization guide or share on r/SideProject to boost organic metrics.`);
    }
    if (site.status === 'Under Development') {
      actionableSuggestions.push(`"${site.tool_name}" is currently under development. Finish the MVP and buy the domain to launch.`);
    }
  });

  return (
    <div id="portfolio-view" className="space-y-4">
      {/* Title Header with compact buttons */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div />
        <div className="flex items-center gap-1.5 ml-auto">
          <button 
            onClick={() => setShowCsvImporter(!showCsvImporter)}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-755 text-slate-300 text-xs font-semibold rounded border border-slate-700 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import CSV Stats</span>
          </button>
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-900 text-xs font-bold rounded transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Property</span>
          </button>
        </div>
      </div>

      {/* CSV Import Panel Drawer */}
      {showCsvImporter && (
        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-lg space-y-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">CSV Bulk Traffic Updater</h3>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">Format: domain_name, monthly_traffic_visits, monthly_revenue_usd</p>
          </div>
          <form onSubmit={handleImportCSV} className="space-y-2">
            <textarea 
              rows={3}
              value={csvRawText}
              onChange={(e) => setCsvRawText(e.target.value)}
              placeholder="easyregexexplainer.com, 5400, 45&#10;saasbreakeven.com, 1200, 15"
              className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-xs text-slate-200 placeholder-slate-700 focus:outline-none focus:border-slate-700 font-mono"
            />
            {csvImportMessage && (
              <p className="text-[10px] font-mono text-emerald-400 font-semibold">{csvImportMessage}</p>
            )}
            <div className="flex justify-end gap-1.5">
              <button 
                type="button"
                onClick={() => setShowCsvImporter(false)}
                className="px-2.5 py-1 bg-slate-950 border border-slate-850 hover:bg-slate-900 text-slate-400 rounded text-xxs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 rounded text-xxs font-bold cursor-pointer"
              >
                Apply CSV Bulk Updates
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add New Property Form Modal/Accordion */}
      {showAddForm && (
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg">
          <div className="border-b border-slate-800 pb-2 mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-emerald-400" />
              <span>Add Live Site Property</span>
            </h3>
          </div>
          <form onSubmit={handleSubmitAdd} className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="space-y-1">
              <label className="block text-slate-500 font-mono text-[10px] font-bold">DOMAIN ADDRESS</label>
              <input 
                type="text" 
                required 
                value={domain} 
                onChange={(e) => setDomain(e.target.value)}
                placeholder="e.g. mywavegenerator.com"
                className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 focus:outline-none focus:border-slate-700 font-mono text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-slate-500 font-mono text-[10px] font-bold">MICRO-TOOL NAME</label>
              <input 
                type="text" 
                required 
                value={toolName} 
                onChange={(e) => setToolName(e.target.value)}
                placeholder="e.g. SVG Wave Builder"
                className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 focus:outline-none focus:border-slate-700 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="block text-slate-500 font-mono text-[10px] font-bold">LAUNCH DATE</label>
                <input 
                  type="date" 
                  value={launchDate} 
                  onChange={(e) => setLaunchDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-200 focus:outline-none focus:border-slate-700 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-slate-500 font-mono text-[10px] font-bold">MONETIZATION</label>
                <input 
                  type="text" 
                  value={monetization} 
                  onChange={(e) => setMonetization(e.target.value)}
                  placeholder="e.g. AdSense, Freemium"
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 focus:outline-none focus:border-slate-700 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="block text-slate-500 font-mono text-[10px] font-bold">MONTHLY TRAFFIC</label>
                <input 
                  type="number" 
                  value={monthlyTraffic} 
                  onChange={(e) => setMonthlyTraffic(e.target.value)}
                  placeholder="0"
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 focus:outline-none focus:border-slate-700 font-mono text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-slate-500 font-mono text-[10px] font-bold">MONTHLY REVENUE ($)</label>
                <input 
                  type="number" 
                  value={monthlyRevenue} 
                  onChange={(e) => setMonthlyRevenue(e.target.value)}
                  placeholder="0"
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 focus:outline-none focus:border-slate-700 font-mono text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-slate-500 font-mono text-[10px] font-bold">TECH STACK (COMMA SEPARATED)</label>
              <input 
                type="text" 
                value={techStackInput} 
                onChange={(e) => setTechStackInput(e.target.value)}
                placeholder="React, Tailwind, Zustand"
                className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 focus:outline-none focus:border-slate-700 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-slate-500 font-mono text-[10px] font-bold">GITHUB REPO URL (OPTIONAL)</label>
              <input 
                type="text" 
                value={githubRepo} 
                onChange={(e) => setGithubRepo(e.target.value)}
                placeholder="github.com/username/project"
                className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 focus:outline-none focus:border-slate-700 font-mono text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-slate-500 font-mono text-[10px] font-bold">STATUS</label>
              <select 
                value={status} 
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 focus:outline-none focus:border-slate-700 text-xs"
              >
                <option value="Active">Active</option>
                <option value="Under Development">Under Development</option>
                <option value="Archived">Archived</option>
              </select>
            </div>

            <div className="md:col-span-2 flex justify-end gap-1.5 pt-1.5">
              <button 
                type="button" 
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 bg-slate-950 border border-slate-800 hover:bg-slate-900 text-slate-400 rounded font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-900 font-bold rounded cursor-pointer"
              >
                Add Live Site
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Aggregate Stats Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Total sites */}
        <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[9px] text-slate-500 font-mono font-bold uppercase">PORTFOLIO PROPERTIES</span>
            <div className="text-lg font-bold text-slate-200 font-mono">{totalSites} sites</div>
          </div>
          <div className="p-1.5 bg-slate-950 rounded text-indigo-400 border border-slate-800">
            <Globe className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Best Performer */}
        <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg flex items-center justify-between">
          <div className="space-y-0.5 max-w-[80%]">
            <span className="text-[9px] text-slate-500 font-mono font-bold uppercase">TOP PERFORMER (TRAFFIC)</span>
            <div className="text-xs font-bold text-slate-200 truncate">
              {bestPerforming ? bestPerforming.tool_name : 'No live properties'}
            </div>
            {bestPerforming && (
              <span className="text-[10px] font-mono text-slate-500 block">
                {bestPerforming.monthly_traffic.toLocaleString()} monthly visits
              </span>
            )}
          </div>
          <div className="p-1.5 bg-slate-950 rounded text-emerald-400 border border-slate-800">
            <TrendingUp className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Total revenue */}
        <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[9px] text-slate-500 font-mono font-bold uppercase">PORTFOLIO TOTAL REVENUE</span>
            <div className="text-lg font-bold text-emerald-400 font-mono">${totalRevenue}/mo</div>
          </div>
          <div className="p-1.5 bg-slate-950 rounded text-emerald-400 border border-slate-800">
            <DollarSign className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* Suggestion list */}
      {actionableSuggestions.length > 0 && (
        <div className="bg-amber-950/20 border border-amber-900/40 p-3 rounded-lg space-y-1.5">
          <div className="flex items-center gap-1.5 text-amber-400 font-mono text-[11px] font-bold uppercase">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Recommended Next Actions</span>
          </div>
          <ul className="list-disc list-inside text-[10px] text-slate-400 space-y-1 pl-1 leading-relaxed">
            {actionableSuggestions.slice(0, 3).map((s, idx) => (
              <li key={idx} className="marker:text-amber-500">{s}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Grid of properties */}
      <div id="portfolio-sites-grid" className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {mySites.length === 0 ? (
          <div className="md:col-span-2 text-center py-8 bg-slate-900 border border-slate-800 rounded-lg text-slate-500 font-mono text-xs">
            Your live property tracker is currently empty. Click "Add Property" above to record your first asset!
          </div>
        ) : (
          mySites.map((site) => {
            const isEditing = editingSiteId === site.id;
            
            let statusColor = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
            if (site.status === 'Under Development') {
              statusColor = "text-amber-400 bg-amber-500/10 border-amber-500/20";
            } else if (site.status === 'Archived') {
              statusColor = "text-slate-400 bg-slate-950 border-slate-800";
            }

            return (
              <div key={site.id} className="bg-slate-900 border border-slate-800 rounded-lg p-3.5 space-y-3">
                {/* Header row */}
                <div className="flex justify-between items-start border-b border-slate-800 pb-2">
                  <div>
                    <h3 className="font-bold text-slate-100 text-xs flex items-center gap-1.5 flex-wrap">
                      {site.tool_name}
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${statusColor}`}>
                        {site.status.toUpperCase()}
                      </span>
                    </h3>
                    <a 
                      href={`https://${site.domain}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-[10px] text-emerald-400 hover:underline inline-flex items-center gap-1 font-mono mt-0.5"
                    >
                      <span>{site.domain}</span>
                      <Globe className="w-2.5 h-2.5" />
                    </a>
                  </div>

                  <div className="flex gap-1">
                    <button 
                      onClick={() => {
                        if (isEditing) {
                          setEditingSiteId(null);
                        } else {
                          setEditingSiteId(site.id);
                          setEditTraffic(site.monthly_traffic.toString());
                          setEditRevenue(site.monthly_revenue.toString());
                        }
                      }}
                      className="p-1 bg-slate-950 border border-slate-850 hover:border-slate-700 text-slate-400 rounded cursor-pointer"
                      title="Update Stats"
                    >
                      <Edit className="w-3 h-3" />
                    </button>
                    <button 
                      onClick={() => onDeleteSite(site.id)}
                      className="p-1 bg-slate-950 border border-slate-850 hover:border-rose-950 text-slate-600 hover:text-rose-400 rounded cursor-pointer"
                      title="Delete Property"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Info row */}
                <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                  {/* Traffic stat block */}
                  <div className="p-2 bg-slate-950 border border-slate-850 rounded">
                    <span className="text-[9px] text-slate-500 block uppercase font-bold">MONTHLY TRAFFIC</span>
                    {isEditing ? (
                      <input 
                        type="number"
                        value={editTraffic}
                        onChange={(e) => setEditTraffic(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 text-xs font-mono mt-1 focus:outline-none"
                      />
                    ) : (
                      <span className="text-xs font-bold text-slate-200 mt-0.5 block">
                        {site.monthly_traffic.toLocaleString()} visits
                      </span>
                    )}
                  </div>

                  {/* Revenue stat block */}
                  <div className="p-2 bg-slate-950 border border-slate-850 rounded">
                    <span className="text-[9px] text-slate-500 block uppercase font-bold">MONTHLY REVENUE</span>
                    {isEditing ? (
                      <input 
                        type="number"
                        value={editRevenue}
                        onChange={(e) => setEditRevenue(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 text-xs font-mono mt-1 focus:outline-none"
                      />
                    ) : (
                      <span className="text-xs font-bold text-emerald-400 mt-0.5 block">
                        ${site.monthly_revenue}/mo
                      </span>
                    )}
                  </div>
                </div>

                {/* Tech tags */}
                {site.tech_stack && site.tech_stack.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[9px] text-slate-600 font-mono block font-bold uppercase">BUILT WITH</span>
                    <div className="flex flex-wrap gap-1">
                      {site.tech_stack.map(tech => (
                        <span key={tech} className="px-1.5 py-0.2 bg-slate-950 border border-slate-850 rounded text-[9px] text-slate-400 font-mono">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Expand controls for editing */}
                {isEditing && (
                  <div className="flex justify-end gap-1 border-t border-slate-850 pt-2">
                    <button 
                      onClick={() => setEditingSiteId(null)}
                      className="px-2 py-0.5 bg-slate-950 border border-slate-800 text-slate-500 hover:text-slate-300 text-xxs font-bold rounded cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => handleUpdateStats(site.id)}
                      className="px-2 py-0.5 bg-slate-800 hover:bg-slate-750 text-emerald-400 border border-slate-700 text-xxs font-bold rounded flex items-center gap-1 cursor-pointer"
                    >
                      <Check className="w-2.5 h-2.5" />
                      <span>Save</span>
                    </button>
                  </div>
                )}

                {/* Meta details footer */}
                <div className="flex justify-between items-center text-[9px] text-slate-500 pt-1 border-t border-slate-850/40 font-mono">
                  <span>Launched: {site.launch_date}</span>
                  {site.github_repo ? (
                    <a 
                      href={`https://${site.github_repo}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-slate-400 hover:text-emerald-400 flex items-center gap-1"
                    >
                      <Code className="w-3 h-3" />
                      <span>Repo</span>
                    </a>
                  ) : (
                    <span>Private Repo</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
