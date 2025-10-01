const { v4: uuidv4 } = require('uuid');

class SystemLogs {
  constructor() {
    this.logs = [];
    this.io = null;
    this.maxLogs = 1000; // Maximum number of logs to keep in memory
  }

  // Initialize with Socket.IO instance
  initialize(io) {
    this.io = io;
  }

  // Add a new log entry
  addLog(logData) {
    const log = {
      logId: uuidv4(),
      timestamp: new Date().toISOString(),
      createdAt: Date.now(),
      type: logData.type || 'info',
      message: logData.message || '',
      severity: logData.severity || 'info',
      userId: logData.userId,
      examId: logData.examId,
      metadata: logData.metadata || {},
      ...logData
    };

    this.logs.unshift(log); // Add to beginning of array

    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Emit to all connected clients
    if (this.io) {
      this.io.emit('system-log', log);
    }

    // Also log to console for debugging
    const severityEmoji = {
      'critical': '🚨',
      'error': '❌',
      'warning': '⚠️',
      'info': 'ℹ️'
    };

    console.log(`${severityEmoji[log.severity] || 'ℹ️'} [${log.type.toUpperCase()}] ${log.message}`);
    
    return log;
  }

  // Get logs with optional filtering
  getLogs(filters = {}) {
    let filteredLogs = [...this.logs];

    // Filter by type
    if (filters.type) {
      filteredLogs = filteredLogs.filter(log => log.type === filters.type);
    }

    // Filter by severity
    if (filters.severity) {
      filteredLogs = filteredLogs.filter(log => log.severity === filters.severity);
    }

    // Filter by time (since timestamp)
    if (filters.since) {
      const sinceTime = new Date(filters.since).getTime();
      filteredLogs = filteredLogs.filter(log => log.createdAt >= sinceTime);
    }

    // Apply limit
    if (filters.limit && filters.limit > 0) {
      filteredLogs = filteredLogs.slice(0, filters.limit);
    }

    return filteredLogs;
  }

  // Get log statistics
  getLogStats() {
    const stats = {
      total: this.logs.length,
      byType: {},
      bySeverity: {},
      recent: 0
    };

    const oneHourAgo = Date.now() - (60 * 60 * 1000);

    this.logs.forEach(log => {
      // Count by type
      stats.byType[log.type] = (stats.byType[log.type] || 0) + 1;
      
      // Count by severity
      stats.bySeverity[log.severity] = (stats.bySeverity[log.severity] || 0) + 1;
      
      // Count recent logs (last hour)
      if (log.createdAt > oneHourAgo) {
        stats.recent++;
      }
    });

    return stats;
  }

  // Get logs by type
  getLogsByType(type) {
    return this.logs.filter(log => log.type === type);
  }

  // Get logs by severity
  getLogsBySeverity(severity) {
    return this.logs.filter(log => log.severity === severity);
  }

  // Get recent logs (last N minutes)
  getRecentLogs(minutes = 60) {
    const cutoffTime = Date.now() - (minutes * 60 * 1000);
    return this.logs.filter(log => log.createdAt > cutoffTime);
  }

  // Search logs by message content
  searchLogs(query) {
    const lowercaseQuery = query.toLowerCase();
    return this.logs.filter(log => 
      log.message.toLowerCase().includes(lowercaseQuery) ||
      log.type.toLowerCase().includes(lowercaseQuery)
    );
  }

  // Log different types of events
  logInfo(message, metadata = {}) {
    return this.addLog({
      type: 'info',
      message,
      metadata,
      severity: 'info'
    });
  }

  logWarning(message, metadata = {}) {
    return this.addLog({
      type: 'warning',
      message,
      metadata,
      severity: 'warning'
    });
  }

  logError(message, metadata = {}) {
    return this.addLog({
      type: 'error',
      message,
      metadata,
      severity: 'error'
    });
  }

  logCritical(message, metadata = {}) {
    return this.addLog({
      type: 'critical',
      message,
      metadata,
      severity: 'critical'
    });
  }

  // Log system events
  logSystemEvent(eventType, message, metadata = {}) {
    return this.addLog({
      type: 'system',
      message: `System event: ${message}`,
      metadata: {
        eventType,
        ...metadata
      },
      severity: 'info'
    });
  }

  // Log user actions
  logUserAction(userId, action, metadata = {}) {
    return this.addLog({
      type: 'user_action',
      message: `User ${userId} performed action: ${action}`,
      userId,
      metadata,
      severity: 'info'
    });
  }

  // Log exam events
  logExamEvent(examId, eventType, message, metadata = {}) {
    return this.addLog({
      type: 'exam_event',
      message: `Exam ${examId}: ${message}`,
      examId,
      metadata: {
        eventType,
        ...metadata
      },
      severity: 'info'
    });
  }

  // Log cheating detection events
  logCheatingEvent(userId, examId, eventType, message, metadata = {}) {
    return this.addLog({
      type: 'cheating_detection',
      message: `Cheating detection: ${message}`,
      userId,
      examId,
      metadata: {
        eventType,
        ...metadata
      },
      severity: 'warning'
    });
  }

  // Log distributed system events
  logDistributedSystemEvent(systemType, eventType, message, metadata = {}) {
    return this.addLog({
      type: systemType,
      message: `Distributed system (${systemType}): ${message}`,
      metadata: {
        eventType,
        systemType,
        ...metadata
      },
      severity: 'info'
    });
  }

  // Log performance metrics
  logPerformance(operation, duration, metadata = {}) {
    return this.addLog({
      type: 'performance',
      message: `Performance: ${operation} took ${duration}ms`,
      metadata: {
        operation,
        duration,
        ...metadata
      },
      severity: 'info'
    });
  }

  // Log security events
  logSecurityEvent(eventType, message, metadata = {}) {
    return this.addLog({
      type: 'security',
      message: `Security event: ${message}`,
      metadata: {
        eventType,
        ...metadata
      },
      severity: 'warning'
    });
  }

  // Log database operations
  logDatabaseOperation(operation, collection, metadata = {}) {
    return this.addLog({
      type: 'database',
      message: `Database ${operation} on ${collection}`,
      metadata: {
        operation,
        collection,
        ...metadata
      },
      severity: 'info'
    });
  }

  // Log API requests
  logApiRequest(method, endpoint, statusCode, duration, metadata = {}) {
    return this.addLog({
      type: 'api_request',
      message: `API ${method} ${endpoint} - ${statusCode} (${duration}ms)`,
      metadata: {
        method,
        endpoint,
        statusCode,
        duration,
        ...metadata
      },
      severity: statusCode >= 400 ? 'warning' : 'info'
    });
  }

  // Log authentication events
  logAuthEvent(eventType, userId, metadata = {}) {
    return this.addLog({
      type: 'authentication',
      message: `Auth event: ${eventType} for user ${userId}`,
      userId,
      metadata: {
        eventType,
        ...metadata
      },
      severity: eventType === 'login_failed' ? 'warning' : 'info'
    });
  }

  // Log system errors
  logSystemError(message, error, metadata = {}) {
    return this.addLog({
      type: 'system_error',
      message: `System error: ${message}`,
      metadata,
      severity: 'error'
    });
  }

  // Clear old logs (for maintenance)
  clearOldLogs(olderThanHours = 24) {
    const cutoffTime = Date.now() - (olderThanHours * 60 * 60 * 1000);
    const originalLength = this.logs.length;
    this.logs = this.logs.filter(log => log.createdAt > cutoffTime);
    
    const removedCount = originalLength - this.logs.length;
    if (removedCount > 0) {
      console.log(`Cleared ${removedCount} old logs (older than ${olderThanHours} hours)`);
    }
    
    return removedCount;
  }

  // Clear all logs
  clearAllLogs() {
    const originalLength = this.logs.length;
    this.logs = [];
    
    console.log(`Cleared all ${originalLength} logs`);
    
    // Emit to all connected clients that logs were cleared
    if (this.io) {
      this.io.emit('logs-cleared', {
        timestamp: new Date().toISOString(),
        clearedCount: originalLength
      });
    }
    
    return originalLength;
  }
}

module.exports = new SystemLogs();