import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid, 
  Cell 
} from 'recharts';
import { 
  Combine, 
  Play, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  TrendingUp, 
  ShieldCheck, 
  Radio, 
  RefreshCw, 
  Download,
  Building2,
  Server,
  ArrowRight
} from 'lucide-react';

const AdminAggregation = () => {
  const [aggregating, setAggregating] = useState(false);
  const [distributing, setDistributing] = useState(false);
  const [aggregationResult, setAggregationResult] = useState(null);
  const [distributionResult, setDistributionResult] = useState(null);
  const [error, setError] = useState('');
  const [clients, setClients] = useState([]);
  const [activeTab, setActiveTab] = useState('weights'); // 'weights' | 'parameters' | 'confusion' | 'logs'
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    adminAPI.getClients()
      .then((res) => {
        setClients(res.data.clients || []);
      })
      .catch(() => {});
  }, []);

  const handleRunFedAvg = async () => {
    setAggregating(true);
    setError('');
    setDistributionResult(null);
    setLogs([
      `[${new Date().toLocaleTimeString()}] Initializing Central FedAvg Aggregator Engine...`,
      `[${new Date().toLocaleTimeString()}] Polling pending model updates from hospital silos...`,
      `[${new Date().toLocaleTimeString()}] Found updates ready for parameter fusion.`
    ]);

    try {
      const res = await adminAPI.runFederatedAverage();
      if (res.data.success) {
        setAggregationResult(res.data);
        const newLogs = [
          `[${new Date().toLocaleTimeString()}] Step 1: Ingested ${res.data.hospitals_included} hospital parameter vectors (${res.data.total_samples} total patients).`,
          `[${new Date().toLocaleTimeString()}] Step 2: Computed FedAvg weighting coefficients w_k = n_k / N.`,
          `[${new Date().toLocaleTimeString()}] Step 3: Successfully fused global parameter vector theta_global = SUM(w_k * theta_k).`,
          `[${new Date().toLocaleTimeString()}] Step 4: Cross-silo benchmark validation: Accuracy = ${(res.data.accuracy * 100).toFixed(1)}% | F1-Score = ${(res.data.f1 * 100).toFixed(1)}%.`,
          `[${new Date().toLocaleTimeString()}] Global Model Round #${res.data.round} synthesized and automatically distributed to all hospital nodes.`
        ];
        setLogs(prev => [...prev, ...newLogs]);

        // Auto distribute so hospital silos immediately see the new round
        try {
          const distRes = await adminAPI.distributeGlobalModel();
          if (distRes.data.success) {
            setDistributionResult(distRes.data);
          }
        } catch (_) {}
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Federated Averaging failed. Ensure hospital updates are submitted.');
      setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ERROR: ${err.message}`]);
    } finally {
      setAggregating(false);
    }
  };

  const handleDistribute = async () => {
    setDistributing(true);
    setError('');
    try {
      const res = await adminAPI.distributeGlobalModel();
      if (res.data.success) {
        setDistributionResult(res.data);
        setLogs(prev => [
          ...prev, 
          `[${new Date().toLocaleTimeString()}] Broadcast successful: Global Model Round #${res.data.round} distributed to all ${res.data.hospitals_notified} hospital silos!`
        ]);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to distribute global model.');
    } finally {
      setDistributing(false);
    }
  };

  const contributions = aggregationResult?.hospital_contributions || [];
  const featureShifts = aggregationResult?.feature_shifts || [];

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
            <Combine className="h-6 w-6 text-amber-400" />
            Federated Averaging (FedAvg) Studio
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Aggregate distributed neural/logistic parameters $\theta_k$ weighted by sample volume without accessing private patient records.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRunFedAvg}
            disabled={aggregating}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-lg shadow-amber-500/20 transition hover:brightness-110 disabled:opacity-50"
          >
            {aggregating ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Aggregating FedAvg Parameters...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-slate-950" />
                Execute Federated Averaging
              </>
            )}
          </button>

          {aggregationResult && (
            <button
              onClick={handleDistribute}
              disabled={distributing}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-cyan-500/20 transition hover:brightness-110 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              <span>{distributing ? 'Broadcasting...' : 'Distribute to Hospitals'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Distribution Success Banner */}
      {distributionResult && (
        <div className="rounded-2xl border border-cyan-500/50 bg-gradient-to-r from-cyan-950/50 via-indigo-950/40 to-slate-900/60 p-5 shadow-lg shadow-cyan-500/10">
          <div className="flex items-start gap-3.5">
            <Radio className="h-6 w-6 text-cyan-400 shrink-0 mt-0.5 animate-pulse" />
            <div>
              <h4 className="text-sm font-bold text-cyan-300">
                Global Model Broadcast Complete (Round #{distributionResult.round})!
              </h4>
              <p className="text-xs text-slate-300 mt-1">
                {distributionResult.message} Hospital silos can now download and synchronize updated parameters into their local models.
              </p>
              <div className="mt-2 text-[11px] text-cyan-400/80 font-mono">
                Broadcast Timestamp: {new Date(distributionResult.broadcast_at).toLocaleString()} • Notified Silos: {distributionResult.hospitals_notified}
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-rose-900/60 bg-rose-950/40 p-4 text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Aggregation Mathematical Process Explanation */}
      <div className="glass-panel rounded-2xl border border-slate-800 p-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <span className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            Mathematical Parameter Fusion Equation
          </span>
          <span className="text-[10px] uppercase font-bold text-slate-400 px-2 py-0.5 rounded bg-slate-800 font-mono">
            McMahan et al. FedAvg
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="rounded-xl bg-slate-900/70 p-3.5 border border-slate-800">
            <div className="font-semibold text-amber-400 mb-1">1. Sample Weight Calculation</div>
            <code className="text-slate-200 block text-xs font-mono mb-1">w_k = n_k / N</code>
            <p className="text-slate-400 text-[11px]">
              Each hospital's gradient impact is proportional to its local dataset size $n_k$.
            </p>
          </div>

          <div className="rounded-xl bg-slate-900/70 p-3.5 border border-slate-800">
            <div className="font-semibold text-cyan-400 mb-1">2. Parameter Vector Fusion</div>
            <code className="text-slate-200 block text-xs font-mono mb-1">θ_global = Σ (w_k * θ_k)</code>
            <p className="text-slate-400 text-[11px]">
              Weighted linear combination of coefficients across all participating hospital silos.
            </p>
          </div>

          <div className="rounded-xl bg-slate-900/70 p-3.5 border border-slate-800">
            <div className="font-semibold text-emerald-400 mb-1">3. Broadcast & Distribution</div>
            <code className="text-slate-200 block text-xs font-mono mb-1">Broadcast(θ_global) → Silos</code>
            <p className="text-slate-400 text-[11px]">
              Updated model parameters sent back to local hospitals for personalized evaluation.
            </p>
          </div>
        </div>
      </div>

      {/* Main Aggregation Telemetry Panels */}
      {aggregationResult ? (
        <div className="space-y-6">
          
          {/* Aggregation Summary Stat Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="glass-panel rounded-xl p-4 border border-slate-800 text-center">
              <div className="text-[10px] font-bold uppercase text-slate-400">Synthesized Version</div>
              <div className="text-2xl font-black text-amber-400 mt-1">Round #{aggregationResult.round}</div>
            </div>
            <div className="glass-panel rounded-xl p-4 border border-slate-800 text-center">
              <div className="text-[10px] font-bold uppercase text-slate-400">Global Accuracy</div>
              <div className="text-2xl font-black text-emerald-400 mt-1">{(aggregationResult.accuracy * 100).toFixed(1)}%</div>
            </div>
            <div className="glass-panel rounded-xl p-4 border border-slate-800 text-center">
              <div className="text-[10px] font-bold uppercase text-slate-400">Global F1-Score</div>
              <div className="text-2xl font-black text-cyan-400 mt-1">{(aggregationResult.f1 * 100).toFixed(1)}%</div>
            </div>
            <div className="glass-panel rounded-xl p-4 border border-slate-800 text-center">
              <div className="text-[10px] font-bold uppercase text-slate-400">Hospitals Ingested</div>
              <div className="text-2xl font-black text-indigo-400 mt-1">{aggregationResult.hospitals_included} Silos</div>
            </div>
          </div>

          {/* Tabbed Aggregation Deep Dive */}
          <div className="glass-panel rounded-2xl border border-slate-800 p-5">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-4">
              <button
                onClick={() => setActiveTab('weights')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  activeTab === 'weights'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Hospital Contribution Weights
              </button>
              <button
                onClick={() => setActiveTab('parameters')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  activeTab === 'parameters'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Feature Aggregation Table
              </button>
              <button
                onClick={() => setActiveTab('logs')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  activeTab === 'logs'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                FedAvg Execution Logs
              </button>
            </div>

            {/* TAB: WEIGHTS */}
            {activeTab === 'weights' && (
              <div className="space-y-4">
                <p className="text-xs text-slate-300">
                  Relative contribution weights ($w_k$) allocated to participating hospital silos:
                </p>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={contributions} margin={{ top: 10, right: 30, left: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="hospital_id" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                      <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} unit="%" />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem' }}
                      />
                      <Bar dataKey="weight_percentage" name="FedAvg Contribution Weight (%)" fill="#f59e0b" radius={[6, 6, 0, 0]}>
                        {contributions.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={['#06b6d4', '#6366f1', '#10b981', '#f59e0b'][index % 4]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* TAB: PARAMETERS */}
            {activeTab === 'parameters' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900/90 text-[11px] uppercase font-bold text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3">Feature Code</th>
                      <th className="px-4 py-3">Clinical Descriptor</th>
                      <th className="px-4 py-3">Aggregated Coefficient</th>
                      <th className="px-4 py-3">Cross-Silo Variance (σ²)</th>
                      <th className="px-4 py-3">Clinical Direction</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {featureShifts.map((f, i) => (
                      <tr key={i} className="hover:bg-slate-900/50 transition">
                        <td className="px-4 py-2.5 font-mono text-cyan-400 font-bold">{f.feature}</td>
                        <td className="px-4 py-2.5 font-semibold text-white">{f.label}</td>
                        <td className="px-4 py-2.5 font-mono font-bold text-slate-100">{f.aggregated_weight}</td>
                        <td className="px-4 py-2.5 font-mono text-slate-400">{f.cross_hospital_variance}</td>
                        <td className="px-4 py-2.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            f.aggregated_weight > 0 ? 'bg-rose-950 text-rose-400 border border-rose-800' : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          }`}>
                            {f.direction}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB: LOGS */}
            {activeTab === 'logs' && (
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-300 h-72 overflow-y-auto space-y-1">
                {logs.map((l, i) => (
                  <div key={i} className="text-slate-300">{l}</div>
                ))}
              </div>
            )}

          </div>

        </div>
      ) : (
        <div className="glass-panel rounded-2xl border border-slate-800 p-12 text-center text-xs text-slate-400 space-y-3">
          <Combine className="h-12 w-12 text-amber-500/50 mx-auto animate-pulse" />
          <h3 className="text-base font-bold text-white">FedAvg Aggregation Idle</h3>
          <p className="max-w-md mx-auto">
            Click "Execute Federated Averaging" above to ingest submitted parameters from Hospital A, B, C, etc., and produce the updated Global Model!
          </p>
        </div>
      )}

    </div>
  );
};

export default AdminAggregation;
