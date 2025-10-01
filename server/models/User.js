const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    index: true,
    unique: true,
    sparse: true
  },
  name: {
    type: String,
    required: true
  },
  // teacherId reference for students created by a teacher (class roster)
  teacherId: {
    type: String,
  },
  role: {
    type: String,
    enum: ['student', 'teacher', 'admin'],
    required: true
  },
  passwordHash: {
    type: String
  },
  rollNo: {
    type: String,
    required: function() { return this.role === 'student'; }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
