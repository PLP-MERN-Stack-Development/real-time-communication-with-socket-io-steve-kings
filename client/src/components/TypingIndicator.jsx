import React from 'react';
import './TypingIndicator.css';

const TypingIndicator = ({ users }) => {
  if (!users || users.length === 0) return null;

  const formatTypingText = () => {
    if (users.length === 1) {
      return `${users[0]} is typing...`;
    } else if (users.length === 2) {
      return `${users[0]} and ${users[1]} are typing...`;
    } else {
      return `${users[0]} and ${users.length - 1} others are typing...`;
    }
  };

  return (
    <div className="typing-indicator">
      <div className="typing-avatar">
        <div className="typing-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
      <div className="typing-text">
        {formatTypingText()}
      </div>
    </div>
  );
};

export default TypingIndicator;