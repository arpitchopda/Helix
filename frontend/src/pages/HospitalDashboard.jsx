import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { hospitalAPI } from '../services/api';
import { 
  Building2, 
  Database, 
  Cpu, 
  RefreshCw, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  ArrowUpRight, 
  TrendingUp, 
  Clock, 
  ShieldCheck,
  Layers,
  Send
} from 'lucide-react';

const HospitalDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboard = () => {
    setLoading(true);
    hospitalAPI.getDashboard()
      .then((res) => {
        setData(res.data);
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Failed to load hospital metrics.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-8 w-8 animate-spin text-cyan-400" />
          <p className="text-xs text-slate-400">Loading Hospital Silo Node telemetry...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="glass-panel relative overflow-hidden rounded-2xl p-6 sm:p-8 border border-slate-800">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="rounded-md bg-cyan-500/20 px-2 py-0.5 text-xs font-bold text-cyan-400 border border-cyan-500/30">
                Hospital Silo Node
              </span>
              <span className="text-xs text-slate-400">{data?.location || user?.location}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              {data?.hospital_name || user?.hospital_name}
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Node ID: <code className="text-cyan-400 font-mono font-bold">{data?.hospital_id}</code>. 
              Train local clinical models on proprietary electronic health records and participate in decentralized Federated Averaging rounds.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              to="/training"
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-cyan-500/20 transition hover:brightness-110"
            >
              <Cpu className="h-4 w-4" />
              Train Local Model
            </Link>
            <Link
              to="/sync"
              className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-700"
            >
              <RefreshCw className="h-4 w-4 text-cyan-400" />
              Sync Global Model
            </Link>
          </div>
        </div>
      </div>

      {/* Global Model Sync Notification Banner */}
      {data?.sync_status === 'update_available' && (
        <div className="rounded-2xl border border-cyan-500/40 bg-gradient-to-r from-cyan-950/40 via-indigo-950/30 to-slate-900/60 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-lg shadow-cyan-500/10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 shrink-0 border border-cyan-500/30">
              <RefreshCw className="h-5 w-5 animate-spin" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-cyan-300">
                New Global Model (Round #{data?.global_round}) Available for Ingestion!
              </h4>
              <p className="text-xs text-slate-300">
                The Central Coordinator completed Federated Averaging with {Math.round((data?.global_accuracy || 0) * 100)}% benchmark accuracy. Sync global weights to boost local diagnostics.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/sync"
              className="flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2.5 text-xs font-bold text-slate-950 transition hover:bg-cyan-400 shadow-md shadow-cyan-500/20"
            >
              Open Sync Hub
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Key Metric Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Record count card */}
        <div className="glass-panel glass-panel-hover rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Local Patient EHR</span>
            <div className="h-8 w-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <Database className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">{data?.record_count || 0}</div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>Isolated in Hospital Boundary</span>
          </div>
        </div>

        {/* Local model status card */}
        <div className="glass-panel glass-panel-hover rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Training Status</span>
            <div className="h-8 w-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Cpu className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white capitalize">
            {data?.training_status === 'synced_with_global' ? 'Synced (Global)' : (data?.training_status?.replace('_', ' ') || 'Not Started')}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
            <Clock className="h-3.5 w-3.5 text-indigo-400" />
            <span>{data?.trained_at ? `Trained ${new Date(data.trained_at).toLocaleTimeString()}` : 'Awaiting training run'}</span>
          </div>
        </div>

        {/* Local Accuracy */}
        <div className="glass-panel glass-panel-hover rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Local Accuracy</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-400">
            {data?.local_accuracy ? `${(data.local_accuracy * 100).toFixed(1)}%` : 'N/A'}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
            <span>F1-Score: {data?.local_f1 ? `${(data.local_f1 * 100).toFixed(1)}%` : 'N/A'}</span>
          </div>
        </div>

        {/* Global Round & Sync */}
        <div className="glass-panel glass-panel-hover rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Global Round</span>
            <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-400">
            Round #{data?.global_round || 0}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
            <span>
              {data?.synced_global_round 
                ? `Local synced with R#${data.synced_global_round}` 
                : 'Not yet synchronized'}
            </span>
          </div>
        </div>

      </div>

      {/* Workflow Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        <Link
          to="/dataset"
          className="glass-panel glass-panel-hover group rounded-2xl p-6 border border-slate-800 flex flex-col justify-between"
        >
          <div>
            <div className="h-10 w-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mb-4 border border-cyan-500/30 group-hover:scale-110 transition">
              <Database className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-white group-hover:text-cyan-400 transition">
              1. Manage Clinical Dataset
            </h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Upload patient CSV datasets, inspect feature distributions (Age, Cholesterol, Blood Pressure, ECG), and validate clinical schemas.
            </p>
          </div>
          <div className="mt-6 flex items-center gap-2 text-xs font-bold text-cyan-400">
            <span>View & Upload Dataset</span>
            <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
        </Link>

        <Link
          to="/training"
          className="glass-panel glass-panel-hover group rounded-2xl p-6 border border-slate-800 flex flex-col justify-between"
        >
          <div>
            <div className="h-10 w-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4 border border-indigo-500/30 group-hover:scale-110 transition">
              <Cpu className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-white group-hover:text-indigo-400 transition">
              2. Detailed Local Training
            </h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Configure training hyperparameters, observe live epoch loss/accuracy curves, evaluate confusion matrices, and submit parameter updates.
            </p>
          </div>
          <div className="mt-6 flex items-center gap-2 text-xs font-bold text-indigo-400">
            <span>Launch Training Studio</span>
            <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
        </Link>

        <Link
          to="/predict"
          className="glass-panel glass-panel-hover group rounded-2xl p-6 border border-slate-800 flex flex-col justify-between"
        >
          <div>
            <div className="h-10 w-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4 border border-emerald-500/30 group-hover:scale-110 transition">
              <Sparkles className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition">
              3. Clinical Prediction & SHAP
            </h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Input patient clinical biomarkers, evaluate cardiovascular disease risk probability, and inspect transparent SHAP explainability insights.
            </p>
          </div>
          <div className="mt-6 flex items-center gap-2 text-xs font-bold text-emerald-400">
            <span>Run Diagnostic Inference</span>
            <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
        </Link>

      </div>

    </div>
  );
};

export default HospitalDashboard;
