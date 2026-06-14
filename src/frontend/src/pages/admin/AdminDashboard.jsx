import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { ApiContext } from '../../App';

const AdminDashboard = () => {
  const API_URL = useContext(ApiContext);
  const [data, setData] = useState({ dashboard: null, activity: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    
    const fetchDashboardData = async () => {
      try {
        const [dashRes, actRes] = await Promise.all([
          axios.get(`${API_URL}/admin/dashboard`),
          axios.get(`${API_URL}/admin/activity`)
        ]);
        
        if (isMounted) {
          setData({
            dashboard: dashRes.data,
            activity: actRes.data
          });
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          console.error("Dashboard fetch error:", err);
          setError(err.response?.data?.error || 'Failed to load dashboard data. Ensure backend is running.');
          setLoading(false);
        }
      }
    };

    fetchDashboardData();
    return () => { isMounted = false; };
  }, [API_URL]);

  if (loading) return <div className="admin-content">Loading...</div>;

  return (
    <div>
      <h2 className="admin-page-title">System Overview</h2>
      
      {error && <div className="error-message">Error: {error}</div>}

      <div className="dashboard-grid">
        <div className="stat-card">
          <div className="stat-title">Total Active Tables</div>
          <div className="stat-value">{data.dashboard?.systemStats?.totalTables || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Menu Items</div>
          <div className="stat-value">{data.dashboard?.systemStats?.totalMenuItems || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Staff Accounts</div>
          <div className="stat-value">{data.dashboard?.systemStats?.totalUsers || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Today's Revenue</div>
          <div className="stat-value">${parseFloat(data.dashboard?.todayMetrics?.revenue || 0).toFixed(2)}</div>
        </div>
      </div>

      <div className="data-panel">
        <div className="data-panel-header">Recent System Activity</div>
        <table className="dense-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>User ID</th>
              <th>Action</th>
              <th>Resource</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {data.activity?.recentActivity?.slice(0, 15).map((log, idx) => (
              <tr key={log.id || idx}>
                <td>{new Date(log.timestamp).toLocaleString()}</td>
                <td>{log.userId || 'System'}</td>
                <td>{log.action}</td>
                <td>{log.resource || '-'}</td>
                <td>{log.success ? 'Success' : 'Failed'}</td>
              </tr>
            ))}
            {(!data.activity?.recentActivity || data.activity.recentActivity.length === 0) && (
              <tr>
                <td colSpan="5">No recent activity found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDashboard;
