const mongoose = require('mongoose');

const systemLogSchema = new mongoose.Schema({
  logId: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    enum: [
      'cheating_detection',
      'clock_sync',
      'load_balancing', 
      'replication',
      'mutual_exclusion',
      'read_write_lock',
      'exam_event',
      'system_error'
    ],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  userId: String,
  examId: String,
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  severity: {
    type: String,
    enum: ['info', 'warning', 'error', 'critical'],
    default: 'info'
  }
}, {
  timestamps: true
});

// Index for efficient time-based queries
systemLogSchema.index({ createdAt: -1 });
systemLogSchema.index({ type: 1, createdAt: -1 });

module.exports = mongoose.model('SystemLog', systemLogSchema);
