import React, { useState, useEffect } from 'react';
import { Idea, DomainCheck } from '../types.js';
import { 
  Globe, 
  Search, 
  Copy, 
  Check, 
  RefreshCw, 
  AlertTriangle,
  HelpCircle,
  TrendingUp,
  ExternalLink
} from 'lucide-react';

interface DomainScoutViewProps {
  ideas: Idea[];
  selectedIdea: Idea | null;
  domainChecks: DomainCheck[];
  onCheckDomain: (domain: string, ideaId: number) => void;
  onBulkCheck: (ideaId: number) => void;
  isChecking: boolean;
}

export default function DomainScoutView({
  ideas,
  selectedIdea,
  domainChecks,
  onCheckDomain,
  onBulkCheck,
  isChecking
}: DomainScoutViewProps) {
  const [currentIdea, setCurrentIdea] = useState<Idea | null>(selectedIdea);
  const [customDomainInput, setCustomDomainInput] = useState('');
  const [copiedDomain, setCopiedDomain] = useState<string | null>(null);

  // Sync selectedIdea state
  useEffect(() => {
    if (selectedIdea) {
      setCurrentIdea(selectedIdea);
    } else if (ideas.length > 0 && !currentIdea) {
      setCurrentIdea(ideas[0]);
    }
  }, [selectedIdea, ideas]);

  // Filter domain checks for current idea
  const filteredChecks = domainChecks.filter(d => d.idea_id === currentIdea?.id);

  // Generate local variations list (even if not checked yet) to display placeholders
  const generatedVariations = currentIdea 
    ? [
        `${currentIdea.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
        `get${currentIdea.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
        `use${currentIdea.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
        `${currentIdea.name.toLowerCase().replace(/[^a-z0-9]/g, '')}tool.com`,
        `${currentIdea.name.toLowerCase().replace(/[^a-z0-9]/g, '')}app.com`
      ]
    : [];

  const handleCustomCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customDomainInput.trim() || !currentIdea) return;
    
    let domain = customDomainInput.trim().toLowerCase();
    if (!domain.includes('.')) {
      domain = `${domain}.com`;
    }
    onCheckDomain(domain, currentIdea.id);
    setCustomDomainInput('');
  };

  const copyToClipboard = (domain: string) => {
    navigator.clipboard.writeText(domain);
    setCopiedDomain(domain);
    setTimeout(() => setCopiedDomain(null), 2000);
  };

  const calculateAgeYears = (creationDateStr?: string) => {
    if (!creationDateStr) return null;
    try {
      const created = new Date(creationDateStr);
      const diffMs = Date.now() - created.getTime();
      const ageY = diffMs / (1000 * 60 * 60 * 24 * 365.25);
      return Math.round(ageY * 10) / 10;
    } catch {
      return null;
    }
  };

  return (
    <div id="domain-scout-view" className="space-y-4">
      {/* Selector and Tools Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column: Selector & Custom Input */}
        <div className="lg:col-span-1 space-y-4">
          {/* Select Idea Panel */}
          <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-lg space-y-3">
            <label className="block text-[10px] font-bold text-slate-500 font-mono tracking-wider">TARGET TOOL OPPORTUNITY</label>
            <select 
              value={currentIdea?.id || ''}
              onChange={(e) => {
                const found = ideas.find(i => i.id === Number(e.target.value));
                if (found) setCurrentIdea(found);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded text-xs text-slate-200 p-2 focus:outline-none focus:border-slate-700 font-mono"
            >
              {ideas.length === 0 ? (
                <option value="">No ideas available</option>
              ) : (
                ideas.map(i => (
                  <option key={i.id} value={i.id}>{i.name} ({i.opportunity_score} pts)</option>
                ))
              )}
            </select>

            {currentIdea && (
              <div className="p-2.5 bg-slate-950 rounded border border-slate-800 text-[10px] text-slate-400 space-y-1 font-mono">
                <span className="font-bold text-slate-300 block">Niche Category:</span>
                <p className="text-slate-400">{currentIdea.category}</p>
                <p className="text-slate-500 italic mt-1 font-sans">"{currentIdea.description}"</p>
              </div>
            )}
          </div>

          {/* Check Custom Domain */}
          <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-lg space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-emerald-400" />
              <span>Manual Check</span>
            </h3>
            <form onSubmit={handleCustomCheck} className="space-y-2">
              <input 
                type="text"
                required
                value={customDomainInput}
                onChange={(e) => setCustomDomainInput(e.target.value)}
                placeholder="e.g. easyformatter.com"
                className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-slate-700 font-mono"
              />
              <button 
                type="submit"
                disabled={isChecking || !currentIdea}
                className="w-full flex items-center justify-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-900 text-emerald-400 border border-slate-700 rounded text-xs font-bold cursor-pointer"
              >
                {isChecking ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Globe className="w-3 h-3" />}
                <span>Check Domain</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Variations Table / Results */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5 space-y-3">
            {/* Header with bulk check */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-800 pb-2">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-emerald-400" />
                  <span>WHOIS Availability Matrix</span>
                </h3>
                <p className="text-[10px] text-slate-500">Automated brand variations for "{currentIdea?.name || 'Selected Idea'}"</p>
              </div>
              
              {currentIdea && (
                <button 
                  onClick={() => onBulkCheck(currentIdea.id)}
                  disabled={isChecking}
                  className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-slate-900 font-bold text-xs rounded transition-all cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${isChecking ? 'animate-spin' : ''}`} />
                  <span>Bulk Check Top 5</span>
                </button>
              )}
            </div>

            {/* Results Grid Table */}
            {!currentIdea ? (
              <div className="text-center py-8 text-slate-500 font-mono text-xs">
                Please select or discover an idea first.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500 bg-slate-950/40">
                      <th className="p-2 font-bold text-slate-500">Suggested Domain</th>
                      <th className="p-2 font-bold text-slate-500">Availability</th>
                      <th className="p-2 font-bold text-slate-500 hidden sm:table-cell">Registrar</th>
                      <th className="p-2 font-bold text-slate-500 text-right">Age</th>
                      <th className="p-2 font-bold text-slate-500 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {generatedVariations.map((domainName) => {
                      const checked = filteredChecks.find(c => c.domain_name.toLowerCase() === domainName.toLowerCase());
                      const ageYears = checked ? calculateAgeYears(checked.creation_date) : null;
                      
                      let statusText = 'Not checked';
                      let statusColor = 'text-slate-500 bg-slate-950/40 border-slate-850';
                      let trStyle = '';
                      
                      if (checked) {
                        if (checked.status === 'Available') {
                          statusText = 'AVAILABLE';
                          statusColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
                          trStyle = 'bg-emerald-500/[0.02]';
                        } else if (checked.status === 'Taken') {
                          statusText = 'TAKEN';
                          statusColor = 'text-rose-400 bg-rose-500/10 border-rose-500/20';
                        } else {
                          statusText = 'UNKNOWN';
                          statusColor = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
                        }
                      }

                      return (
                        <tr key={domainName} className={`hover:bg-slate-800/30 transition-colors text-slate-300 ${trStyle}`}>
                          {/* Domain Name */}
                          <td className="p-2 font-bold text-white">
                            {domainName}
                          </td>

                          {/* Status Badge */}
                          <td className="p-2">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${statusColor}`}>
                              {statusText}
                            </span>
                          </td>

                          {/* Registrar info */}
                          <td className="p-2 text-slate-400 truncate max-w-[110px] hidden sm:table-cell">
                            {checked?.registrar || (checked ? 'No registrar' : '—')}
                          </td>

                          {/* Domain Age / Competitor signal */}
                          <td className="p-2 text-right text-[11px]">
                            {ageYears !== null ? (
                              <div className="space-y-0.5">
                                <span className="text-slate-300 font-bold">{ageYears} yrs</span>
                                {ageYears > 2 && (
                                  <span className="block text-[8px] font-bold text-rose-400 bg-rose-950/20 border border-rose-900/40 px-1 py-0.2 rounded text-center">
                                    Established
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-600">—</span>
                            )}
                          </td>

                          {/* Copy / Single Check trigger */}
                          <td className="p-2">
                            <div className="flex items-center justify-center gap-1">
                              <button 
                                onClick={() => copyToClipboard(domainName)}
                                title="Copy domain name to clipboard"
                                className="p-1 bg-slate-950 border border-slate-850 hover:border-slate-700 text-slate-400 rounded cursor-pointer"
                              >
                                {copiedDomain === domainName ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                              </button>
                              
                              {!checked && (
                                <button 
                                  onClick={() => onCheckDomain(domainName, currentIdea.id)}
                                  disabled={isChecking}
                                  className="p-1 text-emerald-400 hover:underline text-[10px] font-bold cursor-pointer"
                                >
                                  Check
                                </button>
                              )}

                              {checked?.status === 'Taken' && (
                                <a 
                                  href={`https://${domainName}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="View Taken Site"
                                  className="p-1 bg-slate-950 border border-slate-850 hover:border-slate-700 text-slate-400 rounded"
                                >
                                  <ExternalLink className="w-3 h-3 text-slate-500 hover:text-emerald-400" />
                                </a>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Domain Advisor Box */}
          <div className="bg-slate-950/40 border border-slate-850 p-3 rounded-lg flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5 animate-pulse" />
            <div className="space-y-0.5">
              <h4 className="text-[11px] font-bold text-slate-300">Domain Scouting Advice</h4>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                If all WHOIS lookup limit API credits are exhausted, Domain Scout falls back to performing a live NS/A record resolver trace. If no IP addresses or nameservers are resolved, it marks the domain as <span className="text-emerald-400 font-bold">AVAILABLE</span>. Double check before buying.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
