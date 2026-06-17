import { useState, useEffect, useContext, memo } from 'react';
import axios from 'axios';
import { SocketContext, ApiContext } from '../App';
import { Plus, X, CalendarPlus } from 'lucide-react';
import TableDetailsModal from './TableDetailsModal';
import ReservationBookingModal from './ReservationBookingModal';
import toast from 'react-hot-toast';

const TableCard = memo(({ table, displayStatus, getStatusColor, onClick }) => {
  return (
    <div
      className="glass-panel"
      style={{
        borderTop: `4px solid ${getStatusColor(displayStatus)}`,
        cursor: 'pointer',
      }}
      onClick={() => onClick(table)}
    >
      <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Table {table.label}</h3>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Capacity: {table.capacity}</p>
      <p style={{ fontWeight: '500', color: getStatusColor(displayStatus), marginTop: '0.5rem' }}>
        {displayStatus}
      </p>
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.table.id === nextProps.table.id &&
    prevProps.table.status === nextProps.table.status &&
    prevProps.table.capacity === nextProps.table.capacity &&
    prevProps.displayStatus === nextProps.displayStatus
  );
});

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
  const [viewDate, setViewDate] = useState(new Date().toISOString().split('T')[0]);

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

  const handleTableUpdate = (updatedTable) => {
    setTables(prev => prev.map(t => t.id === updatedTable.id || t._id === updatedTable.id ? { ...t, ...updatedTable } : t));
  };

  const handleTableCreate = (newTable) => {
    setTables(prev => {
      if (prev.some(t => t.id === newTable.id || t._id === newTable._id)) return prev;
      return [...prev, newTable];
    });
  };

  const handleTableDelete = ({ tableId }) => {
    setTables(prev => prev.filter(t => t.id !== tableId && t._id !== tableId));
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
        setTables((prev) => {
          if (prev.some(t => t.id === response.data.table.id)) return prev;
          return [...prev, response.data.table];
        });
        toast.success(`Table ${response.data.table.label} created successfully`);
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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTables();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchReservations();

    if (socket) {
      socket.on('table:updated', handleTableUpdate);
      socket.on('table:created', handleTableCreate);
      socket.on('table:deleted', handleTableDelete);
      socket.on('reservation:created', fetchReservations);
      socket.on('reservation:updated', fetchReservations);
      socket.on('reservation:deleted', fetchReservations);
      socket.on('order:item_updated', handleOrderItemUpdated);
    }

    return () => {
      if (socket) {
        socket.off('table:updated', handleTableUpdate);
        socket.off('table:created', handleTableCreate);
        socket.off('table:deleted', handleTableDelete);
        socket.off('reservation:created', fetchReservations);
        socket.off('reservation:updated', fetchReservations);
        socket.off('reservation:deleted', fetchReservations);
        socket.off('order:item_updated', handleOrderItemUpdated);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket]);

  const handleOrderItemUpdated = (data) => {
    if (data.status === 'READY') {
      toast.success(`🍽️ ${data.menu_item_name} is READY for Table ${data.table_label}!`, { duration: 5000 });
    }
  };

  const getNextTableNumber = () => {
    if (!tables || tables.length === 0) return 1;
    const numbers = tables
      .map(t => parseInt(t.label.toString().replace(/\D/g, ''), 10))
      .filter(n => !isNaN(n));
    if (numbers.length === 0) return 1;
    return Math.max(...numbers) + 1;
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

  const computeTableDisplayStatus = (table) => {
    const todayStr = new Date().toDateString();
    const viewDateStr = new Date(viewDate).toDateString();
    
    // Real-time status (Occupied/Cleaning) only applies to today.
    // For future/past dates, the physical table is considered 'Available' as a baseline.
    let status = (viewDateStr === todayStr) ? table.status : 'Available';

    const activeRes = reservations.filter(r =>
      (r.tableId === table.id || r.tableId === table._id) &&
      new Date(r.startTime).toDateString() === viewDateStr &&
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

  return (
    <div className="floor-plan-container">
      <div className="flex" style={{ justifyContent: 'space-between', marginBottom: '2rem', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <h2 style={{ margin: 0 }}>Restaurant Floor</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <label style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>View Date:</label>
            <input
              type="date"
              className="form-input"
              style={{ padding: '0.5rem 0.75rem', fontSize: '1rem', width: 'auto', borderRadius: '8px' }}
              value={viewDate}
              onChange={(e) => setViewDate(e.target.value)}
            />
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="btn-primary flex gap-2"
            style={{ alignItems: 'center', padding: '0.6rem 1.2rem', fontSize: '1rem', borderRadius: '8px' }}
            onClick={() => {
              setIsBookingModalOpen(true);
            }}
          >
            <CalendarPlus size={20} /> New Booking
          </button>
          {user?.role === 'admin' || user?.role === 'management' ? (
            <button
              type="button"
              className="btn-primary flex gap-2"
              style={{ alignItems: 'center', padding: '0.6rem 1.2rem', fontSize: '1rem', borderRadius: '8px' }}
              onClick={() => {
                setAddError('');
                setNewLabel(getNextTableNumber().toString());
                setShowAddModal(true);
              }}
            >
              <Plus size={20} /> Add Table
            </button>
          ) : null}
        </div>
      </div>



      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1.5rem' }}>
        {tables.map(table => (
          <TableCard 
            key={table._id || table.id}
            table={table}
            displayStatus={computeTableDisplayStatus(table)}
            getStatusColor={getStatusColor}
            onClick={setSelectedTable}
          />
        ))}
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
                  placeholder="e.g. A1 or 9"
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
            new Date(r.startTime).toDateString() === new Date(viewDate).toDateString() &&
            !['CANCELLED', 'NO_SHOW', 'COMPLETED'].includes(r.status?.toUpperCase())
          )}
          onClose={() => setSelectedTable(null)}
          onActionSuccess={() => {
            setSelectedTable(null);
            fetchTables();
            fetchReservations();
          }}
          displayStatus={computeTableDisplayStatus(selectedTable)}
        />
      )}

      {isBookingModalOpen && (
        <ReservationBookingModal
          tables={tables}
          onClose={() => setIsBookingModalOpen(false)}
          onBookingSuccess={(res) => {
            setIsBookingModalOpen(false);
            setReservations(prev => [...prev, res]);
            toast.success(`Successfully booked! Customer: ${res.bookedBy || res.customerName}, Table: ${res.table?.name || 'Assigned'}, Time: ${new Date(res.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
          }}
        />
      )}
    </div>
  );
};

export default FloorPlan;
