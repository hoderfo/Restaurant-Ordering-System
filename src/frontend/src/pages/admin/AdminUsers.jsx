import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { ApiContext, SocketContext } from '../../App';
import { toast } from 'react-hot-toast';

const AdminUsers = () => {
  const API_URL = useContext(ApiContext);
  const socket = useContext(SocketContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'floor' });

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${API_URL}/admin/users`);
      setUsers(res.data.users);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to fetch users');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleStatusUpdate = ({ userId, isActive }) => {
      setUsers(prevUsers => prevUsers.map(user => 
        user.id === userId ? { ...user, isActive } : user
      ));
    };

    socket.on('user:status_update', handleStatusUpdate);
    
    return () => {
      socket.off('user:status_update', handleStatusUpdate);
    };
  }, [socket]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/admin/users`, newUser);
      toast.success('User created successfully');
      setShowModal(false);
      setNewUser({ username: '', password: '', role: 'floor' });
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create user');
    }
  };

  const handleUpdateRole = async (userId, role) => {
    try {
      await axios.put(`${API_URL}/admin/users/${userId}/role`, { role });
      toast.success('Role updated');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update role');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await axios.delete(`${API_URL}/admin/users/${userId}`);
      toast.success('User deleted');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const handleResetPassword = async (userId) => {
    const newPassword = window.prompt('Enter new password:');
    if (!newPassword) return;
    try {
      await axios.post(`${API_URL}/admin/users/${userId}/reset-password`, { newPassword });
      toast.success('Password reset successfully');
    } catch (error) {
      toast.error('Failed to reset password');
    }
  };

  if (loading) return <div>Loading users...</div>;

  return (
    <div className="admin-content-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Staff Users</h2>
        <button className="btn-primary" onClick={() => setShowModal(true)}>Add User</button>
      </div>

      <div className="table-responsive">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.username}</td>
                <td>
                  <select 
                    value={user.role} 
                    onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                  >
                    <option value="admin">Admin</option>
                    <option value="management">Management</option>
                    <option value="floor">Floor</option>
                    <option value="kitchen">Kitchen</option>
                  </select>
                </td>
                <td>{user.isActive ? 'Active' : 'Inactive'}</td>
                <td>
                  <button className="btn-secondary" onClick={() => handleResetPassword(user.id)}>Reset Password</button>
                  <button className="btn-secondary" style={{ marginLeft: '10px' }} onClick={() => handleDeleteUser(user.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Add New Staff</h2>
            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label>Username</label>
                <input 
                  type="text" 
                  value={newUser.username} 
                  onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                  required
                />
              </div>
              <div>
                <label>Password</label>
                <input 
                  type="password" 
                  value={newUser.password} 
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  required
                />
              </div>
              <div>
                <label>Role</label>
                <select 
                  value={newUser.role} 
                  onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                >
                  <option value="admin">Admin</option>
                  <option value="management">Management</option>
                  <option value="floor">Floor</option>
                  <option value="kitchen">Kitchen</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
