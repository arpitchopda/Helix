import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid, 
  BarChart, 
  Bar 
} from 'recharts';
import { 
  LineChart as LineChartIcon, 
  TrendingUp, 
  Award, 
  ShieldCheck, 
  RefreshCw, 
  Layers, 
  Zap,
  CheckCircle2
} from 'lucide-react';

const AdminPerformance = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchPerformance = () => {
    setLoading(true);
    adminAPI.getPerformance()
      .then((res) => {
        setData(res.data);
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Failed to load performance metrics.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPerformance();
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  const rounds = data?.rounds || [];
  const baseline = data?.centralized_baseline;
  const latest = data?.global_metrics || {};

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
            <LineChartIcon className="h-6 w-6 text-cyan-400" />
            Global Model Performance & Centralized Benchmark
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Compare decentralized federated model trajectories across aggregation rounds against the theoretical centralized data-pooling baseline.
          </p>
        </div>
      </div>

      {/* Comparison Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="glass-panel rounded-2xl p-5 border border-slate-800">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Global FL Accuracy
          </div>
          <div className="text-3xl font-black text-emerald-400">
            {latest.accuracy ? `${latest.accuracy}%` : 'N/A'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>Round #{latest.round || rounds.length}</span>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-5 border border-slate-800">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Centralized Baseline
          </div>
          <div className="text-3xl font-black text-cyan-400">
            {baseline?.accuracy ? `${baseline.accuracy}%` : 'N/A'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            <span>Theoretical Upper Bound</span>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-5 border border-slate-800">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            FL Efficiency Parity
          </div>
          <div className="text-3xl font-black text-indigo-400">
            {latest.accuracy && baseline?.accuracy
              ? `${((latest.accuracy / baseline.accuracy) * 100).toFixed(1)}%`
              : 'N/A'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            <span>Ratio to Centralized Model</span>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-5 border border-slate-800">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Privacy Conservation
          </div>
          <div className="text-3xl font-black text-amber-400">100.0%</div>
          <div className="text-[11px] text-slate-400 mt-1">
            <span>0 Patient Records Shared</span>
          </div>
        </div>

      </div>

      {/* Rounds Progression Chart */}
      <div className="glass-panel rounded-2xl border border-slate-800 p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <span className="text-sm font-bold text-white flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-cyan-400" />
            Federated Accuracy Trajectory across Aggregation Rounds
          </span>
          <span className="text-xs text-slate-400">
            Total Rounds: {rounds.length}
          </span>
        </div>

        {rounds.length > 0 ? (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rounds} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="round" stroke="#64748b" tick={{ fontSize: 11 }} label={{ value: 'FL Round', position: 'insideBottomRight', offset: -5, fill: '#64748b' }} />
                <YAxis stroke="#64748b" domain={[50, 100]} tick={{ fontSize: 11 }} unit="%" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem' }} 
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Line type="monotone" dataKey="accuracy" stroke="#10b981" strokeWidth={3} name="Global Accuracy (%)" dot={{ r: 5 }} />
                <Line type="monotone" dataKey="f1" stroke="#06b6d4" strokeWidth={2.5} name="Global F1-Score (%)" dot={{ r: 4 }} />
                <Line type="monotone" dataKey="precision" stroke="#6366f1" strokeWidth={2} name="Precision (%)" dot={false} strokeDasharray="3 3" />
                <Line type="monotone" dataKey="recall" stroke="#f59e0b" strokeWidth={2} name="Recall (%)" dot={false} strokeDasharray="3 3" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-xs text-slate-400">
            No federated rounds recorded yet. Run Federated Averaging to view trajectory.
          </div>
        )}
      </div>

      {/* Rounds History Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800">
          <span className="text-sm font-bold text-white">Aggregated Global Model Ledger</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900 text-[11px] uppercase font-bold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Round #</th>
                <th className="px-4 py-3">Accuracy</th>
                <th className="px-4 py-3">Precision</th>
                <th className="px-4 py-3">Recall</th>
                <th className="px-4 py-3">F1-Score</th>
                <th className="px-4 py-3">Aggregation Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {rounds.map((r) => (
                <tr key={r.round} className="hover:bg-slate-900/50">
                  <td className="px-4 py-2.5 font-bold text-cyan-400 font-mono">Round #{r.round}</td>
                  <td className="px-4 py-2.5 font-bold text-emerald-400">{r.accuracy}%</td>
                  <td className="px-4 py-2.5">{r.precision}%</td>
                  <td className="px-4 py-2.5">{r.recall}%</td>
                  <td className="px-4 py-2.5 font-semibold text-white">{r.f1}%</td>
                  <td className="px-4 py-2.5 text-slate-400 font-mono text-[11px]">
                    {new Date(r.timestamp).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default AdminPerformance;
