const { v4: uuidv4 } = require('uuid');

class RicartAgrawalaLock {
  constructor(nodeId = uuidv4()) {
    this.nodeId = nodeId;
    this.requestQueue = [];
    this.replyCount = 0;
    this.requesting = false;
    this.locked = false;
    this.timestamp = 0;
    this.pendingRequests = new Map(); // requestId -> {timestamp, callback}
  }

  // Generate unique timestamp for requests
  getTimestamp() {
    return Date.now() * 1000 + Math.floor(Math.random() * 1000);
  }

  // Request lock
  async requestLock(resourceId, callback) {
    const requestId = uuidv4();
    const timestamp = this.getTimestamp();
    
    this.pendingRequests.set(requestId, { timestamp, callback });
    
    if (this.locked || this.requesting) {
      // Add to queue
      this.requestQueue.push({ requestId, timestamp, resourceId });
      return;
    }

    this.requesting = true;
    this.timestamp = timestamp;
    this.replyCount = 0;

    // Send request to all other nodes (simplified for single-node demo)
    console.log(`[${this.nodeId}] Requesting lock for ${resourceId} with timestamp ${timestamp}`);
    
    // Simulate immediate grant for single-node system
    setTimeout(() => {
      this.grantLock(requestId, resourceId);
    }, Math.random() * 100 + 50); // Random delay 50-150ms
  }

  // Grant lock
  grantLock(requestId, resourceId) {
    const request = this.pendingRequests.get(requestId);
    if (!request) return;

    this.locked = true;
    this.requesting = false;
    this.pendingRequests.delete(requestId);

    console.log(`[${this.nodeId}] Lock granted for ${resourceId}`);
    
    // Execute callback
    if (request.callback) {
      request.callback();
    }
  }

  // Release lock
  releaseLock(resourceId) {
    if (!this.locked) return;

    this.locked = false;
    console.log(`[${this.nodeId}] Lock released for ${resourceId}`);

    // Process next request in queue
    if (this.requestQueue.length > 0) {
      const nextRequest = this.requestQueue.shift();
      this.grantLock(nextRequest.requestId, nextRequest.resourceId);
    }
  }

  // Check if locked
  isLocked() {
    return this.locked;
  }

  // Get lock status
  getStatus() {
    return {
      nodeId: this.nodeId,
      locked: this.locked,
      requesting: this.requesting,
      queueLength: this.requestQueue.length,
      timestamp: this.timestamp
    };
  }
}

// Global lock manager for different resources
class LockManager {
  constructor() {
    this.locks = new Map(); // resourceId -> RicartAgrawalaLock
    this.nodeId = uuidv4();
  }

  getLock(resourceId) {
    if (!this.locks.has(resourceId)) {
      this.locks.set(resourceId, new RicartAgrawalaLock(this.nodeId));
    }
    return this.locks.get(resourceId);
  }

  async acquireReadLock(resourceId) {
    return new Promise((resolve) => {
      const lock = this.getLock(`read-${resourceId}`);
      lock.requestLock(resourceId, resolve);
    });
  }

  async acquireWriteLock(resourceId) {
    return new Promise((resolve) => {
      const lock = this.getLock(`write-${resourceId}`);
      lock.requestLock(resourceId, resolve);
    });
  }

  releaseReadLock(resourceId) {
    const lock = this.getLock(`read-${resourceId}`);
    lock.releaseLock(resourceId);
  }

  releaseWriteLock(resourceId) {
    const lock = this.getLock(`write-${resourceId}`);
    lock.releaseLock(resourceId);
  }

  getSystemStatus() {
    const status = {};
    for (const [resourceId, lock] of this.locks) {
      status[resourceId] = lock.getStatus();
    }
    return status;
  }
}

module.exports = new LockManager();
