import React, { useState, useEffect } from 'react';
import {
  Layers,
  Award,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Database,
  Cpu,
  HelpCircle,
  RefreshCw
} from 'lucide-react';
import { ModelPerformance, ModelInfo } from '../types';
import { api } from '../services/api';

export const ModelPerformancePage: React.FC = () => {
  const [perf, setPerf] = useState<ModelPerformance | null>(null);
  const [info, setInfo] = useState<ModelInfo | null>(null);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [pData, iData] = await Promise.all([
        api.getModelPerformance(),
        api.getModelInfo(),
      ]);
      setPerf(pData);
      setInfo(iData);
    } catch (err) {
      console.error('Failed to load performance metrics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#1e293b]">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            Machine Learning Evaluation & Benchmarking
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Empirically measured test split performance metrics stored in SQLite database
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#111e3f] text-slate-300 hover:text-white border border-[#1e293b] transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          <span>Refresh Evaluation</span>
        </button>
      </div>

      {/* Model Status Card */}
      <div className="bg-[#0b1329] border border-[#1e293b] rounded-xl p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-cyan-950/80 border border-cyan-800 flex items-center justify-center text-cyan-400">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-100">
                  {info?.model_name || 'Random Forest Classifier'}
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold">
                  {info?.status || 'PRODUCTION READY'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">
                Model Version: {info?.model_version || '1.0.0'} • Features: 39 Lexical & Structural Indicators
              </p>
            </div>
          </div>

          <div className="text-xs font-mono text-slate-400 bg-[#070b14] p-3 rounded-lg border border-[#1e293b] space-y-1">
            <div>Dataset: <strong className="text-slate-200">{perf?.dataset_name || 'PhishTank + Tranco Benchmark'}</strong></div>
            <div>Held-out Test Samples: <strong className="text-cyan-400">{perf?.test_sample_count || 20} URLs</strong></div>
          </div>
        </div>
      </div>

      {/* 4 Core Empirical Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Accuracy */}
        <div className="bg-[#0b1329] border border-[#1e293b] rounded-xl p-4">
          <span className="text-[11px] text-slate-400 font-medium">Test Set Accuracy</span>
          <div className="text-2xl font-bold font-mono text-cyan-400 mt-1">
            {perf?.accuracy !== null && perf?.accuracy !== undefined ? `${(perf.accuracy * 100).toFixed(1)}%` : 'N/A'}
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Fraction of all correctly classified URLs</p>
        </div>

        {/* Precision */}
        <div className="bg-[#0b1329] border border-[#1e293b] rounded-xl p-4">
          <span className="text-[11px] text-slate-400 font-medium">Precision (Malicious)</span>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
            {perf?.precision !== null && perf?.precision !== undefined ? `${(perf.precision * 100).toFixed(1)}%` : 'N/A'}
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Minimizes benign false alarms</p>
        </div>

        {/* Recall */}
        <div className="bg-[#0b1329] border border-[#1e293b] rounded-xl p-4">
          <span className="text-[11px] text-slate-400 font-medium">Recall (Detection Rate)</span>
          <div className="text-2xl font-bold font-mono text-blue-400 mt-1">
            {perf?.recall !== null && perf?.recall !== undefined ? `${(perf.recall * 100).toFixed(1)}%` : 'N/A'}
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Proportion of phishing URLs caught</p>
        </div>

        {/* F1 Score */}
        <div className="bg-[#0b1329] border border-[#1e293b] rounded-xl p-4">
          <span className="text-[11px] text-slate-400 font-medium">Macro F1-Score</span>
          <div className="text-2xl font-bold font-mono text-purple-400 mt-1">
            {perf?.f1_score !== null && perf?.f1_score !== undefined ? `${(perf.f1_score * 100).toFixed(1)}%` : 'N/A'}
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Harmonic mean of precision and recall</p>
        </div>
      </div>

      {/* Confusion Matrix and Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Confusion Matrix */}
        <div className="bg-[#0b1329] border border-[#1e293b] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <span>Held-out Test Confusion Matrix</span>
            <span className="text-[10px] font-mono text-slate-400">(n = {perf?.test_sample_count || 20})</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5 mb-4">
            Ground-truth labels vs model predictions on unbiased test partition
          </p>

          {perf?.confusion_matrix ? (
            <div className="grid grid-cols-2 gap-3 text-center font-mono">
              <div className="p-4 rounded-lg bg-emerald-950/40 border border-emerald-800">
                <span className="text-[10px] text-emerald-400 uppercase tracking-wider block">True Negatives (TN)</span>
                <span className="text-2xl font-bold text-emerald-300">{perf.confusion_matrix.true_negative}</span>
                <span className="text-[10px] text-slate-400 block mt-1">Benign correctly marked Safe</span>
              </div>

              <div className="p-4 rounded-lg bg-amber-950/40 border border-amber-800">
                <span className="text-[10px] text-amber-400 uppercase tracking-wider block">False Positives (FP)</span>
                <span className="text-2xl font-bold text-amber-300">{perf.confusion_matrix.false_positive}</span>
                <span className="text-[10px] text-slate-400 block mt-1">Benign falsely marked Malicious</span>
              </div>

              <div className="p-4 rounded-lg bg-rose-950/40 border border-rose-800">
                <span className="text-[10px] text-rose-400 uppercase tracking-wider block">False Negatives (FN)</span>
                <span className="text-2xl font-bold text-rose-300">{perf.confusion_matrix.false_negative}</span>
                <span className="text-[10px] text-slate-400 block mt-1">Malicious missed by model</span>
              </div>

              <div className="p-4 rounded-lg bg-cyan-950/40 border border-cyan-800">
                <span className="text-[10px] text-cyan-400 uppercase tracking-wider block">True Positives (TP)</span>
                <span className="text-2xl font-bold text-cyan-300">{perf.confusion_matrix.true_positive}</span>
                <span className="text-[10px] text-slate-400 block mt-1">Malicious correctly intercepted</span>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 text-xs">
              Confusion matrix not available.
            </div>
          )}
        </div>

        {/* Model Comparison Table */}
        <div className="bg-[#0b1329] border border-[#1e293b] rounded-xl p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-200">
              Ensemble Model Comparison (RF vs LR)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 mb-4">
              Side-by-side empirical benchmark on identical feature matrix and test split
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#070b14] text-slate-400 uppercase text-[10px] border-b border-[#1e293b]">
                  <tr>
                    <th className="px-3 py-2">Candidate Model</th>
                    <th className="px-3 py-2">Accuracy</th>
                    <th className="px-3 py-2">Precision</th>
                    <th className="px-3 py-2">Recall</th>
                    <th className="px-3 py-2">F1</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1e293b] text-slate-300">
                  {perf?.comparison?.map((m, idx) => (
                    <tr key={idx} className={m.model.includes('Random Forest') ? 'bg-cyan-950/20' : ''}>
                      <td className="px-3 py-2.5 font-bold flex items-center gap-1.5">
                        <span>{m.model}</span>
                        {m.model.includes('Random Forest') && (
                          <span className="text-[9px] bg-cyan-900 text-cyan-300 px-1 py-0.2 rounded font-sans">
                            Selected
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-cyan-400">{(m.accuracy * 100).toFixed(1)}%</td>
                      <td className="px-3 py-2.5 text-emerald-400">{(m.precision * 100).toFixed(1)}%</td>
                      <td className="px-3 py-2.5 text-blue-400">{(m.recall * 100).toFixed(1)}%</td>
                      <td className="px-3 py-2.5 text-purple-400">{(m.f1 * 100).toFixed(1)}%</td>
                    </tr>
                  )) || (
                    <tr>
                      <td colSpan={5} className="px-3 py-4 text-center text-slate-500">
                        Comparison data loading...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Academic / Cybersecurity Context */}
          <div className="mt-4 p-3 rounded-lg bg-[#070b14] border border-[#1e293b] text-xs text-slate-400 space-y-1">
            <span className="font-semibold text-slate-300 block">Why Accuracy Alone Is Insufficient:</span>
            <p className="text-[11px] leading-relaxed">
              In real-world cybersecurity, URL datasets are heavily imbalanced. A naive classifier predicting every URL as "SAFE" can achieve high raw accuracy while failing 100% of phishing intrusions. Therefore, URL Sentinel AI benchmarks Macro F1 and Precision to strictly prevent false negatives.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
