import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { 
  ShieldCheck, 
  Activity, 
  Lock, 
  User, 
  ArrowRight, 
  Building2, 
  Sparkles, 
  Server, 
  AlertCircle,
  Cpu,
  Radio
} from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [publicHospitals, setPublicHospitals] = useState([]);
  const { login } = useAuth();
  const navigate = useNavigate();
  const canvasRef = useRef(null);

  // Dynamic Interactive Neural Plexus Particles Animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Particle nodes
    const particleCount = Math.min(Math.floor((width * height) / 22000), 55);
    const particles = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        radius: Math.random() * 2 + 1.2,
        color: ['#06b6d4', '#38bdf8', '#6366f1', '#10b981'][Math.floor(Math.random() * 4)],
        pulse: Math.random() * Math.PI * 2,
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw connection lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 140) {
            const alpha = (1 - dist / 140) * 0.35;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(6, 182, 212, ${alpha})`;
            ctx.lineWidth = 0.85;
            ctx.stroke();
          }
        }
      }

      // Draw nodes
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.pulse += 0.03;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        const currentRadius = p.radius + Math.sin(p.pulse) * 0.5;

        // Outer glow
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, currentRadius * 3);
        gradient.addColorStop(0, p.color);
        gradient.addColorStop(1, 'transparent');

        ctx.beginPath();
        ctx.arc(p.x, p.y, currentRadius * 3, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Core dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, currentRadius, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  useEffect(() => {
    authAPI.getPublicHospitals()
      .then((res) => {
        if (res.data.success) {
          setPublicHospitals(res.data.hospitals);
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!username || !password) {
      setError('Please provide both username and password.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (u, p) => {
    setUsername(u);
    setPassword(p);
    setLoading(true);
    setError('');
    try {
      await login(u, p);
      navigate('/');
    } catch (err) {
      // Fallback try with hospital123
      try {
        await login(u, 'hospital123');
        navigate('/');
      } catch (err2) {
        setError(err.response?.data?.message || err.message || 'Instant login failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 overflow-hidden bg-[#030712]">
      
      {/* 1. Futuristic Neural Network Background Wallpaper */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat transition-all duration-700 scale-105"
        style={{ 
          backgroundImage: `url('/login_bg.jpg')`,
        }}
      />

      {/* 2. Deep Cybernetic Gradient & Vignette Overlay */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#030712]/75 via-[#030712]/55 to-[#030712]/90 backdrop-blur-[1.5px]" />
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,#030712_95%)] pointer-events-none" />

      {/* 3. Interactive Floating Plexus Canvas */}
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 z-0 pointer-events-none opacity-80"
      />

      {/* 4. Top Header & Platform Badge */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center mb-6">
        
        {/* Animated Icon */}
        <div className="flex justify-center mb-3">
          <div className="relative group">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-cyan-500 via-indigo-500 to-emerald-400 opacity-75 blur-md group-hover:opacity-100 transition duration-500 animate-pulse" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-[#090d1a]/90 border border-cyan-400/40 shadow-2xl backdrop-blur-xl">
              <Activity className="h-9 w-9 text-cyan-400" />
            </div>
          </div>
        </div>

        {/* Live Network Status Indicator */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-[11px] font-semibold text-cyan-300 backdrop-blur-md mb-2 shadow-lg shadow-cyan-500/10">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400"></span>
          </span>
          <span>Federated Healthcare Mesh • Online</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white drop-shadow-md">
          HEALIX <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">PLATFORM</span>
        </h1>
        <p className="mt-1.5 text-xs text-slate-300/90 font-medium max-w-sm mx-auto drop-shadow">
          Decentralized Multi-Hospital AI for Privacy-Preserving Cardiovascular Risk Prediction
        </p>
      </div>

      {/* 5. Central Glassmorphism Login Card */}
      <div className="w-full sm:max-w-md relative z-10">
        <div className="relative rounded-3xl p-6 sm:p-8 bg-[#090e1c]/80 backdrop-blur-2xl border border-cyan-500/30 shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_40px_rgba(6,182,212,0.15)]">
          
          {error && (
            <div className="mb-4 rounded-xl border border-rose-500/40 bg-rose-950/60 p-3 text-xs text-rose-200 flex items-center gap-2.5 backdrop-blur-md animate-shake">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-1.5">
                Hospital Node ID / Admin ID
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <User className="h-4 w-4 text-cyan-400/80" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. hospital_a or admin"
                  className="w-full rounded-xl border border-slate-700/80 bg-slate-900/90 pl-10 pr-4 py-2.5 text-xs font-medium text-white placeholder-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30 outline-none transition shadow-inner"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-200 uppercase tracking-wider mb-1.5">
                Node Access Key / Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <Lock className="h-4 w-4 text-cyan-400/80" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-700/80 bg-slate-900/90 pl-10 pr-4 py-2.5 text-xs font-medium text-white placeholder-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/30 outline-none transition shadow-inner"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-500 to-indigo-600 py-3 text-xs font-extrabold text-white shadow-lg shadow-cyan-500/30 transition hover:brightness-110 active:scale-[0.99] disabled:opacity-50 tracking-wide"
            >
              {loading ? (
                <>
                  <Radio className="h-4 w-4 animate-spin" />
                  <span>Connecting to Node Mesh...</span>
                </>
              ) : (
                <>
                  <span>Enter Federated Workspace</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* 1-Click Demonstration Fast-Login Node Grid */}
          <div className="mt-6 pt-5 border-t border-slate-800/80">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                1-Click Demonstration Nodes
              </span>
              <span className="text-[10px] text-cyan-400 font-semibold bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                Instant Access
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {/* Hospital A */}
              <button
                type="button"
                onClick={() => handleQuickLogin('hospital_a', 'hospA123')}
                className="group flex items-center gap-2 rounded-xl border border-cyan-900/40 bg-slate-900/70 p-2.5 text-left text-xs transition hover:border-cyan-400 hover:bg-cyan-950/30 hover:shadow-md hover:shadow-cyan-500/10 cursor-pointer"
              >
                <div className="h-7 w-7 rounded-lg bg-cyan-500/20 text-cyan-300 flex items-center justify-center shrink-0 group-hover:scale-110 transition">
                  <Building2 className="h-3.5 w-3.5" />
                </div>
                <div className="overflow-hidden">
                  <div className="font-bold text-slate-100 text-[11px] truncate group-hover:text-cyan-300 transition">Hospital A</div>
                  <div className="text-[10px] text-slate-400 truncate">300 Records</div>
                </div>
              </button>

              {/* Hospital B */}
              <button
                type="button"
                onClick={() => handleQuickLogin('hospital_b', 'hospB123')}
                className="group flex items-center gap-2 rounded-xl border border-indigo-900/40 bg-slate-900/70 p-2.5 text-left text-xs transition hover:border-indigo-400 hover:bg-indigo-950/30 hover:shadow-md hover:shadow-indigo-500/10 cursor-pointer"
              >
                <div className="h-7 w-7 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0 group-hover:scale-110 transition">
                  <Building2 className="h-3.5 w-3.5" />
                </div>
                <div className="overflow-hidden">
                  <div className="font-bold text-slate-100 text-[11px] truncate group-hover:text-indigo-300 transition">Hospital B</div>
                  <div className="text-[10px] text-slate-400 truncate">250 Records</div>
                </div>
              </button>

              {/* Hospital C */}
              <button
                type="button"
                onClick={() => handleQuickLogin('hospital_c', 'hospC123')}
                className="group flex items-center gap-2 rounded-xl border border-emerald-900/40 bg-slate-900/70 p-2.5 text-left text-xs transition hover:border-emerald-400 hover:bg-emerald-950/30 hover:shadow-md hover:shadow-emerald-500/10 cursor-pointer"
              >
                <div className="h-7 w-7 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0 group-hover:scale-110 transition">
                  <Building2 className="h-3.5 w-3.5" />
                </div>
                <div className="overflow-hidden">
                  <div className="font-bold text-slate-100 text-[11px] truncate group-hover:text-emerald-300 transition">Hospital C</div>
                  <div className="text-[10px] text-slate-400 truncate">200 Records</div>
                </div>
              </button>

              {/* Admin Central Coordinator */}
              <button
                type="button"
                onClick={() => handleQuickLogin('admin', 'admin123')}
                className="group flex items-center gap-2 rounded-xl border border-amber-900/50 bg-amber-950/20 p-2.5 text-left text-xs transition hover:border-amber-400 hover:bg-amber-950/40 hover:shadow-md hover:shadow-amber-500/10 cursor-pointer"
              >
                <div className="h-7 w-7 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0 group-hover:scale-110 transition">
                  <Server className="h-3.5 w-3.5" />
                </div>
                <div className="overflow-hidden">
                  <div className="font-bold text-amber-200 text-[11px] truncate group-hover:text-amber-300 transition">Central Admin</div>
                  <div className="text-[10px] text-amber-400/80 truncate">FedAvg Hub</div>
                </div>
              </button>
            </div>
          </div>

          {/* Privacy Protocol Footer */}
          <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-slate-400 text-center">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span>HIPAA-Compliant Differential Privacy & Federated Security</span>
          </div>

        </div>
      </div>

      {/* Bottom Footer Details */}
      <div className="mt-8 text-center text-[11px] text-slate-500 relative z-10 font-mono">
        Healix Decentralized Healthcare AI v2.5 • McMahan FedAvg Protocol
      </div>

    </div>
  );
};

export default Login;
