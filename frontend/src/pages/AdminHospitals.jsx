import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { 
  Building2, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Database, 
  ShieldCheck, 
  RefreshCw, 
  User, 
  Lock, 
  MapPin, 
  Sparkles,
  Layers,
  Cpu
} from 'lucide-react';

const AdminHospitals = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    hospital_name: '',
    hospital_id: '',
    username: '',
    password: '',
    location: '',
    sample_size: 250
  });

  const fetchHospitals = () => {
    setLoading(true);
    adminAPI.getClients()
      .then((res) => {
        setClients(res.data.clients || []);
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Failed to fetch hospital clients.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchHospitals();
  }, []);

  const handleNameChange = (name) => {
    const idSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    setFormData(prev => ({
      ...prev,
      hospital_name: name,
      hospital_id: idSlug,
      username: idSlug ? idSlug : prev.username,
      password: idSlug ? `${idSlug}123` : prev.password
    }));
  };

  const handleAddHospital = async (e) => {
    e.preventDefault();
    if (!formData.hospital_name || !formData.hospital_id || !formData.username || !formData.password) {
      setError('Please fill in all required hospital details.');
      return;
    }

    setSubmitting(true);
    setError('');
    setMessage('');

    try {
      const res = await adminAPI.addHospital(formData);
      if (res.data.success) {
        setMessage(res.data.message || `Hospital '${formData.hospital_name}' registered successfully!`);
        setShowAddModal(false);
        setFormData({
          hospital_name: '',
          hospital_id: '',
          username: '',
          password: '',
          location: '',
          sample_size: 250
        });
        fetchHospitals();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register hospital.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteHospital = async (hospitalId, hospitalName) => {
    if (!window.confirm(`Are you sure you want to delete and decommission '${hospitalName}' (${hospitalId})?`)) {
      return;
    }

    try {
      const res = await adminAPI.deleteHospital(hospitalId);
      if (res.data.success) {
        setMessage(res.data.message || `Hospital '${hospitalName}' deleted.`);
        fetchHospitals();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete hospital.');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
            <Building2 className="h-6 w-6 text-cyan-400" />
            Hospital Silos Management & Onboarding
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Register new hospital healthcare nodes, configure synthetic patient cohorts, and manage silo connectivity across the federated network.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-cyan-500/20 transition hover:brightness-110"
        >
          <Plus className="h-4 w-4" />
          <span>Register New Hospital</span>
        </button>
      </div>

      {/* Alerts */}
      {message && (
        <div className="rounded-xl border border-emerald-900/60 bg-emerald-950/40 p-4 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{message}</span>
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-rose-900/60 bg-rose-950/40 p-4 text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Hospital Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {clients.map((c) => (
          <div
            key={c.id}
            className="glass-panel glass-panel-hover rounded-2xl p-5 border border-slate-800 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between mb-3">
                <div className="h-10 w-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
                  <Building2 className="h-5 w-5" />
                </div>
                <button
                  onClick={() => handleDeleteHospital(c.id, c.name)}
                  title="Decommission Hospital"
                  className="rounded-lg p-1.5 text-slate-500 hover:bg-rose-950/50 hover:text-rose-400 transition"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <h3 className="text-base font-bold text-white mb-0.5">{c.name}</h3>
              <div className="flex items-center gap-1 text-xs text-slate-400 mb-3">
                <MapPin className="h-3 w-3 text-slate-500" />
                <span>{c.location || 'Regional Medical Facility'}</span>
              </div>

              <div className="space-y-2 text-xs pt-3 border-t border-slate-800/80">
                <div className="flex justify-between">
                  <span className="text-slate-400">Node ID:</span>
                  <code className="text-cyan-400 font-mono font-bold text-[11px]">{c.id}</code>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Login Username:</span>
                  <span className="text-slate-300 font-mono">{c.username}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Patient Cohort:</span>
                  <span className="font-semibold text-white">{c.dataset_size} Records</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Local Model Acc:</span>
                  <span className="font-bold text-emerald-400">
                    {c.accuracy ? `${(c.accuracy * 100).toFixed(1)}%` : 'Not trained'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Update Status:</span>
                  <span className={`font-semibold capitalize ${
                    c.update_status === 'submitted' ? 'text-amber-400 animate-pulse' : 'text-slate-400'
                  }`}>
                    {c.update_status === 'submitted' ? 'Pending FedAvg' : c.update_status}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <span>Sync State:</span>
              <span className={`px-2 py-0.5 rounded font-bold ${
                c.is_synced ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-slate-900 text-slate-400'
              }`}>
                {c.is_synced ? 'Synced (Latest)' : (c.synced_global_round ? `Round #${c.synced_global_round}` : 'Pending Sync')}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Hospital Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-lg rounded-2xl border border-slate-700 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="h-5 w-5 text-cyan-400" />
                Register New Federated Hospital Node
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddHospital} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Hospital Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Hospital D - Apollo Heart Hospital"
                  value={formData.hospital_name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-cyan-500 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Hospital ID (Slug) *
                  </label>
                  <input
                    type="text"
                    placeholder="hospital_d"
                    value={formData.hospital_id}
                    onChange={(e) => setFormData({ ...formData, hospital_id: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-cyan-500 outline-none font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Location / City
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Dallas, TX"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-cyan-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Login Username *
                  </label>
                  <input
                    type="text"
                    placeholder="hospital_d"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-cyan-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Login Password *
                  </label>
                  <input
                    type="text"
                    placeholder="hospD123"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-white focus:border-cyan-500 outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Synthetic EHR Patient Cohort Size ({formData.sample_size} records)
                </label>
                <input
                  type="range"
                  min="100"
                  max="600"
                  step="50"
                  value={formData.sample_size}
                  onChange={(e) => setFormData({ ...formData, sample_size: parseInt(e.target.value) })}
                  className="w-full accent-cyan-400 bg-slate-800 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>100 Records</span>
                  <span>300 (Standard)</span>
                  <span>600 Records</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-cyan-500/25 transition hover:brightness-110 disabled:opacity-50"
                >
                  {submitting ? 'Creating Silo & Seeding Data...' : 'Create & Onboard Hospital'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminHospitals;
