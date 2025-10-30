import React, { useState } from 'react';
import { format } from 'date-fns';
import { useSocket } from '../context/SocketContext';
import { Heart, ThumbsUp, Smile, MoreHorizontal } from 'lucide-react';
import './Message.css';

const Message = ({ message, currentUser, isConsecutive }) => {
  const { addReaction } = useSocket();
  const [showReactions, setShowReactions] = useState(false);

  const isOwnMessage = message.sender?._id === currentUser?._id || 
                      message.sender?.username === currentUser?.username;
  
  const isSystemMessage = message.isSystem || message.system;

  const handleReaction = (emoji) => {
    if (message._id && !currentUser?.isGuest) {
      addReaction(message._id, emoji);
    }
    setShowReactions(false);
  };

  const formatTime = (timestamp) => {
    return format(new Date(timestamp), 'HH:mm');
  };

  if (isSystemMessage) {
    return (
      <div className="system-message">
        <span className="system-text">{message.content || message.message}</span>
      </div>
    );
  }

  return (
    <div className={`message ${isOwnMessage ? 'own-message' : 'other-message'} ${isConsecutive ? 'consecutive' : ''}`}>
      {!isConsecutive && !isOwnMessage && (
        <div className="message-avatar">
          {message.sender?.username?.charAt(0).toUpperCase() || 'U'}
        </div>
      )}
      
      <div className="message-content">
        {!isConsecutive && (
          <div className="message-header">
            <span className="sender-name">
              {isOwnMessage ? 'You' : (message.sender?.username || 'Unknown')}
            </span>
            <span className="message-time">
              {formatTime(message.createdAt || message.timestamp)}
            </span>
          </div>
        )}
        
        <div className="message-bubble">
          {message.messageType === 'image' && message.fileUrl ? (
            <div className="message-image">
              <img src={message.fileUrl} alt={message.fileName} />
              {message.content && <p>{message.content}</p>}
            </div>
          ) : message.messageType === 'file' && message.fileUrl ? (
            <div className="message-file">
              <a href={message.fileUrl} download={message.fileName} target="_blank" rel="noopener noreferrer">
                📎 {message.fileName}
              </a>
              {message.content && <p>{message.content}</p>}
            </div>
          ) : (
            <p className="message-text">{message.content || message.message}</p>
          )}
          
          {message.isPrivate && (
            <span className="private-indicator">🔒 Private</span>
          )}
          
          {message._id && (
            <span className="persistence-indicator" title="Message saved to database">
              💾
            </span>
          )}
        </div>
        
        {/* Reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="message-reactions">
            {message.reactions.map((reaction, index) => (
              <span key={index} className="reaction">
                {reaction.emoji}
              </span>
            ))}
          </div>
        )}
        
        {/* Reaction Menu */}
        <div className="message-actions">
          <button 
            className="reaction-button"
            onClick={() => setShowReactions(!showReactions)}
          >
            <Smile size={16} />
          </button>
          
          {showReactions && (
            <div className="reaction-menu">
              <button onClick={() => handleReaction('👍')}>👍</button>
              <button onClick={() => handleReaction('❤️')}>❤️</button>
              <button onClick={() => handleReaction('😂')}>😂</button>
              <button onClick={() => handleReaction('😮')}>😮</button>
              <button onClick={() => handleReaction('😢')}>😢</button>
              <button onClick={() => handleReaction('😡')}>😡</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Message;