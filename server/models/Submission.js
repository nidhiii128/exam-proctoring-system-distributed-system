const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  questionId: String,
  selectedOption: Number
});

const submissionSchema = new mongoose.Schema({
  submissionId: {
    type: String,
    required: true,
    unique: true
  },
  examId: {
    type: String,
    required: true
  },
  userId: {
    type: String,
    required: true
  },
  rollNo: String,
  name: String,
  answers: [answerSchema],
  status: {
    type: String,
    enum: ['in-progress', 'submitted', 'terminated'],
    default: 'in-progress'
  },
  cheatingWarnings: {
    type: Number,
    default: 0
  },
  marks: {
    type: Number,
    default: 0
  },
  maxMarks: Number,
  submittedAt: Date,
  autoSubmitted: {
    type: Boolean,
    default: false
  },
  marksReleased: {
    type: Boolean,
    default: false
  },
  examTitle: String,
  examDuration: Number,
  totalQuestions: Number,
  answeredQuestions: Number,
  warnings: [String]
}, {
  timestamps: true
});

// Compound index for efficient queries
submissionSchema.index({ examId: 1, userId: 1 });

module.exports = mongoose.model('Submission', submissionSchema);
