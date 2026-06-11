import { useState, useContext } from 'react';
import axios from 'axios';
import { ApiContext } from '../App';
import { X, Calendar, Clock, Users, User, Phone, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

const ReservationBookingModal = ({ onClose, onBookingSuccess, tables = [] }) => {
  const API_URL = useContext(ApiContext);

  const [isWalkIn, setIsWalkIn] = useState(false);
  const [formData, setFormData] = useState({
    bookedBy: '',
    contact: '',
    guests: 2,
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().substring(0, 5),
    duration: 90,
    tableId: '',
    notes: ''
  });

  const [loading, setLoading] = useState(false);
  
  // Warning handling
  const [warningData, setWarningData] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e, override = false, useSuggestedTable = null, useSuggestedTime = null) => {
    if (e) e.preventDefault();
    setLoading(true);
    setWarningData(null);

    try {
      // For Walk-in, date and time should be now
      let finalDate = formData.date;
      let finalTime = formData.time;
      
      if (isWalkIn) {
        const now = new Date();
        finalDate = now.toISOString().split('T')[0];
        finalTime = now.toTimeString().substring(0, 5);
      } else if (useSuggestedTime) {
        const sTime = new Date(useSuggestedTime);
        finalDate = sTime.toISOString().split('T')[0];
        finalTime = sTime.toTimeString().substring(0, 5);
      }

      // Combine date and time
      const dateTimeString = `${finalDate}T${finalTime}:00.000`;

      const payload = {
        ...formData,
        date: dateTimeString,
        tableId: useSuggestedTable || formData.tableId || null,
        isWalkIn,
        overrideWarningConfirmed: override
      };

      if (!payload.tableId) delete payload.tableId;

      const response = await axios.post(`${API_URL}/reservations`, payload);
      
      if (response.data.success) {
        onBookingSuccess({
          ...response.data.reservation,
          table: response.data.table
        });
      }
    } catch (err) {
      if (err.response?.status === 409 && err.response.data.requiresOverride) {
        // Backend asks for confirmation
        setWarningData(err.response.data);
      } else {
        toast.error(err.response?.data?.message || err.message || 'Booking failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1000 }}>
      <div className="modal-content" style={{ maxWidth: '500px', width: '100%' }}>
        <div className="modal-header">
          <h2>New Booking</h2>
          <button type="button" onClick={onClose} className="btn-secondary" style={{ padding: '0.25rem' }}>
            <X size={20} />
          </button>
        </div>

        {warningData ? (
          <div style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#D97706', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
            <h3 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              ⚠️ Capacity/Availability Warning
            </h3>
            <p style={{ marginBottom: '1rem' }}>{warningData.message}</p>
            
            <div className="flex gap-2" style={{ flexDirection: 'column' }}>
              {warningData.suggestedTableId && warningData.suggestedTableId !== formData.tableId && (
                 <button 
                  className="btn-primary" 
                  onClick={() => handleSubmit(null, true, warningData.suggestedTableId)}
                 >
                   Yes, book suggested Table {warningData.suggestedTableId}
                 </button>
              )}
              
              {warningData.suggestedTime && (
                <button 
                  className="btn-primary" 
                  onClick={() => handleSubmit(null, true, null, warningData.suggestedTime)}
                 >
                   Yes, book at suggested time
                 </button>
              )}

              <button 
                className="btn-secondary" 
                onClick={() => handleSubmit(null, true, formData.tableId, null)}
              >
                Proceed anyway (Squeeze in)
              </button>

              <button 
                className="btn-secondary" 
                style={{ marginTop: '0.5rem', backgroundColor: 'transparent', border: '1px solid currentColor' }}
                onClick={() => setWarningData(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            <div className="flex gap-2" style={{ marginBottom: '0.5rem' }}>
              <button 
                type="button" 
                className={!isWalkIn ? 'btn-primary' : 'btn-secondary'} 
                style={{ flex: 1 }}
                onClick={() => setIsWalkIn(false)}
              >
                Reservation
              </button>
              <button 
                type="button" 
                className={isWalkIn ? 'btn-primary' : 'btn-secondary'} 
                style={{ flex: 1 }}
                onClick={() => setIsWalkIn(true)}
              >
                Walk-In
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label><User size={14}/> Customer Name</label>
                <input type="text" className="form-input" name="bookedBy" value={formData.bookedBy} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label><Phone size={14}/> Contact Phone</label>
                <input type="text" className="form-input" name="contact" value={formData.contact} onChange={handleChange} required />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label><Users size={14}/> Party Size</label>
                <input type="number" className="form-input" name="guests" min="1" value={formData.guests} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label><Clock size={14}/> Duration (mins)</label>
                <input type="number" className="form-input" name="duration" min="15" step="15" value={formData.duration} onChange={handleChange} required />
              </div>
            </div>

            {!isWalkIn && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label><Calendar size={14}/> Date</label>
                  <input type="date" className="form-input" name="date" value={formData.date} onChange={handleChange} required={!isWalkIn} />
                </div>
                <div className="form-group">
                  <label><Clock size={14}/> Time</label>
                  <input type="time" className="form-input" name="time" value={formData.time} onChange={handleChange} required={!isWalkIn} />
                </div>
              </div>
            )}

            <div className="form-group">
              <label>Select Table (Optional)</label>
              <select className="form-input" name="tableId" value={formData.tableId} onChange={handleChange}>
                <option value="">-- Auto-assign Best Fit --</option>
                {tables.map(t => (
                  <option key={t.id} value={t.id}>{t.label} (Seats {t.capacity})</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label><FileText size={14}/> Notes</label>
              <textarea className="form-input" name="notes" value={formData.notes} onChange={handleChange} rows="2" placeholder="Allergies, high chair..."></textarea>
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
              {loading ? 'Processing...' : (isWalkIn ? 'Seat Guest' : 'Create Reservation')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ReservationBookingModal;
