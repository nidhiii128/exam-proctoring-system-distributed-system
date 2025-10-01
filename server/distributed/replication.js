const { v4: uuidv4 } = require('uuid');
const systemLogs = require('./systemLogs');

class Replication {
  constructor() {
    this.chunks = new Map();
    this.replicationFactor = 3;
    this.nodes = ['node-1', 'node-2', 'node-3', 'node-4', 'node-5'];
  }

  // Create replicated chunk for data
  createChunk(data, chunkType = 'exam_data') {
    const chunkId = uuidv4();
    const replicas = this.selectReplicaNodes();
    
    const chunk = {
      chunkId,
      data,
      type: chunkType,
      replicas,
      status: 'replicating',
      createdAt: Date.now(),
      lastUpdated: Date.now()
    };

    this.chunks.set(chunkId, chunk);

    // Simulate replication process
    this.replicateChunk(chunkId);

    systemLogs.addLog({
      type: 'replication',
      message: `Created chunk ${chunkId} with ${this.replicationFactor} replicas`,
      metadata: {
        chunkId,
        type: chunkType,
        replicas,
        replicationFactor: this.replicationFactor
      }
    });

    return chunkId;
  }

  selectReplicaNodes() {
    // Randomly select nodes for replication
    const shuffled = [...this.nodes].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, this.replicationFactor);
  }

  async replicateChunk(chunkId) {
    const chunk = this.chunks.get(chunkId);
    if (!chunk) return;

    // Simulate replication delay
    setTimeout(() => {
      chunk.status = 'replicated';
      chunk.lastUpdated = Date.now();

      systemLogs.addLog({
        type: 'replication',
        message: `Chunk ${chunkId} successfully replicated to ${chunk.replicas.length} nodes`,
        metadata: {
          chunkId,
          replicas: chunk.replicas,
          replicationTime: chunk.lastUpdated - chunk.createdAt
        }
      });
    }, Math.random() * 1000 + 500); // 500-1500ms delay
  }

  // Update chunk data with consistency check
  async updateChunk(chunkId, newData) {
    const chunk = this.chunks.get(chunkId);
    if (!chunk) {
      throw new Error(`Chunk ${chunkId} not found`);
    }

    // Check if all replicas are available
    const availableReplicas = await this.checkReplicaAvailability(chunkId);
    const minReplicas = Math.ceil(this.replicationFactor / 2) + 1; // Majority

    if (availableReplicas < minReplicas) {
      systemLogs.addLog({
        type: 'replication',
        message: `Update failed for chunk ${chunkId} - insufficient replicas (${availableReplicas}/${minReplicas} required)`,
        metadata: {
          chunkId,
          availableReplicas,
          minReplicas,
          totalReplicas: this.replicationFactor
        },
        severity: 'error'
      });
      throw new Error('Insufficient replicas for consistent update');
    }

    // Update chunk
    chunk.data = newData;
    chunk.lastUpdated = Date.now();
    chunk.status = 'updating';

    // Simulate propagation to replicas
    setTimeout(() => {
      chunk.status = 'replicated';
      
      systemLogs.addLog({
        type: 'replication',
        message: `Chunk ${chunkId} updated and propagated to replicas`,
        metadata: {
          chunkId,
          availableReplicas,
          propagationTime: Date.now() - chunk.lastUpdated
        }
      });
    }, Math.random() * 800 + 200);

    return true;
  }

  async checkReplicaAvailability(chunkId) {
    const chunk = this.chunks.get(chunkId);
    if (!chunk) return 0;

    // Simulate replica health check (some might be down)
    let available = 0;
    for (const replica of chunk.replicas) {
      // 90% availability simulation
      if (Math.random() > 0.1) {
        available++;
      }
    }

    return available;
  }

  getChunkStatus(chunkId) {
    return this.chunks.get(chunkId) || null;
  }

  getAllChunks() {
    return Array.from(this.chunks.values()).map(chunk => ({
      chunkId: chunk.chunkId,
      type: chunk.type,
      status: chunk.status,
      replicas: chunk.replicas.length,
      lastUpdated: chunk.lastUpdated
    }));
  }

  // Simulate node failure and recovery
  simulateNodeFailure(nodeId) {
    systemLogs.addLog({
      type: 'replication',
      message: `Node ${nodeId} failed - checking affected chunks`,
      metadata: { nodeId, failureTime: Date.now() },
      severity: 'error'
    });

    // Find chunks affected by this node failure
    let affectedChunks = 0;
    for (const [chunkId, chunk] of this.chunks) {
      if (chunk.replicas.includes(nodeId)) {
        affectedChunks++;
        // In a real system, you'd initiate re-replication here
      }
    }

    systemLogs.addLog({
      type: 'replication',
      message: `Node failure affected ${affectedChunks} chunks - initiating recovery`,
      metadata: { nodeId, affectedChunks },
      severity: 'warning'
    });
  }

  getReplicationMetrics() {
    const chunks = Array.from(this.chunks.values());
    return {
      totalChunks: chunks.length,
      replicatedChunks: chunks.filter(c => c.status === 'replicated').length,
      replicatingChunks: chunks.filter(c => c.status === 'replicating').length,
      updatingChunks: chunks.filter(c => c.status === 'updating').length,
      replicationFactor: this.replicationFactor,
      availableNodes: this.nodes.length
    };
  }
}

module.exports = new Replication();
