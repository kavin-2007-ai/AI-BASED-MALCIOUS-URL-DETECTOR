import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  Filter,
  Trash2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Database,
  ArrowUpDown
} from 'lucide-react';
import { ScanHistoryItem } from '../types';
import { api } from '../services/api';

interface ScanHistoryPageProps {
  onSelectScan: (id: number) => void;
  onScanCleared: () => void;
}

export const ScanHistoryPage: React.FC<ScanHistoryPageProps> = ({
  onSelectScan,
  onScanCleared,
}) => {
  const [items, setItems] = useState<ScanHistoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [classification, setClassification] = useState('');
  const [sortBy, setSortBy] = useState('scanned_at');
  const [order, setOrder] = useState('desc');
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [clearing, setClearing] = useState(false);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await api.getHistory({
        page,
        pageSize: 10,
        search: search.trim() || undefined,
        classification: classification || undefined,
        sortBy,
        order,
      });
      setItems(data.items);
      setTotal(data.total);
      setTotalPages(data.total_pages);
    } catch (err) {
      console.error('Failed to load scan history', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [page, classification, sortBy, order]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchHistory();
  };

  const handleClearHistory = async () => {
    setClearing(true);
    try {
      await api.clearHistory();
      setShowConfirmClear(false);
      setPage(1);
      await fetchHistory();
      onScanCleared();
    } catch (err) {
      console.error('Failed to clear history', err);
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#1e293b]">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            Persistent URL Scan Registry
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Historical scans stored in SQLite with full feature extraction and decision audit trails
          </p>
        </div>

        <button
          onClick={() => setShowConfirmClear(true)}
          disabled={total === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-950/60 text-rose-400 hover:bg-rose-900/60 border border-rose-800 disabled:opacity-40 transition"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear Scan Registry</span>
        </button>
      </div>

      {/* Confirmation Modal */}
      {showConfirmClear && (
        <div className="p-4 rounded-xl bg-[#0b1329] border border-rose-800 text-slate-200 text-xs flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
            <div>
              <p className="font-bold text-slate-100">Confirm database purge?</p>
              <p className="text-slate-400 text-[11px]">
                This will permanently delete all {total} stored scan records and their associated feature vectors from SQLite.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowConfirmClear(false)}
              className="px-3 py-1.5 rounded bg-[#1e293b] text-slate-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleClearHistory}
              disabled={clearing}
              className="px-3 py-1.5 rounded bg-rose-600 text-white font-semibold hover:bg-rose-700"
            >
              {clearing ? 'Purging...' : 'Yes, Delete All'}
            </button>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-[#0b1329] border border-[#1e293b] rounded-xl p-4 flex flex-col md:flex-row items-center gap-3">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search saved URL or domain..."
            className="w-full bg-[#070b14] border border-[#1e293b] rounded-lg py-1.5 pl-9 pr-3 text-xs text-slate-100 placeholder-slate-500 font-mono focus:outline-none focus:border-cyan-500"
          />
        </form>

        {/* Classification Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={classification}
            onChange={(e) => {
              setClassification(e.target.value);
              setPage(1);
            }}
            className="bg-[#070b14] border border-[#1e293b] rounded-lg py-1.5 px-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
          >
            <option value="">All Classifications</option>
            <option value="SAFE">SAFE Only</option>
            <option value="SUSPICIOUS">SUSPICIOUS Only</option>
            <option value="MALICIOUS">MALICIOUS Only</option>
          </select>
        </div>

        {/* Sort Field */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={`${sortBy}-${order}`}
            onChange={(e) => {
              const [sb, ord] = e.target.value.split('-');
              setSortBy(sb);
              setOrder(ord);
              setPage(1);
            }}
            className="bg-[#070b14] border border-[#1e293b] rounded-lg py-1.5 px-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
          >
            <option value="scanned_at-desc">Newest First</option>
            <option value="scanned_at-asc">Oldest First</option>
            <option value="risk_score-desc">Highest Risk Score</option>
            <option value="risk_score-asc">Lowest Risk Score</option>
          </select>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-[#0b1329] border border-[#1e293b] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#070b14] text-slate-400 uppercase font-mono text-[10px] border-b border-[#1e293b]">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Target URL</th>
                <th className="px-4 py-3">Classification</th>
                <th className="px-4 py-3">Risk Score</th>
                <th className="px-4 py-3">Model</th>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e293b] text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    Loading records from SQLite...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    No historical scans match the criteria.
                  </td>
                </tr>
              ) : (
                items.map((scan) => {
                  const badgeColor =
                    scan.classification === 'SAFE'
                      ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
                      : scan.classification === 'SUSPICIOUS'
                      ? 'bg-amber-950/80 text-amber-400 border-amber-800'
                      : 'bg-rose-950/80 text-rose-400 border-rose-800';

                  return (
                    <tr key={scan.id} className="hover:bg-[#111e3f]/50 transition">
                      <td className="px-4 py-3 font-mono text-slate-400">#{scan.id}</td>
                      <td className="px-4 py-3 font-mono text-slate-200 max-w-sm truncate" title={scan.normalized_url}>
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
                      <td className="px-4 py-3 text-[11px] text-slate-400 font-mono">
                        {scan.model_name.replace('Classifier', 'Clf')}
                      </td>
                      <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">
                        {new Date(scan.scanned_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => onSelectScan(scan.id)}
                          className="px-2.5 py-1 rounded bg-[#1e293b] hover:bg-cyan-500 hover:text-slate-950 text-cyan-400 text-[11px] transition"
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

        {/* Pagination Bar */}
        <div className="p-4 border-t border-[#1e293b] flex items-center justify-between text-xs text-slate-400">
          <span>
            Showing page <strong className="text-slate-200">{page}</strong> of <strong className="text-slate-200">{totalPages}</strong> ({total} total entries)
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded bg-[#1e293b] hover:bg-[#334155] text-slate-300 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded bg-[#1e293b] hover:bg-[#334155] text-slate-300 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
