const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Submission = require('../models/Submission');
const systemLogs = require('../distributed/systemLogs');
const readWriteLocks = require('../distributed/readWriteLocks');

const router = express.Router();

// Submit exam answers
router.post('/submit', async (req, res) => {
  try {
    const { examId, userId, rollNo, name, answers } = req.body;
    
    // Enforce one attempt per student per exam
    try {
      const existing = await Submission.findOne({ examId, userId });
      if (existing) {
        return res.status(409).json({ error: 'Exam already submitted by this student' });
      }
    } catch (e) {
      // if DB error, continue; /take guard will also protect
    }

    const submissionId = uuidv4();
    const submissionData = {
      submissionId,
      examId,
      userId,
      rollNo,
      name,
      answers,
      status: 'submitted',
      submittedAt: new Date(),
      autoSubmitted: false
    };

    // Calculate marks based on correct answers from the exam
    let marks = 0;
    let maxMarks = 0;
    let warningCount = 0;
    try {
      const Exam = require('../models/Exam');
      const cheatingDetection = require('../distributed/cheatingDetection');
      const examDoc = await Exam.findOne({ examId });
      const questionMap = new Map();
      const perQuestion = 10;
      if (examDoc && Array.isArray(examDoc.questions)) {
        examDoc.questions.forEach(q => questionMap.set(String(q.questionId), q.correctOption));
        maxMarks = examDoc.questions.length * perQuestion;
      } else {
        // Fallback to submitted answers count to avoid NaN
        maxMarks = (answers?.length || 0) * perQuestion;
      }
      for (const ans of answers || []) {
        const correct = questionMap.get(String(ans.questionId));
        if (correct !== undefined && Number(ans.selectedOption) === Number(correct)) {
          marks += perQuestion;
        }
      }
      // Apply penalty if one or more warnings occurred: first warning halves marks
      const statusInfo = cheatingDetection.getStudentStatus(userId);
      warningCount = statusInfo?.warningCount || 0;
      if (warningCount >= 1) {
        marks = Math.floor(marks / 2);
      }
    } catch (e) {
      // If exam fetch fails, default to previous behavior
      const perQuestion = 10;
      marks = (answers?.length || 0) * perQuestion;
      maxMarks = marks;
    }
    submissionData.marks = marks;
    submissionData.maxMarks = maxMarks;
    submissionData.cheatingWarnings = warningCount;

    try {
      const submission = new Submission(submissionData);
      await submission.save();
    } catch (dbError) {
      console.warn('MongoDB not available for submission');
    }

    systemLogs.logExamEvent(examId, 'exam_submitted', userId, {
      submissionId,
      answersCount: answers.length,
      marks,
      rollNo,
      userName: name
    });

    // Notify teacher dashboards
    try {
      const { io } = require('..');
      io.to('teacher').emit('student-submitted', {
        userId,
        rollNo,
        name,
        examId,
        submissionId,
        marks,
        maxMarks,
        timestamp: new Date().toISOString()
      });
    } catch (e) {}

    // Stop cheating detection for this student to avoid post-submit termination
    try {
      const cheatingDetection = require('../distributed/cheatingDetection');
      cheatingDetection.markSubmitted(userId);
    } catch (e) {}

    res.json({ success: true, submission: submissionData });
  } catch (error) {
    console.error('Submit exam error:', error);
    res.status(500).json({ error: 'Failed to submit exam' });
  }
});

// Get student's marks
router.get('/:userId/:examId/marks', async (req, res) => {
  try {
    const { userId, examId } = req.params;
    
    let submission = null;
    try {
      submission = await Submission.findOne({ userId, examId });
    } catch (dbError) {
      console.warn('MongoDB not available for marks lookup');
    }

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    res.json({ success: true, marks: submission.marks, maxMarks: submission.maxMarks });
  } catch (error) {
    console.error('Get marks error:', error);
    res.status(500).json({ error: 'Failed to get marks' });
  }
});

// Get all marks for a student with read-write locking
router.get('/:userId/marks', async (req, res) => {
  try {
    const { userId } = req.params;
    const readWriteLocks = require('../distributed/readWriteLocks');
    const { toChunkId } = require('../distributed/chunking');
    
    const chunkId = toChunkId(userId, 5);
    const resourceId = `marks-chunk-${chunkId}`;
    
    try {
      // Acquire read lock with timeout
      await readWriteLocks.requestReadLock(userId, resourceId, 5000);
      
      let submissions = [];
      try {
        submissions = await Submission.find({ userId }).select('examId marks maxMarks submittedAt status marksReleased examTitle examDuration totalQuestions answeredQuestions warnings');
      } catch (dbError) {
        console.warn('MongoDB not available for marks list');
      }
      
      // Process submissions to include additional data
      const processedSubmissions = submissions.map(sub => ({
        submissionId: sub.submissionId,
        examId: sub.examId,
        examTitle: sub.examTitle || 'Exam',
        examDuration: sub.examDuration || 0,
        totalQuestions: sub.totalQuestions || 0,
        answeredQuestions: sub.answeredQuestions || 0,
        marks: sub.marks || 0,
        maxMarks: sub.maxMarks || 0,
        status: sub.status || 'submitted',
        submittedAt: sub.submittedAt,
        marksReleased: sub.marksReleased || false,
        warnings: sub.warnings || [],
        canView: sub.marksReleased || false,
        waiting: !sub.marksReleased
      }));
      
      res.json({ 
        success: true, 
        submissions: processedSubmissions,
        chunkId,
        lockStatus: readWriteLocks.getLockStatus(resourceId)
      });
    } catch (lockError) {
      if (lockError.message.includes('timeout')) {
        res.status(423).json({ 
          error: 'System is busy. Please wait and try again.',
          lockStatus: 'timeout'
        });
      } else {
        throw lockError;
      }
    } finally {
      // Release read lock
      readWriteLocks.releaseLock(userId, resourceId);
    }
  } catch (error) {
    console.error('Get all marks error:', error);
    res.status(500).json({ error: 'Failed to get marks list' });
  }
});

// Explicit read-lock acquire/release for student marks viewing
router.post('/:userId/acquire-read-lock', async (req, res) => {
  try {
    const { userId } = req.params;
    const readWriteLocks = require('../distributed/readWriteLocks');
    const { toChunkId } = require('../distributed/chunking');
    const chunkId = toChunkId(userId, 5);
    const resourceId = `marks-chunk-${chunkId}`;
    await readWriteLocks.requestReadLock(userId, resourceId, 5000);
    res.json({ success: true, lockStatus: readWriteLocks.getLockStatus(resourceId) });
  } catch (error) {
    res.status(423).json({ error: 'busy' });
  }
});

router.post('/:userId/release-read-lock', async (req, res) => {
  try {
    const { userId } = req.params;
    const readWriteLocks = require('../distributed/readWriteLocks');
    const { toChunkId } = require('../distributed/chunking');
    const chunkId = toChunkId(userId, 5);
    const resourceId = `marks-chunk-${chunkId}`;
    readWriteLocks.releaseLock(userId, resourceId);
    res.json({ success: true, lockStatus: readWriteLocks.getLockStatus(resourceId) });
  } catch (error) {
    res.status(500).json({ error: 'failed' });
  }
});

module.exports = router;
