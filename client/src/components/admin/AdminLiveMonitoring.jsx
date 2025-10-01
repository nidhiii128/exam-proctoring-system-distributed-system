import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSystemStatus } from '../../utils/api';

const AdminLiveMonitoring = ({ user, socket, onLogout, addToast }) => {
  const navigate = useNavigate();
  const [systemMetrics, setSystemMetrics] = useState({
    cpu: 45,
    memory: 67,
    network: 23,
    disk: 34
  });
  const [activeProcesses, setActiveProcesses] = useState([
    { name: 'Clock Sync Service', status: 'Running', cpu: 2.3, memory: 45 },
    { name: 'Cheating Detection', status: 'Running', cpu: 5.7, memory: 78 },
    { name: 'Load Balancer', status: 'Running', cpu: 1.8, memory: 32 },
    { name: 'Replication Manager', status: 'Running', cpu: 3.2, memory: 56 },
    { name: 'Database Service', status: 'Running', cpu: 8.1, memory: 124 },
    { name: 'WebSocket Handler', status: 'Running', cpu: 4.5, memory: 67 }
  ]);
  const [realTimeEvents, setRealTimeEvents] = useState([
    { id: 1, type: 'info', message: 'Clock synchronization completed', timestamp: Date.now() - 5000 },
    { id: 2, type: 'warning', message: 'High CPU usage detected on Server-2', timestamp: Date.now() - 10000 },
    { id: 3, type: 'info', message: 'New student joined exam session', timestamp: Date.now() - 15000 },
    { id: 4, type: 'error', message: 'Failed to replicate chunk to Server-3', timestamp: Date.now() - 20000 },
    { id: 5, type: 'info', message: 'Mutex lock acquired for exam editing', timestamp: Date.now() - 25000 }
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSystemData();
    
    // Simulate real-time updates
    const interval = setInterval(() => {
      updateMetrics();
      addRandomEvent();
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const loadSystemData = async () => {
    try {
      const response = await getSystemStatus();
      if (response.data.success) {
        // Process system status data
      }
    } catch (error) {
      console.error('Failed to load system data:', error);
      addToast('Failed to load system data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const updateMetrics = () => {
    setSystemMetrics(prev => ({
      cpu: Math.max(10, Math.min(90, prev.cpu + (Math.random() - 0.5) * 10)),
      memory: Math.max(20, Math.min(85, prev.memory + (Math.random() - 0.5) * 8)),
      network: Math.max(5, Math.min(50, prev.network + (Math.random() - 0.5) * 6)),
      disk: Math.max(15, Math.min(70, prev.disk + (Math.random() - 0.5) * 5))
    }));
  };

  const addRandomEvent = () => {
    const eventTypes = ['info', 'warning', 'error'];
    const messages = [
      'Clock synchronization completed',
      'New student joined exam session',
      'Mutex lock acquired for exam editing',
      'High CPU usage detected',
      'Memory usage threshold exceeded',
      'Network latency spike detected',
      'Database connection pool exhausted',
      'Cheating detection algorithm triggered',
      'Load balancer redistributed traffic',
      'Replication chunk synchronized'
    ];
    
    const newEvent = {
      id: Date.now(),
      type: eventTypes[Math.floor(Math.random() * eventTypes.length)],
      message: messages[Math.floor(Math.random() * messages.length)],
      timestamp: Date.now()
    };
    
    setRealTimeEvents(prev => [newEvent, ...prev.slice(0, 19)]); // Keep last 20 events
  };

  const getEventIcon = (type) => {
    const icons = {
      info: 'ℹ️',
      warning: '⚠️',
      error: '❌'
    };
    return icons[type] || '📝';
  };

  const getEventColor = (type) => {
    const colors = {
      info: 'text-blue-400 bg-blue-900/20 border-blue-500/30',
      warning: 'text-yellow-400 bg-yellow-900/20 border-yellow-500/30',
      error: 'text-red-400 bg-red-900/20 border-red-500/30'
    };
    return colors[type] || 'text-gray-400 bg-gray-900/20 border-gray-500/30';
  };

  const getMetricColor = (value, type) => {
    if (type === 'cpu' || type === 'memory') {
      if (value > 80) return 'text-red-400';
      if (value > 60) return 'text-yellow-400';
      return 'text-green-400';
    }
    return 'text-blue-400';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="glass-card text-center p-8 animate-scale-in">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Loading Live Monitoring...</h2>
          <p className="text-gray-300">Initializing real-time system metrics</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-md border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">⚙️</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Live Monitoring</h1>
                <p className="text-sm text-gray-300">Real-time System Performance</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-300">Live</span>
              </div>
              <button onClick={() => navigate('/admin')} className="btn-secondary">
                Back to Dashboard
              </button>
              <button onClick={onLogout} className="btn-secondary">
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Real-time System Monitoring</h2>
          <p className="text-gray-300">Monitor live system performance and resource utilization.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Live Metrics */}
          <div className="glass-card p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">📊</span>
              </div>
              <h3 className="text-xl font-bold text-white">Live Metrics</h3>
              <div className="flex items-center space-x-2 ml-auto">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-300">Real-time</span>
              </div>
            </div>
            
            <div className="space-y-6">
              {/* CPU Usage */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-300">CPU Usage</span>
                  <span className={`text-sm font-medium ${getMetricColor(systemMetrics.cpu, 'cpu')}`}>
                    {systemMetrics.cpu.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full transition-all duration-500 ${
                      systemMetrics.cpu > 80 ? 'bg-red-500' : 
                      systemMetrics.cpu > 60 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${systemMetrics.cpu}%` }}
                  ></div>
                </div>
              </div>

              {/* Memory Usage */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-300">Memory Usage</span>
                  <span className={`text-sm font-medium ${getMetricColor(systemMetrics.memory, 'memory')}`}>
                    {systemMetrics.memory.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full transition-all duration-500 ${
                      systemMetrics.memory > 80 ? 'bg-red-500' : 
                      systemMetrics.memory > 60 ? 'bg-yellow-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${systemMetrics.memory}%` }}
                  ></div>
                </div>
              </div>

              {/* Network I/O */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-300">Network I/O</span>
                  <span className={`text-sm font-medium ${getMetricColor(systemMetrics.network, 'network')}`}>
                    {systemMetrics.network.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3">
                  <div 
                    className="bg-purple-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${systemMetrics.network}%` }}
                  ></div>
                </div>
              </div>

              {/* Disk Usage */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-300">Disk Usage</span>
                  <span className={`text-sm font-medium ${getMetricColor(systemMetrics.disk, 'disk')}`}>
                    {systemMetrics.disk.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full transition-all duration-500 ${
                      systemMetrics.disk > 80 ? 'bg-red-500' : 
                      systemMetrics.disk > 60 ? 'bg-yellow-500' : 'bg-cyan-500'
                    }`}
                    style={{ width: `${systemMetrics.disk}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Active Processes */}
          <div className="glass-card p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">⚙️</span>
              </div>
              <h3 className="text-xl font-bold text-white">Active Processes</h3>
            </div>
            
            <div className="space-y-3">
              {activeProcesses.map((process, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-white">{process.name}</div>
                    <div className="text-sm text-gray-400">
                      CPU: {process.cpu}% • Memory: {process.memory}MB
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                      process.status === 'Running' ? 'bg-green-400' : 'bg-red-400'
                    }`}></div>
                    <span className="text-sm text-gray-300">{process.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Real-time Events */}
        <div className="glass-card p-6 mt-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm">📋</span>
            </div>
            <h3 className="text-xl font-bold text-white">Real-time Events</h3>
            <div className="flex items-center space-x-2 ml-auto">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-300">Live Updates</span>
            </div>
          </div>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {realTimeEvents.map((event) => (
              <div
                key={event.id}
                className={`p-3 rounded-lg border text-sm ${getEventColor(event.type)}`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{getEventIcon(event.type)}</span>
                    <div>
                      <div className="font-medium">{event.message}</div>
                      <div className="text-xs opacity-75 mt-1">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* System Performance Chart Placeholder */}
        <div className="glass-card p-6 mt-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm">📈</span>
            </div>
            <h3 className="text-xl font-bold text-white">Performance Trends</h3>
          </div>
          
          <div className="h-64 bg-gray-800/50 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-gray-400 text-2xl">📊</span>
              </div>
              <p className="text-gray-400">Performance charts will be available soon</p>
              <p className="text-sm text-gray-500 mt-2">Real-time graphs and historical data visualization</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminLiveMonitoring;
