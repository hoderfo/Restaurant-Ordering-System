import { useState, useContext } from 'react';
import axios from 'axios';
import { ApiContext } from '../App';
import { X, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import OrderManagementModal from './OrderManagementModal';

const TableDetailsModal = ({ user, table, reservations = [], onClose, displayStatus, onActionSuccess }) => {
  const API_URL = useContext(ApiContext);
  const [loading, setLoading] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);

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
    try {
      await axios.put(`${API_URL}/tables/${table.id || table._id}`, { status: newStatus });
      toast.success('Table status updated');
      if (onActionSuccess) onActionSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update table status');
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    setLoading(true);
    try {
      await axios.delete(`${API_URL}/tables/${table.id || table._id}`);
      toast.success('Table deleted successfully');
      if (onActionSuccess) onActionSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot delete table. It may have order history.');
    } finally {
      setLoading(false);
      setShowConfirmDelete(false);
    }
  };

  const handleDelete = () => {
    setShowConfirmDelete(true);
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1000 }}>
      <div className="modal-content" style={{ maxWidth: '600px', width: '100%' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h2>Table {table.label}</h2>
            <span style={{
              backgroundColor: getStatusColor(displayStatus || table.status),
              color: 'white',
              padding: '0.2rem 0.5rem',
              borderRadius: '12px',
              fontSize: '0.75rem',
              fontWeight: 'bold'
            }}>
              {displayStatus || table.status}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {user?.role === 'admin' && (
              <button type="button" onClick={handleDelete} className="btn-secondary" style={{ padding: '0.25rem', color: '#EF4444', borderColor: 'transparent' }} title="Delete Table">
                <Trash2 size={20} />
              </button>
            )}
            <button type="button" onClick={onClose} className="btn-secondary" style={{ padding: '0.25rem' }}>
              <X size={20} />
            </button>
          </div>
        </div>



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
                  onClick={() => setShowOrderModal(true)}
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
                      <strong>{new Date(res.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{res.status}</span>
                    </div>
                    <div style={{ fontSize: '0.9rem' }}>
                      {res.bookedBy} ({res.guests} pax)
                    </div>
                    {res.status?.toUpperCase() === 'PENDING' && (() => {
                      // Only show Check In and No Show if the exact start time has passed (no buffer)
                      const isFuture = new Date(res.startTime) > new Date();
                      
                      return (
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                          {!isFuture && (
                            <button className="btn-primary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', flex: 1, backgroundColor: '#10B981', borderColor: '#10B981', color: 'white' }} onClick={async () => {
                              try {
                                await axios.put(`${API_URL}/reservations/${res._id || res.id}/checkin`);
                                toast.success('Guest checked in successfully');
                                if (onActionSuccess) onActionSuccess();
                              } catch (err) { toast.error(err.response?.data?.message || 'Check-in failed'); }
                            }}>Check In</button>
                          )}
                          <button className="btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', flex: 1, backgroundColor: '#EF4444', borderColor: '#EF4444', color: 'white' }} onClick={async () => {
                            try {
                              await axios.put(`${API_URL}/reservations/${res._id || res.id}/cancel`);
                              toast.success('Reservation cancelled');
                              if (onActionSuccess) onActionSuccess();
                            } catch (err) { toast.error(err.response?.data?.message || 'Cancel failed'); }
                          }}>Cancel</button>
                          {!isFuture && (
                            <button className="btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', flex: 1, backgroundColor: '#6B7280', borderColor: '#6B7280', color: 'white' }} onClick={async () => {
                              try {
                                await axios.put(`${API_URL}/reservations/${res._id || res.id}/noshow`);
                                toast.success('Marked as No-Show');
                                if (onActionSuccess) onActionSuccess();
                              } catch (err) { toast.error(err.response?.data?.message || 'No-show failed'); }
                            }}>No-Show</button>
                          )}
                        </div>
                      );
                    })()}
                  </li>
                ))}
              </ul>
            </div>
          )}



        </div>
      </div>

      {showConfirmDelete && (
        <div className="modal-overlay" style={{ zIndex: 1001, backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-content" style={{ maxWidth: '350px', width: '100%', textAlign: 'center' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--text-color)' }}>Delete Table</h3>
            <p style={{ marginBottom: '1.5rem', color: 'var(--text-muted)' }}>
              Are you sure you want to delete <strong>Table {table.label}</strong>?<br/>
              This action will hide the table from the floor plan.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button 
                className="btn-secondary" 
                style={{ flex: 1 }}
                onClick={() => setShowConfirmDelete(false)}
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                className="btn-primary" 
                style={{ flex: 1, backgroundColor: '#EF4444', borderColor: '#EF4444' }}
                onClick={confirmDelete}
                disabled={loading}
              >
                {loading ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showOrderModal && (
        <OrderManagementModal
          table={table}
          onClose={() => {
            setShowOrderModal(false);
            if (onActionSuccess) onActionSuccess(); // Refresh floor plan if order was checked out
          }}
        />
      )}
    </div>
  );
};

export default TableDetailsModal;
