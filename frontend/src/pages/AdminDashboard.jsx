import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../services/api';
import { 
  Network, 
  Building2, 
  Combine, 
  Layers, 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  ArrowUpRight, 
  TrendingUp, 
  ShieldCheck, 
  RefreshCw, 
  Radio, 
  Send,
  Plus
} from 'lucide-react';

const AdminDashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = () => {
    setLoading(true);
    Promise.all([adminAPI.getDashboard(), adminAPI.getClients()])
      .then(([dashRes, clientsRes]) => {
        setDashboard(dashRes.data);
        setClients(clientsRes.data.clients || []);
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Failed to load network dashboard.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-8 w-8 animate-spin text-amber-400" />
          <p className="text-xs text-slate-400">Loading Central Coordination Node telemetry...</p>
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
              <span className="rounded-md bg-amber-500/20 px-2 py-0.5 text-xs font-bold text-amber-300 border border-amber-500/30">
                Central Coordinator Node
              </span>
              <span className="text-xs text-slate-400">Federated Server</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Federated Network Command Center
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Coordinate decentralized hospital silos, aggregate parameter gradients via Federated Averaging (FedAvg), and broadcast global clinical models.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              to="/admin/hospitals"
              className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/90 px-4 py-2.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-700"
            >
              <Plus className="h-4 w-4 text-cyan-400" />
              Add / Manage Hospitals
            </Link>
            <Link
              to="/admin/aggregate"
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-lg shadow-amber-500/20 transition hover:brightness-110"
            >
              <Combine className="h-4 w-4" />
              Run Federated Averaging
            </Link>
          </div>
        </div>
      </div>

      {/* Aggregation Readiness Notification Banner */}
      {dashboard?.pending_updates > 0 ? (
        <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-950/40 via-orange-950/30 to-slate-900/60 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-lg shadow-amber-500/10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 shrink-0 border border-amber-500/30">
              <Combine className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-300">
                {dashboard.pending_updates} Hospital Model Update{dashboard.pending_updates > 1 ? 's' : ''} Ready for Federated Averaging!
              </h4>
              <p className="text-xs text-slate-300">
                Hospital clients have submitted encrypted parameter updates. Execute FedAvg to fuse weights into Global Model Round #{dashboard.current_round + 1}.
              </p>
            </div>
          </div>
          <Link
            to="/admin/aggregate"
            className="shrink-0 flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2 text-xs font-bold text-slate-950 transition hover:bg-amber-300"
          >
            Launch FedAvg Studio
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>Global Model is current (Round #{dashboard?.current_round || 0}). Awaiting new hospital training rounds.</span>
          </div>
          <Link to="/admin/hospitals" className="text-cyan-400 hover:underline text-xs font-medium">
            Manage Hospitals &rarr;
          </Link>
        </div>
      )}

      {/* Network Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Hospital Silos Count */}
        <div className="glass-panel glass-panel-hover rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Hospital Nodes</span>
            <div className="h-8 w-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <Building2 className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">{dashboard?.hospital_count || 0}</div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>All Silos Connected & Secure</span>
          </div>
        </div>

        {/* Pending Updates */}
        <div className="glass-panel glass-panel-hover rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending Submissions</span>
            <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Send className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-400">{dashboard?.pending_updates || 0}</div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
            <span>Awaiting Parameter Aggregation</span>
          </div>
        </div>

        {/* Global FL Rounds */}
        <div className="glass-panel glass-panel-hover rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Global Rounds</span>
            <div className="h-8 w-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-indigo-400">
            Round #{dashboard?.current_round || 0}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
            <span>Accuracy: {dashboard?.latest_accuracy ? `${(dashboard.latest_accuracy * 100).toFixed(1)}%` : 'Pending'}</span>
          </div>
        </div>

        {/* Total Network Cohort */}
        <div className="glass-panel glass-panel-hover rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Patients (Mesh)</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Database className="h-4 w-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-400">
            {dashboard?.total_network_samples || 0}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
            <span>Aggregated without data sharing</span>
          </div>
        </div>

      </div>

      {/* Hospital Nodes Status Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-cyan-400" />
            <span className="text-sm font-bold text-white">Federated Hospital Clients & Live Telemetry</span>
          </div>
          <Link
            to="/admin/hospitals"
            className="flex items-center gap-1 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition"
          >
            <span>Add New Hospital Node</span>
            <Plus className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/90 text-[11px] uppercase font-bold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Hospital Node</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Dataset Cohort</th>
                <th className="px-4 py-3">Training Status</th>
                <th className="px-4 py-3">Local Accuracy</th>
                <th className="px-4 py-3">Submission Status</th>
                <th className="px-4 py-3">Sync Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {clients.map((client) => (
                <tr key={client.id} className="hover:bg-slate-900/50 transition">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-white">{client.name}</div>
                    <code className="text-[10px] text-cyan-400 font-mono">{client.id}</code>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{client.location || 'Medical Center'}</td>
                  <td className="px-4 py-3 font-semibold text-white">{client.dataset_size} Records</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold capitalize ${
                      client.training_status === 'completed'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : (client.training_status === 'synced_with_global'
                            ? 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                            : 'bg-slate-900 text-slate-400 border border-slate-800')
                    }`}>
                      {client.training_status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-emerald-400">
                    {client.accuracy ? `${(client.accuracy * 100).toFixed(1)}%` : 'N/A'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      client.update_status === 'submitted'
                        ? 'bg-amber-950 text-amber-300 border border-amber-700 animate-pulse'
                        : (client.update_status === 'aggregated'
                            ? 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                            : 'bg-slate-900 text-slate-500 border border-slate-800')
                    }`}>
                      {client.update_status === 'submitted' ? 'Update Ready' : client.update_status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                      client.is_synced
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                        : 'bg-amber-950/60 text-amber-400 border border-amber-900/60'
                    }`}>
                      {client.is_synced ? 'Synced (Latest)' : (client.synced_global_round ? `Round #${client.synced_global_round}` : 'Pending Sync')}
                    </span>
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

export default AdminDashboard;
