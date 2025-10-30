import React from 'react';
import Message from './Message';
import { format, isToday, isYesterday } from 'date-fns';
import './MessageList.css';

const MessageList = ({ messages, currentUser }) => {
  // Group messages by date
  const groupMessagesByDate = (messages) => {
    const groups = {};
    
    messages.forEach(message => {
      const date = new Date(message.createdAt);
      const dateKey = format(date, 'yyyy-MM-dd');
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(message);
    });
    
    return groups;
  };

  const formatDateHeader = (dateString) => {
    const date = new Date(dateString);
    
    if (isToday(date)) {
      return 'Today';
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else {
      return format(date, 'MMMM d, yyyy');
    }
  };

  const messageGroups = groupMessagesByDate(messages);
  const sortedDates = Object.keys(messageGroups).sort();

  if (messages.length === 0) {
    return (
      <div className="empty-messages">
        <div className="empty-icon">💬</div>
        <h3>No messages yet</h3>
        <p>Start the conversation by sending a message!</p>
      </div>
    );
  }

  return (
    <div className="message-list">
      {sortedDates.map(date => (
        <div key={date} className="message-group">
          <div className="date-separator">
            <span className="date-text">{formatDateHeader(date)}</span>
          </div>
          
          {messageGroups[date].map((message, index) => {
            const prevMessage = index > 0 ? messageGroups[date][index - 1] : null;
            const isConsecutive = prevMessage && 
              prevMessage.sender?._id === message.sender?._id &&
              prevMessage.sender?.username === message.sender?.username &&
              new Date(message.createdAt) - new Date(prevMessage.createdAt) < 300000; // 5 minutes
            
            return (
              <Message
                key={message._id || message.id || index}
                message={message}
                currentUser={currentUser}
                isConsecutive={isConsecutive}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default MessageList;