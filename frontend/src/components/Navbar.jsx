import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  ShieldCheck, 
  Activity, 
  LogOut, 
  Building2, 
  UserCheck, 
  Network, 
  Radio,
  Sun,
  Moon
} from 'lucide-react';

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const { theme, isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-xl transition-colors">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Brand & Federation Status */}
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 shadow-lg shadow-cyan-500/20">
            <Activity className="h-6 w-6 text-white" />
            <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-white">HEALIX</span>
              <span className="rounded-md bg-cyan-950/80 px-2 py-0.5 text-xs font-semibold text-cyan-400 border border-cyan-800/50">
                FL v2.5
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 hidden sm:flex">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              Decentralized Healthcare AI & Privacy-Preserving Mesh
            </p>
          </div>
        </div>

        {/* Status Indicators, Theme Toggle & User Profile */}
        <div className="flex items-center gap-2.5 sm:gap-4">
          
          {/* Privacy badge */}
          <div className="hidden lg:flex items-center gap-2 rounded-full border border-emerald-900/60 bg-emerald-950/40 px-3 py-1 text-xs font-medium text-emerald-400">
            <Radio className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
            Zero Raw Data Transfer (HIPAA/GDPR)
          </div>

          {/* Dark / Light Mode Toggle Button */}
          <button
            onClick={toggleTheme}
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            aria-label="Toggle Dark/Light Mode"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/80 text-slate-300 transition hover:border-cyan-500/50 hover:bg-slate-800 hover:text-cyan-400 shadow-sm"
          >
            {isDark ? (
              <Sun className="h-4 w-4 text-amber-400 transition-transform duration-300 hover:rotate-90" />
            ) : (
              <Moon className="h-4 w-4 text-indigo-400 transition-transform duration-300 hover:-rotate-12" />
            )}
          </button>

          {/* User & Role Badge */}
          {user && (
            <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-1.5">
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                isAdmin 
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                  : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
              }`}>
                {isAdmin ? <Network className="h-4 w-4" /> : <Building2 className="h-4 w-4" />}
              </div>
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-200">
                    {user.hospital_name || user.username}
                  </span>
                  <span className={`text-[10px] uppercase font-bold px-1.5 py-0.2 rounded ${
                    isAdmin 
                      ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30' 
                      : 'bg-cyan-400/20 text-cyan-300 border border-cyan-400/30'
                  }`}>
                    {user.role}
                  </span>
                </div>
                {user.location && (
                  <p className="text-[11px] text-slate-400 leading-none">{user.location}</p>
                )}
              </div>
            </div>
          )}

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            title="Sign Out"
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2 text-xs font-medium text-slate-400 transition hover:bg-rose-950/40 hover:text-rose-400 hover:border-rose-900/50"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>

        </div>
      </div>
    </header>
  );
};

export default Navbar;
