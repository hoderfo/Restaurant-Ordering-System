import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { ApiContext } from '../../App';
import { toast } from 'react-hot-toast';

const AdminSystem = () => {
  const API_URL = useContext(ApiContext);
  const [health, setHealth] = useState(null);
  const [diagnostics, setDiagnostics] = useState(null);
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [healthRes, diagRes, backupRes] = await Promise.all([
        axios.get(`${API_URL}/health/detailed`),
        axios.get(`${API_URL}/health/diagnostics`),
        axios.get(`${API_URL}/backup/history`)
      ]);
      setHealth(healthRes.data);
      setDiagnostics(diagRes.data);
      setBackups(backupRes.data.backups || []);
    } catch (error) {
      toast.error('Failed to load system data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRunBackup = async () => {
    try {
      toast('Running backup...');
      await axios.post(`${API_URL}/backup/now`);
      toast.success('Backup completed successfully');
      fetchData();
    } catch (error) {
      toast.error('Backup failed');
    }
  };

  if (loading) return <div>Loading system data...</div>;

  return (
    <div className="admin-content-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>System Health & Diagnostics</h2>
        <button className="btn-primary" onClick={handleRunBackup}>Run Backup Now</button>
      </div>

      {health && (
        <div className="glass-panel" style={{ padding: '20px', marginBottom: '20px' }}>
          <h3>Health Status: <span style={{ color: health.status === 'healthy' ? '#10B981' : '#EF4444' }}>{health.status?.toUpperCase()}</span></h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginTop: '15px' }}>
            <div>
              <strong>Uptime:</strong> {Math.floor(health.uptime / 3600)}h {Math.floor((health.uptime % 3600) / 60)}m
            </div>
            <div>
              <strong>Memory Usage:</strong> {health.services?.memory?.used || 0} MB
            </div>
            <div>
              <strong>Database Status:</strong> <span style={{ color: health.services?.database?.status === 'healthy' ? '#10B981' : '#EF4444' }}>{health.services?.database?.status?.toUpperCase() || 'UNKNOWN'}</span>
            </div>
          </div>
        </div>
      )}

      {diagnostics && (
        <div className="glass-panel" style={{ padding: '20px', marginBottom: '20px' }}>
          <h3>System Diagnostics</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginTop: '15px' }}>
            <div><strong>Node Version:</strong> {diagnostics.version}</div>
            <div><strong>Environment:</strong> {diagnostics.environment}</div>
            <div><strong>Heap Total:</strong> {diagnostics.metrics?.memory?.heapTotal} MB</div>
            <div><strong>RSS:</strong> {diagnostics.metrics?.memory?.rss} MB</div>
          </div>
        </div>
      )}

      <div className="glass-panel" style={{ padding: '20px' }}>
        <h3>Backup History</h3>
        <div className="table-responsive" style={{ marginTop: '15px' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>File Name</th>
                <th>Size</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {backups.map((backup, idx) => (
                <tr key={idx}>
                  <td>{new Date(backup.createdAt).toLocaleString()}</td>
                  <td>{backup.filename}</td>
                  <td>{Math.round(backup.size / 1024)} KB</td>
                  <td style={{ color: '#10B981' }}>
                    SUCCESS
                  </td>
                </tr>
              ))}
              {backups.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center' }}>No backups found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminSystem;
