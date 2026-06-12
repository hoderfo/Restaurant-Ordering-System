import { useState, useEffect, useContext, memo } from 'react';
import axios from 'axios';
import { SocketContext, ApiContext } from '../App';

const KitchenOrderCard = memo(({ order, updateStatus }) => {
  return (
    <div 
      className="glass-panel"
      style={{ 
        borderLeft: `4px solid ${order.status.toLowerCase() === 'pending' ? 'var(--status-reserved)' : 'var(--status-cleaning)'}`,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <div className="flex" style={{ justifyContent: 'space-between', marginBottom: '1rem' }}>
        <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Table {order.table_label}</span>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          {new Date(order.created_at || order.order_created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
      
      <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', flex: 1 }}>
        {order.quantity}x {order.menu_item_name}
      </h3>
      
      {order.note && (
        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#FCA5A5', padding: '0.5rem', borderRadius: '4px', fontSize: '0.9rem', marginBottom: '1rem' }}>
          Note: {order.note}
        </div>
      )}

      <div className="flex gap-2" style={{ marginTop: 'auto' }}>
        {order.status.toLowerCase() === 'pending' && (
          <button 
            className="btn-secondary" 
            style={{ flex: 1, borderColor: 'var(--status-cleaning)', color: 'var(--status-cleaning)' }}
            onClick={() => updateStatus(order.order_item_id, 'in_preparation')}
          >
            Start Prep
          </button>
        )}
        
        {order.status.toLowerCase() === 'in_preparation' && (
          <button 
            className="btn-primary" 
            style={{ flex: 1, backgroundColor: 'var(--status-available)' }}
            onClick={() => updateStatus(order.order_item_id, 'ready')}
          >
            Mark Ready
          </button>
        )}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  return prevProps.order.status === nextProps.order.status &&
         prevProps.order.order_item_id === nextProps.order.order_item_id;
});

const KitchenView = ({ user }) => {
  const socket = useContext(SocketContext);
  const API_URL = useContext(ApiContext);
  
  const [kitchenOrders, setKitchenOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchKitchenOrders = async () => {
    try {
      const response = await axios.get(`${API_URL}/orders/kitchen`);
      if (response.data.success) {
        setKitchenOrders(response.data.kitchenOrders);
      }
    } catch (error) {
      console.error('Error fetching kitchen orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewItem = (item) => {
    setKitchenOrders(prev => {
      // Avoid duplicates
      if (prev.find(o => o.order_item_id === item.order_item_id)) return prev;
      return [...prev, item].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    });
  };

  const handleItemUpdated = (updatedItem) => {
    setKitchenOrders(prev => {
      if (['ready', 'served'].includes(updatedItem.status.toLowerCase())) {
        return prev.filter(o => o.order_item_id !== updatedItem.order_item_id);
      }
      return prev.map(o => o.order_item_id === updatedItem.order_item_id ? { ...o, ...updatedItem } : o);
    });
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchKitchenOrders();

    if (socket) {
      socket.on('order:new_item', handleNewItem);
      socket.on('order:item_updated', handleItemUpdated);
    }

    return () => {
      if (socket) {
        socket.off('order:new_item', handleNewItem);
        socket.off('order:item_updated', handleItemUpdated);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket]);

  const updateStatus = async (itemId, newStatus) => {
    try {
      await axios.put(`${API_URL}/orders/items/${itemId}/status`, { status: newStatus });
      // The socket event will update the UI
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  if (loading) {
    return <div className="text-center mt-4">Loading kitchen display...</div>;
  }

  if (!user || (user.role !== 'admin' && user.role !== 'kitchen')) {
    return (
      <div className="glass-panel text-center" style={{ maxWidth: '500px', margin: '4rem auto' }}>
        <h2 style={{ color: '#EF4444', marginBottom: '1rem' }}>Access Denied</h2>
        <p>Please log in with a Kitchen or Admin account to view the Kitchen Display System.</p>
      </div>
    );
  }

  return (
    <div className="kds-container">
      <div className="flex" style={{ justifyContent: 'space-between', marginBottom: '2rem' }}>
        <h2>Kitchen Display System</h2>
        <button onClick={fetchKitchenOrders} className="btn-secondary">Refresh</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
        {kitchenOrders.length === 0 ? (
          <p className="text-muted">No pending orders. Good job!</p>
        ) : (
          kitchenOrders.map(order => (
            <KitchenOrderCard 
              key={order.order_item_id} 
              order={order} 
              updateStatus={updateStatus} 
            />
          ))
        )}
      </div>
    </div>
  );
};

export default KitchenView;
