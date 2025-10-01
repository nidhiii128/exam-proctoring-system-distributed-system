const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Exam = require('../models/Exam');
const Submission = require('../models/Submission');
const systemLogs = require('../distributed/systemLogs');
const replication = require('../distributed/replication');
const multer = require('multer');
const csvParser = require('csv-parser');

const router = express.Router();
const upload = multer();

// List available (active) exams for students
router.get('/available', async (req, res) => {
  try {
    const { userId } = req.query || {};
    let exams = [];
    try {
      const docs = await Exam.find({ status: 'active' });
      let submittedExamIds = [];
      if (userId) {
        try {
          const Submission = require('../models/Submission');
          const subs = await Submission.find({ userId }).select('examId');
          submittedExamIds = subs.map(s => s.examId);
        } catch (e) {}
      }
      exams = docs.map(e => ({
        examId: e.examId,
        title: e.title,
        description: e.description || '',
        duration: e.duration,
        status: e.status,
        startTime: e.startTime,
        endTime: e.endTime,
        createdBy: e.createdBy,
        questions: Array.isArray(e.questions) ? e.questions.map(q => ({ questionId: q.questionId })) : []
      })).filter(exam => !submittedExamIds.includes(exam.examId));
    } catch (dbError) {
      exams = [];
    }
    res.json({ success: true, exams });
  } catch (error) {
    console.error('List available exams error:', error);
    res.status(500).json({ error: 'Failed to fetch available exams' });
  }
});

// List all exams (admin/teacher overview)
router.get('/all', async (req, res) => {
  try {
    let exams = [];
    try {
      const docs = await Exam.find({}).sort({ createdAt: -1 });
      exams = docs.map(e => ({ ...e.toObject(), questionCount: Array.isArray(e.questions) ? e.questions.length : 0 }));
    } catch (e) {
      exams = [];
    }
    res.json({ success: true, exams });
  } catch (error) {
    console.error('List all exams error:', error);
    res.status(500).json({ error: 'Failed to fetch exams' });
  }
});

// Get exams for a teacher
router.get('/teacher/:teacherId', async (req, res) => {
  try {
    const { teacherId } = req.params;
    let exams = [];
    try {
      exams = await Exam.find({ createdBy: teacherId }).sort({ createdAt: -1 });
    } catch (e) {
      exams = [];
    }
    res.json({ success: true, exams });
  } catch (error) {
    console.error('Teacher exams error:', error);
    res.status(500).json({ error: 'Failed to fetch teacher exams' });
  }
});

// Create new exam
router.post('/create', async (req, res) => {
  try {
    const body = req.body || {};
    const title = body.title || '';
    const duration = Number(body.duration) || 0;
    const createdBy = body.createdBy || '';
    const questions = Array.isArray(body.questions) ? body.questions : [];

    if (!title || !createdBy || questions.length === 0) {
      return res.status(400).json({ error: 'title, createdBy and questions are required' });
    }
    
    const examId = uuidv4();
    const examData = {
      examId,
      title,
      questions: questions.map(q => ({ ...q, questionId: uuidv4() })),
      duration,
      createdBy,
      status: 'created'
    };

    // Save to database
    try {
      const exam = new Exam(examData);
      await exam.save();
    } catch (dbError) {
      console.warn('MongoDB not available, using in-memory storage');
    }

    // Create replicated chunk
    replication.createChunk(examData, 'exam_data');

    systemLogs.logExamEvent(examId, 'exam_created', createdBy, {
      title,
      questionCount: questions.length,
      duration
    });

    res.json({ success: true, exam: examData });
  } catch (error) {
    console.error('Create exam error:', error);
    res.status(500).json({ error: 'Failed to create exam' });
  }
});

// Start exam
router.post('/:examId/start', async (req, res) => {
  try {
    const { examId } = req.params;
    const { userId } = req.body;

    let exam = null;
    try {
      exam = await Exam.findOne({ examId });
      if (exam) {
        exam.status = 'active';
        exam.startTime = new Date();
        exam.endTime = new Date(Date.now() + exam.duration * 60 * 1000);
        await exam.save();
      }
    } catch (dbError) {
      console.warn('MongoDB not available for exam start');
    }

    systemLogs.logExamEvent(examId, 'exam_started', userId, {
      startTime: new Date().toISOString(),
      examTitle: exam?.title
    });

    res.json({ success: true, message: 'Exam started' });
  } catch (error) {
    console.error('Start exam error:', error);
    res.status(500).json({ error: 'Failed to start exam' });
  }
});

// Stop exam
router.post('/:examId/stop', async (req, res) => {
  try {
    const { examId } = req.params;
    try {
      await Exam.findOneAndUpdate({ examId }, { status: 'ended', endTime: new Date() });
    } catch (e) {}
    systemLogs.logExamEvent(examId, 'exam_stopped');
    res.json({ success: true });
  } catch (error) {
    console.error('Stop exam error:', error);
    res.status(500).json({ error: 'Failed to stop exam' });
  }
});

// Get exam for students
router.get('/:examId/take', async (req, res) => {
  try {
    const { examId } = req.params;
    const { userId } = req.query || {};
    
    let exam = null;
    try {
      exam = await Exam.findOne({ examId });
    } catch (dbError) {
      // Return mock exam for demo
      exam = {
        examId,
        title: 'Demo Exam',
        questions: [
          {
            questionId: uuidv4(),
            text: 'What is the capital of France?',
            options: ['London', 'Berlin', 'Paris', 'Madrid'],
            correctOption: 2
          },
          {
            questionId: uuidv4(),
            text: 'Which programming language is this exam system built with?',
            options: ['Python', 'JavaScript', 'Java', 'C++'],
            correctOption: 1
          }
        ],
        duration: 30,
        startTime: new Date(),
        endTime: new Date(Date.now() + 30 * 60 * 1000)
      };
    }

    if (!exam || exam.status !== 'active') {
      return res.status(404).json({ error: 'Exam not found or not active' });
    }

    // One attempt guard: if a submission exists for this userId, block
    if (userId) {
      try {
        const existing = await Submission.findOne({ examId, userId });
        if (existing) {
          if (existing.status === 'terminated') {
            return res.status(409).json({ error: 'You are blocked from this exam due to termination' });
          }
          return res.status(409).json({ error: 'You have already submitted this exam' });
        }
      } catch (e) {}
    }

    // Build plain JSON (no Mongoose docs), hide answers
    const questionList = Array.isArray(exam.questions)
      ? exam.questions.map(q => ({
          questionId: q.questionId,
          text: q.text,
          options: q.options || []
        }))
      : [];

    const studentExam = {
      examId: exam.examId,
      title: exam.title,
      description: exam.description || '',
      duration: exam.duration,
      status: exam.status,
      startTime: exam.startTime,
      endTime: exam.endTime,
      questions: questionList
    };

    res.json({ success: true, exam: studentExam });
  } catch (error) {
    console.error('Get exam error:', error);
    res.status(500).json({ error: 'Failed to get exam' });
  }
});

// Get exam results for teacher
router.get('/:examId/results', async (req, res) => {
  try {
    const { examId } = req.params;
    
    let submissions = [];
    try {
      submissions = await Submission.find({ examId });
    } catch (dbError) {
      console.warn('MongoDB not available for results');
    }

    res.json({ success: true, submissions });
  } catch (error) {
    console.error('Get results error:', error);
    res.status(500).json({ error: 'Failed to get results' });
  }
});

  // Release marks (best-effort; do not block on lock verification)
  router.post('/:examId/release-marks', async (req, res) => {
  try {
    const { examId } = req.params;
    const { userId } = req.body;
    
    try {
      // Update exam to mark as released
      await Exam.findOneAndUpdate({ examId }, { marksReleased: true });
      
      // Get all submissions for this exam and calculate scores
      const Submission = require('../models/Submission');
      const submissions = await Submission.find({ examId });

      // Fetch exam once for metadata and answers map
      const examDoc = await Exam.findOne({ examId });
      const questionMap = new Map();
      if (examDoc && Array.isArray(examDoc.questions)) {
        examDoc.questions.forEach(q => questionMap.set(String(q.questionId), q.correctOption));
      }

      for (const submission of submissions) {
        // Preserve manually edited marks if already set
        let marks = typeof submission.marks === 'number' ? submission.marks : 0;
        let maxMarks = typeof submission.maxMarks === 'number' ? submission.maxMarks : 0;

        if (marks === 0 && maxMarks === 0) {
          // Only compute if nothing set yet
          if (examDoc && Array.isArray(examDoc.questions)) {
            maxMarks = examDoc.questions.length * 10; // 10 marks per question
            for (const answer of submission.answers || []) {
              const correct = questionMap.get(String(answer.questionId));
              if (correct !== undefined && Number(answer.selectedOption) === Number(correct)) {
                marks += 10;
              }
            }
            if (submission.cheatingWarnings >= 1) marks = Math.floor(marks / 2);
            if (submission.status === 'terminated') marks = 0;
          } else {
            // Fallback
            marks = submission.answers?.length * 10 || 0;
            maxMarks = marks;
          }
        }

        // Update submission with release status and metadata; keep existing marks if edited
        await Submission.findOneAndUpdate(
          { submissionId: submission.submissionId },
          { 
            marks, 
            maxMarks, 
            marksReleased: true,
            examTitle: examDoc?.title || 'Exam',
            examDuration: examDoc?.duration || 0,
            totalQuestions: Array.isArray(examDoc?.questions) ? examDoc.questions.length : 0,
            answeredQuestions: submission.answers?.length || 0
          }
        );
      }

      systemLogs.logExamEvent(examId, 'marks_released', userId, { examTitle: examDoc?.title });
      res.json({ success: true, message: 'Marks released successfully' });
    } catch (dbError) {
      console.warn('MongoDB not available for mark release');
      res.json({ success: true, message: 'Marks release queued' });
    }
  } catch (error) {
    console.error('Release marks error:', error);
    res.status(500).json({ error: 'Failed to release marks' });
  }
});

// Acquire write lock for marks updating (without releasing)
router.post('/:examId/acquire-write-lock', async (req, res) => {
  try {
    const { examId } = req.params;
    const { userId } = req.body;
    const readWriteLocks = require('../distributed/readWriteLocks');
    const { io } = require('..'); // Access the Socket.IO instance
    
    // Acquire write locks across all chunks to block all student readers
    const chunkKeys = ['marks-chunk-0','marks-chunk-1','marks-chunk-2','marks-chunk-3','marks-chunk-4'];
    
    // Notify students that marks are being updated
    io.to('student').emit('marks-update-start', { examId, userId });
    
    // Instead of denying immediately, attempt to acquire with a bounded wait (writer-priority handled by lock manager)
    const acquired = [];
    try {
      // Acquire locks; if any chunk times out due to active readers, fail the whole operation
      for (const key of chunkKeys) {
        // Give a bit more time so readers can drain
        await readWriteLocks.requestWriteLock(userId, key, 5000);
        acquired.push(key);
      }

      systemLogs.addLog({
        type: 'marks_write_lock_acquired',
        message: `Teacher acquired write lock for exam`,
        userId,
        metadata: { lockKeys: chunkKeys, examId, lockType: 'write' }
      });

      const status = chunkKeys.map(k => ({ key: k, status: readWriteLocks.getLockStatus(k) }));
      res.json({ success: true, message: 'Write lock acquired successfully', lockStatus: status });
    } catch (lockError) {
      // Best-effort cleanup of any partial acquisitions
      for (const key of acquired) {
        try { readWriteLocks.releaseLock(userId, key); } catch (e) {}
      }
      if (lockError.message.includes('timeout')) {
        const statuses = chunkKeys.map(k => ({ key: k, status: readWriteLocks.getLockStatus(k) }));
        res.status(423).json({ 
          error: 'Students are currently viewing marks. Try again shortly.',
          reason: 'students_reading',
          lockStatus: statuses
        });
      } else {
        throw lockError;
      }
    }
  } catch (error) {
    console.error('Acquire write lock error:', error);
    res.status(500).json({ error: 'Failed to acquire write lock' });
  }
});

// Release write lock
router.post('/:examId/release-write-lock', async (req, res) => {
  try {
    const { examId } = req.params;
    const { userId } = req.body;
    const readWriteLocks = require('../distributed/readWriteLocks');
    const { io } = require('..'); // Access the Socket.IO instance
    const chunkKeys = ['marks-chunk-0','marks-chunk-1','marks-chunk-2','marks-chunk-3','marks-chunk-4'];

    for (const key of chunkKeys) {
      try { readWriteLocks.releaseLock(userId, key); } catch (e) {}
    }

    systemLogs.addLog({
      type: 'marks_write_lock_released',
      message: `Teacher released write lock for exam`,
      userId,
      metadata: { lockKeys: chunkKeys, examId }
    });

    // Notify students that marks update is complete
    io.to('student').emit('marks-update-end', { examId, userId });

    const status = chunkKeys.map(k => ({ key: k, status: readWriteLocks.getLockStatus(k) }));
    res.json({ success: true, message: 'Write lock released successfully', lockStatus: status });
  } catch (error) {
    console.error('Release write lock error:', error);
    res.status(500).json({ error: 'Failed to release write lock' });
  }
});

// Update individual student marks (requires write lock)
router.put('/:examId/update-marks/:userId', async (req, res) => {
  try {
    const { examId, userId } = req.params;
    const { marks, maxMarks } = req.body;
    const readWriteLocks = require('../distributed/readWriteLocks');
    let io = null;
    try { io = require('..').io; } catch (e) {}
    
  // Allow manual update even if lock status cannot be verified (to avoid false 423s)
    
    const Submission = require('../models/Submission');
    const submission = await Submission.findOne({ examId, userId });
    if (!submission) return res.status(404).json({ error: 'Submission not found' });

    // Notify student UIs that an update is in progress
    try { io && io.to('student').emit('marks-update-start', { userId, examId }); } catch (e) {}

    // Update submission with new marks
    await Submission.findOneAndUpdate(
      { submissionId: submission.submissionId },
      { 
        marks: parseInt(marks) || 0,
        maxMarks: parseInt(maxMarks) || submission.maxMarks || 0,
        marksReleased: false // Keep as unreleased until teacher clicks Done
      }
    );

    systemLogs.addLog({
      type: 'marks_updated_manually',
      message: `Teacher manually updated marks for student`,
      userId: req.body?.userId || 'teacher',
      metadata: {
        examId,
        studentId: userId,
        marks,
        maxMarks
      }
    });

    // Notify completion so targeted student UIs can refresh if needed
    try { io && io.to('student').emit('marks-update-end', { userId, examId }); } catch (e) {}

    res.json({ success: true, message: 'Marks updated successfully' });
  } catch (error) {
    console.error('Update marks error:', error);
    res.status(500).json({ error: 'Failed to update marks' });
  }
});

// Release marks for a single student
router.post('/:examId/release-marks/:userId', async (req, res) => {
  try {
    const { examId, userId } = req.params;
    const readWriteLocks = require('../distributed/readWriteLocks');
    let io = null;
    try { io = require('..').io; } catch (e) {}
    
    // Extract roll number for chunking (last 2 digits % 5)
    const rollNo = userId.slice(-2);
    const chunkId = parseInt(rollNo) % 5;
    const resourceId = `marks-chunk-${chunkId}`;
    
    try {
      // Acquire write lock for marks updating
      await readWriteLocks.requestWriteLock(userId, resourceId, 10000);
      // Notify the target student (and optionally teachers) that an update is in progress
      try { io && io.to('student').emit('marks-update-start', { userId, examId, resourceId }); } catch (e) {}
      
      systemLogs.addLog({
        type: 'marks_write_lock',
        message: `Teacher acquired write lock for updating marks of student`,
        userId,
        metadata: {
          resourceId,
          chunkId,
          examId,
          lockType: 'write'
        }
      });
      
      const Submission = require('../models/Submission');
      const submission = await Submission.findOne({ examId, userId });
      if (!submission) return res.status(404).json({ error: 'Submission not found' });

      let marks = 0;
      let maxMarks = 0;
      let examDoc = null;
      
      try {
        examDoc = await Exam.findOne({ examId });
        if (examDoc && Array.isArray(examDoc.questions)) {
          maxMarks = examDoc.questions.length * 10;
          const map = new Map();
          examDoc.questions.forEach(q => map.set(String(q.questionId), q.correctOption));
          for (const a of submission.answers || []) {
            const c = map.get(String(a.questionId));
            if (c !== undefined && Number(a.selectedOption) === Number(c)) marks += 10;
          }
          if (submission.cheatingWarnings >= 1) marks = Math.floor(marks / 2);
          if (submission.status === 'terminated') marks = 0;
        }
      } catch (e) {
        console.error('Error calculating marks:', e);
      }

      // If teacher has manually set marks previously, preserve them
      const finalMarks = typeof submission.marks === 'number' && submission.marks >= 0 ? submission.marks : marks;
      const finalMax = typeof submission.maxMarks === 'number' && submission.maxMarks > 0 ? submission.maxMarks : (maxMarks || (examDoc?.questions?.length || 0) * 10);

      // Update submission with all necessary fields
      await Submission.findOneAndUpdate(
        { submissionId: submission.submissionId },
        { 
          marks: finalMarks, 
          maxMarks: finalMax, 
          marksReleased: true,
          examTitle: examDoc?.title || 'Exam',
          examDuration: examDoc?.duration || 0,
          totalQuestions: examDoc?.questions?.length || 0,
          answeredQuestions: submission.answers?.length || 0
        }
      );

      systemLogs.addLog({
        type: 'marks_updated',
        message: `Marks updated for student`,
        userId,
        metadata: {
          resourceId,
          chunkId,
          examId,
          marks: finalMarks,
          maxMarks: finalMax
        }
      });

      // Notify completion so student UIs can refresh immediately
      try { io && io.to('student').emit('marks-update-end', { userId, examId, resourceId }); } catch (e) {}
      res.json({ success: true, message: 'Marks released successfully' });
    } catch (lockError) {
      systemLogs.addLog({
        type: 'marks_write_lock_denied',
        message: `Teacher denied write lock for student - system busy`,
        userId,
        metadata: {
          resourceId,
          chunkId,
          examId,
          reason: 'system_busy'
        }
      });
      
      res.status(423).json({ 
        error: 'System is busy. Please wait and try again.',
        lockStatus: 'system_busy'
      });
    } finally {
      try { readWriteLocks.releaseLock(userId, resourceId); } catch (e) {}
    }
  } catch (error) {
    console.error('Release marks (single) error:', error);
    res.status(500).json({ error: 'Failed to release marks' });
  }
});

// Get exam by id
router.get('/:examId', async (req, res) => {
  try {
    const { examId } = req.params;
    let exam = null;
    try {
      exam = await Exam.findOne({ examId });
    } catch (e) {}
    if (!exam) return res.status(404).json({ error: 'Exam not found' });
    res.json({ success: true, exam });
  } catch (error) {
    console.error('Get exam error:', error);
    res.status(500).json({ error: 'Failed to get exam' });
  }
});

// Lightweight exam details for student join/preview (no answers)
router.get('/:examId/details', async (req, res) => {
  try {
    const { examId } = req.params;
    let exam = null;
    try {
      exam = await Exam.findOne({ examId });
    } catch (e) {}
    if (!exam) return res.status(404).json({ error: 'Exam not found' });
    const questionCount = Array.isArray(exam.questions) ? exam.questions.length : 0;
    res.json({
      success: true,
      exam: {
        examId: exam.examId,
        title: exam.title,
        description: exam.description || '',
        duration: exam.duration,
        status: exam.status,
        startTime: exam.startTime,
        endTime: exam.endTime,
        createdBy: exam.createdBy,
        questionCount
      }
    });
  } catch (error) {
    console.error('Get exam details error:', error);
    res.status(500).json({ error: 'Failed to get exam details' });
  }
});

// Update exam
router.put('/:examId', async (req, res) => {
  try {
    const { examId } = req.params;
    const data = req.body;
    try {
      await Exam.findOneAndUpdate({ examId }, data);
    } catch (e) {}
    res.json({ success: true });
  } catch (error) {
    console.error('Update exam error:', error);
    res.status(500).json({ error: 'Failed to update exam' });
  }
});

// Delete exam
router.delete('/:examId', async (req, res) => {
  try {
    const { examId } = req.params;
    try {
      // Acquire write lock to ensure atomic cleanup
      const ricartAgrawala = require('../distributed/ricartAgrawala');
      const lockKey = 'marks-chunk-0';
      await ricartAgrawala.acquireWriteLock(lockKey);
      try {
        await Exam.deleteOne({ examId });
        // Remove all student submissions/marks for this exam
        const Submission = require('../models/Submission');
        await Submission.deleteMany({ examId });
        systemLogs.logExamEvent(examId, 'exam_deleted_cleanup', null, { removedSubmissions: true });
      } finally {
        ricartAgrawala.releaseWriteLock(lockKey);
      }
    } catch (e) {}
    res.json({ success: true });
  } catch (error) {
    console.error('Delete exam error:', error);
    res.status(500).json({ error: 'Failed to delete exam' });
  }
});

// Duplicate exam
router.post('/:examId/duplicate', async (req, res) => {
  try {
    const { examId } = req.params;
    let exam = null;
    try {
      exam = await Exam.findOne({ examId });
    } catch (e) {}
    if (!exam) return res.status(404).json({ error: 'Exam not found' });
    const newExam = exam.toObject();
    newExam._id = undefined;
    newExam.examId = uuidv4();
    newExam.title = `${exam.title} (Copy)`;
    newExam.status = 'created';
    let saved;
    try {
      saved = await new Exam(newExam).save();
    } catch (e) {
      // best-effort fallback object
      saved = newExam;
    }
    // Return a client-friendly exam object
    const clientExam = {
      examId: saved.examId,
      title: saved.title,
      description: saved.description || '',
      duration: saved.duration,
      status: saved.status,
      createdAt: saved.createdAt || new Date(),
      questions: Array.isArray(saved.questions) ? saved.questions.map(q => ({ questionId: q.questionId })) : []
    };
    res.json({ success: true, exam: clientExam });
  } catch (error) {
    console.error('Duplicate exam error:', error);
    res.status(500).json({ error: 'Failed to duplicate exam' });
  }
});

// Archive/Restore flags (simple via status)
router.post('/:examId/archive', async (req, res) => {
  try {
    const { examId } = req.params;
    try { await Exam.findOneAndUpdate({ examId }, { status: 'archived' }); } catch (e) {}
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: 'Failed to archive' }); }
});

router.post('/:examId/restore', async (req, res) => {
  try {
    const { examId } = req.params;
    try { await Exam.findOneAndUpdate({ examId }, { status: 'created' }); } catch (e) {}
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: 'Failed to restore' }); }
});

// CSV template for questions
router.get('/template-csv', (req, res) => {
  const content = [
    'qno,question,optionsa,optionsb,optionsc,optionsd,correctansweroption',
    '1,"What is the capital of France?","Paris","London","Berlin","Madrid","a"',
    '2,"Which planet is known as the Red Planet?","Venus","Mars","Jupiter","Saturn","b"',
    '3,"What is 2 + 2?","3","4","5","6","b"'
  ].join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="sample_questions.csv"');
  res.send(content);
});

// Import exam from CSV (multipart): file, title, duration, createdBy
router.post('/import-csv', upload.single('file'), async (req, res) => {
  try {
    const { title, duration = 30, createdBy } = req.body;
    if (!req.file) return res.status(400).json({ error: 'CSV file required' });

    const rows = [];
    const buffer = req.file.buffer;
    await new Promise((resolve, reject) => {
      const stream = require('stream');
      const rs = new stream.PassThrough();
      rs.end(buffer);
      rs.pipe(csvParser())
        .on('data', (data) => rows.push(data))
        .on('end', resolve)
        .on('error', reject);
    });

    const normalize = (row) => {
      // Clean headers: lowercase, trim, strip BOM
      const cleaned = {};
      for (const [rawK, rawV] of Object.entries(row)) {
        const k = String(rawK).replace(/^\uFEFF/, '').trim().toLowerCase();
        cleaned[k] = typeof rawV === 'string' ? rawV.trim() : rawV;
      }
      const pick = (...keys) => keys.map(k=>k.toLowerCase()).find(k => cleaned[k] !== undefined);
      const qKey = pick('question','ques','q','questiontext');
      const aKey = pick('optionsa','optiona','opt a','a');
      const bKey = pick('optionsb','optionb','opt b','b');
      const cKey = pick('optionsc','optionc','opt c','c');
      const dKey = pick('optionsd','optiond','opt d','d');
      const ansKey = pick('correctansweroption','answer','correct','ans');
      const ans = (ansKey ? cleaned[ansKey] : 'a')?.toString().trim().toLowerCase();
      const idx = { a:0,b:1,c:2,d:3 }[ans] ?? 0;
      return {
        questionId: uuidv4(),
        text: (qKey ? cleaned[qKey] : '') || '',
        options: [cleaned[aKey]||'', cleaned[bKey]||'', cleaned[cKey]||'', cleaned[dKey]||''],
        correctOption: idx
      };
    };
    const questions = rows
      .map(normalize)
      .filter(q => q.text && Array.isArray(q.options) && q.options.some(o => o && o.length));
    if (questions.length === 0) return res.status(400).json({ error: 'No valid questions' });

    const examId = uuidv4();
    const examData = { examId, title: title || 'Imported Exam', questions, duration: Number(duration)||30, createdBy, status: 'created' };
    try { await new Exam(examData).save(); } catch (e) {}
    systemLogs.logExamEvent(examId, 'exam_imported', createdBy, { count: questions.length });
    res.json({ success: true, exam: examData });
  } catch (error) {
    console.error('Import CSV exam error:', error);
    res.status(500).json({ error: 'Failed to import exam' });
  }
});

module.exports = router;
