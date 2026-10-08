import React, { useState } from 'react';
import { predictionAPI } from '../services/api';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Cell, 
  ReferenceLine 
} from 'recharts';
import { 
  Sparkles, 
  Activity, 
  Heart, 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  Sliders, 
  CheckCircle2, 
  RefreshCw, 
  ArrowRight, 
  Info,
  HelpCircle,
  FileText,
  TrendingDown,
  Layers
} from 'lucide-react';

const PRESETS = {
  highRisk: {
    label: 'High Risk Cardiac Patient (Typical Angina & Ischemia)',
    data: {
      age: 63,
      sex: 1,
      cp: 0,
      trestbps: 155,
      chol: 285,
      fbs: 1,
      restecg: 1,
      thalach: 125,
      exang: 1,
      oldpeak: 2.8,
      slope: 0,
      ca: 2,
      thal: 2
    }
  },
  lowRisk: {
    label: 'Low Risk Healthy Patient (Normotensive & Active)',
    data: {
      age: 41,
      sex: 0,
      cp: 2,
      trestbps: 112,
      chol: 175,
      fbs: 0,
      restecg: 0,
      thalach: 172,
      exang: 0,
      oldpeak: 0.2,
      slope: 2,
      ca: 0,
      thal: 0
    }
  },
  borderline: {
    label: 'Borderline Patient (Moderate Hypertension & Age)',
    data: {
      age: 56,
      sex: 1,
      cp: 1,
      trestbps: 138,
      chol: 232,
      fbs: 0,
      restecg: 0,
      thalach: 146,
      exang: 0,
      oldpeak: 1.1,
      slope: 1,
      ca: 1,
      thal: 1
    }
  }
};

const Prediction = () => {
  const [formData, setFormData] = useState(PRESETS.highRisk.data);
  const [predictionResult, setPredictionResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('shap'); // 'shap' | 'details' | 'whatif'

  const handlePredict = async (dataToUse = formData) => {
    setLoading(true);
    setError('');
    try {
      const res = await predictionAPI.predictAndExplain(dataToUse);
      if (res.data.success) {
        setPredictionResult(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Prediction failed. Ensure a global or local model is trained.');
    } finally {
      setLoading(false);
    }
  };

  const applyPreset = (key) => {
    const presetData = PRESETS[key].data;
    setFormData(presetData);
    handlePredict(presetData);
  };

  // Format data for Recharts Diverging SHAP Bar Chart
  const shapChartData = (predictionResult?.feature_explanations || []).map(f => ({
    name: f.label,
    shap_value: f.shap_value,
    impact: f.impact_type,
    raw_value: `${f.value} ${f.unit}`
  }));

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
            <Sparkles className="h-6 w-6 text-cyan-400" />
            Clinical Inference & Deep SHAP Explainability
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Evaluate individual patient cardiovascular disease risk using the federated global model, accompanied by feature-level Shapley additive explanations (XAI).
          </p>
        </div>

        {predictionResult?.model_source && (
          <div className="flex items-center gap-2 rounded-xl bg-slate-900/90 border border-slate-800 px-3.5 py-1.5 text-xs text-slate-300">
            <Layers className="h-4 w-4 text-cyan-400" />
            <span>Engine: <strong className="text-cyan-300">{predictionResult.model_source}</strong></span>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-rose-900/60 bg-rose-950/40 p-4 text-xs text-rose-300 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Preset Profiles Picker Bar */}
      <div className="glass-panel rounded-2xl border border-slate-800 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
          <Sliders className="h-4 w-4 text-cyan-400" />
          <span>Load Clinical Patient Profiles:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => applyPreset('highRisk')}
            className="px-3 py-1.5 rounded-lg border border-rose-900/60 bg-rose-950/40 text-rose-300 text-xs font-semibold hover:bg-rose-900/40 transition"
          >
            🔴 Typical High Risk Profile
          </button>
          <button
            onClick={() => applyPreset('lowRisk')}
            className="px-3 py-1.5 rounded-lg border border-emerald-900/60 bg-emerald-950/40 text-emerald-300 text-xs font-semibold hover:bg-emerald-900/40 transition"
          >
            🟢 Healthy / Low Risk Profile
          </button>
          <button
            onClick={() => applyPreset('borderline')}
            className="px-3 py-1.5 rounded-lg border border-amber-900/60 bg-amber-950/40 text-amber-300 text-xs font-semibold hover:bg-amber-900/40 transition"
          >
            🟡 Borderline Risk Profile
          </button>
        </div>
      </div>

      {/* 2 Column Main Layout: Left = Inputs Form, Right = Prediction Score & Deep SHAP */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Col (5 spans): Patient Biomarker Input Form */}
        <div className="lg:col-span-5 glass-panel rounded-2xl border border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-sm font-bold text-white flex items-center gap-2">
              <Heart className="h-4 w-4 text-rose-400" />
              Patient Biomarkers (13 Features)
            </span>
            <span className="text-[10px] font-bold text-slate-400 px-2 py-0.5 rounded bg-slate-800">
              EHR Record
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            
            {/* Age */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Age (Years)</label>
              <input
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: parseFloat(e.target.value) })}
                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-white focus:border-cyan-500 outline-none"
              />
            </div>

            {/* Sex */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Biological Sex</label>
              <select
                value={formData.sex}
                onChange={(e) => setFormData({ ...formData, sex: parseInt(e.target.value) })}
                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-white focus:border-cyan-500 outline-none"
              >
                <option value={1}>1: Male</option>
                <option value={0}>0: Female</option>
              </select>
            </div>

            {/* Chest Pain (cp) */}
            <div className="col-span-2">
              <label className="block text-slate-300 font-semibold mb-1">Chest Pain Presentation (cp)</label>
              <select
                value={formData.cp}
                onChange={(e) => setFormData({ ...formData, cp: parseInt(e.target.value) })}
                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-white focus:border-cyan-500 outline-none"
              >
                <option value={0}>0: Typical Angina (High Ischemic Risk)</option>
                <option value={1}>1: Atypical Angina</option>
                <option value={2}>2: Non-Anginal Pain</option>
                <option value={3}>3: Asymptomatic</option>
              </select>
            </div>

            {/* Resting BP */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Resting BP (mm Hg)</label>
              <input
                type="number"
                value={formData.trestbps}
                onChange={(e) => setFormData({ ...formData, trestbps: parseFloat(e.target.value) })}
                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-white focus:border-cyan-500 outline-none"
              />
            </div>

            {/* Cholesterol */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Cholesterol (mg/dl)</label>
              <input
                type="number"
                value={formData.chol}
                onChange={(e) => setFormData({ ...formData, chol: parseFloat(e.target.value) })}
                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-white focus:border-cyan-500 outline-none"
              />
            </div>

            {/* Fasting Blood Sugar */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">FBS &gt; 120 mg/dl</label>
              <select
                value={formData.fbs}
                onChange={(e) => setFormData({ ...formData, fbs: parseInt(e.target.value) })}
                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-white focus:border-cyan-500 outline-none"
              >
                <option value={0}>0: False (&lt;=120 mg/dl)</option>
                <option value={1}>1: True (&gt;120 mg/dl)</option>
              </select>
            </div>

            {/* Resting ECG */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Resting ECG</label>
              <select
                value={formData.restecg}
                onChange={(e) => setFormData({ ...formData, restecg: parseInt(e.target.value) })}
                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-white focus:border-cyan-500 outline-none"
              >
                <option value={0}>0: Normal</option>
                <option value={1}>1: ST-T Wave Abnormality</option>
                <option value={2}>2: LV Hypertrophy</option>
              </select>
            </div>

            {/* Max HR */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Peak Heart Rate (bpm)</label>
              <input
                type="number"
                value={formData.thalach}
                onChange={(e) => setFormData({ ...formData, thalach: parseFloat(e.target.value) })}
                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-white focus:border-cyan-500 outline-none"
              />
            </div>

            {/* Exercise Angina */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Exercise Angina</label>
              <select
                value={formData.exang}
                onChange={(e) => setFormData({ ...formData, exang: parseInt(e.target.value) })}
                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-white focus:border-cyan-500 outline-none"
              >
                <option value={0}>0: No (Asymptomatic)</option>
                <option value={1}>1: Yes (Exertional)</option>
              </select>
            </div>

            {/* ST Depression (oldpeak) */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">ST Depression (mm)</label>
              <input
                type="number"
                step="0.1"
                value={formData.oldpeak}
                onChange={(e) => setFormData({ ...formData, oldpeak: parseFloat(e.target.value) })}
                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-white focus:border-cyan-500 outline-none"
              />
            </div>

            {/* Slope */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">ST Slope</label>
              <select
                value={formData.slope}
                onChange={(e) => setFormData({ ...formData, slope: parseInt(e.target.value) })}
                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-white focus:border-cyan-500 outline-none"
              >
                <option value={0}>0: Upsloping</option>
                <option value={1}>1: Flat</option>
                <option value={2}>2: Downsloping</option>
              </select>
            </div>

            {/* CA (Fluoroscopy vessels) */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Colored Vessels (ca)</label>
              <select
                value={formData.ca}
                onChange={(e) => setFormData({ ...formData, ca: parseInt(e.target.value) })}
                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-white focus:border-cyan-500 outline-none"
              >
                <option value={0}>0 Vessels</option>
                <option value={1}>1 Vessel</option>
                <option value={2}>2 Vessels</option>
                <option value={3}>3 Vessels</option>
              </select>
            </div>

            {/* Thalassemia */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Thal Perfusion</label>
              <select
                value={formData.thal}
                onChange={(e) => setFormData({ ...formData, thal: parseInt(e.target.value) })}
                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-white focus:border-cyan-500 outline-none"
              >
                <option value={0}>0: Normal</option>
                <option value={1}>1: Fixed Defect</option>
                <option value={2}>2: Reversible Defect</option>
              </select>
            </div>

          </div>

          <button
            onClick={() => handlePredict()}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 py-3 text-xs font-bold text-white shadow-lg shadow-cyan-500/25 transition hover:brightness-110 active:scale-[0.99] disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Computing SHAP Attributions...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Run AI Diagnostic & Explain (SHAP)
              </>
            )}
          </button>
        </div>

        {/* Right Col (7 spans): Diagnostic Results & SHAP Deep Dive */}
        <div className="lg:col-span-7 space-y-5">
          
          {predictionResult ? (
            <div className="space-y-5">
              
              {/* Primary Risk Classification Score Card */}
              <div className={`rounded-2xl p-6 border transition-all ${
                predictionResult.prediction === 1
                  ? 'border-rose-500/40 bg-gradient-to-br from-rose-950/40 via-slate-900/90 to-slate-950 shadow-xl shadow-rose-950/20'
                  : 'border-emerald-500/40 bg-gradient-to-br from-emerald-950/40 via-slate-900/90 to-slate-950 shadow-xl shadow-emerald-950/20'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {predictionResult.prediction === 1 ? (
                        <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold text-xs border border-rose-500/40">
                          <AlertTriangle className="h-3.5 w-3.5" /> High Risk Detected
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs border border-emerald-500/40">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Low Risk (Normal)
                        </span>
                      )}
                      <span className="text-xs text-slate-400">Cardiovascular Disease Prediction</span>
                    </div>

                    <h2 className="text-3xl font-black text-white mt-2">
                      {predictionResult.risk_level}
                    </h2>
                    <p className="text-xs text-slate-300 mt-1">
                      Calculated Risk Probability: <strong className="text-cyan-300 font-mono text-sm">{(predictionResult.probability * 100).toFixed(1)}%</strong>
                    </p>
                  </div>

                  {/* Visual Probability Gauge Bar */}
                  <div className="sm:w-44 text-right">
                    <div className="text-xs text-slate-400 mb-1">Disease Probability</div>
                    <div className="h-4 w-full bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          predictionResult.prediction === 1
                            ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                            : 'bg-gradient-to-r from-cyan-500 to-emerald-500'
                        }`}
                        style={{ width: `${Math.max(5, Math.min(100, predictionResult.probability * 100))}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                      <span>0% (Safe)</span>
                      <span>100% (High)</span>
                    </div>
                  </div>
                </div>

                {/* Plain-English Clinical Summary Narrative */}
                <div className="mt-4 pt-4 border-t border-slate-800/80 text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-1.5 font-bold text-cyan-300 mb-1">
                    <FileText className="h-3.5 w-3.5" />
                    <span>Clinical AI Synthesis</span>
                  </div>
                  {predictionResult.clinical_narrative}
                </div>
              </div>

              {/* Tab navigation for SHAP explanations */}
              <div className="glass-panel rounded-2xl border border-slate-800 p-5 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                  <button
                    onClick={() => setActiveTab('shap')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      activeTab === 'shap'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    SHAP Feature Impact Chart
                  </button>
                  <button
                    onClick={() => setActiveTab('details')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      activeTab === 'details'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Clinical Breakdown Table
                  </button>
                  <button
                    onClick={() => setActiveTab('whatif')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      activeTab === 'whatif'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Actionable Counterfactuals
                  </button>
                </div>

                {/* TAB 1: SHAP DIVERGING BAR CHART */}
                {activeTab === 'shap' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-300">
                      <span>Feature Shapley Attribution Score ($\phi_i$):</span>
                      <div className="flex items-center gap-3 text-[11px]">
                        <span className="flex items-center gap-1 text-rose-400">
                          <span className="h-2 w-2 rounded-full bg-rose-500"></span> Escalates Risk (+)
                        </span>
                        <span className="flex items-center gap-1 text-emerald-400">
                          <span className="h-2 w-2 rounded-full bg-emerald-500"></span> Protective / Lowers Risk (-)
                        </span>
                      </div>
                    </div>

                    <div className="h-96 w-full pt-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          layout="vertical"
                          data={shapChartData}
                          margin={{ top: 5, right: 30, left: 110, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis type="number" stroke="#64748b" tick={{ fontSize: 11 }} />
                          <YAxis dataKey="name" type="category" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                          <Tooltip
                            formatter={(val, name, item) => [`${val > 0 ? '+' : ''}${val}`, `Impact (Raw: ${item.payload.raw_value})`]}
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem' }}
                          />
                          <ReferenceLine x={0} stroke="#475569" strokeWidth={1.5} />
                          <Bar dataKey="shap_value" name="SHAP Attribution" radius={[4, 4, 4, 4]}>
                            {shapChartData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={entry.shap_value > 0 ? '#f43f5e' : '#10b981'}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* TAB 2: CLINICAL BREAKDOWN TABLE */}
                {activeTab === 'details' && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-900/90 text-[11px] uppercase font-bold text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="px-3 py-2.5">Feature</th>
                          <th className="px-3 py-2.5">Patient Value</th>
                          <th className="px-3 py-2.5">Normal Reference</th>
                          <th className="px-3 py-2.5">SHAP Impact</th>
                          <th className="px-3 py-2.5">Clinical Explanation</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {predictionResult.feature_explanations.map((f, idx) => (
                          <tr key={idx} className="hover:bg-slate-900/40">
                            <td className="px-3 py-2 font-semibold text-white">{f.label}</td>
                            <td className="px-3 py-2 font-mono font-bold text-cyan-300">{f.value} {f.unit}</td>
                            <td className="px-3 py-2 text-slate-400">{f.normal_range}</td>
                            <td className="px-3 py-2">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                                f.shap_value > 0 
                                  ? 'bg-rose-950 text-rose-300 border border-rose-800' 
                                  : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              }`}>
                                {f.shap_value > 0 ? `+${f.shap_value}` : f.shap_value} ({f.percentage_impact}%)
                              </span>
                            </td>
                            <td className="px-3 py-2 text-[11px] text-slate-300">{f.clinical_insight}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* TAB 3: ACTIONABLE COUNTERFACTUALS */}
                {activeTab === 'whatif' && (
                  <div className="space-y-4 text-xs">
                    <div className="rounded-xl border border-cyan-900/50 bg-cyan-950/20 p-4">
                      <h4 className="font-bold text-cyan-300 flex items-center gap-1.5 mb-2">
                        <TrendingDown className="h-4 w-4" />
                        Cardiologist Action Plan & Counterfactual Risk Mitigation
                      </h4>
                      <p className="text-slate-300 text-[11px] leading-relaxed mb-3">
                        Based on the primary high-weight SHAP factors, the following interventions will have the highest mathematical and clinical impact on reducing disease risk:
                      </p>
                      
                      <ul className="space-y-2">
                        {predictionResult.recommendations?.map((rec, i) => (
                          <li key={i} className="flex items-start gap-2 text-slate-200">
                            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

              </div>

            </div>
          ) : (
            <div className="glass-panel rounded-2xl border border-slate-800 p-12 text-center text-xs text-slate-400 space-y-3">
              <Sparkles className="h-10 w-10 text-cyan-400/50 mx-auto animate-pulse" />
              <h3 className="text-base font-bold text-white">Diagnostic Engine Ready</h3>
              <p className="max-w-md mx-auto">
                Select a preset patient profile above or adjust individual biomarkers, then click "Run AI Diagnostic & Explain (SHAP)" to inspect the full explainability analysis!
              </p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};

export default Prediction;
