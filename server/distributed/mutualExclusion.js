const { v4: uuidv4 } = require('uuid');
const systemLogs = require('./systemLogs');

class MutualExclusion {
  constructor() {
    this.requestQueue = [];
    this.currentHolder = null;
    this.logicalClock = 0;
    this.nodeId = 'server-node';
  }

  // Ricart-Agrawala Algorithm Implementation
  async requestCriticalSection(userId, resource, priority = 'normal') {
    this.logicalClock++;
    const requestId = uuidv4();
    const timestamp = this.logicalClock;
    
    const request = {
      requestId,
      userId,
      resource,
      timestamp,
      priority,
      status: 'waiting'
    };

    // Add to queue and sort by timestamp (priority)
    this.requestQueue.push(request);
    this.requestQueue.sort((a, b) => {
      if (a.timestamp !== b.timestamp) {
        return a.timestamp - b.timestamp;
      }
      return a.priority === 'high' ? -1 : 1;
    });

    systemLogs.addLog({
      type: 'mutual_exclusion',
      message: `User ${userId} requesting access to ${resource} (timestamp: ${timestamp}, priority: ${priority})`,
      userId,
      metadata: {
        requestId,
        resource,
        timestamp,
        priority,
        queueLength: this.requestQueue.length
      }
    });

    return new Promise((resolve) => {
      request.resolve = resolve;
      this.processQueue();
    });
  }

  processQueue() {
    if (this.currentHolder || this.requestQueue.length === 0) {
      return;
    }

    const nextRequest = this.requestQueue[0];
    
    // Grant access to the first request in queue
    this.currentHolder = nextRequest;
    nextRequest.status = 'granted';
    
    systemLogs.addLog({
      type: 'mutual_exclusion',
      message: `Access granted to user ${nextRequest.userId} for ${nextRequest.resource}`,
      userId: nextRequest.userId,
      metadata: {
        requestId: nextRequest.requestId,
        resource: nextRequest.resource,
        waitTime: Date.now() - nextRequest.createdAt
      }
    });

    // Resolve the promise
    if (nextRequest.resolve) {
      nextRequest.resolve({
        granted: true,
        requestId: nextRequest.requestId,
        release: () => this.releaseCriticalSection(nextRequest.requestId)
      });
    }
  }

  releaseCriticalSection(requestId) {
    if (this.currentHolder?.requestId === requestId) {
      const releasedRequest = this.currentHolder;
      
      // Remove from queue and reset holder
      this.requestQueue = this.requestQueue.filter(req => req.requestId !== requestId);
      this.currentHolder = null;
      
      systemLogs.addLog({
        type: 'mutual_exclusion',
        message: `User ${releasedRequest.userId} released access to ${releasedRequest.resource}`,
        userId: releasedRequest.userId,
        metadata: {
          requestId,
          resource: releasedRequest.resource,
          holdTime: Date.now() - releasedRequest.createdAt
        }
      });

      // Process next request in queue
      this.processQueue();
      
      return true;
    }
    
    return false;
  }

  getQueueStatus() {
    return {
      queueLength: this.requestQueue.length,
      currentHolder: this.currentHolder?.userId || null,
      waitingRequests: this.requestQueue.map(req => ({
        userId: req.userId,
        resource: req.resource,
        timestamp: req.timestamp,
        priority: req.priority
      }))
    };
  }
}

module.exports = new MutualExclusion();
