import { useState } from 'react';
import axios from 'axios';
import { X } from 'lucide-react';

const AuthModal = ({ onClose, onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:3000/api/auth/login', {
        username,
        password
      });

      if (response.data.token && response.data.user) {
        onLogin(response.data.user, response.data.token);
      } else {
        setError('Login failed');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '450px', width: '100%' }}>
        <div className="modal-header">
          <h2>Staff Login</h2>
          <button onClick={onClose} className="btn-secondary" style={{ padding: '0.25rem' }}>
            <X size={20} />
          </button>
        </div>
        
        {error && (
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input 
              type="text" 
              className="form-input"
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              required 
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" 
              className="form-input"
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              required 
            />
          </div>
          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AuthModal;
