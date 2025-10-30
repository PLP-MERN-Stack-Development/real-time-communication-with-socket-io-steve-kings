import React, { useState, useRef, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import TypingIndicator from './TypingIndicator';
import { Hash, User, X, Users } from 'lucide-react';
import './ChatArea.css';

const ChatArea = ({ selectedUser, onClearSelection }) => {
  const { user } = useAuth();
  const { 
    currentRoom, 
    messages, 
    users, 
    typingUsers, 
    sendMessage, 
    sendPrivateMessage,
    setTyping 
  } = useSocket();
  
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Filter messages based on current context
  const filteredMessages = selectedUser 
    ? messages.filter(msg => 
        msg.isPrivate && (
          (msg.sender?._id === selectedUser._id || msg.sender?._id === user?._id) ||
          (msg.sender?.username === selectedUser.username || msg.sender?.username === user?.username)
        )
      )
    : messages.filter(msg => !msg.isPrivate && msg.room === currentRoom);

  const handleSendMessage = (content, messageType, fileUrl, fileName) => {
    if (selectedUser) {
      sendPrivateMessage(selectedUser._id || selectedUser.socketId, content);
    } else {
      sendMessage(content, messageType, fileUrl, fileName);
    }
  };

  const handleTyping = (typing) => {
    if (typing !== isTyping) {
      setIsTyping(typing);
      setTyping(typing);
      
      if (typing) {
        // Clear existing timeout
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        
        // Set timeout to stop typing after 3 seconds
        typingTimeoutRef.current = setTimeout(() => {
          setIsTyping(false);
          setTyping(false);
        }, 3000);
      } else {
        // Clear timeout when user stops typing
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
      }
    }
  };

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const roomUsers = users.filter(u => u.currentRoom === currentRoom);

  return (
    <div className="chat-area">
      {/* Header */}
      <div className="chat-header">
        <div className="chat-info">
          {selectedUser ? (
            <>
              <div className="chat-avatar">
                <User size={20} />
              </div>
              <div className="chat-details">
                <h3 className="chat-title">{selectedUser.username}</h3>
                <span className="chat-subtitle">Private conversation</span>
              </div>
            </>
          ) : (
            <>
              <div className="chat-avatar">
                <Hash size={20} />
              </div>
              <div className="chat-details">
                <h3 className="chat-title">#{currentRoom}</h3>
                <span className="chat-subtitle">
                  <Users size={14} />
                  {roomUsers.length} member{roomUsers.length !== 1 ? 's' : ''}
                </span>
              </div>
            </>
          )}
        </div>
        
        <div className="chat-actions">
          {selectedUser && (
            <button 
              className="close-button"
              onClick={onClearSelection}
              title="Close private chat"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="messages-container">
        <MessageList 
          messages={filteredMessages}
          currentUser={user}
        />
        
        {/* Typing Indicator */}
        {!selectedUser && typingUsers.length > 0 && (
          <TypingIndicator users={typingUsers} />
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="message-input-container">
        <MessageInput 
          onSendMessage={handleSendMessage}
          onTyping={handleTyping}
          placeholder={
            selectedUser 
              ? `Message ${selectedUser.username}...`
              : `Message #${currentRoom}...`
          }
        />
      </div>
    </div>
  );
};

export default ChatArea;