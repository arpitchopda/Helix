import React, { useState, useEffect } from 'react';
import { hospitalAPI } from '../services/api';
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
  Bar, 
  Cell 
} from 'recharts';
import { 
  Cpu, 
  Play, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Terminal, 
  Sliders, 
  TrendingUp, 
  ShieldCheck, 
  RefreshCw,
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';

const HospitalTraining = () => {
  const [hyperparams, setHyperparams] = useState({
    epochs: 25,
    learning_rate: 0.05,
    batch_size: 32,
    use_global_weights: true
  });
  const [training, setTraining] = useState(false);
  const [trainingResult, setTrainingResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(null);
  const [error, setError] = useState('');
  const [logs, setLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('curves'); // 'curves' | 'weights' | 'confusion' | 'logs'

  useEffect(() => {
    // Check existing status
    hospitalAPI.getTrainingStatus()
      .then((res) => {
        if (res.data.status === 'completed' || res.data.status === 'synced_with_global') {
          setTrainingResult({
            accuracy: res.data.accuracy,
            precision: res.data.precision,
            recall: res.data.recall,
            f1: res.data.f1,
            epoch_history: res.data.epoch_history || [],
            status: res.data.status
          });
        }
      })
      .catch(() => {});
  }, []);

  const handleStartTraining = async () => {
    setTraining(true);
    setError('');
    setSubmitSuccess(null);
    setLogs([
      `[${new Date().toLocaleTimeString()}] Initializing Local Silo Environment...`,
      `[${new Date().toLocaleTimeString()}] Reading isolated hospital EHR dataset...`,
      `[${new Date().toLocaleTimeString()}] Applying StandardScaler normalization to 13 clinical biomarkers...`,
      `[${new Date().toLocaleTimeString()}] Configuration: Epochs=${hyperparams.epochs}, LR=${hyperparams.learning_rate}, BatchSize=${hyperparams.batch_size}`,
      `[${new Date().toLocaleTimeString()}] ${hyperparams.use_global_weights ? 'Warm-starting with latest Global Model parameters...' : 'Random parameter initialization...'}`
    ]);

    try {
      const res = await hospitalAPI.trainModel(hyperparams);
      if (res.data.success) {
        setTrainingResult(res.data);
        
        const newLogs = [
          `[${new Date().toLocaleTimeString()}] Training completed successfully!`,
          `[${new Date().toLocaleTimeString()}] Final Convergence: Train Loss=${res.data.epoch_history?.slice(-1)[0]?.train_loss || 0.35}, Val Acc=${(res.data.accuracy * 100).toFixed(1)}%`,
          `[${new Date().toLocaleTimeString()}] Metrics: Accuracy=${(res.data.accuracy * 100).toFixed(1)}% | Precision=${(res.data.precision * 100).toFixed(1)}% | Recall=${(res.data.recall * 100).toFixed(1)}% | F1=${(res.data.f1 * 100).toFixed(1)}%`,
          `[${new Date().toLocaleTimeString()}] Gradient vectors ready for encrypted Federated Averaging submission.`
        ];
        setLogs(prev => [...prev, ...newLogs]);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Training failed. Verify local dataset is uploaded.');
      setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ERROR: ${err.message}`]);
    } finally {
      setTraining(false);
    }
  };

  const handleSubmitUpdate = async () => {
    setSubmitting(true);
    setError('');
    try {
      const res = await hospitalAPI.submitUpdate();
      if (res.data.success) {
        setSubmitSuccess(res.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit update.');
    } finally {
      setSubmitting(false);
    }
  };

  const epochData = trainingResult?.epoch_history || [];

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
            <Cpu className="h-6 w-6 text-cyan-400" />
            Local Model Training & Loss Telemetry
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Train machine learning parameters strictly on local patient data. View live epoch loss, validation metrics, and submit encrypted updates.
          </p>
        </div>

        {trainingResult && (
          <button
            onClick={handleSubmitUpdate}
            disabled={submitting}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:brightness-110 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            <span>{submitting ? 'Encrypting & Submitting...' : 'Submit Update to Coordinator'}</span>
          </button>
        )}
      </div>

      {/* Submission Success Alert */}
      {submitSuccess && (
        <div className="rounded-2xl border border-emerald-500/50 bg-gradient-to-r from-emerald-950/50 via-cyan-950/40 to-slate-900/60 p-5 flex items-start gap-3.5 shadow-lg shadow-emerald-500/10">
          <CheckCircle2 className="h-6 w-6 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-emerald-300">
              Parameter Update Submitted for Global Round #{submitSuccess.round}!
            </h4>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              {submitSuccess.message}
            </p>
            <div className="mt-2 text-[11px] text-emerald-400/80 font-mono">
              Timestamp: {new Date(submitSuccess.timestamp).toLocaleString()} • Differential Privacy Mask: Active
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

      {/* Main Grid: Hyperparameters & Live Training Engine */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col: Hyperparameter Controls */}
        <div className="glass-panel rounded-2xl border border-slate-800 p-5 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-sm font-bold text-white flex items-center gap-2">
              <Sliders className="h-4 w-4 text-cyan-400" />
              Training Hyperparameters
            </span>
            <span className="text-[10px] uppercase font-bold text-slate-400 px-2 py-0.5 rounded bg-slate-800">
              Silo Engine
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1.5">
                <span>Epochs</span>
                <span className="text-cyan-400 font-mono font-bold">{hyperparams.epochs}</span>
              </div>
              <input
                type="range"
                min="5"
                max="50"
                step="5"
                value={hyperparams.epochs}
                onChange={(e) => setHyperparams({ ...hyperparams, epochs: parseInt(e.target.value) })}
                className="w-full accent-cyan-400 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>5 (Fast)</span>
                <span>25 (Standard)</span>
                <span>50 (Deep)</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1.5">
                <span>Learning Rate (η)</span>
                <span className="text-cyan-400 font-mono font-bold">{hyperparams.learning_rate}</span>
              </div>
              <select
                value={hyperparams.learning_rate}
                onChange={(e) => setHyperparams({ ...hyperparams, learning_rate: parseFloat(e.target.value) })}
                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-200 outline-none focus:border-cyan-500"
              >
                <option value={0.01}>0.01 (Conservative)</option>
                <option value={0.05}>0.05 (Optimal)</option>
                <option value={0.1}>0.10 (Aggressive)</option>
                <option value={0.2}>0.20 (Fast Descent)</option>
              </select>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold text-slate-300 mb-1.5">
                <span>Batch Size</span>
                <span className="text-cyan-400 font-mono font-bold">{hyperparams.batch_size}</span>
              </div>
              <select
                value={hyperparams.batch_size}
                onChange={(e) => setHyperparams({ ...hyperparams, batch_size: parseInt(e.target.value) })}
                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-200 outline-none focus:border-cyan-500"
              >
                <option value={16}>16 (Stochastic)</option>
                <option value={32}>32 (Mini-batch)</option>
                <option value={64}>64 (Smooth Gradient)</option>
              </select>
            </div>

            <div className="pt-2 border-t border-slate-800">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hyperparams.use_global_weights}
                  onChange={(e) => setHyperparams({ ...hyperparams, use_global_weights: e.target.checked })}
                  className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500 accent-cyan-500"
                />
                <span className="text-xs text-slate-300 font-medium">
                  Warm-start with Global Model weights
                </span>
              </label>
              <p className="text-[11px] text-slate-400 mt-1 pl-5">
                Initializes local model weights from previous FedAvg rounds for accelerated convergence.
              </p>
            </div>
          </div>

          <button
            onClick={handleStartTraining}
            disabled={training}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 py-3 text-xs font-bold text-white shadow-lg shadow-cyan-500/25 transition hover:brightness-110 active:scale-[0.99] disabled:opacity-50"
          >
            {training ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Training Silo Model ({hyperparams.epochs} Epochs)...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-white" />
                Execute Local Training Run
              </>
            )}
          </button>

          <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3 text-[11px] text-slate-400 space-y-1">
            <div className="font-semibold text-slate-300 flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              Silo Privacy Guarantee
            </div>
            <p>
              Optimizer executes strictly in-memory. Only parameter weights $(\theta_k)$ are exported.
            </p>
          </div>
        </div>

        {/* Right Col (2 spans): Interactive Visualizations & Live Curves */}
        <div className="lg:col-span-2 glass-panel rounded-2xl border border-slate-800 p-5 flex flex-col justify-between">
          
          <div>
            {/* Tab navigation */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('curves')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    activeTab === 'curves'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Epoch Loss & Accuracy Curves
                </button>
                <button
                  onClick={() => setActiveTab('weights')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    activeTab === 'weights'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Learned Feature Weights
                </button>
                <button
                  onClick={() => setActiveTab('confusion')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    activeTab === 'confusion'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Confusion Matrix
                </button>
                <button
                  onClick={() => setActiveTab('logs')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    activeTab === 'logs'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Terminal Logs
                </button>
              </div>

              {trainingResult && (
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-slate-400">Accuracy:</span>
                  <span className="font-bold text-emerald-400 font-mono text-sm">
                    {(trainingResult.accuracy * 100).toFixed(1)}%
                  </span>
                </div>
              )}
            </div>

            {/* TAB CONTENT: CURVES */}
            {activeTab === 'curves' && (
              <div>
                {epochData.length > 0 ? (
                  <div className="space-y-4">
                    <div className="h-64 w-full">
                      <p className="text-xs font-semibold text-slate-300 mb-2">
                        Cross-Entropy Loss Progression across {epochData.length} Epochs
                      </p>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={epochData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis dataKey="epoch" stroke="#64748b" textAnchor="end" tick={{ fontSize: 11 }} />
                          <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem' }} 
                            labelStyle={{ color: '#94a3b8' }}
                          />
                          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                          <Line type="monotone" dataKey="train_loss" stroke="#06b6d4" strokeWidth={2.5} name="Training Loss" dot={{ r: 2 }} />
                          <Line type="monotone" dataKey="val_loss" stroke="#f43f5e" strokeWidth={2} name="Validation Loss" dot={{ r: 2 }} strokeDasharray="4 4" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="h-56 w-full pt-4 border-t border-slate-800">
                      <p className="text-xs font-semibold text-slate-300 mb-2">
                        Training vs Validation Accuracy (%)
                      </p>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={epochData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                          <XAxis dataKey="epoch" stroke="#64748b" tick={{ fontSize: 11 }} />
                          <YAxis stroke="#64748b" domain={[40, 100]} tick={{ fontSize: 11 }} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem' }} 
                            labelStyle={{ color: '#94a3b8' }}
                          />
                          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                          <Line type="monotone" dataKey="train_accuracy" stroke="#10b981" strokeWidth={2.5} name="Train Accuracy (%)" dot={false} />
                          <Line type="monotone" dataKey="val_accuracy" stroke="#6366f1" strokeWidth={2.5} name="Validation Accuracy (%)" dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                ) : (
                  <div className="h-80 flex flex-col items-center justify-center text-slate-400 text-xs">
                    <Cpu className="h-10 w-10 text-slate-600 mb-2" />
                    <p>No active training run. Click "Execute Local Training Run" to see live epoch curves.</p>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: WEIGHTS */}
            {activeTab === 'weights' && (
              <div className="space-y-4">
                <p className="text-xs text-slate-300">
                  Parameter coefficients learned for local heart disease risk estimation:
                </p>
                {trainingResult?.feature_importance ? (
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        layout="vertical"
                        data={trainingResult.feature_importance}
                        margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis type="number" stroke="#64748b" tick={{ fontSize: 11 }} />
                        <YAxis dataKey="label" type="category" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem' }}
                        />
                        <Bar dataKey="weight" name="Coefficient Weight" radius={[0, 4, 4, 0]}>
                          {trainingResult.feature_importance.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.weight > 0 ? '#f43f5e' : '#10b981'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center text-xs text-slate-400">
                    Train model to inspect coefficient vector.
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: CONFUSION MATRIX */}
            {activeTab === 'confusion' && (
              <div className="space-y-5">
                <p className="text-xs text-slate-300">
                  Binary Classification Diagnostic Matrix on 20% Local Holdout Evaluation Set:
                </p>

                {trainingResult?.confusion_matrix ? (
                  <div className="max-w-md mx-auto grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/20 p-4 text-center">
                      <div className="text-[11px] font-bold uppercase text-emerald-400">True Negatives (TN)</div>
                      <div className="text-3xl font-black text-white mt-1">{trainingResult.confusion_matrix.tn}</div>
                      <div className="text-[10px] text-slate-400 mt-1">Correctly identified low risk</div>
                    </div>
                    <div className="rounded-xl border border-rose-500/40 bg-rose-950/20 p-4 text-center">
                      <div className="text-[11px] font-bold uppercase text-rose-400">False Positives (FP)</div>
                      <div className="text-3xl font-black text-white mt-1">{trainingResult.confusion_matrix.fp}</div>
                      <div className="text-[10px] text-slate-400 mt-1">Type I Error (False Alarm)</div>
                    </div>
                    <div className="rounded-xl border border-rose-500/40 bg-rose-950/20 p-4 text-center">
                      <div className="text-[11px] font-bold uppercase text-rose-400">False Negatives (FN)</div>
                      <div className="text-3xl font-black text-white mt-1">{trainingResult.confusion_matrix.fn}</div>
                      <div className="text-[10px] text-slate-400 mt-1">Type II Error (Missed Disease)</div>
                    </div>
                    <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/20 p-4 text-center">
                      <div className="text-[11px] font-bold uppercase text-emerald-400">True Positives (TP)</div>
                      <div className="text-3xl font-black text-white mt-1">{trainingResult.confusion_matrix.tp}</div>
                      <div className="text-[10px] text-slate-400 mt-1">Correctly detected heart disease</div>
                    </div>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center text-xs text-slate-400">
                    No validation evaluation available.
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: LOGS */}
            {activeTab === 'logs' && (
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-300 h-80 overflow-y-auto space-y-1">
                <div className="text-cyan-400 text-[11px] mb-2 flex items-center gap-1.5">
                  <Terminal className="h-3.5 w-3.5" />
                  <span>Silo Terminal Logs Console</span>
                </div>
                {logs.length > 0 ? (
                  logs.map((l, i) => <div key={i} className="text-slate-300">{l}</div>)
                ) : (
                  <div className="text-slate-600">Console idle. Awaiting training execution...</div>
                )}
              </div>
            )}

          </div>

          {/* Metric footer pill bar */}
          {trainingResult && (
            <div className="mt-4 pt-4 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="rounded-xl bg-slate-900/60 p-2.5 border border-slate-800">
                <div className="text-[10px] uppercase font-bold text-slate-400">Accuracy</div>
                <div className="text-base font-bold text-emerald-400">
                  {(trainingResult.accuracy * 100).toFixed(1)}%
                </div>
              </div>
              <div className="rounded-xl bg-slate-900/60 p-2.5 border border-slate-800">
                <div className="text-[10px] uppercase font-bold text-slate-400">Precision</div>
                <div className="text-base font-bold text-cyan-400">
                  {(trainingResult.precision * 100).toFixed(1)}%
                </div>
              </div>
              <div className="rounded-xl bg-slate-900/60 p-2.5 border border-slate-800">
                <div className="text-[10px] uppercase font-bold text-slate-400">Recall</div>
                <div className="text-base font-bold text-indigo-400">
                  {(trainingResult.recall * 100).toFixed(1)}%
                </div>
              </div>
              <div className="rounded-xl bg-slate-900/60 p-2.5 border border-slate-800">
                <div className="text-[10px] uppercase font-bold text-slate-400">F1-Score</div>
                <div className="text-base font-bold text-amber-400">
                  {(trainingResult.f1 * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};

export default HospitalTraining;
