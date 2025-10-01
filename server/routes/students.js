const express = require('express');
const router = express.Router();
const multer = require('multer');
const csvParser = require('csv-parser');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');
const User = require('../models/User');

const upload = multer();

// In-memory fallback when Mongo is disconnected
const isDbConnected = () => mongoose.connection && mongoose.connection.readyState === 1;
const memory = { students: [] };

// Get students for a teacher
router.get('/teacher/:teacherId', async (req, res) => {
  try {
    const { teacherId } = req.params;
    let students;
    if (isDbConnected()) {
      students = await User.find({ role: 'student', teacherId }).select('_id name rollNo teacherId userId');
    } else {
      students = memory.students.filter(s => s.teacherId === teacherId);
    }
    res.json({ success: true, students });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Add a student
router.post('/', async (req, res) => {
  try {
    const { name, rollNo, teacherId } = req.body;
    if (!name || !rollNo || !teacherId) {
      return res.status(400).json({ success: false, error: 'name, rollNo, teacherId required' });
    }
    if (isDbConnected()) {
      const user = new User({ userId: uuidv4(), name, rollNo, role: 'student', teacherId });
      await user.save();
      return res.json({ success: true, user });
    }
    const memUser = { _id: uuidv4(), userId: uuidv4(), name, rollNo, role: 'student', teacherId };
    memory.students.push(memUser);
    res.json({ success: true, user: memUser });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Delete a student
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (isDbConnected()) {
      await User.deleteOne({ _id: id, role: 'student' });
    } else {
      memory.students = memory.students.filter(s => s._id !== id);
    }
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Clear all students for a teacher
router.post('/clear', async (req, res) => {
  try {
    const { teacherId } = req.body;
    if (isDbConnected()) {
      await User.deleteMany({ role: 'student', teacherId });
    } else {
      memory.students = memory.students.filter(s => s.teacherId !== teacherId);
    }
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// Import CSV
router.post('/import', upload.single('file'), async (req, res) => {
  try {
    const { teacherId, createAccounts } = req.body;
    if (!req.file) return res.status(400).json({ success: false, error: 'CSV file required' });

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

    // Normalize headers from various CSV formats
    const normalize = (row) => {
      const entries = Object.entries(row).reduce((acc, [k, v]) => {
        const key = String(k).trim().toLowerCase();
        acc[key] = typeof v === 'string' ? v.trim() : v;
        return acc;
      }, {});
      const rollNo = entries['roll no'] || entries['rollno'] || entries['roll_no'] || entries['rollnumber'] || entries['roll'] || entries['rollno.'] || entries['rollno '] || entries['roll'] || entries['rollno'] || entries['rollnumber'] || entries['roll number'] || entries['roll#'] || entries['rollnum'] || entries['rollno.'] || entries['rollno'] || entries['rollno '] || entries['roll no'] || entries['rollno'] || entries['rollno'] || entries['rollno'];
      const name = entries['name'] || entries['student name'] || entries['fullname'] || entries['full name'];
      return { name, rollNo };
    };

    const docs = rows
      .map(normalize)
      .filter(r => r.name && r.rollNo)
      .map(r => ({ userId: uuidv4(), name: r.name, rollNo: r.rollNo, role: 'student', teacherId }));

    if (docs.length > 0) {
      if (isDbConnected()) {
        // If createAccounts flag, also set email and default password
        if (String(createAccounts) === 'true') {
          const docsWithCreds = docs.map(d => ({
            ...d,
            email: `${d.rollNo}@examproctor.com`,
            passwordHash: bcrypt.hashSync('student123', 10)
          }));
          await User.insertMany(docsWithCreds, { ordered: false });
        } else {
          await User.insertMany(docs, { ordered: false });
        }
      } else {
        const memDocs = docs.map(d => ({ _id: uuidv4(), ...d }));
        memory.students.push(...memDocs);
      }
    }

    // Return updated list for this teacher so UI can refresh immediately
    let students;
    if (isDbConnected()) {
      students = await User.find({ role: 'student', teacherId }).select('_id name rollNo teacherId userId');
    } else {
      students = memory.students.filter(s => s.teacherId === teacherId);
    }

    res.json({ success: true, count: docs.length, students });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

module.exports = router;


