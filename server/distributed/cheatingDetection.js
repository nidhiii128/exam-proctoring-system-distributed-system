const { v4: uuidv4 } = require('uuid');
const systemLogs = require('./systemLogs');

class CheatingDetection {
  constructor() {
    this.activeStudents = new Map(); // socket.id -> student info
    this.cheatingWarnings = new Map(); // userId -> warning count
    this.submittedStudents = new Set();
    this.activeStudents = new Map(); // socket.id -> student info
    this.cheatingWarnings = new Map(); // userId -> warning count
    this.submittedStudents = new Set();
    this.globalTimer = null; // Add this line
  }

  startCheatingDetection(socket, examId, user, io) {
    const userId = user?.userId || user;
    
    // Store student info with socket ID
    this.activeStudents.set(socket.id, {
      userId,
      rollNo: user?.rollNo,
      name: user?.name,
      examId,
      warningCount: 0,
      status: 'active',
      socketId: socket.id  // Add this line
    });
  
    systemLogs.addLog({
      type: 'cheating_detection',
      message: `Cheating detection started for student ${user?.rollNo || user?.name || userId} in exam ${examId}`,
      userId,
      examId,
      metadata: {
        socketId: socket.id,
        detectionType: 'random_student_selection',
        rollNo: user?.rollNo,
        userName: user?.name
      }
    });
  
    // Start global timer (only once for all students)
    if (!this.globalTimer) {
      this.globalTimer = setInterval(() => {
        this.simulateCheatingDetection(null, null, null, io);
      }, 30000); // Every 30 seconds
    }
  
    socket.on('disconnect', () => {
      this.activeStudents.delete(socket.id);
      this.cheatingWarnings.delete(userId);
      
      // Stop timer if no more students
      if (this.activeStudents.size === 0 && this.globalTimer) {
        clearInterval(this.globalTimer);
        this.globalTimer = null;
      }
    });
  }

  simulateCheatingDetection(socket, userId, examId, io) {
    // Get all active students
    const activeStudents = Array.from(this.activeStudents.values());
    
    if (activeStudents.length === 0) {
      return; // No students to check
    }
  
    // Pick a random student
    const randomIndex = Math.floor(Math.random() * activeStudents.length);
    const selectedStudent = activeStudents[randomIndex];
    
    // Find the socket for this student
    const selectedSocket = io.sockets.sockets.get(selectedStudent.socketId);
    if (!selectedSocket) {
      return;
    }
  
    // Increment warning and take action
    this.handleCheatingDetected(selectedSocket, selectedStudent.userId, selectedStudent.examId, io);
  }

  async handleCheatingDetected(socket, userId, examId, io) {
    const currentWarnings = this.cheatingWarnings.get(userId) || 0;
    
    if (currentWarnings === 0) {
      // First warning - marks halved
      this.cheatingWarnings.set(userId, 1);
      
      const student = this.activeStudents.get(socket.id);
      if (student) {
        student.warningCount = 1;
      }
  
      socket.emit('cheating-warning', {
        type: 'warning',
        message: 'Warning: Cheating detected. Your marks will be halved.',
        warningCount: 1
      });
  
      systemLogs.addLog({
        type: 'cheating_detection',
        message: `First cheating warning issued to student ${userId} - marks will be halved`,
        userId,
        examId,
        metadata: {
          warningCount: 1,
          action: 'marks_halved',
          socketId: socket.id
        },
        severity: 'warning'
      });
  
      // Notify teacher/admin
      io.to('teacher').emit('student-warning', {
        userId,
        rollNo: student?.rollNo,
        name: student?.name,
        examId,
        warningCount: 1,
        action: 'marks_halved',
        timestamp: new Date().toISOString()
      });
  
    } else if (currentWarnings === 1) {
      // Second warning - terminate exam
      this.cheatingWarnings.set(userId, 2);
      
      const student = this.activeStudents.get(socket.id);
      if (student) {
        student.status = 'terminated';
      }
  
      socket.emit('cheating-termination', {
        type: 'termination',
        message: 'Exam terminated due to repeated cheating. Your marks are set to 0.',
        warningCount: 2
      });
  
      systemLogs.addLog({
        type: 'cheating_detection',
        message: `Student ${userId} exam terminated due to repeated cheating - marks set to 0`,
        userId,
        examId,
        metadata: {
          warningCount: 2,
          action: 'exam_terminated',
          socketId: socket.id
        },
        severity: 'critical'
      });
  
      // Notify teacher/admin
      io.to('teacher').emit('student-terminated', {
        userId,
        rollNo: student?.rollNo,
        name: student?.name,
        examId,
        warningCount: 2,
        action: 'exam_terminated',
        timestamp: new Date().toISOString()
      });
  
      // Persist a terminated submission with marks set to 0 to prevent rejoining
      try {
        const Submission = require('../models/Submission');
        const existing = await Submission.findOne({ userId, examId });
        if (existing) {
          existing.status = 'terminated';
          existing.marks = 0;
          existing.submittedAt = new Date();
          existing.autoSubmitted = true;
          await existing.save();
        } else {
          await new Submission({
            submissionId: uuidv4(),
            userId,
            examId,
            answers: [],
            status: 'terminated',
            cheatingWarnings: 2,
            marks: 0,
            maxMarks: 0,
            submittedAt: new Date(),
            autoSubmitted: true
          }).save();
        }
      } catch (e) {
        // best-effort persistence; continue
      }
  
      // Disconnect student after delay
      setTimeout(() => {
        socket.disconnect();
      }, 3000);
    }
    // No action if warnings >= 2 (already terminated)
  }

  // Manual trigger for testing
  triggerCheatingDetection(userId, examId, io) {
    // Find socket for this user
    for (const [socketId, student] of this.activeStudents) {
      if (student.userId === userId) {
        const socket = io.sockets.sockets.get(socketId);
        if (socket) {
          this.handleCheatingDetected(socket, userId, examId, io);
        }
        break;
      }
    }
  }

  getStudentStatus(userId) {
    const warnings = this.cheatingWarnings.get(userId) || 0;
    
    // Find active student
    for (const student of this.activeStudents.values()) {
      if (student.userId === userId) {
        return {
          userId,
          examId: student.examId,
          warningCount: warnings,
          status: student.status
        };
      }
    }

    return null;
  }

  getAllActiveStudents() {
    const students = [];
    for (const [socketId, student] of this.activeStudents) {
      const warnings = this.cheatingWarnings.get(student.userId) || 0;
      students.push({
        socketId,
        userId: student.userId,
        examId: student.examId,
        warningCount: warnings,
        status: student.status
      });
    }
    return students;
  }

  // Get statistics for admin dashboard
  getCheatingStats() {
    const students = this.getAllActiveStudents();
    return {
      totalActiveStudents: students.length,
      studentsWithWarnings: students.filter(s => s.warningCount > 0).length,
      terminatedStudents: students.filter(s => s.status === 'terminated').length,
      warningDistribution: {
        noWarnings: students.filter(s => s.warningCount === 0).length,
        oneWarning: students.filter(s => s.warningCount === 1).length,
        twoOrMoreWarnings: students.filter(s => s.warningCount >= 2).length
      }
    };
  }

  // Simulate different types of cheating detection
  simulateSpecificCheating(type, userId, examId, io) {
    const cheatingTypes = {
      'tab_switching': 'Student switched browser tabs',
      'copy_paste': 'Copy-paste activity detected',
      'multiple_devices': 'Multiple device access detected',
      'suspicious_patterns': 'Suspicious answer patterns detected',
      'external_help': 'External assistance detected'
    };

    systemLogs.addLog({
      type: 'cheating_detection',
      message: `${cheatingTypes[type]} for student ${userId}`,
      userId,
      examId,
      metadata: {
        cheatingType: type,
        detectionMethod: 'simulated',
        confidence: Math.random() * 100
      },
      severity: 'warning'
    });

    // Trigger handling
    this.triggerCheatingDetection(userId, examId, io);
  }

  // Mark a user as submitted; future detections are ignored
  markSubmitted(userId) {
    this.submittedStudents.add(userId);
    // Also try to flip any active status entries
    for (const student of this.activeStudents.values()) {
      if (student.userId === userId) {
        student.status = 'submitted';
      }
    }
  }
}

module.exports = new CheatingDetection();
