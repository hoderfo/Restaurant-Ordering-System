import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { SocketContext, ApiContext } from '../App';
import { Plus, X, CalendarPlus } from 'lucide-react';
import TableDetailsModal from './TableDetailsModal';
import ReservationBookingModal from './ReservationBookingModal';

const FloorPlan = ({ user }) => {
  const socket = useContext(SocketContext);
  const API_URL = useContext(ApiContext);
  
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reservations, setReservations] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newCapacity, setNewCapacity] = useState(4);
  const [addError, setAddError] = useState('');
  const [adding, setAdding] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingTableId, setBookingTableId] = useState(null);

  useEffect(() => {
    fetchTables();
    fetchReservations();

    if (socket) {
      socket.on('table:updated', handleTableUpdate);
      socket.on('table:created', handleTableCreate);
      socket.on('table:deleted', handleTableDelete);
      socket.on('reservation:created', fetchReservations);
      socket.on('reservation:updated', fetchReservations);
      socket.on('reservation:deleted', fetchReservations);
    }

    return () => {
      if (socket) {
        socket.off('table:updated', handleTableUpdate);
        socket.off('table:created', handleTableCreate);
        socket.off('table:deleted', handleTableDelete);
        socket.off('reservation:created', fetchReservations);
        socket.off('reservation:updated', fetchReservations);
        socket.off('reservation:deleted', fetchReservations);
      }
    };
  }, [socket]);

  const fetchReservations = async () => {
    try {
      const response = await axios.get(`${API_URL}/reservations`);
      if (response.data.reservations) {
        setReservations(response.data.reservations);
      }
    } catch (error) {
      console.error('Error fetching reservations:', error);
    }
  };

  const fetchTables = async () => {
    try {
      const response = await axios.get(`${API_URL}/tables`);
      if (response.data.tables) {
        setTables(response.data.tables);
      }
    } catch (error) {
      console.error('Error fetching tables:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTable = async (e) => {
    e.preventDefault();
    setAddError('');
    setAdding(true);

    try {
      const response = await axios.post(`${API_URL}/tables`, {
        label: newLabel.trim(),
        capacity: parseInt(newCapacity, 10),
      });

      if (response.data.table) {
        setTables((prev) => [...prev, response.data.table]);
        setShowAddModal(false);
        setNewLabel('');
        setNewCapacity(4);
      }
    } catch (error) {
      setAddError(error.response?.data?.message || error.response?.data?.error || 'Failed to add table');
    } finally {
      setAdding(false);
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

  const computeTableDisplayStatus = (table) => {
    let status = table.status;
    
    const activeRes = reservations.filter(r => 
      (r.tableId === table.id || r.tableId === table._id) && 
      new Date(r.startTime).toDateString() === new Date().toDateString() &&
      !['CANCELLED', 'NO_SHOW', 'COMPLETED'].includes(r.status?.toUpperCase())
    );

    if (activeRes.length > 0 && status?.toUpperCase() === 'AVAILABLE') {
      return 'Reserved';
    }

    return status;
  };

  if (loading) {
    return <div className="text-center mt-4">Loading floor plan...</div>;
  }

  if (loading) {
    return <div className="text-center mt-4">Loading floor plan...</div>;
  }

  return (
    <div className="floor-plan-container">
      <div className="flex" style={{ justifyContent: 'space-between', marginBottom: '2rem' }}>
        <h2>Restaurant Floor</h2>
        <div className="flex gap-2">
          <button
            type="button"
            className="btn-primary flex gap-2"
            style={{ alignItems: 'center' }}
            onClick={() => {
              setBookingTableId(null);
              setIsBookingModalOpen(true);
            }}
          >
            <CalendarPlus size={16} /> New Booking
          </button>
          {user?.role === 'admin' || user?.role === 'management' ? (
            <button
              type="button"
              className="btn-primary flex gap-2"
              style={{ alignItems: 'center' }}
              onClick={() => {
                setAddError('');
                setShowAddModal(true);
              }}
            >
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
        {tables.map(table => {
          const displayStatus = computeTableDisplayStatus(table);
          return (
            <div 
              key={table._id || table.id}
              className="glass-panel"
              style={{ 
                borderTop: `4px solid ${getStatusColor(displayStatus)}`,
                cursor: 'pointer',
                transition: 'transform 0.2s',
              }}
              onClick={() => setSelectedTable(table)}
              onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'none'}
            >
              <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Table {table.label}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Capacity: {table.capacity}</p>
              <p style={{ fontWeight: '500', color: getStatusColor(displayStatus), marginTop: '0.5rem' }}>
                {displayStatus}
              </p>
            </div>
          );
        })}
      </div>

      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Add Table</h2>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="btn-secondary"
                style={{ padding: '0.25rem' }}
              >
                <X size={20} />
              </button>
            </div>

            {addError && (
              <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem' }}>
                {addError}
              </div>
            )}

            <form onSubmit={handleAddTable}>
              <div className="form-group">
                <label>Table label</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. T9"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Capacity</label>
                <input
                  type="number"
                  className="form-input"
                  min="1"
                  max="20"
                  value={newCapacity}
                  onChange={(e) => setNewCapacity(e.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                className="btn-primary"
                style={{ width: '100%', marginTop: '1rem' }}
                disabled={adding}
              >
                {adding ? 'Adding...' : 'Create Table'}
              </button>
            </form>
          </div>
        </div>
      )}

      {selectedTable && (
        <TableDetailsModal 
          table={selectedTable} 
          reservations={reservations.filter(r => 
            (r.tableId === selectedTable.id || r.tableId === selectedTable._id) && 
            new Date(r.startTime).toDateString() === new Date().toDateString() &&
            !['CANCELLED', 'NO_SHOW', 'COMPLETED'].includes(r.status?.toUpperCase())
          )}
          onClose={() => setSelectedTable(null)}
          onOpenReservation={(tableId) => {
            setBookingTableId(tableId);
            setIsBookingModalOpen(true);
            setSelectedTable(null);
          }}
        />
      )}

      {isBookingModalOpen && (
        <ReservationBookingModal 
          preSelectedTableId={bookingTableId}
          tables={tables}
          onClose={() => setIsBookingModalOpen(false)}
          onBookingSuccess={(res) => {
            setIsBookingModalOpen(false);
            window.alert(`Successfully booked! Customer: ${res.bookedBy || res.customerName}, Time: ${new Date(res.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`);
          }}
        />
      )}
    </div>
  );
};

export default FloorPlan;
