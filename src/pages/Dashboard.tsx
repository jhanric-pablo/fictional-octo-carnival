import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import CitizenDashboard from './CitizenDashboard';
import AdminDashboard from './AdminDashboard';

export default function DashboardRedirect() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      const wasStaff = localStorage.getItem('was_staff');
      if (wasStaff === 'true') {
        navigate('/staff-portal');
      } else {
        navigate('/auth');
      }
    }
  }, [user, loading, navigate]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return user.role === 'admin' || user.role === 'rescuer' ? <AdminDashboard /> : <CitizenDashboard />;
}
