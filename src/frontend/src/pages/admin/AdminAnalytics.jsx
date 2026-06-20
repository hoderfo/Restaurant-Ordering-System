import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { SocketContext, ApiContext, SettingsContext } from '../../App';
import { toast } from 'react-hot-toast';

const AdminAnalytics = ({ user }) => {
  const socket = useContext(SocketContext);
  const API_URL = useContext(ApiContext);
  const globalSettings = useContext(SettingsContext) || {};
  const currency = globalSettings.CURRENCY_SYMBOL || '$';

  const [metrics, setMetrics] = useState(null);
  const [logs, setLogs] = useState([]);
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportType, setReportType] = useState('daily');

  useEffect(() => {
    if (!socket || !user) return;

    const date = new Date().toISOString().split('T')[0];

    // Listeners
    socket.on('dashboard:metrics', (data) => setMetrics(data));
    socket.on('dashboard:update', (data) => setMetrics(data));
    
    socket.on('auditlog:history', (data) => setLogs(data.logs || []));
    socket.on('auditlog:new', (entry) => {
      setLogs((prev) => [entry, ...prev].slice(0, 100)); // Keep last 100
    });

    // Subscriptions
    socket.emit('dashboard:subscribe', { date });
    if (user.role === 'admin') {
      socket.emit('auditlog:subscribe', { days: 7 });
    }

    return () => {
      socket.off('dashboard:metrics');
      socket.off('dashboard:update');
      socket.off('auditlog:history');
      socket.off('auditlog:new');
    };
  }, [socket, user]);

  const handleGenerateReport = async () => {
    try {
      // Trigger via REST API instead of socket to download PDF directly
      const url = `${API_URL}/reports/export/pdf?type=${reportType}&date=${reportDate}`;
      
      const response = await axios.post(url, {}, {
        responseType: 'blob' // Important for file download
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `report_${reportType}_${reportDate}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
      
      toast.success('Report downloaded successfully');
    } catch (error) {
      console.error(error);
      toast.error('Failed to generate report');
    }
  };

  return (
    <div className="admin-content-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Reports & Logs</h2>
      </div>

      {metrics && metrics.metrics && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginBottom: '30px' }}>
          <div className="glass-panel" style={{ padding: '15px' }}>
            <h4>Total Orders</h4>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{metrics.metrics.order_count}</div>
          </div>
          <div className="glass-panel" style={{ padding: '15px' }}>
            <h4>Revenue</h4>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10B981' }}>{currency}{(metrics.metrics.total_revenue || 0).toFixed(2)}</div>
          </div>
          <div className="glass-panel" style={{ padding: '15px' }}>
            <h4>Active Orders</h4>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{metrics.metrics.active_orders}</div>
          </div>
          <div className="glass-panel" style={{ padding: '15px' }}>
            <h4>Avg Order Value</h4>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{currency}{(metrics.metrics.avg_order_value || 0).toFixed(2)}</div>
          </div>
        </div>
      )}

      <div className="glass-panel" style={{ padding: '20px', marginBottom: '30px' }}>
        <h3>Generate Report (PDF)</h3>
        <div style={{ display: 'flex', gap: '15px', marginTop: '15px', alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px' }}>Report Type</label>
            <select className="form-input" value={reportType} onChange={(e) => setReportType(e.target.value)}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px' }}>Date</label>
            <input 
              type="date" 
              className="form-input" 
              value={reportDate} 
              onChange={(e) => setReportDate(e.target.value)} 
            />
          </div>
          <button className="btn-primary" onClick={handleGenerateReport}>Download PDF</button>
        </div>
      </div>

      {user?.role === 'admin' && (
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h3>Audit Log (Live)</h3>
          <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto', marginTop: '15px' }}>
            <table className="admin-table">
              <thead style={{ position: 'sticky', top: 0, backgroundColor: '#fff' }}>
                <tr>
                  <th>Timestamp</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Resource</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, idx) => (
                  <tr key={log.log_id || idx}>
                    <td>{new Date(log.timestamp).toLocaleString()}</td>
                    <td>{log.username || 'System'}</td>
                    <td>{log.action}</td>
                    <td>{log.resource}</td>
                    <td>
                      <span style={{ color: log.success ? '#10B981' : '#EF4444', fontWeight: 'bold' }}>
                        {log.success ? 'Success' : 'Failed'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAnalytics;
