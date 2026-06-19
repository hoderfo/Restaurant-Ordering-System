/* eslint-disable react-refresh/only-export-components */
import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import axios from 'axios';
import { ChefHat, LayoutGrid } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import './index.css';

// Components
import FloorPlan from './components/FloorPlan';
import KitchenView from './components/KitchenView';
import AuthModal from './components/AuthModal';
import MenuManagement from './components/MenuManagement';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminSystem from './pages/admin/AdminSystem';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin;
const API_URL = import.meta.env.VITE_API_URL || `${window.location.origin}/api`;

export const SocketContext = React.createContext();
export const ApiContext = React.createContext();

const savedToken = localStorage.getItem('token');
if (savedToken) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
}

const ProtectedRoute = ({ user, children }) => {
  if (!user) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <h2>Welcome to Tasty Station</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '1rem', fontSize: '1.1rem' }}>
          Please click "Staff Login" to access your workspace.
        </p>
      </div>
    );
  }
  return children;
};

function App() {
  const [socket, setSocket] = useState(null);
  const [user, setUser] = useState(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const savedToken = localStorage.getItem('token');

    const newSocket = io(SOCKET_URL, {
      auth: { token: savedToken }
    });
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSocket(newSocket);

    const savedUser = localStorage.getItem('user');
    if (savedToken && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
        axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
      } catch (error) {
        console.error("Failed to parse user data:", error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }

    return () => newSocket.close();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
    if (socket) {
      socket.disconnect();
    }
    navigate('/');
  };

  return (
    <SocketContext.Provider value={socket}>
      <ApiContext.Provider value={API_URL}>
        <div className="app-container">
          <Toaster
            position="top-right"
            toastOptions={{ duration: 3000 }}
          />
          <header className="app-header">
            <div className="logo-container">
              <h1>Tasty Station</h1>
            </div>
            <nav className="main-nav">
              <Link to="/" className="nav-link"><LayoutGrid size={18} /> Floor Plan</Link>
              <Link to="/kitchen" className="nav-link"><ChefHat size={18} /> Kitchen KDS</Link>
              <Link to="/menu" className="nav-link">Menu Management</Link>
              {user && user.role === 'admin' && (
                <Link to="/admin" className="nav-link" style={{ color: '#e84118', fontWeight: 'bold' }}>Admin Portal</Link>
              )}
            </nav>
            <div className="user-actions">
              {user ? (
                <>
                  <span className="user-info">Hello, {user.username} ({user.role})</span>
                  <button onClick={handleLogout} className="btn-secondary">Logout</button>
                </>
              ) : (
                <button onClick={() => setAuthModalOpen(true)} className="btn-primary">Staff Login</button>
              )}
            </div>
          </header>

          <main className="main-content">
            <Routes>
              <Route path="/" element={<ProtectedRoute user={user}><FloorPlan user={user} /></ProtectedRoute>} />
              <Route path="/kitchen" element={<ProtectedRoute user={user}><KitchenView user={user} /></ProtectedRoute>} />
              <Route path="/menu" element={<ProtectedRoute user={user}><MenuManagement user={user} /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute user={user}><AdminLayout user={user} /></ProtectedRoute>}>
                <Route index element={<AdminDashboard />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="menu" element={<MenuManagement user={user} />} />
                <Route path="tables" element={<FloorPlan user={user} />} />
                <Route path="analytics" element={<AdminAnalytics user={user} />} />
                <Route path="system" element={<AdminSystem />} />
              </Route>
            </Routes>
          </main>

          {authModalOpen && (
            <AuthModal
              onClose={() => setAuthModalOpen(false)}
              onLogin={(userData, token) => {
                setUser(userData);
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(userData));
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

                if (socket) {
                  socket.auth = { token };
                  socket.connect();
                }

                setAuthModalOpen(false);

                // Role-based redirection
                if (userData.role === 'admin') {
                  navigate('/admin');
                } else if (userData.role === 'kitchen') {
                  navigate('/kitchen');
                } else if (userData.role === 'floor' || userData.role === 'management') {
                  navigate('/');
                }
              }}
            />
          )}
        </div>
      </ApiContext.Provider>
    </SocketContext.Provider>
  );
}

export default App;
