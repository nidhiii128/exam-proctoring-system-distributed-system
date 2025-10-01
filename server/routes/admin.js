const express = require('express');
const systemLogs = require('../distributed/systemLogs');
const loadBalancing = require('../distributed/loadBalancing');
const replication = require('../distributed/replication');
const mutualExclusion = require('../distributed/mutualExclusion');
const readWriteLocks = require('../distributed/readWriteLocks');
const cheatingDetection = require('../distributed/cheatingDetection');
const Exam = require('../models/Exam');
const Submission = require('../models/Submission');

const router = express.Router();

// Get system status
router.get('/status', (req, res) => {
  try {
    const status = {
      serverStatus: loadBalancing.getServerStatus(),
      replicationMetrics: replication.getReplicationMetrics(),
      mutualExclusionQueue: mutualExclusion.getQueueStatus(),
      lockStatus: readWriteLocks.getAllLockStatuses ? readWriteLocks.getAllLockStatuses() : readWriteLocks.getSystemStatus(),
      cheatingStats: cheatingDetection.getCheatingStats(),
      logStats: systemLogs.getLogStats(),
      timestamp: new Date().toISOString()
    };

    res.json({ success: true, status });
  } catch (error) {
    console.error('Get admin status error:', error);
    res.status(500).json({ error: 'Failed to get system status' });
  }
});

// Get system logs with filters
router.get('/logs', (req, res) => {
  try {
    const sanitize = (v) => (v === undefined || v === null || v === 'undefined' || v === 'null' || v === '' ? undefined : v);
    const limitParsed = parseInt(req.query.limit);
    const filters = {
      type: sanitize(req.query.type),
      severity: sanitize(req.query.severity),
      limit: Number.isFinite(limitParsed) ? limitParsed : 100,
      since: sanitize(req.query.since)
    };

    const logs = systemLogs.getLogs(filters);
    res.json({ success: true, logs });
  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({ error: 'Failed to get logs' });
  }
});

// Clear all system logs
router.delete('/logs', (req, res) => {
  try {
    const clearedCount = systemLogs.clearAllLogs();
    res.json({ 
      success: true, 
      message: `Cleared ${clearedCount} logs`,
      clearedCount 
    });
  } catch (error) {
    console.error('Clear logs error:', error);
    res.status(500).json({ error: 'Failed to clear logs' });
  }
});

// Simulate system events for demo
router.post('/simulate/:type', (req, res) => {
  try {
    const { type } = req.params;
    const { userId = 'demo-user', examId = 'demo-exam' } = req.body || {};

    switch (type) {
      case 'cheating':
        cheatingDetection.simulateSpecificCheating('tab_switching', userId, examId);
        break;
      case 'load':
        for (let i = 0; i < 40; i++) {
          loadBalancing.addConnection(`sim-${Date.now()}-${i}`);
        }
      case 'replication':
        replication.createChunk({ demo: 'data' }, 'simulation');
        break;
      default:
        return res.status(400).json({ error: 'Unknown simulation type' });
    }

    res.json({ success: true, message: `Simulated ${type} event` });
  } catch (error) {
    console.error('Simulation error:', error);
    res.status(500).json({ error: 'Failed to simulate event' });
  }
});

// Danger: wipe database entries (exams and submissions)
// POST /api/admin/wipe
router.post('/wipe', async (req, res) => {
  try {
    // Optional filters: examId, teacherId
    const { examId } = req.body || {};
    if (examId) {
      await Exam.deleteOne({ examId });
      await Submission.deleteMany({ examId });
    } else {
      await Exam.deleteMany({});
      await Submission.deleteMany({});
    }
    systemLogs.addLog({ type: 'maintenance', message: 'Database wipe executed', severity: 'warning' });
    res.json({ success: true });
  } catch (error) {
    console.error('Admin wipe error:', error);
    res.status(500).json({ error: 'Failed to wipe data' });
  }
});

module.exports = router;