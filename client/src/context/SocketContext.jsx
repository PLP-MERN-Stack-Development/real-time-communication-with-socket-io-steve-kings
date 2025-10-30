import React, { createContext, useContext, useEffect, useState } from 'react';
import { socket } from '../socket/socket';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const { user, token } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [currentRoom, setCurrentRoom] = useState('general');
  const [rooms, setRooms] = useState([]);

  // Connect to socket when user is available
  useEffect(() => {
    if (user) {
      socket.connect();
      
      // Join with authentication
      if (user.isGuest) {
        socket.emit('user_join', { username: user.username, room: currentRoom });
      } else {
        socket.emit('user_join', { token, room: currentRoom });
      }
    }

    return () => {
      if (socket.connected) {
        socket.disconnect();
      }
    };
  }, [user, token, currentRoom]);

  // Socket event listeners
  useEffect(() => {
    const onConnect = () => {
      setIsConnected(true);
      console.log('Connected to server');
    };

    const onDisconnect = (reason) => {
      setIsConnected(false);
      console.log('Disconnected from server:', reason);
      
      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect
        socket.connect();
      }
    };

    const onConnectError = (error) => {
      console.error('Connection error:', error);
      toast.error('Failed to connect to server');
    };

    const onReceiveMessage = (message) => {
      setMessages(prev => [...prev, message]);
      
      // Show notification for new messages (if not from current user)
      if (message.sender?._id !== user?._id && message.sender?.username !== user?.username) {
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(`New message from ${message.sender?.username || 'Unknown'}`, {
            body: message.content,
            icon: '/favicon.ico'
          });
        }
        
        // Play notification sound
        const audio = new Audio('/notification.mp3');
        audio.play().catch(() => {}); // Ignore errors if sound fails
      }
    };

    const onPrivateMessage = (message) => {
      setMessages(prev => [...prev, { ...message, isPrivate: true }]);
      
      if (message.sender?._id !== user?._id) {
        toast.success(`Private message from ${message.sender?.username}`);
      }
    };

    const onUserList = (userList) => {
      setUsers(userList);
    };

    const onUserJoined = ({ username, room }) => {
      if (room === currentRoom) {
        toast.success(`${username} joined the room`);
        setMessages(prev => [...prev, {
          _id: Date.now(),
          content: `${username} joined the room`,
          isSystem: true,
          createdAt: new Date().toISOString()
        }]);
      }
    };

    const onUserLeft = ({ username, room }) => {
      if (room === currentRoom) {
        toast(`${username} left the room`);
        setMessages(prev => [...prev, {
          _id: Date.now(),
          content: `${username} left the room`,
          isSystem: true,
          createdAt: new Date().toISOString()
        }]);
      }
    };

    const onTypingUsers = ({ room, users: typingList }) => {
      if (room === currentRoom) {
        setTypingUsers(typingList.filter(username => username !== user?.username));
      }
    };

    const onReactionAdded = ({ messageId, reactions }) => {
      setMessages(prev => prev.map(msg => 
        msg._id === messageId ? { ...msg, reactions } : msg
      ));
    };

    const onError = (error) => {
      console.error('Socket error:', error);
      toast.error(error.message || 'An error occurred');
    };

    const onMessageSent = (data) => {
      console.log('Message sent successfully:', data);
    };

    const onRoomMessages = (messages) => {
      console.log('Loaded room messages:', messages.length);
      setMessages(messages);
    };

    const onRoomCreated = (roomData) => {
      setRooms(prev => [...prev, {
        name: roomData.name,
        description: roomData.description
      }]);
      toast.success(`New room "${roomData.name}" has been created!`);
    };

    // Register event listeners
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);
    socket.on('receive_message', onReceiveMessage);
    socket.on('private_message', onPrivateMessage);
    socket.on('user_list', onUserList);
    socket.on('user_joined', onUserJoined);
    socket.on('user_left', onUserLeft);
    socket.on('typing_users', onTypingUsers);
    socket.on('reaction_added', onReactionAdded);
    socket.on('error', onError);
    socket.on('message_sent', onMessageSent);
    socket.on('room_messages', onRoomMessages);
    socket.on('room_created', onRoomCreated);

    // Cleanup
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      socket.off('receive_message', onReceiveMessage);
      socket.off('private_message', onPrivateMessage);
      socket.off('user_list', onUserList);
      socket.off('user_joined', onUserJoined);
      socket.off('user_left', onUserLeft);
      socket.off('typing_users', onTypingUsers);
      socket.off('reaction_added', onReactionAdded);
      socket.off('error', onError);
      socket.off('message_sent', onMessageSent);
      socket.off('room_messages', onRoomMessages);
      socket.off('room_created', onRoomCreated);
    };
  }, [user, currentRoom]);

  // Load rooms from API
  useEffect(() => {
    const loadRooms = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/rooms');
        const roomsData = await response.json();
        setRooms(roomsData.map(room => ({
          name: room.name,
          description: room.description,
          messageCount: room.messageCount
        })));
      } catch (error) {
        console.error('Error loading rooms:', error);
        // Fallback to default rooms
        setRooms([
          { name: 'general', description: 'General discussion' },
          { name: 'random', description: 'Random conversations' },
          { name: 'tech', description: 'Technology discussions' }
        ]);
      }
    };
    
    loadRooms();
  }, []);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const sendMessage = (content, messageType = 'text', fileUrl = null, fileName = null) => {
    if (!content.trim() && !fileUrl) return;

    try {
      socket.emit('send_message', {
        content: content.trim(),
        room: currentRoom,
        messageType,
        fileUrl,
        fileName
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const sendPrivateMessage = (recipientId, content) => {
    if (!content.trim()) return;

    socket.emit('private_message', {
      recipientId,
      content: content.trim()
    });
  };

  const setTyping = (isTyping) => {
    socket.emit('typing', {
      room: currentRoom,
      isTyping
    });
  };

  const joinRoom = (roomName) => {
    if (roomName !== currentRoom) {
      setCurrentRoom(roomName);
      setMessages([]); // Clear messages when switching rooms
      socket.emit('join_room', { room: roomName });
    }
  };

  const addReaction = (messageId, emoji) => {
    socket.emit('add_reaction', { messageId, emoji });
  };

  const value = {
    socket,
    isConnected,
    messages,
    users,
    typingUsers,
    currentRoom,
    rooms,
    sendMessage,
    sendPrivateMessage,
    setTyping,
    joinRoom,
    addReaction,
    setMessages
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};