import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import axios from 'axios';
import { ChefHat, LayoutGrid } from 'lucide-react';
import './index.css';

// Components
import FloorPlan from './components/FloorPlan';
import KitchenView from './components/KitchenView';
import AuthModal from './components/AuthModal';

const SOCKET_URL = 'http://localhost:3000';
const API_URL = 'http://localhost:3000/api';

export const SocketContext = React.createContext();
export const ApiContext = React.createContext();

function App() {
  const [socket, setSocket] = useState(null);
  const [user, setUser] = useState(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);
    
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (savedToken && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
        axios.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
      } catch (e) {
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
  };

  return (
    <SocketContext.Provider value={socket}>
      <ApiContext.Provider value={API_URL}>
        <Router>
          <div className="app-container">
            <header className="app-header">
              <div className="logo-container">
                <h1>Tasty Station</h1>
              </div>
              <nav className="main-nav">
                <Link to="/" className="nav-link"><LayoutGrid size={18} /> Floor Plan</Link>
                <Link to="/kitchen" className="nav-link"><ChefHat size={18} /> Kitchen KDS</Link>
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
                <Route path="/" element={<FloorPlan user={user} />} />
                <Route path="/kitchen" element={<KitchenView user={user} />} />
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
                  setAuthModalOpen(false);
                }}
              />
            )}
          </div>
        </Router>
      </ApiContext.Provider>
    </SocketContext.Provider>
  );
}

export default App;
