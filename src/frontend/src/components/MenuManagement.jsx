import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { ApiContext } from '../App';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';

const CATEGORIES = ['STARTER', 'MAIN', 'DESSERT', 'BEVERAGE'];
const STATUSES = ['ACTIVE', 'SOLD_OUT', 'INACTIVE'];

const MenuManagement = ({ user }) => {
  const API_URL = useContext(ApiContext);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: 'MAIN',
    status: 'ACTIVE'
  });

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/menu`);
      if (response.data.success) {
        setMenuItems(response.data.menuItems);
      }
    } catch (error) {
      console.error('Error fetching menu items:', error);
      toast.error('Failed to load menu items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenuItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        description: item.description || '',
        price: item.price,
        category: item.category,
        status: item.status
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        category: 'MAIN',
        status: 'ACTIVE'
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await axios.put(`${API_URL}/menu/${editingItem.id}`, formData);
        toast.success('Menu item updated successfully');
      } else {
        await axios.post(`${API_URL}/menu`, formData);
        toast.success('Menu item created successfully');
      }
      setIsModalOpen(false);
      fetchMenuItems();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to mark this item as inactive?')) {
      try {
        await axios.delete(`${API_URL}/menu/${id}`);
        toast.success('Item marked as inactive');
        fetchMenuItems();
      } catch (error) {
        toast.error('Failed to delete item');
      }
    }
  };

  const handleStatusToggle = async (item) => {
    const newStatus = item.status === 'ACTIVE' ? 'SOLD_OUT' : 'ACTIVE';
    try {
      await axios.put(`${API_URL}/menu/${item.id}`, { status: newStatus });
      toast.success(`Item marked as ${newStatus}`);
      fetchMenuItems();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  if (!user || !['admin', 'management'].includes(user.role)) {
    return (
      <div className="glass-panel text-center" style={{ maxWidth: '500px', margin: '4rem auto' }}>
        <h2 style={{ color: '#EF4444', marginBottom: '1rem' }}>Access Denied</h2>
        <p>Please log in with a Management or Admin account to view the Menu Management system.</p>
      </div>
    );
  }

  const groupedItems = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = menuItems.filter(i => i.category === cat);
    return acc;
  }, {});

  return (
    <div className="menu-container" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Menu Management</h2>
        <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => handleOpenModal()}>
          <Plus size={20} /> Add Item
        </button>
      </div>

      {loading ? (
        <p className="text-center">Loading menu...</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
          {CATEGORIES.map(category => (
            groupedItems[category]?.length > 0 && (
              <div key={category}>
                <h3 style={{ borderBottom: '2px solid var(--surface-border)', paddingBottom: '0.5rem', marginBottom: '1.5rem', color: 'var(--primary-color)' }}>
                  {category}
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                  {groupedItems[category].map(item => (
                    <div key={item.id} className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', opacity: item.status === 'SOLD_OUT' ? 0.7 : 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <h4 style={{ margin: 0, fontSize: '1.2rem', color: item.status === 'SOLD_OUT' ? 'var(--text-muted)' : 'var(--text-color)' }}>{item.name}</h4>
                        <span style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>${Number(item.price).toFixed(2)}</span>
                      </div>
                      
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', flex: 1 }}>{item.description || 'No description'}</p>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--surface-border)' }}>
                        <span 
                          style={{ 
                            fontSize: '0.8rem', 
                            padding: '0.2rem 0.5rem', 
                            borderRadius: '12px', 
                            backgroundColor: item.status === 'ACTIVE' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                            color: item.status === 'ACTIVE' ? '#10B981' : '#EF4444',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                          }}
                          onClick={() => handleStatusToggle(item)}
                        >
                          {item.status}
                        </span>
                        
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="btn-secondary" style={{ padding: '0.4rem' }} onClick={() => handleOpenModal(item)}>
                            <Edit2 size={16} />
                          </button>
                          <button className="btn-secondary" style={{ padding: '0.4rem', color: '#EF4444', borderColor: 'transparent' }} onClick={() => handleDelete(item.id)}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header" style={{ marginBottom: '1.5rem' }}>
              <h2>{editingItem ? 'Edit Menu Item' : 'Add Menu Item'}</h2>
              <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary" style={{ padding: '0.25rem' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label>Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  required 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label>Description</label>
                <textarea 
                  className="form-input" 
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Price ($)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    min="0" 
                    className="form-input" 
                    required 
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                  />
                </div>

                <div className="form-group" style={{ flex: 1 }}>
                  <label>Category</label>
                  <select 
                    className="form-input" 
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {editingItem && (
                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                  <label>Status</label>
                  <select 
                    className="form-input" 
                    required
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                  >
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              )}

              <button type="submit" className="btn-primary" style={{ width: '100%' }}>
                {editingItem ? 'Save Changes' : 'Create Item'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuManagement;
