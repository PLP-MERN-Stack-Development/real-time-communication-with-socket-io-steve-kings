import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import CreateRoom from './CreateRoom';
import { 
  Hash, 
  Users, 
  Settings, 
  LogOut, 
  MessageCircle,
  Plus,
  Search,
  User,
  UserPlus,
  Shield
} from 'lucide-react';
import './Sidebar.css';

const Sidebar = ({ onUserSelect, onShowProfile }) => {
  const { user, logout } = useAuth();
  const { rooms, currentRoom, joinRoom, users } = useSocket();
  const [activeTab, setActiveTab] = useState('rooms');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateRoom, setShowCreateRoom] = useState(false);

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) &&
    u.username !== user?.username
  );

  const handleUserClick = (selectedUser) => {
    onUserSelect(selectedUser);
    setActiveTab('users');
  };

  return (
    <div className="sidebar">
      {/* Header */}
      <div className="sidebar-header">
        <div className="app-title">
          <MessageCircle size={24} />
          <span>Stephen's Chat</span>
        </div>
        <div className="user-info">
          <div className="user-avatar">
            {user?.username?.charAt(0).toUpperCase()}
          </div>
          <div className="user-details">
            <span className="username">{user?.username}</span>
            <span className="user-status">
              {user?.isGuest ? 'Guest' : 'Online'}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="sidebar-tabs">
        <button
          className={`tab ${activeTab === 'rooms' ? 'active' : ''}`}
          onClick={() => setActiveTab('rooms')}
        >
          <Hash size={16} />
          Rooms
        </button>
        <button
          className={`tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <Users size={16} />
          Users ({users.length})
        </button>
      </div>

      {/* Search */}
      <div className="search-container">
        <Search size={16} className="search-icon" />
        <input
          type="text"
          placeholder={activeTab === 'rooms' ? 'Search rooms...' : 'Search users...'}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {/* Content */}
      <div className="sidebar-content">
        {activeTab === 'rooms' && (
          <div className="rooms-list">
            <div className="section-header">
              <span>Rooms</span>
              <button 
                className="add-button" 
                title="Create Room"
                onClick={() => setShowCreateRoom(true)}
              >
                <Plus size={16} />
              </button>
            </div>
            {rooms
              .filter(room => room.name.toLowerCase().includes(searchTerm.toLowerCase()))
              .map((room) => (
                <div
                  key={room.name}
                  className={`room-item ${currentRoom === room.name ? 'active' : ''}`}
                  onClick={() => joinRoom(room.name)}
                >
                  <Hash size={16} />
                  <div className="room-info">
                    <span className="room-name">{room.name}</span>
                    <span className="room-description">{room.description}</span>
                  </div>
                  {room.messageCount > 0 && (
                    <span className="message-count">{room.messageCount}</span>
                  )}
                </div>
              ))}
          </div>
        )}

        {activeTab === 'users' && (
          <div className="users-list">
            <div className="section-header">
              <span>Online Users</span>
            </div>
            {filteredUsers.length === 0 ? (
              <div className="empty-state">
                <User size={32} />
                <p>No users found</p>
              </div>
            ) : (
              filteredUsers.map((user) => (
                <div
                  key={user._id || user.socketId}
                  className="user-item"
                  onClick={() => handleUserClick(user)}
                >
                  <div className="user-avatar">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="user-info">
                    <span className="username">{user.username}</span>
                    <span className="user-status">
                      <div className="status-dot online"></div>
                      Online
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="sidebar-footer">
        {user?.role === 'admin' && (
          <Link to="/admin" className="footer-button admin">
            <Shield size={16} />
            Admin Panel
          </Link>
        )}
        {user?.isGuest && (
          <Link to="/register" className="footer-button register">
            <UserPlus size={16} />
            Create Account
          </Link>
        )}
        <button className="footer-button" onClick={onShowProfile}>
          <Settings size={16} />
          Settings
        </button>
        <button className="footer-button logout" onClick={logout}>
          <LogOut size={16} />
          Logout
        </button>
      </div>
      
      {/* Create Room Modal */}
      {showCreateRoom && (
        <CreateRoom onClose={() => setShowCreateRoom(false)} />
      )}
    </div>
  );
};

export default Sidebar;