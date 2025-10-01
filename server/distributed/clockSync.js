const { v4: uuidv4 } = require('uuid');
const systemLogs = require('./systemLogs');

class ClockSync {
  constructor() {
    this.serverTime = Date.now();
    this.clientOffsets = new Map();
  }

  // Berkeley Algorithm Implementation
  startClockSync(socket) {
    const syncInterval = setInterval(() => {
      this.performClockSync(socket);
    }, 5000); // Sync every 5 seconds

    socket.on('disconnect', () => {
      clearInterval(syncInterval);
      this.clientOffsets.delete(socket.id);
    });

    // Initial sync
    this.performClockSync(socket);
  }

  performClockSync(socket) {
    const serverTime = Date.now();
    
    // Request client time
    socket.emit('clock-sync-request', { serverTime });
    
    socket.once('clock-sync-response', (data) => {
      const { clientTime, serverTimeReceived } = data;
      const networkDelay = (Date.now() - serverTimeReceived) / 2;
      const adjustedClientTime = clientTime + networkDelay;
      const offset = serverTime - adjustedClientTime;
      
      this.clientOffsets.set(socket.id, offset);
      
      // Calculate average offset (simplified Berkeley algorithm)
      const offsets = Array.from(this.clientOffsets.values());
      const averageOffset = offsets.reduce((sum, off) => sum + off, 0) / offsets.length;
      
      // Send adjustment to client
      socket.emit('clock-sync-adjustment', { 
        adjustment: averageOffset,
        serverTime: Date.now()
      });
      
      // Log the synchronization
      systemLogs.addLog({
        type: 'clock_sync',
        message: `Clock synchronized for client ${socket.id}. Offset: ${offset}ms, Average: ${averageOffset.toFixed(2)}ms`,
        metadata: {
          clientId: socket.id,
          offset,
          averageOffset: parseFloat(averageOffset.toFixed(2)),
          networkDelay
        }
      });
    });
  }

  getAdjustedTime() {
    return Date.now();
  }
}

module.exports = new ClockSync();
