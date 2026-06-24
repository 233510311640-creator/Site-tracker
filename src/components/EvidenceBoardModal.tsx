import React from 'react';
import { Idea, Evidence } from '../types.js';
import { 
  Award, 
  X, 
  TrendingUp, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw,
  Cpu,
  Check
} from 'lucide-react';

interface EvidenceBoardModalProps {
  idea: Idea | null;
  evidenceList: Evidence[];
  onGenerateEvidence: (ideaId: number) => void;
  onClose: () => void;
  isGenerating: boolean;
}

export default function EvidenceBoardModal({
  idea,
  evidenceList,
  onGenerateEvidence,
  onClose,
  isGenerating
}: EvidenceBoardModalProps) {
  if (!idea) return null;

  // Filter evidence for the selected idea
  const filteredEvidence = evidenceList.filter(e => e.idea_id === idea.id);
  
  const marketEv = filteredEvidence.find(e => e.evidence_type === 'market');
  const financialEv = filteredEvidence.find(e => e.evidence_type === 'financial');
  const competitiveEv = filteredEvidence.find(e => e.evidence_type === 'competitive');
  const recommendationEv = filteredEvidence.find(e => e.evidence_type === 'recommendation');

  const hasEvidence = filteredEvidence.length > 0;

  return (
    <div id="evidence-board-overlay" className="fixed inset-0 bg-slate-950/80 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
      <div 
        id="evidence-board-card" 
        className="bg-slate-900 border border-slate-800 rounded-lg w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
      >
        {/* Header bar */}
        <div className="p-3 border-b border-slate-800 flex justify-between items-center bg-slate-950/40">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-xs uppercase tracking-wider">Evidence & Feasibility Card</h3>
              <p className="text-[10px] text-slate-400 font-mono">AUTONOMOUS ADVISORY • {idea.name.toUpperCase()}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 rounded cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="p-3.5 overflow-y-auto space-y-3 flex-1 text-slate-300 text-xs leading-relaxed">
          {/* Summary Details */}
          <div className="p-3 bg-slate-950 rounded border border-slate-850 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div className="space-y-0.5 max-w-[80%]">
              <span className="text-[9px] text-slate-500 font-mono font-bold">SELECTED OPPORTUNITY CONCEPT</span>
              <h4 className="font-bold text-slate-200 text-xs">{idea.name}</h4>
              <p className="text-[10px] text-slate-400">{idea.description}</p>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[9px] text-slate-500 font-mono font-bold block">OPPORTUNITY SCORE</span>
              <span className="text-base font-bold text-emerald-400 font-mono">{idea.opportunity_score}/100</span>
            </div>
          </div>

          {!hasEvidence ? (
            /* Call to Action: Generate Evidence Card */
            <div className="text-center py-10 px-4 border border-dashed border-slate-800 rounded-lg space-y-3">
              <div className="p-3 bg-slate-950 rounded-full w-10 h-10 mx-auto flex items-center justify-center border border-slate-800">
                <Cpu className={`w-5 h-5 text-emerald-400 ${isGenerating ? 'animate-spin' : ''}`} />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h4 className="font-bold text-slate-200 text-xs">Deep Feasibility Scoring Needed</h4>
                <p className="text-[10px] text-slate-500">
                  Run Gemini's High-Thinking mode to cross-analyze search traffic trends, project AdSense margins, map competitive blindspots, and output customized build recommendation cards.
                </p>
              </div>
              <button 
                onClick={() => onGenerateEvidence(idea.id)}
                disabled={isGenerating}
                className="mx-auto flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-slate-900 font-bold rounded text-xs cursor-pointer"
              >
                {isGenerating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Cpu className="w-3.5 h-3.5 animate-pulse" />}
                <span>{isGenerating ? 'Analyzing market indicators...' : 'Generate AI Evidence Cards'}</span>
              </button>
            </div>
          ) : (
            /* Render active evidence bento grid */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Card 1: Market evidence */}
              <div className="bg-slate-950 p-3 border border-slate-850 rounded-lg space-y-1.5 flex flex-col justify-between">
                <div className="space-y-1">
                  <div className="flex justify-between items-center border-b border-slate-850 pb-1.5">
                    <span className="font-bold text-slate-200 text-xxs uppercase flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Market Demand Signal</span>
                    </span>
                    <span className="font-mono text-[9px] text-slate-500">CONFIDENCE: {marketEv?.confidence_score || 85}%</span>
                  </div>
                  <p className="text-slate-400 text-[10px] leading-relaxed">
                    {marketEv?.content || "Gathering Google and Reddit demand vectors..."}
                  </p>
                </div>
                <div className="text-slate-600 font-mono text-[9px] pt-1.5 border-t border-slate-900/40">VECTORS: SEMANTIC FREQUENCY, INDEX SEARCH GROWTH</div>
              </div>

              {/* Card 2: Financial Projection */}
              <div className="bg-slate-950 p-3 border border-slate-850 rounded-lg space-y-1.5 flex flex-col justify-between">
                <div className="space-y-1">
                  <div className="flex justify-between items-center border-b border-slate-850 pb-1.5">
                    <span className="font-bold text-slate-200 text-xxs uppercase flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Financial Break-Even</span>
                    </span>
                    <span className="font-mono text-[9px] text-slate-500">CONFIDENCE: {financialEv?.confidence_score || 80}%</span>
                  </div>
                  <p className="text-slate-400 text-[10px] leading-relaxed">
                    {financialEv?.content || "Calculating CPM yield potentials..."}
                  </p>
                </div>
                <div className="text-slate-600 font-mono text-[9px] pt-1.5 border-t border-slate-900/40">RPM BASELINE: AdSense $2.50, carbonAds $4.20</div>
              </div>

              {/* Card 3: Competitive Gap */}
              <div className="bg-slate-950 p-3 border border-slate-850 rounded-lg space-y-1.5 flex flex-col justify-between">
                <div className="space-y-1">
                  <div className="flex justify-between items-center border-b border-slate-850 pb-1.5">
                    <span className="font-bold text-slate-200 text-xxs uppercase flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                      <span>Competitive Gap</span>
                    </span>
                    <span className="font-mono text-[9px] text-slate-500">CONFIDENCE: {competitiveEv?.confidence_score || 90}%</span>
                  </div>
                  <p className="text-slate-400 text-[10px] leading-relaxed">
                    {competitiveEv?.content || "Analyzing UX friction and signup walls..."}
                  </p>
                </div>
                <div className="text-slate-600 font-mono text-[9px] pt-1.5 border-t border-slate-900/40">GAP ANALYSIS: FRICTIONLESS ACCESSIBILITY, NO-REGISTRATION</div>
              </div>

              {/* Card 4: Build Recommendation (Col Span 2) */}
              <div className="md:col-span-2 bg-slate-950 p-3.5 border border-emerald-950/80 rounded-lg space-y-2">
                <div className="flex justify-between items-center border-b border-emerald-950/60 pb-1.5">
                  <span className="font-bold text-emerald-400 flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-xxs uppercase tracking-wider">AI Build Recommendation</span>
                  </span>
                  <span className="font-mono text-[9px] text-slate-500">EXECUTION SCORE: {recommendationEv?.confidence_score || 95}%</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed italic">
                  "{recommendationEv?.content || "Formulating precise differentiator guidelines..."}"
                </p>
                
                {/* Meta list of speed/differentiators */}
                <div className="pt-2 border-t border-slate-900 grid grid-cols-3 gap-3 text-[9px] text-slate-400 font-mono">
                  <div>
                    <span className="block text-slate-600 font-bold">EST. BUILD DAYS:</span>
                    <span className="font-bold text-slate-200">1 - 3 days (Single Screen)</span>
                  </div>
                  <div>
                    <span className="block text-slate-600 font-bold">PRIMARY MONETIZATION:</span>
                    <span className="font-bold text-emerald-400">Google AdSense / Ads</span>
                  </div>
                  <div>
                    <span className="block text-slate-600 font-bold">UX DIFFERENTIATION:</span>
                    <span className="font-bold text-slate-200">Offline-First, Zero Signup</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer bar */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/40 flex justify-end gap-1.5 shrink-0">
          {hasEvidence && (
            <button 
              onClick={() => onGenerateEvidence(idea.id)}
              disabled={isGenerating}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-750 text-emerald-400 text-xxs font-bold rounded flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>Re-analyze</span>
            </button>
          )}
          <button 
            onClick={onClose}
            className="px-3 py-1 bg-slate-950 border border-slate-850 hover:bg-slate-900 text-slate-400 text-xxs font-bold rounded cursor-pointer"
          >
            Close Board
          </button>
        </div>
      </div>
    </div>
  );
}
