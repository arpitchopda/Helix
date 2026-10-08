import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

// Pages
import Login from './pages/Login';
import HospitalDashboard from './pages/HospitalDashboard';
import HospitalData from './pages/HospitalData';
import HospitalTraining from './pages/HospitalTraining';
import HospitalGlobalSync from './pages/HospitalGlobalSync';
import AdminDashboard from './pages/AdminDashboard';
import AdminHospitals from './pages/AdminHospitals';
import AdminAggregation from './pages/AdminAggregation';
import AdminPerformance from './pages/AdminPerformance';
import Prediction from './pages/Prediction';

const ProtectedLayout = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#070b14] text-cyan-400">
        <div className="text-center">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent mx-auto mb-3" />
          <p className="text-xs text-slate-400 font-mono">Initializing Secure Healix Mesh...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-[#070b14] flex flex-col text-slate-100 transition-colors relative overflow-hidden">
      
      {/* 1. Deep Futuristic Neural Network Background Wallpaper */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat pointer-events-none opacity-40 dark:opacity-40 transition-opacity duration-500 scale-105"
        style={{ backgroundImage: `url('/login_bg.jpg')` }}
      />

      {/* 2. Cybernetic Gradient Overlay & Radial Ambient Glow */}
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-[#070b14]/85 via-[#070b14]/75 to-[#070b14]/95 pointer-events-none" />
      <div className="fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_top,rgba(6,182,212,0.14),transparent_65%)] pointer-events-none" />
      <div className="fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(99,102,241,0.12),transparent_70%)] pointer-events-none" />

      {/* 3. Foreground Content with Navbar, Sidebar & Route Pages */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

const DashboardRouter = () => {
  const { isAdmin } = useAuth();
  return isAdmin ? <AdminDashboard /> : <HospitalDashboard />;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route
              path="/"
              element={
                <ProtectedLayout>
                  <DashboardRouter />
                </ProtectedLayout>
              }
            />

            {/* Hospital Routes */}
            <Route
              path="/dataset"
              element={
                <ProtectedLayout>
                  <HospitalData />
                </ProtectedLayout>
              }
            />
            <Route
              path="/training"
              element={
                <ProtectedLayout>
                  <HospitalTraining />
                </ProtectedLayout>
              }
            />
            <Route
              path="/sync"
              element={
                <ProtectedLayout>
                  <HospitalGlobalSync />
                </ProtectedLayout>
              }
            />

            {/* Admin Routes */}
            <Route
              path="/admin/hospitals"
              element={
                <ProtectedLayout>
                  <AdminHospitals />
                </ProtectedLayout>
              }
            />
            <Route
              path="/admin/aggregate"
              element={
                <ProtectedLayout>
                  <AdminAggregation />
                </ProtectedLayout>
              }
            />
            <Route
              path="/admin/performance"
              element={
                <ProtectedLayout>
                  <AdminPerformance />
                </ProtectedLayout>
              }
            />

            {/* Shared Routes */}
            <Route
              path="/predict"
              element={
                <ProtectedLayout>
                  <Prediction />
                </ProtectedLayout>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
