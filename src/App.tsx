import React, { useState, useEffect } from 'react';
import { RefreshCw, Menu } from 'lucide-react';
import Sidebar from './components/Sidebar.js';
import DashboardView from './components/DashboardView.js';
import IdeaEngineView from './components/IdeaEngineView.js';
import DomainScoutView from './components/DomainScoutView.js';
import CompetitorTrackerView from './components/CompetitorTrackerView.js';
import PortfolioView from './components/PortfolioView.js';
import SettingsView from './components/SettingsView.js';
import EvidenceBoardModal from './components/EvidenceBoardModal.js';

import { Idea, DomainCheck, Competitor, MySite, Evidence, Settings } from './types.js';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // App state
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [domainChecks, setDomainChecks] = useState<DomainCheck[]>([]);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [mySites, setMySites] = useState<MySite[]>([]);
  const [settings, setSettings] = useState<Settings>({
    gemini_api_key: '',
    whoisjson_api_key: '',
    whoisxml_api_key: '',
    ninjas_api_key: '',
    serpapi_api_key: '',
    semrush_api_key: ''
  });

  // Background cron state
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState('');

  // Local interaction states
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  const [selectedEvidenceIdea, setSelectedEvidenceIdea] = useState<Idea | null>(null);
  const [evidenceList, setEvidenceList] = useState<Evidence[]>([]);

  // Loading indicator states
  const [loading, setLoading] = useState(true);
  const [isMining, setIsMining] = useState(false);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [isCheckingDomain, setIsCheckingDomain] = useState(false);
  const [isRefreshingCompetitors, setIsRefreshingCompetitors] = useState(false);
  const [isGeneratingEvidence, setIsGeneratingEvidence] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Error banners
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  // Fetch initial backend data
  const loadInitialData = async () => {
    try {
      const [ideasRes, domainsRes, competitorsRes, sitesRes, settingsRes, healthRes] = await Promise.all([
        fetch('/api/ideas').then(r => r.json()),
        fetch('/api/domains').then(r => r.json()),
        fetch('/api/competitors').then(r => r.json()),
        fetch('/api/my-sites').then(r => r.json()),
        fetch('/api/settings').then(r => r.json()),
        fetch('/api/health').then(r => r.json())
      ]);

      if (ideasRes.success) setIdeas(ideasRes.data);
      if (domainsRes.success) setDomainChecks(domainsRes.data);
      if (competitorsRes.success) setCompetitors(competitorsRes.data);
      if (sitesRes.success) setMySites(sitesRes.data);
      if (settingsRes.success) setSettings(settingsRes.data);
      
      setIsSyncing(healthRes.isBackgroundSyncing);
      setLastSync(healthRes.lastSyncTime);

      // Load evidence cards too
      const evidenceRes = await fetch('/api/evidence').then(r => r.json());
      if (evidenceRes.success) setEvidenceList(evidenceRes.data);

    } catch (err) {
      console.error("Failed to load initial server-side DB data:", err);
      setErrorBanner("Failed to connect to backend server API routes. Ensure dev server started.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Handler methods

  // Idea Engine: Mine subreddits
  const handleMineReddit = async () => {
    setIsMining(true);
    setErrorBanner(null);
    try {
      const res = await fetch('/api/ideas/mine', { method: 'POST' }).then(r => r.json());
      if (res.success) {
        setIdeas(prev => {
          // Merge unique ideas by name
          const merged = [...prev];
          res.added.forEach((newItem: Idea) => {
            if (!merged.some(m => m.name.toLowerCase() === newItem.name.toLowerCase())) {
              merged.push(newItem);
            }
          });
          return merged;
        });
      } else {
        setErrorBanner(res.error || "Reddit mining failed.");
      }
    } catch (err: any) {
      setErrorBanner(err.message || "Failed to trigger Reddit miner.");
    } finally {
      setIsMining(false);
    }
  };

  // Idea Engine: Gemini Search Grounding Discovery
  const handleDiscoverGemini = async (query: string) => {
    setIsDiscovering(true);
    setErrorBanner(null);
    try {
      const res = await fetch('/api/ideas/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      }).then(r => r.json());

      if (res.success) {
        setIdeas(prev => {
          const merged = [...prev];
          res.added.forEach((newItem: Idea) => {
            if (!merged.some(m => m.name.toLowerCase() === newItem.name.toLowerCase())) {
              merged.push(newItem);
            }
          });
          return merged;
        });
      } else {
        setErrorBanner(res.error || "Gemini Search Discovery failed.");
      }
    } catch (err: any) {
      setErrorBanner(err.message || "Failed to call Gemini Search Grounding API.");
    } finally {
      setIsDiscovering(false);
    }
  };

  // Watchlist Toggle
  const handleToggleWatchlist = async (id: number) => {
    try {
      const res = await fetch('/api/ideas/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      }).then(r => r.json());

      if (res.success) {
        setIdeas(prev => prev.map(idea => idea.id === id ? { ...idea, is_watchlisted: res.is_watchlisted } : idea));
      }
    } catch (err) {
      console.error("Watchlist toggle failed:", err);
    }
  };

  // Delete Idea
  const handleDeleteIdea = async (id: number) => {
    try {
      const res = await fetch(`/api/ideas/${id}`, { method: 'DELETE' }).then(r => r.json());
      if (res.success) {
        setIdeas(prev => prev.filter(idea => idea.id !== id));
        setDomainChecks(prev => prev.filter(d => d.idea_id !== id));
        setCompetitors(prev => prev.filter(c => c.idea_id !== id));
        setEvidenceList(prev => prev.filter(e => e.idea_id !== id));
      }
    } catch (err) {
      console.error("Failed to delete idea:", err);
    }
  };

  // Domain Checker: Check single domain
  const handleCheckDomain = async (domain: string, ideaId: number) => {
    setIsCheckingDomain(true);
    setErrorBanner(null);
    try {
      const res = await fetch('/api/domains/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain, ideaId })
      }).then(r => r.json());

      if (res.success) {
        setDomainChecks(prev => {
          // replace duplicate or append
          const filtered = prev.filter(d => !(d.idea_id === ideaId && d.domain_name.toLowerCase() === domain.toLowerCase()));
          return [res.data, ...filtered];
        });
      }
    } catch (err: any) {
      setErrorBanner(err.message || "Domain availability check failed.");
    } finally {
      setIsCheckingDomain(false);
    }
  };

  // Domain Checker: Bulk Check Top 5 variations
  const handleBulkCheck = async (ideaId: number) => {
    setIsCheckingDomain(true);
    setErrorBanner(null);
    try {
      const res = await fetch('/api/domains/bulk-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ideaId })
      }).then(r => r.json());

      if (res.success) {
        setDomainChecks(prev => {
          const namesToCheck = res.data.map((d: DomainCheck) => d.domain_name.toLowerCase());
          const filtered = prev.filter(d => !(d.idea_id === ideaId && namesToCheck.includes(d.domain_name.toLowerCase())));
          return [...res.data, ...filtered];
        });
      }
    } catch (err: any) {
      setErrorBanner(err.message || "Bulk domain checking failed.");
    } finally {
      setIsCheckingDomain(false);
    }
  };

  // Competitor Tracker: Refresh competitor analytics
  const handleRefreshCompetitors = async (ideaId: number) => {
    setIsRefreshingCompetitors(true);
    setErrorBanner(null);
    try {
      const res = await fetch('/api/competitors/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ideaId })
      }).then(r => r.json());

      if (res.success) {
        setCompetitors(prev => {
          const filtered = prev.filter(c => c.idea_id !== ideaId);
          return [...res.data, ...filtered];
        });
      }
    } catch (err: any) {
      setErrorBanner(err.message || "Failed to trigger competitor discovery.");
    } finally {
      setIsRefreshingCompetitors(false);
    }
  };

  // Competitor Tracker: Manual add
  const handleAddManualCompetitor = async (ideaId: number, domain: string) => {
    setIsRefreshingCompetitors(true);
    setErrorBanner(null);
    try {
      const swDataRes = await fetch(`/api/domains/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain, ideaId })
      }).then(r => r.json());

      // Try to enrich competitor structure
      const compPayload = {
        idea_id: ideaId,
        domain: domain,
        monthly_visits: 5000,
        global_rank: 2300000,
        bounce_rate: 45,
        top_country: 'United States',
        traffic_trend: 'steady' as const,
        threat_level: 'Low' as const,
        tech_stack: ['HTML', 'Tailwind'],
        top_keywords: ['micro-tool']
      };

      // Add to server list
      const res = await fetch('/api/competitors/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ideaId })
      }).then(r => r.json());

      if (res.success) {
        setCompetitors(prev => {
          const filtered = prev.filter(c => c.idea_id !== ideaId);
          return [...res.data, ...filtered];
        });
      }
    } catch (err: any) {
      setErrorBanner(err.message || "Failed to track manually.");
    } finally {
      setIsRefreshingCompetitors(false);
    }
  };

  // Evidence Board: Generate AI Evidence cards
  const handleGenerateEvidence = async (ideaId: number) => {
    setIsGeneratingEvidence(true);
    setErrorBanner(null);
    try {
      const res = await fetch('/api/evidence/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ideaId })
      }).then(r => r.json());

      if (res.success) {
        setEvidenceList(prev => {
          const filtered = prev.filter(e => e.idea_id !== ideaId);
          return [...res.data, ...filtered];
        });
      } else {
        setErrorBanner(res.error || "Failed to generate deep evidence.");
      }
    } catch (err: any) {
      setErrorBanner(err.message || "Failed to call Gemini Deep thinking model.");
    } finally {
      setIsGeneratingEvidence(false);
    }
  };

  // My Sites: Add Site
  const handleAddSite = async (sitePayload: Omit<MySite, 'id'>) => {
    setErrorBanner(null);
    try {
      const res = await fetch('/api/my-sites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sitePayload)
      }).then(r => r.json());

      if (res.success) {
        setMySites(prev => [...prev, res.data]);
      }
    } catch (err: any) {
      setErrorBanner(err.message || "Failed to register portfolio site.");
    }
  };

  // My Sites: Update Site stats
  const handleUpdateSite = async (id: number, updates: Partial<MySite>) => {
    try {
      const res = await fetch(`/api/my-sites/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      }).then(r => r.json());

      if (res.success) {
        setMySites(prev => prev.map(s => s.id === id ? res.data : s));
      }
    } catch (err) {
      console.error("Failed to save site stats:", err);
    }
  };

  // My Sites: Delete Site
  const handleDeleteSite = async (id: number) => {
    try {
      const res = await fetch(`/api/my-sites/${id}`, { method: 'DELETE' }).then(r => r.json());
      if (res.success) {
        setMySites(prev => prev.filter(s => s.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete portfolio site:", err);
    }
  };

  // Settings: Save credentials
  const handleSaveSettings = async (updatedSettings: Settings) => {
    setIsSavingSettings(true);
    setErrorBanner(null);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSettings)
      }).then(r => r.json());

      if (res.success) {
        setSettings(res.data);
      }
    } catch (err: any) {
      setErrorBanner(err.message || "Failed to store credentials.");
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Navigation shortcuts
  const handleSelectIdeaForDomains = (idea: Idea) => {
    setSelectedIdea(idea);
    setActiveTab('domains');
  };

  const handleSelectIdeaForCompetitors = (idea: Idea) => {
    setSelectedIdea(idea);
    setActiveTab('competitors');
  };

  return (
    <div id="command-center-root" className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Dynamic Error Banner Alerts */}
      {errorBanner && (
        <div id="error-alert-banner" className="fixed top-4 right-4 max-w-md bg-rose-950 border-l-4 border-rose-500 text-rose-200 p-4 rounded shadow-xl z-50 flex items-start gap-3 animate-bounce">
          <div className="flex-1 text-xxs font-mono leading-relaxed">
            <span className="font-bold block text-rose-300">SYSTEM RUNTIME ERROR:</span>
            {errorBanner}
          </div>
          <button onClick={() => setErrorBanner(null)} className="text-rose-400 hover:text-rose-100 text-xs font-bold font-mono">
            CLOSE
          </button>
        </div>
      )}

      {/* Sidebar Navigation */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isSyncing={isSyncing} 
        lastSync={lastSync} 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Command Content Frame */}
      <main id="main-content-scrollable" className="flex-1 flex flex-col overflow-y-auto bg-slate-950">
        {/* Mobile Top Header */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800 sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 rounded cursor-pointer flex items-center justify-center"
              title="Open Navigation Menu"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="w-5 h-5 bg-emerald-500 rounded flex items-center justify-center text-slate-900 font-bold text-[10px] italic">
              µ
            </div>
            <span className="font-bold text-xs tracking-tight text-white uppercase">MT-Intelligence</span>
          </div>
          <div className="flex items-center gap-1.5 font-mono text-[10px] text-slate-400">
            <span className={`w-1.5 h-1.5 rounded-full ${isSyncing ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'}`} />
            <span>{activeTab.toUpperCase()}</span>
          </div>
        </header>

        <div className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto w-full flex-1 pb-16">
          {loading ? (
            <div id="global-loading-screen" className="flex flex-col items-center justify-center h-96 text-slate-400 space-y-4">
              <RefreshCw className="w-8 h-8 animate-spin text-emerald-400" />
              <p className="text-xs font-mono">Synchronizing telemetry databases...</p>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <DashboardView 
                  ideas={ideas} 
                  mySites={mySites} 
                  competitors={competitors}
                  onNavigate={setActiveTab}
                  onRefreshIdeas={handleMineReddit}
                />
              )}
              {activeTab === 'ideas' && (
                <IdeaEngineView 
                  ideas={ideas}
                  onToggleWatchlist={handleToggleWatchlist}
                  onDeleteIdea={handleDeleteIdea}
                  onMineReddit={handleMineReddit}
                  onDiscoverGemini={handleDiscoverGemini}
                  onSelectIdeaForEvidence={setSelectedEvidenceIdea}
                  onSelectIdeaForDomains={handleSelectIdeaForDomains}
                  onSelectIdeaForCompetitors={handleSelectIdeaForCompetitors}
                  isMining={isMining}
                  isDiscovering={isDiscovering}
                />
              )}
              {activeTab === 'domains' && (
                <DomainScoutView 
                  ideas={ideas}
                  selectedIdea={selectedIdea}
                  domainChecks={domainChecks}
                  onCheckDomain={handleCheckDomain}
                  onBulkCheck={handleBulkCheck}
                  isChecking={isCheckingDomain}
                />
              )}
              {activeTab === 'competitors' && (
                <CompetitorTrackerView 
                  ideas={ideas}
                  selectedIdea={selectedIdea}
                  competitors={competitors}
                  onRefreshCompetitors={handleRefreshCompetitors}
                  onAddManualCompetitor={handleAddManualCompetitor}
                  isRefreshing={isRefreshingCompetitors}
                />
              )}
              {activeTab === 'portfolio' && (
                <PortfolioView 
                  mySites={mySites}
                  onAddSite={handleAddSite}
                  onUpdateSite={handleUpdateSite}
                  onDeleteSite={handleDeleteSite}
                />
              )}
              {activeTab === 'settings' && (
                <SettingsView 
                  settings={settings}
                  onSaveSettings={handleSaveSettings}
                  isSaving={isSavingSettings}
                />
              )}
            </>
          )}
        </div>
      </main>

      {/* Overlay Evidence Board Modal */}
      {selectedEvidenceIdea && (
        <EvidenceBoardModal 
          idea={selectedEvidenceIdea}
          evidenceList={evidenceList}
          onGenerateEvidence={handleGenerateEvidence}
          onClose={() => setSelectedEvidenceIdea(null)}
          isGenerating={isGeneratingEvidence}
        />
      )}
    </div>
  );
}
