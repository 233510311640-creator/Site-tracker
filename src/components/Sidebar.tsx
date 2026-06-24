import React from 'react';
import { 
  LayoutDashboard, 
  Lightbulb, 
  Globe, 
  TrendingUp, 
  Briefcase, 
  Settings as SettingsIcon, 
  Cpu,
  RefreshCw,
  X
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isSyncing: boolean;
  lastSync: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ activeTab, setActiveTab, isSyncing, lastSync, isOpen, onClose }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'ideas', label: 'Idea Engine', icon: Lightbulb },
    { id: 'domains', label: 'Domain Scout', icon: Globe },
    { id: 'competitors', label: 'Competitor Tracker', icon: TrendingUp },
    { id: 'portfolio', label: 'My Portfolio', icon: Briefcase },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-40 md:hidden transition-opacity cursor-pointer"
        />
      )}

      <aside 
        id="sidebar-container" 
        className={`fixed inset-y-0 left-0 z-50 w-56 bg-slate-900 border-r border-slate-800 flex flex-col justify-between text-slate-300 select-none transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Header Branding */}
          <div id="sidebar-header" className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-emerald-500 rounded flex items-center justify-center text-slate-900 font-bold text-xs italic">
                µ
              </div>
              <div>
                <h1 className="font-bold text-sm tracking-tight text-white">MT-INTELLIGENCE</h1>
              </div>
            </div>
            
            {/* Close button for mobile/tablets */}
            <button 
              onClick={onClose}
              className="md:hidden p-1.5 bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 rounded cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Navigation Items */}
          <nav id="sidebar-nav" className="p-2 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-btn-${item.id}`}
                  onClick={() => {
                    setActiveTab(item.id);
                    onClose(); // Auto-close on mobile selection
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs transition-colors ${
                    isActive 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold' 
                      : 'hover:bg-slate-800/80 text-slate-400 hover:text-slate-200 border border-transparent font-medium'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                  {item.id === 'ideas' && (
                    <span className="ml-auto bg-slate-950 text-slate-500 text-[10px] font-mono px-1.5 py-0.5 rounded border border-slate-800">
                      Live
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sync Status footer */}
        <div id="sidebar-footer" className="p-4 border-t border-slate-800 bg-slate-900/50">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">System Status</span>
            <span className={`w-2 h-2 rounded-full shadow-[0_0_8px_#10b981] ${isSyncing ? 'bg-amber-400 animate-ping' : 'bg-emerald-500'}`} />
          </div>
          <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5 justify-between">
            <span className="flex items-center gap-1">
              <RefreshCw className={`w-2.5 h-2.5 text-slate-500 ${isSyncing ? 'animate-spin' : ''}`} />
              Sync:
            </span>
            <span className="truncate max-w-[100px] text-slate-300">
              {lastSync ? new Date(lastSync).toLocaleTimeString() : 'Pending'}
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
