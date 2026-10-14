import React from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Globe,
  Database,
  ArrowUpRight,
  RefreshCw,
  Clock
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis
} from 'recharts';
import { DashboardStats, ScanHistoryItem } from '../types';

interface DashboardProps {
  stats: DashboardStats | null;
  loading: boolean;
  onRefresh: () => void;
  onSelectScan: (id: number) => void;
  onNavigateToScanner: () => void;
}

const COLORS = {
  SAFE: '#10b981',        // Green
  SUSPICIOUS: '#f59e0b',  // Amber
  MALICIOUS: '#ef4444',   // Red
};

export const OverviewDashboard: React.FC<DashboardProps> = ({
  stats,
  loading,
  onRefresh,
  onSelectScan,
  onNavigateToScanner,
}) => {
  const chartData = [
    { name: 'SAFE', value: stats?.safe_urls ?? 0, color: COLORS.SAFE },
    { name: 'SUSPICIOUS', value: stats?.suspicious_urls ?? 0, color: COLORS.SUSPICIOUS },
    { name: 'MALICIOUS', value: stats?.malicious_urls ?? 0, color: COLORS.MALICIOUS },
  ];

  const totalCount = stats?.total_urls ?? 0;

  return (
    <div className="space-y-6">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#1e293b]">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            Security Operations Dashboard
            <span className="text-xs font-mono font-normal px-2 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800">
              SOC Mode
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time telemetry and database-persisted URL risk inspection telemetry
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#111e3f] text-slate-300 hover:text-white hover:bg-[#1b2c5b] border border-[#1e293b] transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            <span>Refresh Telemetry</span>
          </button>

          <button
            onClick={onNavigateToScanner}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 hover:brightness-110 shadow-sm transition"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Scan New URL</span>
          </button>
        </div>
      </div>

      {/* 4 Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total URLs Analyzed */}
        <div className="bg-[#0b1329] border border-[#1e293b] rounded-xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Total URLs Analyzed</span>
            <Globe className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100 font-mono">
            {stats ? stats.total_urls : 0}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1">
            <Database className="w-3 h-3 text-slate-400" />
            <span>Live SQLite persisted records</span>
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-xl pointer-events-none" />
        </div>

        {/* Safe URLs */}
        <div className="bg-[#0b1329] border border-[#1e293b] rounded-xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Safe URLs</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono">
            {stats ? stats.safe_urls : 0}
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            {totalCount > 0 ? `${Math.round(((stats?.safe_urls ?? 0) / totalCount) * 100)}% of total scans` : '0% of total scans'}
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
        </div>

        {/* Suspicious URLs */}
        <div className="bg-[#0b1329] border border-[#1e293b] rounded-xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Suspicious URLs</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 font-mono">
            {stats ? stats.suspicious_urls : 0}
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            {totalCount > 0 ? `${Math.round(((stats?.suspicious_urls ?? 0) / totalCount) * 100)}% of total scans` : '0% of total scans'}
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />
        </div>

        {/* Malicious URLs */}
        <div className="bg-[#0b1329] border border-[#1e293b] rounded-xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Malicious URLs</span>
            <ShieldAlert className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-rose-500 font-mono">
            {stats ? stats.malicious_urls : 0}
          </div>
          <div className="mt-2 text-[11px] text-slate-500">
            {totalCount > 0 ? `${Math.round(((stats?.malicious_urls ?? 0) / totalCount) * 100)}% of total scans` : '0% of total scans'}
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-xl pointer-events-none" />
        </div>
      </div>

      {/* Charts & Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Classification Distribution Pie Chart */}
        <div className="bg-[#0b1329] border border-[#1e293b] rounded-xl p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-200">Classification Distribution</h3>
            <p className="text-xs text-slate-400 mt-0.5">Calculated from actual stored database records</p>
          </div>

          <div className="h-48 my-3">
            {totalCount === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs text-center p-4">
                <Globe className="w-8 h-8 text-slate-600 mb-2 stroke-1" />
                <span>No stored scan records yet.</span>
                <span className="text-slate-600 mt-1">Scan a URL to populate live telemetry.</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="#0b1329" strokeWidth={2} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: '#070b14', borderColor: '#1e293b', borderRadius: '8px', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-[#1e293b]">
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Safe</span>
              <span className="text-xs font-mono font-bold text-emerald-400">{stats?.safe_urls ?? 0}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Suspicious</span>
              <span className="text-xs font-mono font-bold text-amber-400">{stats?.suspicious_urls ?? 0}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Malicious</span>
              <span className="text-xs font-mono font-bold text-rose-500">{stats?.malicious_urls ?? 0}</span>
            </div>
          </div>
        </div>

        {/* Real-time Activity Timeline / Bar Chart */}
        <div className="lg:col-span-2 bg-[#0b1329] border border-[#1e293b] rounded-xl p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-200">Recent Risk Scoring Activity</h3>
            <p className="text-xs text-slate-400 mt-0.5">Calculated risk scores of recent URL evaluations (0-100)</p>
          </div>

          <div className="h-48 my-3">
            {(!stats?.recent_activity || stats.recent_activity.length === 0) ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs">
                <Clock className="w-8 h-8 text-slate-600 mb-2 stroke-1" />
                <span>No recent scan telemetry logged.</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.recent_activity}>
                  <XAxis dataKey="timestamp" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis domain={[0, 100]} stroke="#64748b" fontSize={10} tickLine={false} />
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: '#070b14', borderColor: '#1e293b', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Bar dataKey="risk_score" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-[#1e293b]">
            <span>Average Risk Score: <strong className="text-slate-200 font-mono">{stats?.average_risk_score ?? 0}/100</strong></span>
            <span className="text-[11px] text-cyan-400 flex items-center gap-1">
              Live Database Connected
            </span>
          </div>
        </div>
      </div>

      {/* 5 Most Recent Scans Table */}
      <div className="bg-[#0b1329] border border-[#1e293b] rounded-xl overflow-hidden">
        <div className="p-4 border-b border-[#1e293b] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-200">5 Most Recent Scans</h3>
            <p className="text-xs text-slate-400 mt-0.5">Directly queried from the SQLite database</p>
          </div>
          <button
            onClick={() => onSelectScan(-1)} // Navigates to full history
            className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition"
          >
            <span>View Full History</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#070b14] text-slate-400 uppercase font-mono text-[10px] border-b border-[#1e293b]">
              <tr>
                <th className="px-4 py-3">Scanned URL</th>
                <th className="px-4 py-3">Classification</th>
                <th className="px-4 py-3">Risk Score</th>
                <th className="px-4 py-3">Engine Status</th>
                <th className="px-4 py-3">Scanned At</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e293b] text-slate-300">
              {(!stats?.recent_scans || stats.recent_scans.length === 0) ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                    No scans stored in database yet. Ready for first inspection.
                  </td>
                </tr>
              ) : (
                stats.recent_scans.map((scan) => {
                  const badgeColor =
                    scan.classification === 'SAFE'
                      ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
                      : scan.classification === 'SUSPICIOUS'
                      ? 'bg-amber-950/80 text-amber-400 border-amber-800'
                      : 'bg-rose-950/80 text-rose-400 border-rose-800';

                  return (
                    <tr key={scan.id} className="hover:bg-[#111e3f]/50 transition">
                      <td className="px-4 py-3 font-mono text-slate-200 max-w-xs truncate" title={scan.normalized_url}>
                        {scan.normalized_url}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${badgeColor}`}>
                          {scan.classification}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono font-medium">
                        <span className={scan.risk_score > 65 ? 'text-rose-400' : scan.risk_score > 35 ? 'text-amber-400' : 'text-emerald-400'}>
                          {scan.risk_score}/100
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[11px] text-slate-400">
                        {scan.prediction_status === 'ML_PREDICTION' ? (
                          <span className="text-cyan-400 font-mono">ML (Trained)</span>
                        ) : (
                          <span className="text-slate-500 font-mono">Fallback</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">
                        {new Date(scan.scanned_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => onSelectScan(scan.id)}
                          className="px-2.5 py-1 rounded bg-[#1e293b] hover:bg-[#334155] text-cyan-400 text-[11px] transition"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
