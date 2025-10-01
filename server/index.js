const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');

// Import route modules
const authRoutes = require('./routes/auth');
const examRoutes = require('./routes/exam');
const submissionRoutes = require('./routes/submission');
const adminRoutes = require('./routes/admin');
const studentsRoutes = require('./routes/students');

// Import distributed systems modules
const clockSync = require('./distributed/clockSync');
const cheatingDetection = require('./distributed/cheatingDetection');
const systemLogs = require('./distributed/systemLogs');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: (origin, cb) => cb(null, true),
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
  }
});

// Middleware
app.use(cors({
  origin: (origin, cb) => cb(null, true),
  credentials: true
}));
app.use(express.json());

// MongoDB connection (with fallback for demo)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/exam-proctoring';
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    // Seed default teacher and admin if not present
    const User = require('./models/User');
    const bcrypt = require('bcryptjs');
    const { v4: uuidv4 } = require('uuid');
    const seed = async () => {
      const ensure = async (query, doc) => {
        const exists = await User.findOne(query);
        if (!exists) {
          await new User(doc).save();
        }
      };
      ensure({ email: 'amitkumarnerurkar@examproctor.com' }, {
        userId: uuidv4(), name: 'Amit Kumar Nerurkar', email: 'amitkumarnerurkar@examproctor.com', role: 'teacher', passwordHash: bcrypt.hashSync('teacher123', 10)
      });
      ensure({ email: 'admn@examproctor.com' }, {
        userId: uuidv4(), name: 'Admin', email: 'admn@examproctor.com', role: 'admin', passwordHash: bcrypt.hashSync('admin123', 10)
      });
    };
    seed();
  })
  .catch((err) => {
    console.warn('MongoDB connection failed, using in-memory storage:', err.message);
    // In production, you'd want to exit here, but for demo we'll continue
  });

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/exam', examRoutes);
app.use('/api/submission', submissionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/students', studentsRoutes);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('join-role', (role) => {
    try {
      // Leave other role rooms to prevent duplicate broadcasts
      ['student','teacher','admin'].forEach(r => { if (socket.rooms.has(r) && r !== role) socket.leave(r); });
      socket.join(role);
      console.log(`User ${socket.id} joined ${role} room`);
    } catch (e) {
      socket.join(role);
    }
  });

  socket.on('join-exam', (examId, student) => {
    socket.join(`exam-${examId}`);
    const userId = student?.userId;
    console.log(`User ${userId} joined exam ${examId}`);
    
    // Start clock sync for student
    if (socket.rooms.has('student')) {
      clockSync.startClockSync(socket);
    }
    
    // Start cheating detection simulation (with student info)
    cheatingDetection.startCheatingDetection(socket, examId, student || { userId }, io);

    // Notify teachers of join event
    io.to('teacher').emit('student-joined', {
      userId,
      rollNo: student?.rollNo,
      name: student?.name,
      examId,
      timestamp: new Date().toISOString()
    });
  });

  // Client-side confirmation rebroadcast (fallback for edge cases)
  socket.on('student-joined-client', (payload) => {
    const { examId, userId, rollNo, name } = payload || {};
    io.to('teacher').emit('student-joined', {
      userId,
      rollNo,
      name,
      examId,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Initialize distributed systems
systemLogs.initialize(io);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, io };
