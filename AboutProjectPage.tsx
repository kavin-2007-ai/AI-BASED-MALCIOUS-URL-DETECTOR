import React from 'react';
import {
  ShieldAlert,
  Cpu,
  Database,
  Lock,
  Layers,
  Terminal,
  Code2,
  CheckCircle,
  FileText
} from 'lucide-react';

export const AboutProjectPage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="pb-2 border-b border-[#1e293b]">
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          About URL Sentinel AI
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          AI-Powered Malicious URL Detection and Explainable Risk Analysis System
        </p>
      </div>

      {/* Hero Overview */}
      <div className="bg-[#0b1329] border border-[#1e293b] rounded-xl p-6 relative overflow-hidden">
        <div className="relative z-10 space-y-3">
          <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800">
            College Hackathon Cybersecurity Showcase
          </span>
          <h3 className="text-lg font-bold text-slate-100">
            Intelligent Threat Identification & Transparent Risk Explainability
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            URL Sentinel AI is an end-to-end cybersecurity solution built to detect malicious, phishing, and fraudulent URLs before user interaction. Unlike black-box detection tools, Sentinel extracts 39 lexical, structural, and character-level attributes and combines calibrated machine learning probabilities with deterministic risk scoring to present verifiable evidence for every classification.
          </p>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Architecture Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-[#0b1329] border border-[#1e293b] space-y-2">
          <div className="w-8 h-8 rounded-lg bg-blue-950 flex items-center justify-center text-blue-400">
            <Cpu className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-bold text-slate-200">Ensemble ML Engine</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Trained on documented Tranco benign domains and PhishTank/URLhaus malicious feeds. Evaluates Random Forest and Logistic Regression models on held-out test splits.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#0b1329] border border-[#1e293b] space-y-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-950 flex items-center justify-center text-cyan-400">
            <Lock className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-bold text-slate-200">Zero-Exploit Safety</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Sentinel strictly adheres to static URL inspection rules. Submitted targets are parsed and extracted in memory; the server never initiates network requests or renders clickable exploits.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#0b1329] border border-[#1e293b] space-y-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-950 flex items-center justify-center text-emerald-400">
            <Database className="w-4 h-4" />
          </div>
          <h4 className="text-sm font-bold text-slate-200">SQLite + SQLAlchemy</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Persistent database architecture storing complete scan telemetry, extracted features, and empirical model evaluations with transaction isolation.
          </p>
        </div>
      </div>

      {/* 3-Class Uncertainty Classification Policy */}
      <div className="bg-[#0b1329] border border-[#1e293b] rounded-xl p-5 space-y-3">
        <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span>Calibrated Three-Class Decision Policy</span>
        </h4>
        <p className="text-xs text-slate-400 leading-relaxed">
          Rather than fabricating a 3-class dataset, Sentinel trains binary classifiers on ground-truth benign and malicious data, then applies a mathematically transparent uncertainty decision threshold:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs pt-1">
          <div className="p-3 rounded-lg bg-[#070b14] border border-emerald-900/60 text-emerald-300">
            <span className="font-bold text-emerald-400 block mb-1">SAFE: P(Malicious) &lt; 0.35</span>
            <p className="text-[11px] text-slate-400 font-sans">
              Minimal indicators detected; structural patterns align with reputable registered domains.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-[#070b14] border border-amber-900/60 text-amber-300">
            <span className="font-bold text-amber-400 block mb-1">SUSPICIOUS: 0.35 &le; P &lt; 0.65</span>
            <p className="text-[11px] text-slate-400 font-sans">
              Intermediate probability zone; anomalous features (e.g. nonstandard port, multiple subdomains) demand caution.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-[#070b14] border border-rose-900/60 text-rose-300">
            <span className="font-bold text-rose-400 block mb-1">MALICIOUS: P(Malicious) &ge; 0.65</span>
            <p className="text-[11px] text-slate-400 font-sans">
              High confidence malicious pattern matching known phishing, credential harvesting, or payload delivery structures.
            </p>
          </div>
        </div>
      </div>

      {/* Tech Stack Specs */}
      <div className="bg-[#0b1329] border border-[#1e293b] rounded-xl p-5 space-y-3">
        <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <Code2 className="w-4 h-4 text-blue-400" />
          <span>Technical Architecture Stack</span>
        </h4>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div className="p-3 rounded bg-[#070b14] border border-[#1e293b]">
            <span className="text-slate-500 text-[10px] block">FRONTEND</span>
            <span className="text-slate-200 font-bold">React 18 + TS</span>
            <span className="text-slate-500 text-[10px] block mt-0.5">Tailwind CSS + Recharts</span>
          </div>

          <div className="p-3 rounded bg-[#070b14] border border-[#1e293b]">
            <span className="text-slate-500 text-[10px] block">BACKEND</span>
            <span className="text-slate-200 font-bold">FastAPI + Uvicorn</span>
            <span className="text-slate-500 text-[10px] block mt-0.5">Python 3.10+ REST API</span>
          </div>

          <div className="p-3 rounded bg-[#070b14] border border-[#1e293b]">
            <span className="text-slate-500 text-[10px] block">MACHINE LEARNING</span>
            <span className="text-slate-200 font-bold">Scikit-Learn</span>
            <span className="text-slate-500 text-[10px] block mt-0.5">Random Forest & Logistic Reg</span>
          </div>

          <div className="p-3 rounded bg-[#070b14] border border-[#1e293b]">
            <span className="text-slate-500 text-[10px] block">DATABASE</span>
            <span className="text-slate-200 font-bold">SQLite + SQLAlchemy</span>
            <span className="text-slate-500 text-[10px] block mt-0.5">url_sentinel.db</span>
          </div>
        </div>
      </div>
    </div>
  );
};
