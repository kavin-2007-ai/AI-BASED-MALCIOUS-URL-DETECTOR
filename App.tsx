import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { OverviewDashboard } from './pages/OverviewDashboard';
import { URLScanner } from './pages/URLScanner';
import { ScanHistoryPage } from './pages/ScanHistoryPage';
import { ModelPerformancePage } from './pages/ModelPerformancePage';
import { AboutProjectPage } from './pages/AboutProjectPage';
import { DashboardStats, ScanResult } from './types';
import { api } from './services/api';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [backendConnected, setBackendConnected] = useState<boolean>(false);
  const [modelOnline, setModelOnline] = useState<boolean>(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loadingStats, setLoadingStats] = useState<boolean>(false);
  const [selectedScanResult, setSelectedScanResult] = useState<ScanResult | null>(null);

  const checkConnectionAndStats = async () => {
    setLoadingStats(true);
    try {
      const health = await api.checkHealth();
      setBackendConnected(true);
      setModelOnline(health.model_loaded);

      const dashboardStats = await api.getDashboardAnalytics();
      setStats(dashboardStats);
    } catch (err) {
      console.warn('Backend connection check failed:', err);
      setBackendConnected(false);
      setModelOnline(false);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    checkConnectionAndStats();
    const interval = setInterval(checkConnectionAndStats, 30000); // 30s heartbeat
    return () => clearInterval(interval);
  }, []);

  const handleSelectScan = async (id: number) => {
    if (id === -1) {
      setActiveTab('history');
      return;
    }
    try {
      const result = await api.getScanDetails(id);
      setSelectedScanResult(result);
      setActiveTab('scanner');
    } catch (err) {
      console.error('Failed to load scan details', err);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#070b14] text-slate-100">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        backendConnected={backendConnected}
        modelOnline={modelOnline}
      />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          {activeTab === 'dashboard' && (
            <OverviewDashboard
              stats={stats}
              loading={loadingStats}
              onRefresh={checkConnectionAndStats}
              onSelectScan={handleSelectScan}
              onNavigateToScanner={() => setActiveTab('scanner')}
            />
          )}

          {activeTab === 'scanner' && (
            <URLScanner
              onScanCompleted={checkConnectionAndStats}
              selectedScanResult={selectedScanResult}
              setSelectedScanResult={setSelectedScanResult}
            />
          )}

          {activeTab === 'history' && (
            <ScanHistoryPage
              onSelectScan={handleSelectScan}
              onScanCleared={checkConnectionAndStats}
            />
          )}

          {activeTab === 'performance' && <ModelPerformancePage />}

          {activeTab === 'about' && <AboutProjectPage />}
        </div>
      </main>
    </div>
  );
};

export default App;
