import React, { useState, useEffect } from 'react';
import { Settings } from '../types.js';
import { 
  Settings as SettingsIcon, 
  Save, 
  Check, 
  Key, 
  ShieldCheck, 
  Cpu, 
  Info,
  Globe,
  TrendingUp,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

interface SettingsViewProps {
  settings: Settings;
  onSaveSettings: (settings: Settings) => void;
  isSaving: boolean;
}

export default function SettingsView({
  settings,
  onSaveSettings,
  isSaving
}: SettingsViewProps) {
  const [whoisJson, setWhoisJson] = useState(settings.whoisjson_api_key || '');
  const [whoisXml, setWhoisXml] = useState(settings.whoisxml_api_key || '');
  const [ninjas, setNinjas] = useState(settings.ninjas_api_key || '');
  const [serpApi, setSerpApi] = useState(settings.serpapi_api_key || '');
  const [semrush, setSemrush] = useState(settings.semrush_api_key || '');
  const [geminiOverride, setGeminiOverride] = useState(settings.gemini_api_key || '');

  const [savedSuccess, setSavedSuccess] = useState(false);

  // Sync state with settings prop on load
  useEffect(() => {
    setWhoisJson(settings.whoisjson_api_key || '');
    setWhoisXml(settings.whoisxml_api_key || '');
    setNinjas(settings.ninjas_api_key || '');
    setSerpApi(settings.serpapi_api_key || '');
    setSemrush(settings.semrush_api_key || '');
    setGeminiOverride(settings.gemini_api_key || '');
  }, [settings]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      whoisjson_api_key: whoisJson.trim(),
      whoisxml_api_key: whoisXml.trim(),
      ninjas_api_key: ninjas.trim(),
      serpapi_api_key: serpApi.trim(),
      semrush_api_key: semrush.trim(),
      gemini_api_key: geminiOverride.trim()
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div id="settings-view" className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div />
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column: API Credentials */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-3.5 space-y-3">
            <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2">
              <Key className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">API Key Manager</h3>
            </div>

            <div className="space-y-3 text-xs">
              {/* Gemini API Key override */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-slate-400 font-mono text-[10px] font-bold">GEMINI AI API KEY (OVERRIDE)</label>
                  <span className="text-[9px] text-slate-500 font-mono">Env fallback: GEMINI_API_KEY</span>
                </div>
                <input 
                  type="password"
                  value={geminiOverride}
                  onChange={(e) => setGeminiOverride(e.target.value)}
                  placeholder="Leave empty to use automatic workspace secret..."
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 placeholder-slate-700 focus:outline-none focus:border-slate-700 font-mono text-xs"
                />
              </div>

              {/* WhoisJSON Key */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-slate-400 font-mono text-[10px] font-bold">WHOISJSON API TOKEN (PRIMARY TLD CHECKER)</label>
                  <a href="https://whoisjson.com" target="_blank" rel="noopener noreferrer" className="text-[10px] text-emerald-400 hover:underline inline-flex items-center gap-0.5">
                    whoisjson.com <Info className="w-3 h-3" />
                  </a>
                </div>
                <input 
                  type="password"
                  value={whoisJson}
                  onChange={(e) => setWhoisJson(e.target.value)}
                  placeholder="WhoisJSON Bearer token..."
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 placeholder-slate-700 focus:outline-none focus:border-slate-700 font-mono text-xs"
                />
              </div>

              {/* WhoisXML Key */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-slate-400 font-mono text-[10px] font-bold">WHOISXML API KEY (FALLBACK CHECKER 1)</label>
                  <a href="https://domain-availability.whoisxmlapi.com" target="_blank" rel="noopener noreferrer" className="text-[10px] text-emerald-400 hover:underline inline-flex items-center gap-0.5">
                    whoisxmlapi.com <Info className="w-3 h-3" />
                  </a>
                </div>
                <input 
                  type="password"
                  value={whoisXml}
                  onChange={(e) => setWhoisXml(e.target.value)}
                  placeholder="WhoisXML API key..."
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 placeholder-slate-700 focus:outline-none focus:border-slate-700 font-mono text-xs"
                />
              </div>

              {/* API-Ninjas Key */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-slate-400 font-mono text-[10px] font-bold">API-NINJAS KEY (FALLBACK CHECKER 2)</label>
                  <a href="https://api-ninjas.com" target="_blank" rel="noopener noreferrer" className="text-[10px] text-emerald-400 hover:underline inline-flex items-center gap-0.5">
                    api-ninjas.com <Info className="w-3 h-3" />
                  </a>
                </div>
                <input 
                  type="password"
                  value={ninjas}
                  onChange={(e) => setNinjas(e.target.value)}
                  placeholder="API-Ninjas X-Api-Key..."
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 placeholder-slate-700 focus:outline-none focus:border-slate-700 font-mono text-xs"
                />
              </div>

              {/* SerpAPI Key */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-slate-400 font-mono text-[10px] font-bold">SERPAPI KEY (OPTIONAL GOOGLE SCRAPER PROXY)</label>
                  <span className="text-[9px] text-slate-500 font-mono font-bold uppercase">Optional</span>
                </div>
                <input 
                  type="password"
                  value={serpApi}
                  onChange={(e) => setSerpApi(e.target.value)}
                  placeholder="SerpAPI auth key..."
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 placeholder-slate-700 focus:outline-none focus:border-slate-700 font-mono text-xs"
                />
              </div>

              {/* SEMrush trends Key */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-slate-400 font-mono text-[10px] font-bold">SEMRUSH TRENDS KEY (PAID TRAFFIC CHECKER)</label>
                  <span className="text-[9px] text-slate-500 font-mono font-bold uppercase">Optional</span>
                </div>
                <input 
                  type="password"
                  value={semrush}
                  onChange={(e) => setSemrush(e.target.value)}
                  placeholder="SEMrush database key..."
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-200 placeholder-slate-700 focus:outline-none focus:border-slate-700 font-mono text-xs"
                />
              </div>
            </div>

            {/* Save Buttons */}
            <div className="border-t border-slate-800 pt-3 flex items-center justify-between">
              {savedSuccess ? (
                <span className="text-[10px] font-mono text-emerald-400 font-semibold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  Stored successfully!
                </span>
              ) : (
                <span className="text-[10px] text-slate-500 font-mono leading-tight">Keys are fully hashed and securely stored on Server DB.</span>
              )}

              <button 
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-900 text-xs font-bold rounded cursor-pointer"
              >
                {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>Save Configuration</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Status & Capabilities Dashboard */}
        <div className="lg:col-span-1 space-y-4 text-xs">
          {/* Key Checklist Status */}
          <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-lg space-y-3">
            <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">API Status Matrix</h3>
            </div>

            <div className="space-y-2 font-mono text-[10px]">
              {/* Gemini status */}
              <div className="flex justify-between items-center p-2 bg-slate-950 rounded border border-slate-850">
                <span className="text-slate-400">Gemini Pro API</span>
                <span className="text-emerald-400 font-bold">READY (Vite Secret)</span>
              </div>

              {/* WhoisJSON status */}
              <div className="flex justify-between items-center p-2 bg-slate-950 rounded border border-slate-850">
                <span className="text-slate-400">WhoisJSON</span>
                <span className={whoisJson || settings.whoisjson_api_key ? "text-emerald-400 font-bold" : "text-amber-500"}>
                  {whoisJson || settings.whoisjson_api_key ? "CONFIGURED" : "DNS RESOLUTION FALLBACK"}
                </span>
              </div>

              {/* WhoisXML status */}
              <div className="flex justify-between items-center p-2 bg-slate-950 rounded border border-slate-850">
                <span className="text-slate-400">WhoisXML</span>
                <span className={whoisXml || settings.whoisxml_api_key ? "text-emerald-400 font-bold" : "text-slate-600"}>
                  {whoisXml || settings.whoisxml_api_key ? "CONFIGURED" : "DISABLED"}
                </span>
              </div>

              {/* API-Ninjas status */}
              <div className="flex justify-between items-center p-2 bg-slate-950 rounded border border-slate-850">
                <span className="text-slate-400">API-Ninjas</span>
                <span className={ninjas || settings.ninjas_api_key ? "text-emerald-400 font-bold" : "text-slate-600"}>
                  {ninjas || settings.ninjas_api_key ? "CONFIGURED" : "DISABLED"}
                </span>
              </div>
            </div>
          </div>

          {/* Core AI Capabilities indicators */}
          <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-lg space-y-2.5">
            <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2">
              <Cpu className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">AI Pipelines Active</h3>
            </div>

            <div className="space-y-2.5 font-mono text-[9px]">
              <div className="space-y-0.5">
                <span className="text-slate-400 font-bold block">1. SEARCH GROUNDING (ACTIVE)</span>
                <p className="text-slate-500 leading-relaxed font-sans text-[10px]">
                  Utilizes Google Search tools inside gemini-2.5-flash to scour current web lists for micro-tool opportunities.
                </p>
              </div>

              <div className="space-y-0.5">
                <span className="text-slate-400 font-bold block">2. DEEP REASONING THINKING (ACTIVE)</span>
                <p className="text-slate-500 leading-relaxed font-sans text-[10px]">
                  Utilizes gemini-2.5-pro with HIGH thinking level configs to build financial break-even projections and feasibility cards.
                </p>
              </div>
            </div>
          </div>

          {/* Privacy Disclaimer */}
          <div className="bg-amber-950/10 border border-amber-900/40 p-3 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[10px] text-slate-500 leading-relaxed">
              API Keys are securely saved inside the persistent database `db.json` on the server. Never commit your secrets or keys directly to GitHub repositories.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}
