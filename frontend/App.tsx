import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/layout/sidebar';
import { Topbar } from './components/layout/topbar';
import { ClientsPage } from './pages/clients-page';
import { JobsPage } from './pages/jobs-page';
import { ClientDetailPage } from './pages/client-detail-page';
import { JobDetailPage } from './pages/job-detail-page';
import { AnalyticsPage } from './pages/analytics-page';

const AppLayout = ({ children }: { children?: React.ReactNode }) => {
  return (
    <div className="flex min-h-screen w-full bg-gray-100">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6 pt-0">
          <div className="min-h-full w-full rounded-3xl bg-white shadow-sm p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <HashRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Navigate to="/jobs" replace />} />
          <Route path="/clients" element={<ClientsPage />} />
          <Route path="/clients/:id" element={<ClientDetailPage />} />
          <Route path="/jobs" element={<JobsPage />} />
          <Route path="/jobs/:id" element={<JobDetailPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="*" element={<Navigate to="/jobs" replace />} />
        </Routes>
      </AppLayout>
    </HashRouter>
  );
}