import React, { useState, useEffect } from 'react';
import { hospitalAPI } from '../services/api';
import { 
  Database, 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Activity, 
  Heart, 
  Users, 
  Table
} from 'lucide-react';

const HospitalData = () => {
  const [dataset, setDataset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchDataset = () => {
    setLoading(true);
    hospitalAPI.getDataset()
      .then((res) => {
        setDataset(res.data);
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Failed to fetch dataset.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDataset();
  }, []);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    setMessage('');
    setError('');

    hospitalAPI.uploadDataset(formData)
      .then((res) => {
        setMessage(res.data.message || `Uploaded ${res.data.record_count} patient records successfully!`);
        fetchDataset();
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Upload failed. Ensure CSV format matches required clinical columns.');
      })
      .finally(() => setUploading(false));
  };

  const featureDescriptions = [
    { code: 'age', name: 'Age', type: 'Integer', desc: 'Age of the patient in years (29 - 77)' },
    { code: 'sex', name: 'Sex', type: 'Binary', desc: '0 = Female, 1 = Male' },
    { code: 'cp', name: 'Chest Pain Type', type: 'Categorical (0-3)', desc: '0: Typical Angina, 1: Atypical, 2: Non-anginal, 3: Asymptomatic' },
    { code: 'trestbps', name: 'Resting Blood Pressure', type: 'mm Hg', desc: 'Resting blood pressure on admission (94 - 200 mm Hg)' },
    { code: 'chol', name: 'Serum Cholesterol', type: 'mg/dl', desc: 'Serum cholesterol level (126 - 564 mg/dl)' },
    { code: 'fbs', name: 'Fasting Blood Sugar > 120', type: 'Binary', desc: '1 = True, 0 = False (> 120 mg/dl)' },
    { code: 'restecg', name: 'Resting ECG', type: 'Categorical (0-2)', desc: '0: Normal, 1: ST-T wave abnormality, 2: Left ventricular hypertrophy' },
    { code: 'thalach', name: 'Max Heart Rate', type: 'bpm', desc: 'Maximum heart rate achieved during exercise (71 - 202 bpm)' },
    { code: 'exang', name: 'Exercise Angina', type: 'Binary', desc: 'Exercise induced angina: 1 = Yes, 0 = No' },
    { code: 'oldpeak', name: 'ST Depression (Oldpeak)', type: 'Float', desc: 'ST depression induced by exercise relative to rest (0.0 - 6.2 mm)' },
    { code: 'slope', name: 'Slope of ST Segment', type: 'Categorical (0-2)', desc: '0: Upsloping, 1: Flat, 2: Downsloping' },
    { code: 'ca', name: 'Major Vessels Colored', type: 'Integer (0-3)', desc: 'Number of major vessels (0-3) colored by fluoroscopy' },
    { code: 'thal', name: 'Thalassemia', type: 'Categorical (0-2)', desc: '0: Normal, 1: Fixed defect, 2: Reversible defect' },
    { code: 'target', name: 'Target Diagnosis', type: 'Binary (0/1)', desc: '0 = Low Risk / Absence of disease, 1 = High Risk / Presence of disease' },
  ];

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
            <Database className="h-6 w-6 text-cyan-400" />
            Clinical EHR Dataset & Ingestion
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Local patient records stored strictly within the hospital boundary. Compliant with HIPAA & GDPR.
          </p>
        </div>

        {/* Upload Button */}
        <label className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-cyan-500/20 cursor-pointer transition hover:brightness-110">
          <Upload className="h-4 w-4" />
          <span>{uploading ? 'Processing CSV...' : 'Upload New Patient CSV'}</span>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>

      {/* Status Alerts */}
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

      {/* Dataset Statistics */}
      {dataset?.stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="glass-panel rounded-xl p-4 border border-slate-800">
            <div className="text-xs text-slate-400">Total Cohort</div>
            <div className="text-xl font-bold text-white mt-1">{dataset.stats.total_records} Patients</div>
          </div>
          <div className="glass-panel rounded-xl p-4 border border-slate-800">
            <div className="text-xs text-slate-400">High Risk Cases</div>
            <div className="text-xl font-bold text-rose-400 mt-1">{dataset.stats.high_risk_count} ({Math.round(dataset.stats.high_risk_count / (dataset.stats.total_records || 1) * 100)}%)</div>
          </div>
          <div className="glass-panel rounded-xl p-4 border border-slate-800">
            <div className="text-xs text-slate-400">Low Risk Cases</div>
            <div className="text-xl font-bold text-emerald-400 mt-1">{dataset.stats.low_risk_count} ({Math.round(dataset.stats.low_risk_count / (dataset.stats.total_records || 1) * 100)}%)</div>
          </div>
          <div className="glass-panel rounded-xl p-4 border border-slate-800">
            <div className="text-xs text-slate-400">Mean Age</div>
            <div className="text-xl font-bold text-cyan-400 mt-1">{dataset.stats.avg_age} Yrs</div>
          </div>
          <div className="glass-panel rounded-xl p-4 border border-slate-800">
            <div className="text-xs text-slate-400">Mean Cholesterol</div>
            <div className="text-xl font-bold text-indigo-400 mt-1">{dataset.stats.avg_cholesterol} mg/dL</div>
          </div>
        </div>
      )}

      {/* Dataset Preview Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Table className="h-4 w-4 text-cyan-400" />
            <span className="text-sm font-bold text-white">Local EHR Data Preview (Sample Records)</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-semibold text-cyan-400/90 bg-cyan-950/60 border border-cyan-800/60 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
              <span>↔</span> Horizontal Scroll Enabled (14 Features)
            </span>
            <span className="text-xs text-slate-400">
              Showing first {dataset?.preview?.length || 0} rows
            </span>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto text-cyan-400 mb-2" />
            Loading patient records...
          </div>
        ) : dataset?.preview?.length > 0 ? (
          <div className="w-full overflow-x-auto p-1">
            <table className="min-w-[1250px] w-full text-left text-xs text-slate-300 whitespace-nowrap">
              <thead className="bg-slate-900/90 text-[11px] uppercase font-bold text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3 sticky left-0 bg-slate-900 z-10">#</th>
                  <th className="px-4 py-3">Age</th>
                  <th className="px-4 py-3">Sex</th>
                  <th className="px-4 py-3">Chest Pain</th>
                  <th className="px-4 py-3">Resting BP (mmHg)</th>
                  <th className="px-4 py-3">Serum Chol (mg/dL)</th>
                  <th className="px-4 py-3">FBS &gt; 120</th>
                  <th className="px-4 py-3">Resting ECG</th>
                  <th className="px-4 py-3">Peak HR (bpm)</th>
                  <th className="px-4 py-3">Exercise Angina</th>
                  <th className="px-4 py-3">ST Depression</th>
                  <th className="px-4 py-3">ST Slope</th>
                  <th className="px-4 py-3">Major Vessels</th>
                  <th className="px-4 py-3">Thalassemia</th>
                  <th className="px-4 py-3">Target Diagnosis</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {dataset.preview.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/50 transition">
                    <td className="px-4 py-2.5 font-mono text-slate-500 sticky left-0 bg-slate-950/80 z-10">{idx + 1}</td>
                    <td className="px-4 py-2.5 font-semibold text-white">{row.age} yrs</td>
                    <td className="px-4 py-2.5">{row.sex === 1 ? 'Male (1)' : 'Female (0)'}</td>
                    <td className="px-4 py-2.5 font-mono">{row.cp}</td>
                    <td className="px-4 py-2.5 font-mono">{row.trestbps}</td>
                    <td className="px-4 py-2.5 font-mono">{row.chol}</td>
                    <td className="px-4 py-2.5">{row.fbs === 1 ? 'High (1)' : 'Normal (0)'}</td>
                    <td className="px-4 py-2.5 font-mono">{row.restecg}</td>
                    <td className="px-4 py-2.5 font-semibold text-cyan-400 font-mono">{row.thalach}</td>
                    <td className="px-4 py-2.5">{row.exang === 1 ? 'Yes (1)' : 'No (0)'}</td>
                    <td className="px-4 py-2.5 font-mono">{row.oldpeak}</td>
                    <td className="px-4 py-2.5 font-mono">{row.slope}</td>
                    <td className="px-4 py-2.5 font-mono">{row.ca}</td>
                    <td className="px-4 py-2.5 font-mono">{row.thal}</td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                        row.target === 1 
                          ? 'bg-rose-950 text-rose-400 border border-rose-800' 
                          : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      }`}>
                        {row.target === 1 ? 'High Risk (1)' : 'Low Risk (0)'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-slate-400">
            No local data found. Upload a patient CSV to begin.
          </div>
        )}
      </div>

      {/* Clinical Feature Schema Dictionary */}
      <div className="glass-panel rounded-2xl border border-slate-800 p-5">
        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <Heart className="h-4 w-4 text-rose-400" />
          Clinical Feature Schema Specification (UCI Heart Disease Standard)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {featureDescriptions.map((f) => (
            <div key={f.code} className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-3 text-xs">
              <div className="flex items-center justify-between mb-1">
                <code className="text-cyan-400 font-mono font-bold text-xs">{f.code}</code>
                <span className="text-[10px] text-slate-400 px-1.5 py-0.2 rounded bg-slate-800">{f.type}</span>
              </div>
              <div className="font-semibold text-slate-200 text-xs">{f.name}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default HospitalData;
