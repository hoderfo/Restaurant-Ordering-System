import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { ApiContext, SocketContext } from '../App';
import { X, CreditCard, Check, Minus, Plus, Send } from 'lucide-react';
import toast from 'react-hot-toast';

const OrderManagementModal = ({ table, onClose }) => {
  const API_URL = useContext(ApiContext);
  const socket = useContext(SocketContext);

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [activeCategory, setActiveCategory] = useState('ALL');

  const [stagedItems, setStagedItems] = useState([]);
  const [sendingOrder, setSendingOrder] = useState(false);

  const [isCheckoutMode, setIsCheckoutMode] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [discountType, setDiscountType] = useState('');
  const [discountValue, setDiscountValue] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [bill, setBill] = useState(null);

  useEffect(() => {
    const initializeOrder = async () => {
      try {
        setLoading(true);
        const orderRes = await axios.post(`${API_URL}/orders`, { tableId: table.id || table._id });
        const currentOrder = orderRes.data.order;
        setOrder(currentOrder);

        if (currentOrder.status === 'BILLED') {
          const billRes = await axios.get(`${API_URL}/orders/${currentOrder.id}/bill`);
          setBill(billRes.data.bill);
          setIsCheckoutMode(true);
        } else {
          fetchOrderItems(currentOrder.id);
        }

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

  const handleCardClick = (menuItem) => {
    setStagedItems(prev => {
      const existing = prev.find(item => item.menuItem.id === menuItem.id);
      if (existing) {
        return prev.map(item => item.menuItem.id === menuItem.id ? { ...item, quantity: item.quantity + 1 } : item);
      } else {
        return [...prev, { menuItem, quantity: 1, note: '' }];
      }
    });
  };

  const updateStagedQuantity = (menuItemId, delta) => {
    setStagedItems(prev => {
      return prev.map(item => {
        if (item.menuItem.id === menuItemId) {
          return { ...item, quantity: item.quantity + delta };
        }
        return item;
      }).filter(item => item.quantity > 0);
    });
  };

  const updateStagedNote = (menuItemId, note) => {
    setStagedItems(prev => prev.map(item => item.menuItem.id === menuItemId ? { ...item, note } : item));
  };

  const handleSendOrder = async () => {
    if (stagedItems.length === 0) return;
    setSendingOrder(true);
    try {
      const promises = stagedItems.map(item =>
        axios.post(`${API_URL}/orders/${order.id}/items`, {
          menuItemId: item.menuItem.id,
          quantity: item.quantity,
          note: item.note
        })
      );
      await Promise.all(promises);
      toast.success('Items sent to kitchen!');
      setStagedItems([]);
      fetchOrderItems(order.id);
    } catch (err) {
      toast.error('Failed to send order');
    } finally {
      setSendingOrder(false);
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

  const sentSubtotal = orderItems.reduce((sum, item) => sum + (parseFloat(item.unitPrice) * item.quantity), 0);
  const stagedSubtotal = stagedItems.reduce((sum, item) => sum + (parseFloat(item.menuItem.price) * item.quantity), 0);
  const totalSubtotal = sentSubtotal + stagedSubtotal;

  const categories = ['ALL', ...Array.from(new Set(menuItems.map(m => m.category)))];
  const displayedMenu = activeCategory === 'ALL' ? menuItems : menuItems.filter(m => m.category === activeCategory);

  return (
    <div className="modal-overlay" style={{ zIndex: 1050 }}>
      <div className="modal-content" style={{ maxWidth: '1200px', width: '95%', display: 'flex', flexDirection: 'column', height: '90vh' }}>
        <div className="modal-header">
          <h2>Table {table.label}</h2>
          <button type="button" onClick={onClose} className="btn-secondary" style={{ padding: '0.25rem' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', gap: '2rem', flex: 1, overflow: 'hidden' }}>
          {/* Left Panel: Menu Grid */}
          <div style={{ flex: 2, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {!isCheckoutMode && !bill && (
              <>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', overflowX: 'auto', paddingBottom: '0.5rem', paddingTop: '0.2rem', flexShrink: 0 }}>
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '4px',
                        border: '1px solid #dcdde1',
                        backgroundColor: activeCategory === cat ? '#2f3640' : '#f5f6fa',
                        color: activeCategory === cat ? 'white' : '#2f3640',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                  gap: '12px',
                  overflowY: 'auto',
                  paddingRight: '0.5rem',
                  alignContent: 'start'
                }}>
                  {displayedMenu.map(item => (
                    <div
                      key={item.id}
                      onClick={() => handleCardClick(item)}
                      style={{
                        backgroundColor: 'white',
                        border: '1px solid #dcdde1',
                        borderRadius: '8px',
                        padding: '1rem',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                        cursor: 'pointer',
                        aspectRatio: '1',
                        userSelect: 'none'
                      }}
                    >
                      <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: '#2f3640', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {item.name}
                      </div>
                      <div style={{ color: '#10B981', fontWeight: 'bold' }}>
                        ${Number(item.price).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Right Panel: Cart / Checkout */}
          <div style={{ flex: 1.5, backgroundColor: 'var(--surface-color)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--surface-border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

            {bill ? (
              <div style={{ height: '100%', overflowY: 'auto' }}>
                <div style={{ textAlign: 'center', color: '#10B981', marginBottom: '1rem' }}>
                  <Check size={48} style={{ margin: '0 auto' }} />
                  <h3>Order Paid</h3>
                </div>
                <div style={{ backgroundColor: 'var(--bg-color)', padding: '1rem', borderRadius: '8px', fontSize: '0.9rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}><span>Subtotal:</span> <span>${Number(bill.subtotal).toFixed(2)}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}><span>Tax:</span> <span>${Number(bill.taxAmount).toFixed(2)}</span></div>
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
            ) : isCheckoutMode ? (
              <div style={{ height: '100%', overflowY: 'auto' }}>
                <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><CreditCard size={18} /> Checkout</h3>
                <form onSubmit={handleCheckout} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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

                  <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <button type="submit" className="btn-primary" style={{ backgroundColor: '#10B981', borderColor: '#10B981' }} disabled={checkoutLoading}>
                      {checkoutLoading ? 'Processing...' : `Pay $${totalSubtotal.toFixed(2)} + Tax`}
                    </button>
                    <button type="button" className="btn-secondary" onClick={() => setIsCheckoutMode(false)} disabled={checkoutLoading}>
                      Back to Order
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <h3 style={{ marginBottom: '0.5rem', borderBottom: '1px solid var(--surface-border)', paddingBottom: '0.5rem' }}>Cart</h3>

                <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {/* Sent Items */}
                  {orderItems.length > 0 && (
                    <div>
                      <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 'bold', marginBottom: '0.5rem' }}>Sent Items</div>
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {orderItems.map((item, index) => (
                          <li key={index} style={{ padding: '0.5rem', backgroundColor: '#f9fafb', borderRadius: '4px', border: '1px solid #e5e7eb', fontSize: '0.9rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ fontWeight: 'bold', color: '#4b5563' }}>{item.quantity}x {item.name || item.menuItem?.name}</div>
                              <div style={{ color: '#4b5563' }}>${(parseFloat(item.unitPrice) * item.quantity).toFixed(2)}</div>
                            </div>
                            {item.note && <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '0.2rem' }}>Note: {item.note}</div>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Staged Items */}
                  {stagedItems.length > 0 && (
                    <div>
                      <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: '#10B981', fontWeight: 'bold', marginBottom: '0.5rem' }}>New Items</div>
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {stagedItems.map((item) => (
                          <li key={item.menuItem.id} style={{ padding: '0.5rem', backgroundColor: 'white', borderRadius: '4px', border: '1px solid #10B981', fontSize: '0.9rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                              <div style={{ fontWeight: 'bold', flex: 1 }}>{item.menuItem.name}</div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#f3f4f6', borderRadius: '4px', padding: '0.2rem' }}>
                                <button onClick={() => updateStagedQuantity(item.menuItem.id, -1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem' }}><Minus size={14} /></button>
                                <span style={{ fontWeight: 'bold', minWidth: '1rem', textAlign: 'center' }}>{item.quantity}</span>
                                <button onClick={() => updateStagedQuantity(item.menuItem.id, 1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.2rem' }}><Plus size={14} /></button>
                              </div>

                              <div style={{ fontWeight: 'bold', marginLeft: '1rem', width: '60px', textAlign: 'right' }}>
                                ${(parseFloat(item.menuItem.price) * item.quantity).toFixed(2)}
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              <input
                                type="text"
                                placeholder="Add note..."
                                value={item.note}
                                onChange={(e) => updateStagedNote(item.menuItem.id, e.target.value)}
                                style={{ width: '100%', padding: '0.3rem', fontSize: '0.8rem', border: '1px solid #dcdde1', borderRadius: '4px' }}
                              />
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {orderItems.length === 0 && stagedItems.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      Order is empty.
                    </div>
                  )}
                </div>

                <div style={{ paddingTop: '1rem', borderTop: '2px solid var(--surface-border)', marginTop: 'auto' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '1rem' }}>
                    <span>Subtotal:</span>
                    <span>${totalSubtotal.toFixed(2)}</span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      className="btn-primary"
                      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                      onClick={handleSendOrder}
                      disabled={stagedItems.length === 0 || sendingOrder}
                    >
                      <Send size={16} /> {sendingOrder ? 'Submitting...' : 'Submit'}
                    </button>

                    <button
                      className="btn-secondary"
                      style={{ flex: 1, backgroundColor: orderItems.length > 0 ? '#10B981' : '#f3f4f6', color: orderItems.length > 0 ? 'white' : '#9ca3af', borderColor: orderItems.length > 0 ? '#10B981' : '#e5e7eb' }}
                      onClick={() => setIsCheckoutMode(true)}
                      disabled={orderItems.length === 0}
                    >
                      Checkout
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderManagementModal;
