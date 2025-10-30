// server.js - Main server file for Socket.io chat application

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

// Import models
const User = require('./models/User');
const Message = require('./models/Message');
const Room = require('./models/Room');

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Create default admin user if it doesn't exist
    const adminExists = await User.findOne({ username: 'kings' });
    if (!adminExists) {
      const adminUser = new User({
        username: 'kings',
        email: 'admin@stephenschat.com',
        password: 'kings123',
        role: 'admin',
        permissions: {
          canDeleteMessages: true,
          canDeleteUsers: true,
          canManageRooms: true,
          canViewAllUsers: true
        }
      });
      await adminUser.save();
      console.log('✅ Default admin user created:');
      console.log('   Username: kings');
      console.log('   Password: kings123');
      console.log('   Email: admin@stephenschat.com');
    } else {
      console.log('✅ Admin user "kings" already exists');
    }
    
    // Create default rooms if they don't exist
    const defaultRooms = [
      { name: 'general', description: 'General discussion for everyone' },
      { name: 'random', description: 'Random conversations and fun topics' },
      { name: 'tech', description: 'Technology discussions and programming' }
    ];
    
    for (const roomData of defaultRooms) {
      const existingRoom = await Room.findOne({ name: roomData.name });
      if (!existingRoom) {
        const room = new Room({
          ...roomData,
          createdBy: null, // System created
          isPrivate: false
        });
        await room.save();
        console.log(`Created default room: ${roomData.name}`);
      }
    }
  })
  .catch(err => console.error('MongoDB connection error:', err));

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Store connected users and typing status
const connectedUsers = {};
const typingUsers = {};

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Handle user authentication and joining
  socket.on('user_join', async ({ token, username, room = 'general' }) => {
    try {
      let user;
      
      if (token) {
        // Authenticate with JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        user = await User.findById(decoded.userId);
      } else if (username) {
        // Guest user (create temporary user)
        user = { _id: socket.id, username, isGuest: true };
      }
      
      if (user) {
        // Update user status
        if (!user.isGuest) {
          await User.findByIdAndUpdate(user._id, {
            isOnline: true,
            socketId: socket.id,
            lastSeen: new Date()
          });
        }
        
        connectedUsers[socket.id] = {
          ...user.toObject ? user.toObject() : user,
          socketId: socket.id,
          currentRoom: room
        };
        
        socket.join(room);
        
        // Load and send recent messages for the room
        try {
          const recentMessages = await Message.find({ room, isPrivate: false })
            .populate('sender', 'username avatar')
            .sort({ createdAt: -1 })
            .limit(50);
          
          const formattedMessages = recentMessages.reverse().map(msg => ({
            _id: msg._id,
            content: msg.content,
            sender: msg.sender || { username: msg.guestUsername, isGuest: true },
            room: msg.room,
            messageType: msg.messageType,
            fileUrl: msg.fileUrl,
            fileName: msg.fileName,
            createdAt: msg.createdAt,
            reactions: msg.reactions
          }));
          
          socket.emit('room_messages', formattedMessages);
        } catch (error) {
          console.error('Error loading room messages:', error);
        }
        
        // Send user list and join notification
        const roomUsers = Object.values(connectedUsers).filter(u => u.currentRoom === room);
        io.to(room).emit('user_list', roomUsers);
        io.to(room).emit('user_joined', { username: user.username, room });
        
        console.log(`${user.username} joined room: ${room}`);
      }
    } catch (error) {
      console.error('User join error:', error);
      socket.emit('error', { message: 'Authentication failed' });
    }
  });

  // Handle chat messages
  socket.on('send_message', async (messageData) => {
    try {
      const user = connectedUsers[socket.id];
      if (!user) {
        socket.emit('error', { message: 'User not found' });
        return;
      }

      if (!messageData.content || !messageData.content.trim()) {
        socket.emit('error', { message: 'Message content is required' });
        return;
      }

      console.log('Creating message for user:', user.username, 'isGuest:', user.isGuest);

      const message = new Message({
        sender: user.isGuest ? null : user._id,
        guestUsername: user.isGuest ? user.username : null,
        content: messageData.content,
        room: messageData.room || user.currentRoom,
        messageType: messageData.messageType || 'text',
        fileUrl: messageData.fileUrl,
        fileName: messageData.fileName
      });

      const savedMessage = await message.save();
      console.log('Message saved to database:', {
        id: savedMessage._id,
        content: savedMessage.content,
        sender: user.isGuest ? savedMessage.guestUsername : savedMessage.sender,
        room: savedMessage.room
      });
      
      await savedMessage.populate('sender', 'username avatar');

      const messageToSend = {
        _id: savedMessage._id,
        content: savedMessage.content,
        sender: user.isGuest 
          ? { username: savedMessage.guestUsername, isGuest: true }
          : savedMessage.sender,
        room: savedMessage.room,
        messageType: savedMessage.messageType,
        fileUrl: savedMessage.fileUrl,
        fileName: savedMessage.fileName,
        createdAt: savedMessage.createdAt,
        reactions: savedMessage.reactions
      };

      io.to(savedMessage.room).emit('receive_message', messageToSend);
      socket.emit('message_sent', { success: true, messageId: savedMessage._id });
      console.log('Message sent successfully to room:', savedMessage.room);
    } catch (error) {
      console.error('Send message error:', error);
      socket.emit('error', { 
        message: 'Failed to send message', 
        details: error.message 
      });
    }
  });

  // Handle private messages
  socket.on('private_message', async ({ recipientId, content }) => {
    try {
      const sender = connectedUsers[socket.id];
      if (!sender) return;

      const message = new Message({
        sender: sender.isGuest ? null : sender._id,
        guestUsername: sender.isGuest ? sender.username : null,
        content,
        recipient: recipientId,
        isPrivate: true
      });

      const savedMessage = await message.save();
      await savedMessage.populate(['sender', 'recipient'], 'username avatar');

      const messageToSend = {
        _id: savedMessage._id,
        content: savedMessage.content,
        sender: sender.isGuest 
          ? { username: savedMessage.guestUsername, isGuest: true }
          : savedMessage.sender,
        recipient: savedMessage.recipient,
        isPrivate: true,
        createdAt: savedMessage.createdAt
      };

      // Send to recipient
      const recipientSocket = Object.keys(connectedUsers).find(
        socketId => connectedUsers[socketId]._id.toString() === recipientId
      );
      
      if (recipientSocket) {
        io.to(recipientSocket).emit('private_message', messageToSend);
      }
      
      // Send back to sender
      socket.emit('private_message', messageToSend);
    } catch (error) {
      console.error('Private message error:', error);
      socket.emit('error', { message: 'Failed to send private message' });
    }
  });

  // Handle typing indicator
  socket.on('typing', ({ room, isTyping }) => {
    const user = connectedUsers[socket.id];
    if (!user) return;

    const roomKey = `${room}_typing`;
    
    if (isTyping) {
      typingUsers[roomKey] = typingUsers[roomKey] || {};
      typingUsers[roomKey][socket.id] = user.username;
    } else {
      if (typingUsers[roomKey]) {
        delete typingUsers[roomKey][socket.id];
        if (Object.keys(typingUsers[roomKey]).length === 0) {
          delete typingUsers[roomKey];
        }
      }
    }
    
    const typingList = typingUsers[roomKey] ? Object.values(typingUsers[roomKey]) : [];
    socket.to(room).emit('typing_users', { room, users: typingList });
  });

  // Handle message reactions
  socket.on('add_reaction', async ({ messageId, emoji }) => {
    try {
      const user = connectedUsers[socket.id];
      if (!user || user.isGuest) return;

      const message = await Message.findById(messageId);
      if (!message) return;

      // Remove existing reaction from this user
      message.reactions = message.reactions.filter(
        r => r.user.toString() !== user._id.toString()
      );

      // Add new reaction
      message.reactions.push({ user: user._id, emoji });
      await message.save();

      io.to(message.room).emit('reaction_added', {
        messageId,
        reactions: message.reactions
      });
    } catch (error) {
      console.error('Add reaction error:', error);
    }
  });

  // Handle joining rooms
  socket.on('join_room', async ({ room }) => {
    const user = connectedUsers[socket.id];
    if (!user) return;

    // Leave current room
    if (user.currentRoom) {
      socket.leave(user.currentRoom);
      socket.to(user.currentRoom).emit('user_left', { 
        username: user.username, 
        room: user.currentRoom 
      });
    }

    // Join new room
    socket.join(room);
    user.currentRoom = room;

    // Load and send recent messages for the room
    try {
      const recentMessages = await Message.find({ room, isPrivate: false })
        .populate('sender', 'username avatar')
        .sort({ createdAt: -1 })
        .limit(50);
      
      const formattedMessages = recentMessages.reverse().map(msg => ({
        _id: msg._id,
        content: msg.content,
        sender: msg.sender || { username: msg.guestUsername, isGuest: true },
        room: msg.room,
        messageType: msg.messageType,
        fileUrl: msg.fileUrl,
        fileName: msg.fileName,
        createdAt: msg.createdAt,
        reactions: msg.reactions
      }));
      
      socket.emit('room_messages', formattedMessages);
      console.log(`Loaded ${formattedMessages.length} messages for room: ${room}`);
    } catch (error) {
      console.error('Error loading room messages:', error);
    }

    // Send room users and join notification
    const roomUsers = Object.values(connectedUsers).filter(u => u.currentRoom === room);
    io.to(room).emit('user_list', roomUsers);
    io.to(room).emit('user_joined', { username: user.username, room });
  });

  // Handle room creation
  socket.on('create_room', async ({ name, description, isPrivate = false }) => {
    try {
      const user = connectedUsers[socket.id];
      if (!user) {
        socket.emit('error', { message: 'User not found' });
        return;
      }

      // Check if room already exists
      const existingRoom = await Room.findOne({ name: name.toLowerCase() });
      if (existingRoom) {
        socket.emit('error', { message: 'Room name already exists' });
        return;
      }

      // Validate room name
      if (!name || name.trim().length < 2) {
        socket.emit('error', { message: 'Room name must be at least 2 characters' });
        return;
      }

      if (!/^[a-zA-Z0-9_-]+$/.test(name.trim())) {
        socket.emit('error', { message: 'Room name can only contain letters, numbers, hyphens, and underscores' });
        return;
      }

      const room = new Room({
        name: name.toLowerCase().trim(),
        description: description?.trim() || `${name} discussion room`,
        isPrivate,
        createdBy: user.isGuest ? null : user._id,
        members: user.isGuest ? [] : [user._id],
        admins: user.isGuest ? [] : [user._id]
      });

      await room.save();
      
      const roomData = {
        _id: room._id,
        name: room.name,
        description: room.description,
        isPrivate: room.isPrivate,
        createdBy: user.isGuest ? { username: user.username, isGuest: true } : user,
        memberCount: room.members.length,
        createdAt: room.createdAt
      };

      // Notify all users about the new room
      io.emit('room_created', roomData);
      
      // Auto-join the creator to the new room
      socket.emit('room_created_success', roomData);
      
      console.log(`Room "${room.name}" created by ${user.username}`);
    } catch (error) {
      console.error('Create room error:', error);
      socket.emit('error', { message: 'Failed to create room' });
    }
  });

  // Handle disconnection
  socket.on('disconnect', async () => {
    const user = connectedUsers[socket.id];
    
    if (user) {
      // Update user status in database
      if (!user.isGuest) {
        await User.findByIdAndUpdate(user._id, {
          isOnline: false,
          socketId: null,
          lastSeen: new Date()
        });
      }

      // Notify room about user leaving
      if (user.currentRoom) {
        socket.to(user.currentRoom).emit('user_left', { 
          username: user.username, 
          room: user.currentRoom 
        });
        
        // Update room user list
        const roomUsers = Object.values(connectedUsers)
          .filter(u => u.socketId !== socket.id && u.currentRoom === user.currentRoom);
        io.to(user.currentRoom).emit('user_list', roomUsers);
      }

      console.log(`${user.username} disconnected`);
    }
    
    // Clean up
    delete connectedUsers[socket.id];
    Object.keys(typingUsers).forEach(roomKey => {
      if (typingUsers[roomKey] && typingUsers[roomKey][socket.id]) {
        delete typingUsers[roomKey][socket.id];
        if (Object.keys(typingUsers[roomKey]).length === 0) {
          delete typingUsers[roomKey];
        }
      }
    });
  });
});

// API routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password, adminCode } = req.body;
    
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        message: 'User with this email or username already exists' 
      });
    }
    
    // Check for admin code (you can change this secret code)
    const isAdmin = adminCode === 'stephen2025admin';
    
    const user = new User({ 
      username, 
      email, 
      password,
      role: isAdmin ? 'admin' : 'user',
      permissions: isAdmin ? {
        canDeleteMessages: true,
        canDeleteUsers: true,
        canManageRooms: true,
        canViewAllUsers: true
      } : {}
    });
    await user.save();
    
    const token = jwt.sign(
      { userId: user._id }, 
      process.env.JWT_SECRET, 
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        permissions: user.permissions
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get current user info
app.get('/api/auth/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        permissions: user.permissions,
        isOnline: user.isOnline,
        lastSeen: user.lastSeen
      }
    });
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Check if login is by username (for admin convenience)
    let user;
    if (email.includes('@')) {
      user = await User.findOne({ email });
    } else {
      // Allow login by username for admin
      user = await User.findOne({ username: email });
    }
    
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { userId: user._id }, 
      process.env.JWT_SECRET, 
      { expiresIn: '7d' }
    );
    
    res.json({
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        permissions: user.permissions
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.get('/api/messages/:room', async (req, res) => {
  try {
    const { room } = req.params;
    const { page = 1, limit = 50 } = req.query;
    
    const messages = await Message.find({ room, isPrivate: false })
      .populate('sender', 'username avatar')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    res.json(messages.reverse());
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.get('/api/messages/private/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user?.userId; // Add auth middleware if needed
    
    const messages = await Message.find({
      isPrivate: true,
      $or: [
        { sender: currentUserId, recipient: userId },
        { sender: userId, recipient: currentUserId }
      ]
    })
    .populate(['sender', 'recipient'], 'username avatar')
    .sort({ createdAt: 1 });
    
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.get('/api/rooms', async (req, res) => {
  try {
    const rooms = await Room.find({ isPrivate: false })
      .populate('createdBy', 'username')
      .sort({ createdAt: 1 }); // Show older rooms first
    
    const roomsWithStats = await Promise.all(rooms.map(async (room) => {
      const messageCount = await Message.countDocuments({ room: room.name, isPrivate: false });
      return {
        _id: room._id,
        name: room.name,
        description: room.description,
        isPrivate: room.isPrivate,
        createdBy: room.createdBy,
        memberCount: room.members.length,
        messageCount,
        createdAt: room.createdAt
      };
    }));
    
    res.json(roomsWithStats);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.post('/api/rooms', async (req, res) => {
  try {
    const { name, description, isPrivate = false, createdBy } = req.body;
    
    // Check if room already exists
    const existingRoom = await Room.findOne({ name: name.toLowerCase() });
    if (existingRoom) {
      return res.status(400).json({ message: 'Room name already exists' });
    }
    
    // Validate room name
    if (!name || name.trim().length < 2) {
      return res.status(400).json({ message: 'Room name must be at least 2 characters' });
    }
    
    if (!/^[a-zA-Z0-9_-]+$/.test(name.trim())) {
      return res.status(400).json({ message: 'Room name can only contain letters, numbers, hyphens, and underscores' });
    }
    
    const room = new Room({
      name: name.toLowerCase().trim(),
      description: description?.trim() || `${name} discussion room`,
      isPrivate,
      createdBy: createdBy || null,
      members: createdBy ? [createdBy] : [],
      admins: createdBy ? [createdBy] : []
    });
    
    await room.save();
    if (createdBy) {
      await room.populate('createdBy', 'username');
    }
    
    res.status(201).json({
      _id: room._id,
      name: room.name,
      description: room.description,
      isPrivate: room.isPrivate,
      createdBy: room.createdBy,
      memberCount: room.members.length,
      createdAt: room.createdAt
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.post('/api/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({
      fileUrl,
      fileName: req.file.originalname,
      fileSize: req.file.size
    });
  } catch (error) {
    res.status(500).json({ message: 'Upload failed', error: error.message });
  }
});

// Middleware to check admin permissions
const checkAdminPermission = (permission) => {
  return async (req, res, next) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        return res.status(401).json({ message: 'No token provided' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      if (user.role !== 'admin' && !user.permissions[permission]) {
        return res.status(403).json({ message: 'Insufficient permissions' });
      }

      req.user = user;
      next();
    } catch (error) {
      res.status(401).json({ message: 'Invalid token' });
    }
  };
};

app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({}, 'username avatar isOnline lastSeen');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin: Get all users with detailed info
app.get('/api/admin/users', checkAdminPermission('canViewAllUsers'), async (req, res) => {
  try {
    const users = await User.find({})
      .select('-password')
      .sort({ createdAt: -1 });
    
    const usersWithStats = await Promise.all(users.map(async (user) => {
      const messageCount = await Message.countDocuments({ sender: user._id });
      const roomsCreated = await Room.countDocuments({ createdBy: user._id });
      
      return {
        ...user.toObject(),
        messageCount,
        roomsCreated,
        isConnected: !!Object.values(connectedUsers).find(u => u._id?.toString() === user._id.toString())
      };
    }));
    
    res.json(usersWithStats);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin: Delete user
app.delete('/api/admin/users/:userId', checkAdminPermission('canDeleteUsers'), async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Don't allow deleting other admins
    const userToDelete = await User.findById(userId);
    if (userToDelete.role === 'admin') {
      return res.status(403).json({ message: 'Cannot delete admin users' });
    }
    
    // Delete user's messages
    await Message.deleteMany({ sender: userId });
    
    // Remove user from rooms
    await Room.updateMany(
      { members: userId },
      { $pull: { members: userId, admins: userId } }
    );
    
    // Delete rooms created by user (if no other members)
    const userRooms = await Room.find({ createdBy: userId });
    for (const room of userRooms) {
      if (room.members.length <= 1) {
        await Room.findByIdAndDelete(room._id);
        await Message.deleteMany({ room: room.name });
      } else {
        // Transfer ownership to first admin or member
        const newOwner = room.admins.find(id => id.toString() !== userId) || room.members[0];
        room.createdBy = newOwner;
        await room.save();
      }
    }
    
    // Disconnect user if online
    const connectedUser = Object.entries(connectedUsers).find(([_, user]) => 
      user._id?.toString() === userId
    );
    if (connectedUser) {
      const [socketId] = connectedUser;
      io.to(socketId).emit('account_deleted', { message: 'Your account has been deleted by an administrator' });
      setTimeout(() => {
        io.sockets.sockets.get(socketId)?.disconnect();
      }, 2000); // Give time for the message to be received
    }
    
    // Delete the user
    await User.findByIdAndDelete(userId);
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin: Get all messages
app.get('/api/admin/messages', checkAdminPermission('canDeleteMessages'), async (req, res) => {
  try {
    const { page = 1, limit = 50, room, search } = req.query;
    
    let query = {};
    if (room && room !== 'all') {
      query.room = room;
    }
    if (search) {
      query.content = { $regex: search, $options: 'i' };
    }
    
    const messages = await Message.find(query)
      .populate('sender', 'username email role')
      .populate('recipient', 'username')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await Message.countDocuments(query);
    
    res.json({
      messages,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin: Delete message
app.delete('/api/admin/messages/:messageId', checkAdminPermission('canDeleteMessages'), async (req, res) => {
  try {
    const { messageId } = req.params;
    
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    await Message.findByIdAndDelete(messageId);
    
    // Notify all users in the room that message was deleted
    io.to(message.room).emit('message_deleted', { messageId, deletedBy: 'admin' });
    
    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin: Bulk delete messages
app.post('/api/admin/messages/bulk-delete', checkAdminPermission('canDeleteMessages'), async (req, res) => {
  try {
    const { messageIds, room, dateRange } = req.body;
    
    let deleteQuery = {};
    
    if (messageIds && messageIds.length > 0) {
      deleteQuery._id = { $in: messageIds };
    } else if (room) {
      deleteQuery.room = room;
      if (dateRange) {
        deleteQuery.createdAt = {
          $gte: new Date(dateRange.start),
          $lte: new Date(dateRange.end)
        };
      }
    }
    
    const deletedMessages = await Message.find(deleteQuery);
    const result = await Message.deleteMany(deleteQuery);
    
    // Notify affected rooms
    const affectedRooms = [...new Set(deletedMessages.map(msg => msg.room))];
    affectedRooms.forEach(roomName => {
      io.to(roomName).emit('messages_bulk_deleted', { 
        room: roomName, 
        count: result.deletedCount,
        deletedBy: 'admin' 
      });
    });
    
    res.json({ 
      message: `${result.deletedCount} messages deleted successfully`,
      deletedCount: result.deletedCount 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin: Update user role/permissions
app.patch('/api/admin/users/:userId', checkAdminPermission('canDeleteUsers'), async (req, res) => {
  try {
    const { userId } = req.params;
    const { role, permissions } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (role) user.role = role;
    if (permissions) {
      user.permissions = { ...user.permissions, ...permissions };
    }
    
    await user.save();
    
    res.json({ message: 'User updated successfully', user: user.toObject() });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Database verification endpoint
app.get('/api/verify-db', async (req, res) => {
  try {
    const messageCount = await Message.countDocuments();
    const userCount = await User.countDocuments();
    const roomCount = await Room.countDocuments();
    
    const recentMessages = await Message.find()
      .populate('sender', 'username')
      .sort({ createdAt: -1 })
      .limit(10);
    
    const messagesByRoom = await Message.aggregate([
      { $match: { isPrivate: false } },
      { $group: { _id: '$room', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    const onlineUsers = Object.values(connectedUsers).length;
    
    res.json({
      status: 'Database connected ✅',
      timestamp: new Date().toISOString(),
      collections: {
        messages: messageCount,
        users: userCount,
        rooms: roomCount
      },
      realTime: {
        onlineUsers,
        connectedSockets: Object.keys(connectedUsers).length
      },
      messagesByRoom,
      recentMessages: recentMessages.map(msg => ({
        id: msg._id,
        content: msg.content.substring(0, 50) + (msg.content.length > 50 ? '...' : ''),
        sender: msg.sender?.username || msg.guestUsername || 'Unknown',
        room: msg.room,
        isPrivate: msg.isPrivate,
        createdAt: msg.createdAt
      }))
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'Database error ❌', 
      error: error.message 
    });
  }
});

// Root route
app.get('/', (req, res) => {
  res.send('Stephen\'s Socket.io Chat Server is running');
});

// Clean up old messages (keep last 1000 messages per room)
const cleanupOldMessages = async () => {
  try {
    const rooms = ['general', 'random', 'tech'];
    
    for (const room of rooms) {
      const messageCount = await Message.countDocuments({ room, isPrivate: false });
      
      if (messageCount > 1000) {
        const messagesToDelete = await Message.find({ room, isPrivate: false })
          .sort({ createdAt: 1 })
          .limit(messageCount - 1000)
          .select('_id');
        
        const idsToDelete = messagesToDelete.map(msg => msg._id);
        await Message.deleteMany({ _id: { $in: idsToDelete } });
        
        console.log(`Cleaned up ${idsToDelete.length} old messages from room: ${room}`);
      }
    }
  } catch (error) {
    console.error('Error cleaning up old messages:', error);
  }
};

// Run cleanup every 24 hours
setInterval(cleanupOldMessages, 24 * 60 * 60 * 1000);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Database verification: http://localhost:${PORT}/api/verify-db`);
});

module.exports = { app, server, io }; 