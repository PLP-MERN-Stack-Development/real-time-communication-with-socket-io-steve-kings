# 🌟 Stephen's Chat 2025 - AMOLED Edition

<div align="center">

![Stephen's Chat 2025](https://img.shields.io/badge/Stephen's%20Chat-2025%20AMOLED%20Edition-00ff88?style=for-the-badge&logo=socket.io&logoColor=white)

**A modern, real-time chat application with AMOLED dark theme and comprehensive admin controls**

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18+-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.7+-010101?style=flat-square&logo=socket.io&logoColor=white)](https://socket.io/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com/)

</div>

## 🚀 Features

### 💬 **Real-Time Communication**
- **Instant Messaging** with Socket.io
- **Private Messages** between users
- **Multiple Chat Rooms** (General, Random, Tech + Custom)
- **Typing Indicators** with real-time updates
- **Online/Offline Status** tracking
- **Message Reactions** with emoji support
- **File Sharing** (images, documents)

### 🎨 **AMOLED Dark Theme**
- **Pure Black Background** (#000000) for true AMOLED displays
- **Neon Accents** in Dark Green (#00ff88), Dark Blue (#0066ff), and Orange (#ff6600)
- **Glassmorphism Effects** with backdrop blur
- **Gradient Animations** and glow effects
- **Energy Efficient** design for mobile devices

### 👥 **User Management**
- **Guest Access** (no registration required)
- **User Registration** with JWT authentication
- **Profile Management** with avatars
- **Role-Based Access** (User, Admin, Moderator)

### 🛡️ **Admin Panel**
- **Complete User Management** (view, delete users)
- **Message Moderation** (delete messages, bulk operations)
- **Real-Time Analytics** (user stats, message counts)
- **Database Monitoring** with health checks
- **Search & Filter** capabilities

### 📱 **Modern UX**
- **Responsive Design** (mobile-first approach)
- **Progressive Web App** features
- **Browser Notifications** for new messages
- **Smooth Animations** and transitions
- **Accessibility Compliant** interface

## 🏗️ Project Structure

```
stephen-chat-2025/
├── client/                     # React Frontend (Vite)
│   ├── public/                 # Static assets
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   │   ├── ChatArea.jsx    # Main chat interface
│   │   │   ├── Sidebar.jsx     # Navigation and rooms
│   │   │   ├── Message.jsx     # Individual message component
│   │   │   ├── MessageInput.jsx # Message composition
│   │   │   ├── CreateRoom.jsx  # Room creation modal
│   │   │   └── UserProfile.jsx # User settings
│   │   ├── context/            # React Context providers
│   │   │   ├── AuthContext.jsx # Authentication state
│   │   │   └── SocketContext.jsx # Socket.io management
│   │   ├── pages/              # Main application pages
│   │   │   ├── Login.jsx       # Authentication page
│   │   │   ├── Register.jsx    # User registration
│   │   │   ├── Chat.jsx        # Main chat interface
│   │   │   └── AdminDashboard.jsx # Admin control panel
│   │   ├── socket/             # Socket.io client setup
│   │   └── App.jsx             # Main application component
│   └── package.json            # Frontend dependencies
├── server/                     # Node.js Backend
│   ├── models/                 # MongoDB schemas
│   │   ├── User.js             # User model with roles
│   │   ├── Message.js          # Message model
│   │   └── Room.js             # Chat room model
│   ├── public/uploads/         # File upload storage
│   ├── server.js               # Main server file
│   ├── package.json            # Backend dependencies
│   └── .env                    # Environment variables
└── README.md                   # This file
```

## 🛠️ Installation & Setup

### Prerequisites
- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **MongoDB Atlas** account (or local MongoDB)
- Modern web browser

### 1. Clone the Repository
```bash
git clone <repository-url>
cd stephen-chat-2025
```

### 2. Server Setup
```bash
cd server
npm install
```

Create `.env` file:
```env
PORT=5000
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb+srv://chatapp_user:%40kings635@cluster0.ni6krnk.mongodb.net/stephen-chat
JWT_SECRET=stephen_chat_secret_key_2024
NODE_ENV=development
```

### 3. Client Setup
```bash
cd client
npm install
```

### 4. Start the Application
```bash
# Terminal 1 - Start server
cd server
npm run dev

# Terminal 2 - Start client
cd client
npm run dev
```

### 5. Access the Application
- **Main App:** http://localhost:5173
- **Admin Panel:** http://localhost:5173/admin
- **Database API:** http://localhost:5000/api/verify-db

## 🔐 Authentication & Access

### 👤 **Regular Users**
- **Guest Access:** Enter any name to join as guest
- **Registration:** Create account with email/username/password
- **Login:** Use email or username to sign in

### 🛡️ **Admin Access**
- **Default Admin:** 
  - Username: `kings`
  - Password: `kings123`
- **Admin Registration:** Use code `stephen2025admin` during signup
- **Admin Panel:** Automatic redirect after admin login

### 🎯 **Quick Start Guide**
1. Open http://localhost:5173
2. Click "🛡️ Admin Login" for admin access
3. Or enter a name for guest access
4. Start chatting immediately!

## 🎮 Usage Guide

### 💬 **Chat Features**
- **Send Messages:** Type and press Enter
- **Switch Rooms:** Click room names in sidebar
- **Private Messages:** Click on user names
- **Create Rooms:** Click + button next to "Rooms"
- **React to Messages:** Hover over messages and click emoji
- **File Upload:** Click paperclip icon in message input

### 🛡️ **Admin Features**
- **User Management:** View, delete, and manage all users
- **Message Moderation:** Delete inappropriate messages
- **Bulk Operations:** Select multiple items for batch actions
- **Real-Time Monitoring:** Live stats and user activity
- **Search & Filter:** Find specific users or messages

## 🎨 Design Philosophy

### **AMOLED Optimization**
- **True Black Backgrounds** for OLED power savings
- **High Contrast** text for readability
- **Vibrant Accents** that pop on dark displays
- **Minimal Eye Strain** for extended use

### **Color Palette**
- **Primary:** Pure Black (#000000)
- **Accent Green:** #00ff88 (success, online status)
- **Accent Blue:** #0066ff (links, secondary actions)
- **Accent Orange:** #ff6600 (warnings, admin features)
- **Text Primary:** #ffffff
- **Text Secondary:** #cccccc

## 🔧 Technical Stack

### **Frontend**
- **React 18** with Hooks and Context
- **Vite** for fast development and building
- **Socket.io Client** for real-time communication
- **React Router** for navigation
- **Axios** for HTTP requests
- **React Hot Toast** for notifications
- **Lucide React** for icons

### **Backend**
- **Node.js** with Express framework
- **Socket.io** for WebSocket communication
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **bcryptjs** for password hashing
- **Multer** for file uploads
- **CORS** for cross-origin requests

### **Database Schema**
- **Users:** Authentication, roles, permissions
- **Messages:** Content, sender, room, reactions
- **Rooms:** Name, description, members, admins

## 🚀 Advanced Features

### **Real-Time Features**
- ✅ Instant message delivery
- ✅ Typing indicators
- ✅ Online presence
- ✅ Message reactions
- ✅ Room notifications
- ✅ User join/leave events

### **Admin Capabilities**
- ✅ User management (view, delete)
- ✅ Message moderation
- ✅ Bulk operations
- ✅ Real-time analytics
- ✅ Database monitoring
- ✅ Search and filtering

### **UX Enhancements**
- ✅ Mobile-responsive design
- ✅ Progressive Web App features
- ✅ Browser notifications
- ✅ File sharing
- ✅ Message persistence
- ✅ Smooth animations

## 📊 API Endpoints

### **Authentication**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user info

### **Chat**
- `GET /api/messages/:room` - Get room messages
- `GET /api/rooms` - Get available rooms
- `POST /api/rooms` - Create new room
- `POST /api/upload` - Upload files

### **Admin**
- `GET /api/admin/users` - Get all users (admin only)
- `DELETE /api/admin/users/:id` - Delete user (admin only)
- `GET /api/admin/messages` - Get all messages (admin only)
- `DELETE /api/admin/messages/:id` - Delete message (admin only)

## 🔒 Security Features

- **JWT Authentication** with secure tokens
- **Password Hashing** with bcrypt
- **Role-Based Access Control** (RBAC)
- **Input Validation** and sanitization
- **CORS Protection** for API endpoints
- **File Upload Restrictions** for security

## 🌐 Deployment

### **Frontend (Vercel/Netlify)**
```bash
cd client
npm run build
# Deploy dist/ folder
```

### **Backend (Railway/Render)**
```bash
cd server
# Set environment variables
# Deploy with npm start
```

### **Environment Variables**
```env
# Production
NODE_ENV=production
PORT=5000
CLIENT_URL=https://your-frontend-url.com
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=your-secure-jwt-secret
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Developer

**Stephen Kings** - *Full Stack Developer*
- GitHub: [@stephen-kings](https://github.com/stephen-kings)
- Email: stephen@example.com

## 🙏 Acknowledgments

- **Socket.io Team** for the amazing real-time library
- **React Team** for the powerful frontend framework
- **MongoDB** for the flexible database solution
- **Vite** for the lightning-fast build tool

---

<div align="center">

**Built with ❤️ by Stephen Kings | Developed 2025**

*Experience the future of real-time communication*

</div> 