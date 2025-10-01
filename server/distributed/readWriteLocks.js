const systemLogs = require('./systemLogs');

class ReadWriteLockManager {
  constructor() {
    this.locks = new Map(); // resourceId -> { type: 'read'|'write', holders: Set, queue: [], writerPending: boolean }
    this.requestId = 0;
  }

  // Generate unique request ID
  generateRequestId() {
    return ++this.requestId;
  }

  // Check if resource has any locks
  hasLock(resourceId) {
    return this.locks.has(resourceId) && this.locks.get(resourceId).holders.size > 0;
  }

  // Check if resource has write lock
  hasWriteLock(resourceId) {
    const lock = this.locks.get(resourceId);
    return lock && lock.type === 'write' && lock.holders.size > 0;
  }

  // Check if resource has read lock
  hasReadLock(resourceId) {
    const lock = this.locks.get(resourceId);
    return lock && lock.type === 'read' && lock.holders.size > 0;
  }

  // Request read lock
  async requestReadLock(userId, resourceId, timeout = 10000) {
    const requestId = this.generateRequestId();

    systemLogs.addLog({
      type: 'read_lock_request',
      message: `User requesting read lock on ${resourceId}`,
      userId,
      metadata: { resourceId, requestId, lockType: 'read' }
    });

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        systemLogs.addLog({
          type: 'read_lock_timeout',
          message: `Read lock request timeout on ${resourceId}`,
          userId,
          metadata: { resourceId, requestId }
        });
        reject(new Error('Read lock request timeout'));
      }, timeout);

      // Initialize lock if doesn't exist
      if (!this.locks.has(resourceId)) {
        this.locks.set(resourceId, { type: 'read', holders: new Set(), queue: [], writerPending: false });
      }

      const lock = this.locks.get(resourceId);

      const hasQueuedWriter = Array.isArray(lock.queue) && lock.queue.some(q => q.lockType === 'write');

      // If no write lock, no queue, and no queued writers, grant immediately
      if (!this.hasWriteLock(resourceId) && lock.queue.length === 0 && !hasQueuedWriter && !lock.writerPending) {
        lock.holders.add(userId);
        lock.type = 'read';
        clearTimeout(timeoutId);

    systemLogs.addLog({
          type: 'read_lock_granted',
          message: `Read lock granted on ${resourceId}`,
      userId,
          metadata: { resourceId, requestId, holders: Array.from(lock.holders) }
        });
        
        resolve({ requestId, resourceId, lockType: 'read' });
        return;
      }

      // Add to queue
      lock.queue.push({ userId, requestId, resolve, reject, timeoutId, lockType: 'read' });
      
      // Process queue
      this.processQueue(resourceId);
    });
  }

  // Request write lock
  async requestWriteLock(userId, resourceId, timeout = 10000) {
    const requestId = this.generateRequestId();
    
    systemLogs.addLog({
      type: 'write_lock_request',
      message: `User requesting write lock on ${resourceId}`,
      userId,
      metadata: { resourceId, requestId, lockType: 'write' }
    });

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        systemLogs.addLog({
          type: 'write_lock_timeout',
          message: `Write lock request timeout on ${resourceId}`,
          userId,
          metadata: { resourceId, requestId }
        });
        reject(new Error('Write lock request timeout'));
      }, timeout);

      // Initialize lock if doesn't exist
      if (!this.locks.has(resourceId)) {
        this.locks.set(resourceId, { type: 'read', holders: new Set(), queue: [], writerPending: false });
      }

      const lock = this.locks.get(resourceId);

      // Mark that a writer is pending to prevent new readers from bypassing the queue
      lock.writerPending = true;

      // If no locks and no queue, grant immediately
      if (!this.hasLock(resourceId) && lock.queue.length === 0) {
        lock.holders.add(userId);
        lock.type = 'write';
        clearTimeout(timeoutId);

    systemLogs.addLog({
          type: 'write_lock_granted',
          message: `Write lock granted on ${resourceId}`,
      userId,
          metadata: { resourceId, requestId, holders: Array.from(lock.holders) }
        });
        
        resolve({ requestId, resourceId, lockType: 'write' });
        return;
      }

      // Add to queue
      lock.queue.push({ userId, requestId, resolve, reject, timeoutId, lockType: 'write' });
      
      // Process queue
      this.processQueue(resourceId);
    });
  }

  // Process lock queue
  processQueue(resourceId) {
    const lock = this.locks.get(resourceId);
    if (!lock || lock.queue.length === 0) return;

    const hasQueuedWriter = lock.queue.some(r => r.lockType === 'write');
    let next = lock.queue[0];
    
    // If no current locks, grant the request
    if (!this.hasLock(resourceId)) {
      // Writer priority: if a writer is queued, grant the first writer regardless of its position
      if (hasQueuedWriter) {
        const idx = lock.queue.findIndex(r => r.lockType === 'write');
        next = lock.queue[idx];
        // Move the chosen writer to the front for clarity
        lock.queue.splice(idx, 1);
        lock.queue.unshift(next);
      }
      this.grantLock(resourceId, next);
      return;
    }

    // If current lock is read and requesting read, grant it
    // But only if there is no writer waiting (writer priority)
    if (lock.type === 'read' && next.lockType === 'read' && !hasQueuedWriter && !lock.writerPending) {
      this.grantLock(resourceId, next);
      return;
    }

    // Otherwise, wait for current locks to be released
  }

  // Grant lock to requester
  grantLock(resourceId, request) {
    const lock = this.locks.get(resourceId);
    lock.holders.add(request.userId);
    lock.type = request.lockType;
    lock.queue.shift();
    if (request.lockType === 'write') {
      // A writer has been granted; clear the pending flag if no more writers queued
      lock.writerPending = lock.queue.some(r => r.lockType === 'write');
    }
    
    clearTimeout(request.timeoutId);
    request.resolve({ 
      requestId: request.requestId, 
      resourceId, 
      lockType: request.lockType 
    });

    systemLogs.addLog({
      type: `${request.lockType}_lock_granted`,
      message: `${request.lockType} lock granted on ${resourceId}`,
      userId: request.userId,
      metadata: { resourceId, requestId: request.requestId, holders: Array.from(lock.holders) }
    });

    // Continue processing queue for read locks
    if (request.lockType === 'read') {
      this.processQueue(resourceId);
    }
  }

  // Release lock
  releaseLock(userId, resourceId) {
    const lock = this.locks.get(resourceId);
    if (!lock) return;

    lock.holders.delete(userId);
    
    systemLogs.addLog({
      type: 'lock_released',
      message: `Lock released on ${resourceId}`,
      userId,
      metadata: { resourceId, remainingHolders: Array.from(lock.holders) }
    });

    // If no more holders, process queue
    if (lock.holders.size === 0) {
      this.processQueue(resourceId);
    }
  }

  // Get lock status
  getLockStatus(resourceId) {
    const lock = this.locks.get(resourceId);
    if (!lock) return { hasLock: false, type: null, holders: [], queueLength: 0 };

    return {
      hasLock: lock.holders.size > 0,
      type: lock.type,
      holders: Array.from(lock.holders),
      queueLength: lock.queue.length
    };
  }

  // Get all lock statuses
  getAllLockStatuses() {
    const statuses = {};
    for (const [resourceId, lock] of this.locks.entries()) {
      statuses[resourceId] = this.getLockStatus(resourceId);
    }
    return statuses;
  }

  // Clean up expired locks (called periodically)
  cleanupExpiredLocks() {
    // This would be called by a cleanup service
    // For now, we rely on timeouts to handle cleanup
  }
}

// Singleton instance
const lockManager = new ReadWriteLockManager();

module.exports = {
  // Main lock functions
  requestReadLock: (userId, resourceId, timeout) => 
    lockManager.requestReadLock(userId, resourceId, timeout),
  requestWriteLock: (userId, resourceId, timeout) => 
    lockManager.requestWriteLock(userId, resourceId, timeout),
  releaseLock: (userId, resourceId) => 
    lockManager.releaseLock(userId, resourceId),
  
  // Status functions
  getLockStatus: (resourceId) => 
    lockManager.getLockStatus(resourceId),
  getAllLockStatuses: () => 
    lockManager.getAllLockStatuses(),
  hasLock: (resourceId) => 
    lockManager.hasLock(resourceId),
  hasWriteLock: (resourceId) => 
    lockManager.hasWriteLock(resourceId),
  hasReadLock: (resourceId) => 
    lockManager.hasReadLock(resourceId),
  
  // Utility functions
  getSystemStatus: () => lockManager.getAllLockStatuses()
};