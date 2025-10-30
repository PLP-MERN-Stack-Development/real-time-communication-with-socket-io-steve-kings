import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import ChatArea from '../components/ChatArea';
import UserProfile from '../components/UserProfile';
import { useSocket } from '../context/SocketContext';

const Chat = () => {
  const [showProfile, setShowProfile] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const { isConnected } = useSocket();

  return (
    <div className="chat-container">
      <Sidebar 
        onUserSelect={setSelectedUser}
        onShowProfile={() => setShowProfile(true)}
      />
      
      <ChatArea 
        selectedUser={selectedUser}
        onClearSelection={() => setSelectedUser(null)}
      />
      
      {showProfile && (
        <UserProfile 
          onClose={() => setShowProfile(false)}
        />
      )}
      
      {/* Connection status indicator */}
      <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
        <div className="status-dot"></div>
        <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
      </div>
    </div>
  );
};

export default Chat;