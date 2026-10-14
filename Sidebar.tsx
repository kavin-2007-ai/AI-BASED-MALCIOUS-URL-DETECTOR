import React from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  History,
  Activity,
  Layers,
  Info,
  Server,
  Cpu
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  backendConnected: boolean;
  modelOnline: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  backendConnected,
  modelOnline,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Overview Dashboard', icon: Activity },
    { id: 'scanner', label: 'URL Scanner', icon: ShieldAlert },
    { id: 'history', label: 'Scan History', icon: History },
    { id: 'performance', label: 'ML Performance', icon: Layers },
    { id: 'about', label: 'About Project', icon: Info },
  ];

  return (
    <aside className="w-64 bg-[#0b1329] border-r border-[#1e293b] flex flex-col justify-between shrink-0">
      <div>
        {/* Brand header */}
        <div className="p-6 border-b border-[#1e293b] flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <ShieldCheck className="w-6 h-6 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="font-bold text-base tracking-wider text-slate-100 flex items-center gap-1.5">
              URL SENTINEL <span className="text-cyan-400 text-xs px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-800">AI</span>
            </h1>
            <p className="text-[11px] text-slate-400 font-mono tracking-tight">Explainable Risk Engine</p>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="p-4 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600/20 text-cyan-400 border border-cyan-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#111e3f]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* System Status Indicators at bottom of sidebar */}
      <div className="p-4 m-4 rounded-lg bg-[#070b14] border border-[#1e293b] space-y-2.5 text-xs font-mono">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-slate-400">
            <Server className="w-3.5 h-3.5 text-slate-400" />
            <span>FastAPI Server</span>
          </div>
          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
            backendConnected
              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
              : 'bg-rose-950 text-rose-400 border border-rose-800'
          }`}>
            {backendConnected ? 'ONLINE' : 'OFFLINE'}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-slate-400">
            <Cpu className="w-3.5 h-3.5 text-slate-400" />
            <span>ML Engine</span>
          </div>
          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
            modelOnline
              ? 'bg-cyan-950 text-cyan-400 border border-cyan-800'
              : 'bg-amber-950 text-amber-400 border border-amber-800'
          }`}>
            {modelOnline ? 'ACTIVE (RF)' : 'FALLBACK'}
          </span>
        </div>
      </div>
    </aside>
  );
};
