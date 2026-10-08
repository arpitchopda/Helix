import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Database,
  Cpu,
  RefreshCw,
  Sparkles,
  Building,
  Combine,
  LineChart,
  ShieldAlert,
  HelpCircle
} from 'lucide-react';

const Sidebar = () => {
  const { isAdmin, isHospital } = useAuth();

  const hospitalNavItems = [
    { to: '/', label: 'Overview', icon: LayoutDashboard },
    { to: '/dataset', label: 'Clinical Dataset', icon: Database },
    { to: '/training', label: 'Local Model Training', icon: Cpu, badge: 'Live Epochs' },
    { to: '/sync', label: 'Global Model Sync', icon: RefreshCw, badge: 'Distribution' },
    { to: '/predict', label: 'Prediction & SHAP', icon: Sparkles, highlight: true },
  ];

  const adminNavItems = [
    { to: '/', label: 'Network Overview', icon: LayoutDashboard },
    { to: '/admin/hospitals', label: 'Manage Hospitals', icon: Building, badge: 'Add/Manage' },
    { to: '/admin/aggregate', label: 'Federated Averaging', icon: Combine, badge: 'FedAvg' },
    { to: '/admin/performance', label: 'Performance & Baseline', icon: LineChart },
    { to: '/predict', label: 'Global Inference & SHAP', icon: Sparkles, highlight: true },
  ];

  const navItems = isAdmin ? adminNavItems : hospitalNavItems;

  return (
    <aside className="w-64 shrink-0 border-r border-slate-800/80 bg-slate-950/60 p-4 flex flex-col justify-between hidden md:flex min-h-[calc(100vh-4rem)]">
      <div>
        <div className="mb-4 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          {isAdmin ? 'Central Coordinator Node' : 'Hospital Silo Node'}
        </div>

        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `group flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
                      : 'text-slate-400 hover:bg-slate-900/80 hover:text-slate-200 hover:border-slate-800 border border-transparent'
                  } ${item.highlight ? 'ring-1 ring-cyan-500/30 shadow-sm shadow-cyan-500/10' : ''}`
                }
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="rounded-md bg-cyan-950/80 px-1.5 py-0.5 text-[10px] font-semibold text-cyan-400 border border-cyan-800/60">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Privacy Protocol Footer Card */}
      <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-3.5 text-xs">
        <div className="flex items-center gap-2 font-semibold text-emerald-400 mb-1">
          <ShieldAlert className="h-3.5 w-3.5" />
          <span>Privacy Guarantee</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Local patient EHR data never leaves the hospital perimeter. Only mathematical gradients and model weights ($\theta_k$) are shared.
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;
