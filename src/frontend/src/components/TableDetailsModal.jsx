import React, { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { ApiContext } from '../App';
import { X, CalendarPlus, Trash2 } from 'lucide-react';

const TableDetailsModal = ({ table, reservations = [], onClose, onOpenReservation }) => {
  const API_URL = useContext(ApiContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Realtime updates via props will flow into the parent component, 
  // but we should display the most current table data.
  // We'll use the table prop directly.

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'AVAILABLE': return 'var(--status-available)';
      case 'RESERVED': return 'var(--status-reserved)';
      case 'OCCUPIED': return 'var(--status-occupied)';
      case 'CLEANING': return 'var(--status-cleaning)';
      default: return 'var(--surface-border)';
    }
  };

  const handleStatusChange = async (newStatus) => {
    setLoading(true);
    setError(null);
    try {
      await axios.put(`${API_URL}/tables/${table.id || table._id}`, { status: newStatus });
      // The socket event will update the parent FloorPlan, which will pass the new table prop
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update table status');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete Table ${table.label}?`)) return;
    setLoading(true);
    try {
      await axios.delete(`${API_URL}/tables/${table.id || table._id}`);
      onClose(); // Parent will remove it from state via Socket event
    } catch (err) {
      setError(err.response?.data?.message || 'Cannot delete table. It may have order history.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1000 }}>
      <div className="modal-content" style={{ maxWidth: '400px', width: '100%' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h2>Table {table.label}</h2>
            <span style={{ 
              backgroundColor: getStatusColor(table.status), 
              color: 'white', 
              padding: '0.2rem 0.5rem', 
              borderRadius: '12px', 
              fontSize: '0.75rem',
              fontWeight: 'bold'
            }}>
              {table.status}
            </span>
          </div>
          <button type="button" onClick={onClose} className="btn-secondary" style={{ padding: '0.25rem' }}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: '1.5rem' }}>
          <p className="text-muted">Capacity: {table.capacity} guests</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h4>Quick Actions</h4>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            {table.status?.toUpperCase() === 'CLEANING' && (
              <button 
                className="btn-primary" 
                onClick={() => handleStatusChange('AVAILABLE')}
                disabled={loading}
              >
                Mark Cleaned (Available)
              </button>
            )}
            
            {table.status?.toUpperCase() === 'OCCUPIED' && (
              <>
                <button 
                  className="btn-primary" 
                  disabled={loading}
                >
                  Manage Orders
                </button>
                <button 
                  className="btn-secondary" 
                  onClick={() => handleStatusChange('CLEANING')}
                  disabled={loading}
                >
                  End Meal (Requires Cleaning)
                </button>
              </>
            )}
            
            {table.status?.toUpperCase() !== 'CLEANING' && table.status?.toUpperCase() !== 'OCCUPIED' && (
              <p className="text-muted" style={{ gridColumn: '1 / -1', fontSize: '0.9rem' }}>No quick actions for this status.</p>
            )}
          </div>

          <hr style={{ borderColor: 'var(--surface-border)', opacity: 0.5, margin: '0.5rem 0' }} />

          {reservations.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <h4>Today's Reservations</h4>
              <ul style={{ listStyleType: 'none', padding: 0, marginTop: '0.5rem' }}>
                {reservations.map(res => (
                  <li key={res._id || res.id} style={{ 
                    padding: '0.75rem', 
                    border: '1px solid var(--surface-border)', 
                    borderRadius: '8px', 
                    marginBottom: '0.5rem',
                    backgroundColor: 'var(--surface-color)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <strong>{new Date(res.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</strong>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{res.status}</span>
                    </div>
                    <div style={{ fontSize: '0.9rem' }}>
                      {res.bookedBy} ({res.guests} pax)
                    </div>
                    {res.status?.toUpperCase() === 'PENDING' && (
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                         <button className="btn-primary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', flex: 1 }} onClick={async () => {
                           try {
                             await axios.put(`${API_URL}/reservations/${res._id || res.id}/checkin`);
                           } catch (err) { setError(err.response?.data?.message || 'Check-in failed'); }
                         }}>Check In</button>
                         <button className="btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', flex: 1 }} onClick={async () => {
                           try {
                             await axios.put(`${API_URL}/reservations/${res._id || res.id}/cancel`);
                           } catch (err) { setError(err.response?.data?.message || 'Cancel failed'); }
                         }}>Cancel</button>
                         <button className="btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', flex: 1 }} onClick={async () => {
                           try {
                             await axios.put(`${API_URL}/reservations/${res._id || res.id}/noshow`);
                           } catch (err) { setError(err.response?.data?.message || 'No-show failed'); }
                         }}>No-Show</button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <button 
            className="btn-primary" 
            style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', alignItems: 'center' }}
            onClick={() => onOpenReservation(table.id || table._id)}
          >
            <CalendarPlus size={18} /> Book this Table
          </button>

          <button 
            className="btn-secondary" 
            style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', alignItems: 'center', color: '#EF4444', borderColor: '#EF4444' }}
            onClick={handleDelete}
            disabled={loading}
          >
            <Trash2 size={18} /> Delete Table
          </button>

        </div>
      </div>
    </div>
  );
};

export default TableDetailsModal;
