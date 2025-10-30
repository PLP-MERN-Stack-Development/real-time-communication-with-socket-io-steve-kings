import React from 'react';
import { useAuth } from '../context/AuthContext';
import { X, User, Mail, Calendar, Settings } from 'lucide-react';
import './UserProfile.css';

const UserProfile = ({ onClose }) => {
  const { user, logout } = useAuth();

  return (
    <div className="profile-overlay">
      <div className="profile-modal">
        <div className="profile-header">
          <h2>Profile Settings</h2>
          <button className="close-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        
        <div className="profile-content">
          <div className="profile-avatar-section">
            <div className="profile-avatar">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <button className="change-avatar-btn">Change Avatar</button>
          </div>
          
          <div className="profile-info">
            <div className="info-item">
              <User size={16} />
              <div>
                <label>Username</label>
                <span>{user?.username}</span>
              </div>
            </div>
            
            {!user?.isGuest && (
              <div className="info-item">
                <Mail size={16} />
                <div>
                  <label>Email</label>
                  <span>{user?.email}</span>
                </div>
              </div>
            )}
            
            <div className="info-item">
              <Calendar size={16} />
              <div>
                <label>Account Type</label>
                <span>{user?.isGuest ? 'Guest User' : 'Registered User'}</span>
              </div>
            </div>
          </div>
          
          <div className="profile-actions">
            <button className="settings-btn">
              <Settings size={16} />
              Account Settings
            </button>
            <button className="logout-btn" onClick={logout}>
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;