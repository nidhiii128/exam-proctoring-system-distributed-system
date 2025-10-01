const { v4: uuidv4 } = require('uuid');
const systemLogs = require('./systemLogs');

class LoadBalancing {
  constructor() {
    this.servers = {
      main: {
        id: 'main-server',
        load: 0,
        maxCapacity: 100,
        activeConnections: 0,
        status: 'active'
      },
      backup: {
        id: 'backup-server',
        load: 0,
        maxCapacity: 100,
        activeConnections: 0,
        status: 'standby'
      }
    };
    
    this.loadThreshold = 80; // 80% threshold for migration
    this.connectionMap = new Map(); // Track which server handles each connection
  }

  addConnection(connectionId) {
    const targetServer = this.selectServer();
    
    // Update server load
    this.servers[targetServer].activeConnections++;
    this.servers[targetServer].load = 
      (this.servers[targetServer].activeConnections / this.servers[targetServer].maxCapacity) * 100;
    
    // Track connection
    this.connectionMap.set(connectionId, targetServer);
    
    systemLogs.addLog({
      type: 'load_balancing',
      message: `Connection ${connectionId} assigned to ${targetServer} (Load: ${this.servers[targetServer].load.toFixed(1)}%)`,
      metadata: {
        connectionId,
        server: targetServer,
        load: parseFloat(this.servers[targetServer].load.toFixed(1)),
        activeConnections: this.servers[targetServer].activeConnections
      }
    });

    // Check if we need to activate backup server
    this.checkLoadBalancing();
    
    return targetServer;
  }

  removeConnection(connectionId) {
    const server = this.connectionMap.get(connectionId);
    if (server && this.servers[server]) {
      this.servers[server].activeConnections--;
      this.servers[server].load = 
        (this.servers[server].activeConnections / this.servers[server].maxCapacity) * 100;
      
      this.connectionMap.delete(connectionId);
      
      systemLogs.addLog({
        type: 'load_balancing',
        message: `Connection ${connectionId} removed from ${server} (Load: ${this.servers[server].load.toFixed(1)}%)`,
        metadata: {
          connectionId,
          server,
          load: parseFloat(this.servers[server].load.toFixed(1)),
          activeConnections: this.servers[server].activeConnections
        }
      });

      // Check if we can deactivate backup server
      this.checkLoadBalancing();
    }
  }

  selectServer() {
    // If main server is below threshold, use it
    if (this.servers.main.load < this.loadThreshold) {
      return 'main';
    }
    
    // If main server is overloaded, use backup
    if (this.servers.backup.status === 'standby') {
      this.activateBackupServer();
    }
    
    // Choose server with lower load
    return this.servers.main.load <= this.servers.backup.load ? 'main' : 'backup';
  }

  activateBackupServer() {
    if (this.servers.backup.status === 'standby') {
      this.servers.backup.status = 'active';
      
      systemLogs.addLog({
        type: 'load_balancing',
        message: 'Backup server activated due to high load on main server',
        metadata: {
          mainServerLoad: this.servers.main.load,
          threshold: this.loadThreshold,
          reason: 'load_threshold_exceeded'
        },
        severity: 'warning'
      });
    }
  }

  checkLoadBalancing() {
    const mainLoad = this.servers.main.load;
    const backupLoad = this.servers.backup.load;
    
    // Activate backup if main is overloaded
    if (mainLoad > this.loadThreshold && this.servers.backup.status === 'standby') {
      this.activateBackupServer();
    }
    
    // Deactivate backup if both servers are underloaded
    if (mainLoad < this.loadThreshold / 2 && backupLoad < this.loadThreshold / 2 && 
        this.servers.backup.status === 'active') {
      this.servers.backup.status = 'standby';
      
      systemLogs.addLog({
        type: 'load_balancing',
        message: 'Backup server deactivated - load normalized',
        metadata: {
          mainServerLoad: mainLoad,
          backupServerLoad: backupLoad,
          threshold: this.loadThreshold / 2
        }
      });
    }
  }

  getServerStatus() {
    return {
      servers: Object.keys(this.servers).map(key => ({
        id: key,
        ...this.servers[key],
        load: parseFloat(this.servers[key].load.toFixed(1))
      })),
      totalConnections: Array.from(this.connectionMap.values()).length,
      loadThreshold: this.loadThreshold
    };
  }

  // Simulate server migration for demonstration
  migrateConnection(connectionId, targetServer) {
    const currentServer = this.connectionMap.get(connectionId);
    if (currentServer && currentServer !== targetServer) {
      this.removeConnection(connectionId);
      this.connectionMap.set(connectionId, targetServer);
      this.servers[targetServer].activeConnections++;
      this.servers[targetServer].load = 
        (this.servers[targetServer].activeConnections / this.servers[targetServer].maxCapacity) * 100;
      
      systemLogs.addLog({
        type: 'load_balancing',
        message: `Connection ${connectionId} migrated from ${currentServer} to ${targetServer}`,
        metadata: {
          connectionId,
          fromServer: currentServer,
          toServer: targetServer,
          reason: 'load_balancing'
        }
      });
    }
  }
}

module.exports = new LoadBalancing();
