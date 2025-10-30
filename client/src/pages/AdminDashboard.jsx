import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Users, 
  MessageSquare, 
  Activity, 
  RefreshCw, 
  Trash2, 
  Shield, 
  Search,
  Filter,
  AlertTriangle,
  UserX,
  MessageCircle,
  Eye,
  Settings
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [dbStatus, setDbStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedMessages, setSelectedMessages] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRoom, setFilterRoom] = useState('all');
  
  const { user, token, refreshUser } = useAuth();

  const fetchDbStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/verify-db');
      const data = await response.json();
      setDbStatus(data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching database status:', error);
      setDbStatus({ status: 'Connection failed ❌', error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        toast.error('Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Error fetching users');
    }
  };

  const fetchMessages = async () => {
    try {
      const params = new URLSearchParams({
        limit: 100,
        room: filterRoom,
        search: searchTerm
      });
      
      const response = await fetch(`http://localhost:5000/api/admin/messages?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages);
      } else {
        toast.error('Failed to fetch messages');
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Error fetching messages');
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast.success('User deleted successfully');
        fetchUsers();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Error deleting user');
    }
  };

  const deleteMessage = async (messageId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/admin/messages/${messageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast.success('Message deleted successfully');
        fetchMessages();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to delete message');
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Error deleting message');
    }
  };

  const bulkDeleteMessages = async () => {
    if (selectedMessages.length === 0) {
      toast.error('No messages selected');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${selectedMessages.length} messages?`)) {
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/admin/messages/bulk-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ messageIds: selectedMessages })
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(result.message);
        setSelectedMessages([]);
        fetchMessages();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to delete messages');
      }
    } catch (error) {
      console.error('Error bulk deleting messages:', error);
      toast.error('Error deleting messages');
    }
  };

  useEffect(() => {
    const initializeAdmin = async () => {
      // Refresh user data to ensure we have latest role info
      if (token && refreshUser) {
        await refreshUser();
      }
      
      fetchDbStatus();
      if (token) {
        fetchUsers();
        fetchMessages();
      }
    };
    
    initializeAdmin();
    const interval = setInterval(fetchDbStatus, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, [token, refreshUser]);

  useEffect(() => {
    if (activeTab === 'messages' && token) {
      fetchMessages();
    }
  }, [searchTerm, filterRoom, activeTab, token]);

  if (loading && !dbStatus) {
    return (
      <div className="admin-dashboard">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading database status...</p>
        </div>
      </div>
    );
  }

  // Debug: Log user data
  console.log('AdminDashboard - User data:', user);
  console.log('AdminDashboard - User role:', user?.role);

  if (!user || user.role !== 'admin') {
    return (
      <div className="admin-dashboard">
        <div className="access-denied">
          <Shield size={64} />
          <h2>Access Denied</h2>
          <p>You need administrator privileges to access this page.</p>
          <div style={{ marginTop: '16px', fontSize: '12px', color: 'var(--text-muted)' }}>
            Current user: {user?.username || 'None'} | Role: {user?.role || 'None'}
          </div>
          {user && !user.role && (
            <button 
              onClick={async () => {
                console.log('Refreshing user data...');
                await refreshUser();
              }}
              style={{
                marginTop: '16px',
                padding: '8px 16px',
                background: 'var(--green-primary)',
                color: 'var(--bg-primary)',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Refresh User Data
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Stephen's Chat 2025 - Admin Panel</h1>
        <div className="header-actions">
          <button onClick={fetchDbStatus} className="refresh-btn" disabled={loading}>
            <RefreshCw size={16} className={loading ? 'spinning' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="admin-tabs">
        <button 
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <Database size={16} />
          Overview
        </button>
        <button 
          className={`tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <Users size={16} />
          Users ({users.length})
        </button>
        <button 
          className={`tab ${activeTab === 'messages' ? 'active' : ''}`}
          onClick={() => setActiveTab('messages')}
        >
          <MessageSquare size={16} />
          Messages ({messages.length})
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          <div className="status-card">
            <div className="status-header">
              <Database size={24} />
              <h2>{dbStatus?.status || 'Unknown'}</h2>
            </div>
            {lastUpdated && (
              <p className="last-updated">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>

          {dbStatus && !dbStatus.error && (
            <>
              <div className="stats-grid">
                <div className="stat-card">
                  <MessageSquare size={32} />
                  <div className="stat-info">
                    <h3>{dbStatus.collections?.messages || 0}</h3>
                    <p>Total Messages</p>
                  </div>
                </div>

                <div className="stat-card">
                  <Users size={32} />
                  <div className="stat-info">
                    <h3>{dbStatus.collections?.users || 0}</h3>
                    <p>Registered Users</p>
                  </div>
                </div>

                <div className="stat-card">
                  <Activity size={32} />
                  <div className="stat-info">
                    <h3>{dbStatus.realTime?.onlineUsers || 0}</h3>
                    <p>Online Users</p>
                  </div>
                </div>

                <div className="stat-card">
                  <Database size={32} />
                  <div className="stat-info">
                    <h3>{dbStatus.collections?.rooms || 0}</h3>
                    <p>Chat Rooms</p>
                  </div>
                </div>
              </div>

              {dbStatus.messagesByRoom && dbStatus.messagesByRoom.length > 0 && (
                <div className="messages-by-room">
                  <h3>Messages by Room</h3>
                  <div className="room-stats">
                    {dbStatus.messagesByRoom.map((room, index) => (
                      <div key={index} className="room-stat">
                        <span className="room-name">#{room._id}</span>
                        <span className="room-count">{room.count} messages</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="users-management">
          <div className="section-header">
            <h3>User Management</h3>
            <div className="actions">
              {selectedUsers.length > 0 && (
                <button className="danger-btn" onClick={() => {
                  selectedUsers.forEach(userId => deleteUser(userId));
                  setSelectedUsers([]);
                }}>
                  <UserX size={16} />
                  Delete Selected ({selectedUsers.length})
                </button>
              )}
            </div>
          </div>

          <div className="users-table">
            <div className="table-header">
              <div className="checkbox-col">
                <input 
                  type="checkbox" 
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedUsers(users.map(u => u._id));
                    } else {
                      setSelectedUsers([]);
                    }
                  }}
                />
              </div>
              <div>User</div>
              <div>Role</div>
              <div>Status</div>
              <div>Messages</div>
              <div>Joined</div>
              <div>Actions</div>
            </div>

            {users.map(user => (
              <div key={user._id} className="table-row">
                <div className="checkbox-col">
                  <input 
                    type="checkbox" 
                    checked={selectedUsers.includes(user._id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedUsers([...selectedUsers, user._id]);
                      } else {
                        setSelectedUsers(selectedUsers.filter(id => id !== user._id));
                      }
                    }}
                  />
                </div>
                <div className="user-info">
                  <div className="user-avatar">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="username">{user.username}</div>
                    <div className="email">{user.email}</div>
                  </div>
                </div>
                <div className={`role ${user.role}`}>{user.role}</div>
                <div className="status">
                  <span className={`status-dot ${user.isConnected ? 'online' : 'offline'}`}></span>
                  {user.isConnected ? 'Online' : 'Offline'}
                </div>
                <div>{user.messageCount}</div>
                <div>{new Date(user.createdAt).toLocaleDateString()}</div>
                <div className="actions">
                  <button 
                    className="danger-btn small"
                    onClick={() => deleteUser(user._id)}
                    disabled={user.role === 'admin'}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Messages Tab */}
      {activeTab === 'messages' && (
        <div className="messages-management">
          <div className="section-header">
            <h3>Message Management</h3>
            <div className="filters">
              <div className="search-box">
                <Search size={16} />
                <input 
                  type="text" 
                  placeholder="Search messages..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select 
                value={filterRoom} 
                onChange={(e) => setFilterRoom(e.target.value)}
                className="room-filter"
              >
                <option value="all">All Rooms</option>
                <option value="general">General</option>
                <option value="random">Random</option>
                <option value="tech">Tech</option>
              </select>
            </div>
            <div className="actions">
              {selectedMessages.length > 0 && (
                <button className="danger-btn" onClick={bulkDeleteMessages}>
                  <Trash2 size={16} />
                  Delete Selected ({selectedMessages.length})
                </button>
              )}
            </div>
          </div>

          <div className="messages-table">
            <div className="table-header">
              <div className="checkbox-col">
                <input 
                  type="checkbox" 
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedMessages(messages.map(m => m._id));
                    } else {
                      setSelectedMessages([]);
                    }
                  }}
                />
              </div>
              <div>Message</div>
              <div>Sender</div>
              <div>Room</div>
              <div>Time</div>
              <div>Actions</div>
            </div>

            {messages.map(message => (
              <div key={message._id} className="table-row">
                <div className="checkbox-col">
                  <input 
                    type="checkbox" 
                    checked={selectedMessages.includes(message._id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedMessages([...selectedMessages, message._id]);
                      } else {
                        setSelectedMessages(selectedMessages.filter(id => id !== message._id));
                      }
                    }}
                  />
                </div>
                <div className="message-content">
                  {message.content.length > 100 
                    ? message.content.substring(0, 100) + '...' 
                    : message.content
                  }
                </div>
                <div className="sender-info">
                  {message.sender?.username || message.guestUsername || 'Unknown'}
                  {message.sender?.role === 'admin' && <Shield size={12} />}
                </div>
                <div>#{message.room}</div>
                <div>{new Date(message.createdAt).toLocaleString()}</div>
                <div className="actions">
                  <button 
                    className="danger-btn small"
                    onClick={() => deleteMessage(message._id)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {dbStatus?.error && (
        <div className="error-card">
          <h3>Database Error</h3>
          <p>{dbStatus.error}</p>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;