import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { SocketContext, ApiContext } from '../App';
import { Plus } from 'lucide-react';

const FloorPlan = ({ user }) => {
  const socket = useContext(SocketContext);
  const API_URL = useContext(ApiContext);
  
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTables();

    if (socket) {
      socket.on('table:updated', handleTableUpdate);
      socket.on('table:created', handleTableCreate);
      socket.on('table:deleted', handleTableDelete);
    }

    return () => {
      if (socket) {
        socket.off('table:updated', handleTableUpdate);
        socket.off('table:created', handleTableCreate);
        socket.off('table:deleted', handleTableDelete);
      }
    };
  }, [socket]);

  const fetchTables = async () => {
    try {
      const response = await axios.get(`${API_URL}/tables`);
      if (response.data.success) {
        setTables(response.data.tables);
      }
    } catch (error) {
      console.error('Error fetching tables:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTableUpdate = (updatedTable) => {
    setTables(prev => prev.map(t => t.id === updatedTable.id || t._id === updatedTable.id ? { ...t, ...updatedTable } : t));
  };

  const handleTableCreate = (newTable) => {
    setTables(prev => [...prev, newTable]);
  };

  const handleTableDelete = ({ tableId }) => {
    setTables(prev => prev.filter(t => t.id !== tableId && t._id !== tableId));
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'AVAILABLE': return 'var(--status-available)';
      case 'RESERVED': return 'var(--status-reserved)';
      case 'OCCUPIED': return 'var(--status-occupied)';
      case 'CLEANING': return 'var(--status-cleaning)';
      default: return 'var(--surface-border)';
    }
  };

  if (loading) {
    return <div className="text-center mt-4">Loading floor plan...</div>;
  }

  return (
    <div className="floor-plan-container">
      <div className="flex" style={{ justifyContent: 'space-between', marginBottom: '2rem' }}>
        <h2>Restaurant Floor</h2>
        <div className="flex gap-2">
          {user?.role === 'admin' || user?.role === 'management' ? (
            <button className="btn-primary flex gap-2" style={{ alignItems: 'center' }}>
              <Plus size={16} /> Add Table
            </button>
          ) : null}
        </div>
      </div>

      <div className="legend flex gap-2" style={{ marginBottom: '2rem' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}><span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--status-available)' }}></span> Available</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}><span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--status-reserved)' }}></span> Reserved</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}><span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--status-occupied)' }}></span> Occupied</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}><span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--status-cleaning)' }}></span> Cleaning</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1.5rem' }}>
        {tables.map(table => (
          <div 
            key={table._id || table.id}
            className="glass-panel"
            style={{ 
              borderTop: `4px solid ${getStatusColor(table.status)}`,
              cursor: 'pointer',
              transition: 'transform 0.2s',
            }}
            onClick={() => alert(`Clicked Table ${table.label}`)}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'none'}
          >
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Table {table.label}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Capacity: {table.capacity}</p>
            <p style={{ fontWeight: '500', color: getStatusColor(table.status), marginTop: '0.5rem' }}>
              {table.status}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FloorPlan;
