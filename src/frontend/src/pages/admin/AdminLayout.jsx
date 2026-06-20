import React, { useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Activity, Users, MenuSquare, UtensilsCrossed, BarChart3, ShieldCheck } from 'lucide-react';
import './admin.css';

const AdminLayout = ({ user }) => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  if (!user || user.role !== 'admin') {
    return null; // Will redirect via useEffect
  }

  const isActive = (path) => {
    if (path === '/admin' && location.pathname === '/admin') return true;
    if (path !== '/admin' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <Link 
          to="/admin" 
          className={`admin-nav-link ${isActive('/admin') ? 'active' : ''}`}
        >
          <Activity size={16} /> Overview
        </Link>
        <Link 
          to="/admin/users" 
          className={`admin-nav-link ${isActive('/admin/users') ? 'active' : ''}`}
        >
          <Users size={16} /> Staff Users
        </Link>

        <Link 
          to="/admin/analytics" 
          className={`admin-nav-link ${isActive('/admin/analytics') ? 'active' : ''}`}
        >
          <BarChart3 size={16} /> Reports & Logs
        </Link>

        <Link 
          to="/admin/system" 
          className={`admin-nav-link ${isActive('/admin/system') ? 'active' : ''}`}
        >
          <ShieldCheck size={16} /> System
        </Link>

        <Link 
          to="/admin/settings" 
          className={`admin-nav-link ${isActive('/admin/settings') ? 'active' : ''}`}
        >
          <MenuSquare size={16} /> Settings
        </Link>

      </aside>
      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
