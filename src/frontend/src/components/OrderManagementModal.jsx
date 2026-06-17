import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { ApiContext, SocketContext } from '../App';
import { X, Plus, CreditCard, ShoppingBag, Check } from 'lucide-react';
import toast from 'react-hot-toast';

const OrderManagementModal = ({ table, onClose }) => {
  const API_URL = useContext(ApiContext);
  const [loading, setLoading] = useState(true);
  
  const [order, setOrder] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  
  const socket = useContext(SocketContext);
  
  // Add item state
  const [selectedMenuItem, setSelectedMenuItem] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');
  const [addingItem, setAddingItem] = useState(false);
  
  // Checkout state
  const [isCheckoutMode, setIsCheckoutMode] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [discountType, setDiscountType] = useState('');
  const [discountValue, setDiscountValue] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  
  // Bill state
  const [bill, setBill] = useState(null);

  useEffect(() => {
    const initializeOrder = async () => {
      try {
        setLoading(true);
        // Get or Create Order
        const orderRes = await axios.post(`${API_URL}/orders`, { tableId: table.id || table._id });
        const currentOrder = orderRes.data.order;
        setOrder(currentOrder);

        // Check if billed
        if (currentOrder.status === 'BILLED') {
           const billRes = await axios.get(`${API_URL}/orders/${currentOrder.id}/bill`);
           setBill(billRes.data.bill);
           setIsCheckoutMode(true);
        } else {
           fetchOrderItems(currentOrder.id);
        }

        // Fetch Menu Items
        const menuRes = await axios.get(`${API_URL}/menu`);
        if (menuRes.data.success) {
           setMenuItems(menuRes.data.menuItems.filter(m => m.status === 'ACTIVE'));
        }
      } catch (error) {
        toast.error('Failed to initialize order');
      } finally {
        setLoading(false);
      }
    };

    initializeOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table]);

  useEffect(() => {
    if (socket) {
      const handleItemUpdated = (data) => {
        setOrderItems(prev => prev.map(item => 
          (item.id === data.order_item_id || item.order_item_id === data.order_item_id)
            ? { ...item, status: data.status }
            : item
        ));
      };

      socket.on('order:item_updated', handleItemUpdated);
      return () => socket.off('order:item_updated', handleItemUpdated);
    }
  }, [socket]);

  const fetchOrderItems = async (orderId) => {
      try {
        const res = await axios.get(`${API_URL}/orders/table/${table.id || table._id}`);
        if (res.data.success) {
            setOrderItems(res.data.orderItems || []);
        }
      } catch (error) {
        console.error('Fetch items error', error);
      }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!selectedMenuItem) return toast.error('Please select an item');
    
    try {
        setAddingItem(true);
        await axios.post(`${API_URL}/orders/${order.id}/items`, {
            menuItemId: selectedMenuItem,
            quantity: parseInt(quantity),
            note
        });
        toast.success('Item added to order');
        setSelectedMenuItem('');
        setQuantity(1);
        setNote('');
        fetchOrderItems(order.id);
    } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to add item');
    } finally {
        setAddingItem(false);
    }
  };

  const handleCheckout = async (e) => {
      e.preventDefault();
      try {
          setCheckoutLoading(true);
          const payload = {
              paymentMethod,
              discountType: discountType || undefined,
              discountValue: discountValue ? parseFloat(discountValue) : undefined
          };
          const res = await axios.post(`${API_URL}/orders/${order.id}/checkout`, payload);
          if (res.data.success) {
              toast.success('Checkout successful!');
              setBill(res.data.bill);
          }
      } catch (error) {
          toast.error(error.response?.data?.message || 'Checkout failed');
      } finally {
          setCheckoutLoading(false);
      }
  };

  if (loading) {
      return (
          <div className="modal-overlay" style={{ zIndex: 1050 }}>
              <div className="modal-content text-center">Loading Order Details...</div>
          </div>
      );
  }

  const subtotal = orderItems.reduce((sum, item) => sum + (parseFloat(item.unitPrice) * item.quantity), 0);

  return (
    <div className="modal-overlay" style={{ zIndex: 1050 }}>
      <div className="modal-content" style={{ maxWidth: '1000px', width: '100%', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
        <div className="modal-header">
          <h2>Table {table.label} - Order Management</h2>
          <button type="button" onClick={onClose} className="btn-secondary" style={{ padding: '0.25rem' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', gap: '2rem', flex: 1, overflow: 'hidden' }}>
            {/* Left side: Order Items list */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
                <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--surface-border)', paddingBottom: '0.5rem' }}>Current Order</h3>
                
                {orderItems.length === 0 ? (
                    <p className="text-muted">No items in this order yet.</p>
                ) : (
                    <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {orderItems.map((item, index) => (
                            <li key={index} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: 'var(--surface-color)', borderRadius: '8px', border: '1px solid var(--surface-border)' }}>
                                <div>
                                    <span style={{ fontWeight: 'bold' }}>{item.quantity}x {item.name || item.menuItem?.name}</span>
                                    {item.note && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Note: {item.note}</div>}
                                    <div style={{ fontSize: '0.75rem', marginTop: '0.25rem', display: 'inline-block', padding: '0.1rem 0.4rem', borderRadius: '4px', backgroundColor: item.status === 'PENDING' ? '#FEF3C7' : item.status === 'SERVED' ? '#D1FAE5' : '#DBEAFE', color: item.status === 'PENDING' ? '#D97706' : item.status === 'SERVED' ? '#059669' : '#2563EB' }}>
                                        {item.status}
                                    </div>
                                </div>
                                <div style={{ fontWeight: 'bold' }}>
                                    ${(parseFloat(item.unitPrice) * item.quantity).toFixed(2)}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
                
                <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '2px dashed var(--surface-border)', display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 'bold' }}>
                    <span>Subtotal:</span>
                    <span>${subtotal.toFixed(2)}</span>
                </div>
            </div>

            {/* Right side: Add Item / Checkout */}
            <div style={{ width: '350px', backgroundColor: 'var(--surface-color)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--surface-border)', display: 'flex', flexDirection: 'column' }}>
                
                {bill ? (
                    <div>
                        <div style={{ textAlign: 'center', color: '#10B981', marginBottom: '1rem' }}>
                            <Check size={48} style={{ margin: '0 auto' }} />
                            <h3>Order Paid</h3>
                        </div>
                        <div style={{ backgroundColor: 'var(--bg-color)', padding: '1rem', borderRadius: '8px', fontSize: '0.9rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}><span>Subtotal:</span> <span>${Number(bill.subtotal).toFixed(2)}</span></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}><span>Tax (10%):</span> <span>${Number(bill.taxAmount).toFixed(2)}</span></div>
                            {Number(bill.discountAmount) > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: '#EF4444' }}>
                                    <span>Discount:</span> <span>-${Number(bill.discountAmount).toFixed(2)}</span>
                                </div>
                            )}
                            <hr style={{ margin: '0.5rem 0', borderColor: 'var(--surface-border)' }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 'bold' }}>
                                <span>Total:</span> <span>${Number(bill.total).toFixed(2)}</span>
                            </div>
                            <div style={{ marginTop: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                                Paid via {bill.paymentMethod}
                            </div>
                        </div>
                        <button className="btn-primary" style={{ width: '100%', marginTop: '1.5rem' }} onClick={onClose}>Close</button>
                    </div>
                ) : !isCheckoutMode ? (
                    <>
                        <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><ShoppingBag size={18} /> Add to Order</h3>
                        <form onSubmit={handleAddItem} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
                            <div className="form-group">
                                <label>Menu Item</label>
                                <select className="form-input" required value={selectedMenuItem} onChange={e => setSelectedMenuItem(e.target.value)}>
                                    <option value="">Select an item...</option>
                                    {menuItems.map(item => (
                                        <option key={item.id} value={item.id}>{item.name} (${Number(item.price).toFixed(2)})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Quantity</label>
                                <input type="number" min="1" className="form-input" required value={quantity} onChange={e => setQuantity(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label>Note (Optional)</label>
                                <input type="text" className="form-input" placeholder="e.g. No onions" value={note} onChange={e => setNote(e.target.value)} />
                            </div>
                            <button type="submit" className="btn-primary" disabled={addingItem}>
                                {addingItem ? 'Adding...' : 'Add Item'}
                            </button>
                        </form>
                        
                        <hr style={{ margin: '1.5rem 0', borderColor: 'var(--surface-border)' }} />
                        
                        <button className="btn-secondary" style={{ width: '100%', backgroundColor: '#10B981', color: 'white', borderColor: '#10B981' }} onClick={() => setIsCheckoutMode(true)} disabled={orderItems.length === 0}>
                            Proceed to Checkout
                        </button>
                    </>
                ) : (
                    <>
                        <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CreditCard size={18} /> Checkout</h3>
                        <form onSubmit={handleCheckout} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
                            <div className="form-group">
                                <label>Payment Method</label>
                                <select className="form-input" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} required>
                                    <option value="CASH">Cash</option>
                                    <option value="CARD">Credit/Debit Card</option>
                                    <option value="EWALLET">E-Wallet</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Discount Type (Optional)</label>
                                <select className="form-input" value={discountType} onChange={e => {
                                    setDiscountType(e.target.value);
                                    if (!e.target.value) setDiscountValue('');
                                }}>
                                    <option value="">None</option>
                                    <option value="PERCENTAGE">Percentage (%)</option>
                                    <option value="FLAT">Flat Amount ($)</option>
                                </select>
                            </div>
                            {discountType && (
                                <div className="form-group">
                                    <label>Discount Value</label>
                                    <input type="number" step="0.01" min="0" className="form-input" required value={discountValue} onChange={e => setDiscountValue(e.target.value)} />
                                </div>
                            )}
                            
                            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <button type="submit" className="btn-primary" style={{ backgroundColor: '#10B981', borderColor: '#10B981' }} disabled={checkoutLoading}>
                                    {checkoutLoading ? 'Processing...' : 'Complete Payment'}
                                </button>
                                <button type="button" className="btn-secondary" onClick={() => setIsCheckoutMode(false)} disabled={checkoutLoading}>
                                    Back to Order
                                </button>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default OrderManagementModal;
