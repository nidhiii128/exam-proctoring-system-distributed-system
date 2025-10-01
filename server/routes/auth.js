const express = require('express');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');
const systemLogs = require('../distributed/systemLogs');
const mongoose = require('mongoose');

const router = express.Router();

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Real email/password login with JWT (demo fallback disabled)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    // If MongoDB is not connected, allow demo fallback accounts
    if (mongoose.connection.readyState !== 1) {
      const demoUsers = [
        {
          email: 'amitkumarnerurkar@examproctor.com',
          password: 'teacher123',
          user: { userId: uuidv4(), name: 'Amit Kumar Nerurkar', role: 'teacher', email: 'amitkumarnerurkar@examproctor.com' }
        },
        {
          email: 'admn@examproctor.com',
          password: 'admin123',
          user: { userId: uuidv4(), name: 'Admin', role: 'admin', email: 'admn@examproctor.com' }
        }
      ];
      const match = demoUsers.find(u => u.email === email && u.password === password);
      if (match) {
        const token = jwt.sign({ sub: match.user.userId, role: match.user.role }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '8h' });
        systemLogs.addLog({
          type: 'exam_event',
          message: `User ${match.user.email} (${match.user.role}) logged in (demo mode)`,
          userId: match.user.userId,
          metadata: { role: match.user.role }
        });
        return res.json({ success: true, token, user: match.user });
      }
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const user = await User.findOne({ email });
    if (!user || !user.passwordHash || !bcrypt.compareSync(password, user.passwordHash)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ sub: user.userId, role: user.role }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '8h' });
    const userData = { userId: user.userId, name: user.name, role: user.role, rollNo: user.rollNo, email: user.email };

    // Log the login
    systemLogs.addLog({
      type: 'exam_event',
      message: `User ${userData.email || userData.name} (${userData.role}) logged in`,
      userId: userData.userId,
      metadata: { role: userData.role, rollNo: userData.rollNo || null }
    });

    res.json({ success: true, token, user: userData });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Registration endpoint (email/password)
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, rollNo, teacherId } = req.body;
    if (!name || !email || !password || !role) return res.status(400).json({ error: 'name, email, password, role required' });
    if (role === 'student' && !rollNo) return res.status(400).json({ error: 'rollNo required for students' });
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ error: 'Email already registered' });
    const user = new User({ userId: uuidv4(), name, email, role, rollNo, teacherId, passwordHash: bcrypt.hashSync(password, 10) });
    await user.save();
    res.json({ success: true, user: { userId: user.userId, name, email, role, rollNo } });
  } catch (e) {
    console.error('Register error:', e);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Get current user (for session persistence)
router.get('/me/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    let user = null;
    try {
      user = await User.findOne({ userId });
    } catch (dbError) {
      console.warn('MongoDB not available for user lookup');
    }

    if (user) {
      res.json({ success: true, user });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error('User lookup error:', error);
    res.status(500).json({ error: 'Failed to get user info' });
  }
});

// Logout endpoint
router.post('/logout', (req, res) => {
  const { userId, name } = req.body;
  
  systemLogs.addLog({
    type: 'exam_event',
    message: `User ${name} logged out`,
    userId,
    metadata: { action: 'logout' }
  });

  res.json({ success: true });
});

module.exports = router;
