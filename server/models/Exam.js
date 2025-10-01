const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  questionId: String,
  text: String,
  options: [String],
  correctOption: Number
});

const examSchema = new mongoose.Schema({
  examId: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  questions: [questionSchema],
  duration: {
    type: Number, // in minutes
    required: true
  },
  status: {
    type: String,
    enum: ['created', 'active', 'ended'],
    default: 'created'
  },
  startTime: Date,
  endTime: Date,
  createdBy: {
    type: String,
    required: true
  },
  marksReleased: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Exam', examSchema);
