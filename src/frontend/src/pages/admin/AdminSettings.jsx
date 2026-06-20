import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { ApiContext } from '../../App';
import { toast } from 'react-hot-toast';

const AdminSettings = () => {
  const API_URL = useContext(ApiContext);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = async () => {
    try {
      const res = await axios.get(`${API_URL}/admin/settings`);
      if (res.data.success) {
        setSettings(res.data.settings);
      }
    } catch (error) {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async (key) => {
    try {
      setSaving(true);
      const res = await axios.put(`${API_URL}/admin/settings`, {
        key,
        value: settings[key]
      });
      if (res.data.success) {
        toast.success('Setting saved successfully!');
      }
    } catch (error) {
      toast.error('Failed to save setting');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading settings...</div>;

  return (
    <div className="admin-content-section">
      <div style={{ marginBottom: '20px' }}>
        <h2>Restaurant Settings</h2>
        <p style={{ color: 'var(--text-muted)' }}>Manage core business parameters.</p>
      </div>

      <div className="glass-panel" style={{ padding: '20px', maxWidth: '600px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontWeight: 'bold' }}>Restaurant Name</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input 
                type="text" 
                className="form-input" 
                style={{ flex: 1 }}
                value={settings['RESTAURANT_NAME'] || 'Tasty Station'} 
                onChange={(e) => handleChange('RESTAURANT_NAME', e.target.value)} 
              />
              <button 
                className="btn-primary" 
                onClick={() => handleSave('RESTAURANT_NAME')}
                disabled={saving}
              >
                Save
              </button>
            </div>
          </div>

          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontWeight: 'bold' }}>Theme: Primary Color</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input 
                type="color" 
                className="form-input" 
                style={{ flex: 1, padding: '5px', height: '42px' }}
                value={settings['PRIMARY_COLOR'] || '#4F46E5'} 
                onChange={(e) => handleChange('PRIMARY_COLOR', e.target.value)} 
              />
              <button 
                className="btn-primary" 
                onClick={() => handleSave('PRIMARY_COLOR')}
                disabled={saving}
              >
                Save
              </button>
            </div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Used for main buttons and active states. (Requires refresh to take effect globally)
            </span>
          </div>

          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontWeight: 'bold' }}>Theme: Secondary Color</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input 
                type="color" 
                className="form-input" 
                style={{ flex: 1, padding: '5px', height: '42px' }}
                value={settings['SECONDARY_COLOR'] || '#10B981'} 
                onChange={(e) => handleChange('SECONDARY_COLOR', e.target.value)} 
              />
              <button 
                className="btn-primary" 
                onClick={() => handleSave('SECONDARY_COLOR')}
                disabled={saving}
              >
                Save
              </button>
            </div>
          </div>

          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontWeight: 'bold' }}>Tax Rate (%)</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input 
                type="number" 
                step="0.01" 
                min="0"
                className="form-input" 
                style={{ flex: 1 }}
                value={settings['TAX_RATE'] || '10.0'} 
                onChange={(e) => handleChange('TAX_RATE', e.target.value)} 
              />
              <button 
                className="btn-primary" 
                onClick={() => handleSave('TAX_RATE')}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              This percentage is applied to all active orders during checkout.
            </span>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
