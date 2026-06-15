import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Auth from './pages/Auth';
import StaffAuth from './pages/StaffAuth';
import Dashboard from './pages/Dashboard';
import ScrollToTop from './components/ScrollToTop';

import ProtectedRoute from './components/ProtectedRoute';
import ReportPortal from './pages/ReportPortal';
import Impact from './pages/Impact';
import Track from './pages/Track';

export default function App() {
  return (
    <div className="min-h-screen">
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/staff-portal" element={<StaffAuth />} />
          <Route path="/impact" element={<Impact />} />
          <Route path="/track" element={<Track />} />
          
          {/* Protected Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/report-portal" element={<ReportPortal />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}
