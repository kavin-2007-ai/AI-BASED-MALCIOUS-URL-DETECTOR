import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Search,
  RotateCcw,
  ExternalLink,
  Lock,
  Unlock,
  Terminal,
  Cpu,
  Layers,
  ArrowRight,
  Info
} from 'lucide-react';
import { ScanResult } from '../types';
import { api } from '../services/api';

interface URLScannerProps {
  onScanCompleted: () => void;
  selectedScanResult: ScanResult | null;
  setSelectedScanResult: (result: ScanResult | null) => void;
}

export const URLScanner: React.FC<URLScannerProps> = ({
  onScanCompleted,
  selectedScanResult,
  setSelectedScanResult,
}) => {
  const [urlInput, setUrlInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleScan = async (urlToScan?: string) => {
    const target = (urlToScan || urlInput).trim();
    if (!target) {
      setError('Please enter a URL to inspect.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await api.scanUrl(target);
      setSelectedScanResult(result);
      onScanCompleted();
    } catch (err: any) {
      setError(err.message || 'Error occurred while analyzing URL.');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setUrlInput('');
    setError(null);
    setSelectedScanResult(null);
  };

  const demoExamples = [
    {
      title: 'Benign Sample',
      url: 'https://en.wikipedia.org/wiki/Computer_security',
      expected: 'SAFE',
      desc: 'Standard high-reputation domain with HTTPS and clean structure'
    },
    {
      title: 'Suspicious Sample',
      url: 'http://account-verification-notice.online/update/security?token=98218',
      expected: 'SUSPICIOUS',
      desc: 'HTTP usage, authentication keywords in path, non-whitelisted TLD'
    },
    {
      title: 'Documented Malicious Test Sample',
      url: 'http://192.168.1.105:8080/secure-update/login.php?session=token87192',
      expected: 'MALICIOUS',
      desc: 'Raw IP hostname, nonstandard port (8080), multiple credential keywords'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-2 border-b border-[#1e293b]">
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          URL Security Scanner & Deep Risk Inspector
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Extracts 39 structural, lexical, and character features evaluated by trained ML ensembles
        </p>
      </div>

      {/* URL Input Box */}
      <div className="bg-[#0b1329] border border-[#1e293b] rounded-xl p-5 shadow-lg">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleScan();
          }}
          className="space-y-3"
        >
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
            Target URL Input
          </label>

          <div className="relative flex items-center">
            <div className="absolute left-4 text-slate-500">
              <Search className="w-5 h-5 text-cyan-400" />
            </div>

            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Paste a URL to analyze its security... (e.g., https://example.com/login)"
              className="w-full bg-[#070b14] border border-[#1e293b] rounded-lg py-3.5 pl-12 pr-28 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 font-mono transition"
            />

            <div className="absolute right-2 flex items-center gap-1.5">
              {urlInput && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-2.5 py-1.5 rounded-md text-xs text-slate-400 hover:text-white bg-[#1e293b] hover:bg-[#334155] transition"
                  title="Clear input"
                >
                  Clear
                </button>
              )}

              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 hover:brightness-110 disabled:opacity-50 transition flex items-center gap-1.5"
              >
                {loading ? (
                  <>
                    <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Analyze URL</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-1 font-mono">
            <span>Supports: http://, https://, or raw domain names. Never automatically navigates to links.</span>
            <span>Max length: 2048 chars</span>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}
        </form>
      </div>

      {/* Demonstration Test Examples Section */}
      <div className="bg-[#0b1329] border border-[#1e293b] rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">
              Live Demonstration Vectors (Audited Test URLs)
            </h3>
          </div>
          <span className="text-[10px] text-slate-400 bg-[#111e3f] px-2 py-0.5 rounded border border-[#1e293b]">
            Demonstration Mode - No Live Navigation
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {demoExamples.map((demo, idx) => {
            const badgeBorder =
              demo.expected === 'SAFE'
                ? 'border-emerald-800 text-emerald-400 bg-emerald-950/40'
                : demo.expected === 'SUSPICIOUS'
                ? 'border-amber-800 text-amber-400 bg-amber-950/40'
                : 'border-rose-800 text-rose-400 bg-rose-950/40';

            return (
              <div
                key={idx}
                className="p-3 rounded-lg bg-[#070b14] border border-[#1e293b] flex flex-col justify-between hover:border-cyan-500/50 transition group"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-200">{demo.title}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border font-mono font-bold ${badgeBorder}`}>
                      {demo.expected}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mb-2">{demo.desc}</p>
                  <p className="text-[10px] font-mono text-cyan-300/80 break-all p-1.5 rounded bg-[#0b1329] border border-[#1e293b] select-all">
                    {demo.url}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setUrlInput(demo.url);
                    handleScan(demo.url);
                  }}
                  className="mt-3 w-full py-1.5 rounded bg-[#111e3f] hover:bg-blue-600 hover:text-white text-cyan-400 text-xs font-medium flex items-center justify-center gap-1 transition"
                >
                  <span>Load & Analyze Vector</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detailed Scan Results Section */}
      {selectedScanResult && (
        <div className="bg-[#0b1329] border border-[#1e293b] rounded-xl p-6 space-y-6 shadow-xl animate-fadeIn">
          {/* Result Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl border border-[#1e293b] bg-[#070b14]">
            <div className="flex items-center space-x-4">
              <div
                className={`w-14 h-14 rounded-xl flex items-center justify-center border ${
                  selectedScanResult.classification === 'SAFE'
                    ? 'bg-emerald-950/60 border-emerald-500 text-emerald-400'
                    : selectedScanResult.classification === 'SUSPICIOUS'
                    ? 'bg-amber-950/60 border-amber-500 text-amber-400'
                    : 'bg-rose-950/60 border-rose-500 text-rose-500'
                }`}
              >
                {selectedScanResult.classification === 'SAFE' && <ShieldCheck className="w-8 h-8" />}
                {selectedScanResult.classification === 'SUSPICIOUS' && <AlertTriangle className="w-8 h-8" />}
                {selectedScanResult.classification === 'MALICIOUS' && <ShieldAlert className="w-8 h-8" />}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-lg font-extrabold tracking-wider px-2.5 py-0.5 rounded font-mono ${
                      selectedScanResult.classification === 'SAFE'
                        ? 'bg-emerald-500 text-slate-950'
                        : selectedScanResult.classification === 'SUSPICIOUS'
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-rose-600 text-white'
                    }`}
                  >
                    {selectedScanResult.classification}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    Evaluation Engine: {selectedScanResult.model_name} (v{selectedScanResult.model_version})
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 font-mono break-all select-all">
                  Validated Target: <span className="text-slate-200">{selectedScanResult.normalized_url}</span>
                </p>
              </div>
            </div>

            {/* Risk Score Dial Card */}
            <div className="text-right border-t md:border-t-0 md:border-l border-[#1e293b] pt-3 md:pt-0 md:pl-6">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-mono block">
                Calculated Risk Score
              </span>
              <div
                className={`text-3xl font-extrabold font-mono ${
                  selectedScanResult.risk_score > 65
                    ? 'text-rose-500'
                    : selectedScanResult.risk_score > 35
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}
              >
                {selectedScanResult.risk_score}
                <span className="text-sm text-slate-500 font-normal">/100</span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                {selectedScanResult.prediction_status === 'ML_PREDICTION' ? 'ML Probabilistic Calibration' : 'Deterministic Rules'}
              </span>
            </div>
          </div>

          {/* Explainable Reasoning & Recommendation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-[#070b14] border border-[#1e293b] space-y-2">
              <h4 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5" />
                Explainable Risk Analysis
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                {selectedScanResult.explanation}
              </p>
            </div>

            <div className="p-4 rounded-lg bg-[#070b14] border border-[#1e293b] space-y-2">
              <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" />
                Recommended Next Action
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                {selectedScanResult.recommendation}
              </p>
            </div>
          </div>

          {/* Detected Observable Indicators */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
              Detected Risk Indicators ({selectedScanResult.indicators.length})
            </h4>

            {selectedScanResult.indicators.length === 0 ? (
              <div className="p-3 rounded-lg bg-[#070b14] border border-emerald-900/40 text-emerald-300 text-xs flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Zero anomalous structural indicators detected in this URL.</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {selectedScanResult.indicators.map((ind, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-lg bg-[#070b14] border border-[#1e293b] flex items-start space-x-3"
                  >
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold mt-0.5 ${
                        ind.severity === 'HIGH'
                          ? 'bg-rose-950 text-rose-400 border border-rose-800'
                          : ind.severity === 'MEDIUM'
                          ? 'bg-amber-950 text-amber-400 border border-amber-800'
                          : 'bg-blue-950 text-blue-400 border border-blue-800'
                      }`}
                    >
                      {ind.severity}
                    </span>
                    <div>
                      <div className="text-xs font-bold text-slate-200">{ind.title}</div>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{ind.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Extracted URL Characteristics Table */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
              Verified Feature Extraction Telemetry
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-xs font-mono">
              <div className="p-2.5 rounded bg-[#070b14] border border-[#1e293b]">
                <span className="text-slate-500 text-[10px] block">SCHEME</span>
                <span className="text-cyan-400 font-semibold">{selectedScanResult.scheme.toUpperCase()}</span>
              </div>
              <div className="p-2.5 rounded bg-[#070b14] border border-[#1e293b]">
                <span className="text-slate-500 text-[10px] block">HOSTNAME</span>
                <span className="text-slate-200 truncate block" title={selectedScanResult.hostname}>
                  {selectedScanResult.hostname || 'None'}
                </span>
              </div>
              <div className="p-2.5 rounded bg-[#070b14] border border-[#1e293b]">
                <span className="text-slate-500 text-[10px] block">REGISTERED DOMAIN</span>
                <span className="text-slate-200 truncate block">
                  {selectedScanResult.registered_domain || 'N/A'}
                </span>
              </div>
              <div className="p-2.5 rounded bg-[#070b14] border border-[#1e293b]">
                <span className="text-slate-500 text-[10px] block">PORT</span>
                <span className="text-slate-200">
                  {selectedScanResult.port ? selectedScanResult.port : 'Standard'}
                </span>
              </div>
              <div className="p-2.5 rounded bg-[#070b14] border border-[#1e293b]">
                <span className="text-slate-500 text-[10px] block">TOTAL LENGTH</span>
                <span className="text-slate-200">{selectedScanResult.features.url_length} chars</span>
              </div>
              <div className="p-2.5 rounded bg-[#070b14] border border-[#1e293b]">
                <span className="text-slate-500 text-[10px] block">HTTPS ENCRYPTED</span>
                <span className={selectedScanResult.features.https_used ? 'text-emerald-400' : 'text-amber-400'}>
                  {selectedScanResult.features.https_used ? 'Yes' : 'No (Plain HTTP)'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
