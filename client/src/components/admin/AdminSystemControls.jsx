import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSystemStatus, simulateEvent, restartService, updateSystemConfig, getSystemHealth } from '../../utils/api';

const AdminSystemControls = ({ user, socket, onLogout, addToast }) => {
  const navigate = useNavigate();
  const [systemStatus, setSystemStatus] = useState(null);
  const [systemHealth, setSystemHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [lockStatus, setLockStatus] = useState({});
  const [configModal, setConfigModal] = useState(false);
  const [systemConfig, setSystemConfig] = useState({
    cheatingDetection: { enabled: true, sensitivity: 'medium' },
    loadBalancing: { enabled: true, algorithm: 'round-robin' },
    replication: { enabled: true, replicationFactor: 2 },
    clockSync: { enabled: true, interval: 30 },
    mutex: { enabled: true, timeout: 5000 }
  });

  useEffect(() => {
    loadSystemStatus();
    
    // Refresh status every 10 seconds
    const interval = setInterval(loadSystemStatus, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const loadSystemStatus = async () => {
    try {
      const [statusResponse, healthResponse] = await Promise.all([
        getSystemStatus(),
        getSystemHealth()
      ]);
      
      if (statusResponse.data.success) {
        setSystemStatus(statusResponse.data.status);
        setLockStatus(statusResponse.data.status.lockStatus || {});
      }
      
      if (healthResponse.data.success) {
        setSystemHealth(healthResponse.data.health);
      }
    } catch (error) {
      console.error('Failed to load system status:', error);
      addToast('Failed to load system status', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSystemAction = async (actionType, data = {}) => {
    setActionLoading(prev => ({ ...prev, [actionType]: true }));
    
    try {
      await simulateEvent(actionType, data);
      addToast(`${actionType} action executed successfully`, 'success');
      
      // Refresh status after action
      setTimeout(loadSystemStatus, 1000);
    } catch (error) {
      console.error(`Failed to execute ${actionType}:`, error);
      addToast(`Failed to execute ${actionType}`, 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, [actionType]: false }));
    }
  };

  const handleRestartService = async (serviceName) => {
    setActionLoading(prev => ({ ...prev, [`restart-${serviceName}`]: true }));
    
    try {
      await restartService(serviceName);
      addToast(`${serviceName} service restarted successfully`, 'success');
      setTimeout(loadSystemStatus, 2000);
    } catch (error) {
      console.error(`Failed to restart ${serviceName}:`, error);
      addToast(`Failed to restart ${serviceName}`, 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, [`restart-${serviceName}`]: false }));
    }
  };

  const handleUpdateConfig = async () => {
    setActionLoading(prev => ({ ...prev, config: true }));
    
    try {
      await updateSystemConfig(systemConfig);
      addToast('System configuration updated successfully', 'success');
      setConfigModal(false);
      setTimeout(loadSystemStatus, 1000);
    } catch (error) {
      console.error('Failed to update config:', error);
      addToast('Failed to update system configuration', 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, config: false }));
    }
  };

  const handleConfigChange = (section, field, value) => {
    setSystemConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'text-red-400 bg-red-900/20 border-red-500/30';
      case 'error': return 'text-red-400 bg-red-900/20 border-red-500/30';
      case 'warning': return 'text-yellow-400 bg-yellow-900/20 border-yellow-500/30';
      case 'info': 
      default: return 'text-blue-400 bg-blue-900/20 border-blue-500/30';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="glass-card text-center p-8 animate-scale-in">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Loading System Controls...</h2>
          <p className="text-gray-300">Initializing system management interface</p>
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
                <h1 className="text-xl font-bold text-white">System Controls</h1>
                <p className="text-sm text-gray-300">Manage and Control System Components</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-300">System Online</span>
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
          <h2 className="text-3xl font-bold text-white mb-2">System Controls</h2>
          <p className="text-gray-300">Execute system actions and manage distributed components.</p>
        </div>

        {/* System Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <button
            onClick={() => handleSystemAction('cheating', { userId: 'demo-user' })}
            disabled={actionLoading.cheating}
            className="glass-card p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group disabled:opacity-50"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <span className="text-white text-2xl">🛡️</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Simulate Cheating</h3>
              <p className="text-gray-300 text-sm mb-4">Trigger cheating detection system</p>
              {actionLoading.cheating ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span className="text-sm text-gray-300">Executing...</span>
                </div>
              ) : (
                <div className="text-red-400 font-medium group-hover:text-red-300">Execute →</div>
              )}
            </div>
          </button>

          <button
            onClick={() => handleSystemAction('load', { serverId: 'server-1' })}
            disabled={actionLoading.load}
            className="glass-card p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group disabled:opacity-50"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <span className="text-white text-2xl">⚖️</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Add Load</h3>
              <p className="text-gray-300 text-sm mb-4">Simulate high server load</p>
              {actionLoading.load ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span className="text-sm text-gray-300">Executing...</span>
                </div>
              ) : (
                <div className="text-blue-400 font-medium group-hover:text-blue-300">Execute →</div>
              )}
            </div>
          </button>

          <button
            onClick={() => handleSystemAction('replication', { chunkId: 'chunk-001' })}
            disabled={actionLoading.replication}
            className="glass-card p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group disabled:opacity-50"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <span className="text-white text-2xl">🔄</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Create Chunk</h3>
              <p className="text-gray-300 text-sm mb-4">Create new replication chunk</p>
              {actionLoading.replication ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span className="text-sm text-gray-300">Executing...</span>
                </div>
              ) : (
                <div className="text-purple-400 font-medium group-hover:text-purple-300">Execute →</div>
              )}
            </div>
          </button>

          <button
            onClick={() => handleSystemAction('clock_sync', { serverId: 'server-1' })}
            disabled={actionLoading.clock_sync}
            className="glass-card p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group disabled:opacity-50"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <span className="text-white text-2xl">⏰</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Clock Sync</h3>
              <p className="text-gray-300 text-sm mb-4">Trigger clock synchronization</p>
              {actionLoading.clock_sync ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span className="text-sm text-gray-300">Executing...</span>
                </div>
              ) : (
                <div className="text-green-400 font-medium group-hover:text-green-300">Execute →</div>
              )}
            </div>
          </button>

          <button
            onClick={() => handleSystemAction('mutex', { resource: 'exam-editing' })}
            disabled={actionLoading.mutex}
            className="glass-card p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group disabled:opacity-50"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <span className="text-white text-2xl">🔒</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Mutex Test</h3>
              <p className="text-gray-300 text-sm mb-4">Test mutual exclusion</p>
              {actionLoading.mutex ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span className="text-sm text-gray-300">Executing...</span>
                </div>
              ) : (
                <div className="text-yellow-400 font-medium group-hover:text-yellow-300">Execute →</div>
              )}
            </div>
          </button>

          <button
            onClick={() => handleSystemAction('load_balancing', { action: 'redistribute' })}
            disabled={actionLoading.load_balancing}
            className="glass-card p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group disabled:opacity-50"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <span className="text-white text-2xl">⚡</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Load Balance</h3>
              <p className="text-gray-300 text-sm mb-4">Redistribute server load</p>
              {actionLoading.load_balancing ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span className="text-sm text-gray-300">Executing...</span>
                </div>
              ) : (
                <div className="text-indigo-400 font-medium group-hover:text-indigo-300">Execute →</div>
              )}
            </div>
          </button>
        </div>

        {/* Service Management */}
        <div className="glass-card p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">🔧</span>
              </div>
              <h3 className="text-xl font-bold text-white">Service Management</h3>
            </div>
            <button
              onClick={() => setConfigModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-all duration-300"
            >
              System Config
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {['cheating-detection', 'load-balancer', 'replication-service', 'clock-sync'].map(service => (
              <div key={service} className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium text-white capitalize">
                    {service.replace('-', ' ')}
                  </h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    systemHealth?.[service]?.status === 'healthy' 
                      ? 'bg-green-900/50 text-green-400' 
                      : 'bg-red-900/50 text-red-400'
                  }`}>
                    {systemHealth?.[service]?.status || 'unknown'}
                  </span>
                </div>
                <div className="text-sm text-gray-300 mb-3">
                  <div>Uptime: {systemHealth?.[service]?.uptime || 'N/A'}</div>
                  <div>CPU: {systemHealth?.[service]?.cpu || 'N/A'}%</div>
                  <div>Memory: {systemHealth?.[service]?.memory || 'N/A'}%</div>
                </div>
                <button
                  onClick={() => handleRestartService(service)}
                  disabled={actionLoading[`restart-${service}`]}
                  className="w-full px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-sm font-medium transition-all duration-300 disabled:opacity-50"
                >
                  {actionLoading[`restart-${service}`] ? 'Restarting...' : 'Restart'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* System Health Overview */}
        {systemHealth && (
          <div className="glass-card p-6 mb-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">💚</span>
              </div>
              <h3 className="text-xl font-bold text-white">System Health Overview</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-2">
                  {systemHealth.overall?.healthScore || 0}%
                </div>
                <div className="text-sm text-gray-300">Overall Health</div>
                <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      (systemHealth.overall?.healthScore || 0) >= 80 ? 'bg-green-500' :
                      (systemHealth.overall?.healthScore || 0) >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${systemHealth.overall?.healthScore || 0}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-2">
                  {systemHealth.overall?.activeConnections || 0}
                </div>
                <div className="text-sm text-gray-300">Active Connections</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-2">
                  {systemHealth.overall?.responseTime || 0}ms
                </div>
                <div className="text-sm text-gray-300">Avg Response Time</div>
              </div>
            </div>
          </div>
        )}

        {/* Lock Status */}
        {Object.keys(lockStatus).length > 0 && (
          <div className="glass-card p-6 mb-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">🔒</span>
              </div>
              <h3 className="text-xl font-bold text-white">Active Locks</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(lockStatus).map(([resource, lockInfo]) => (
                <div key={resource} className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-white">{resource}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      lockInfo.status === 'locked' ? 'bg-red-900/50 text-red-400' : 'bg-green-900/50 text-green-400'
                    }`}>
                      {lockInfo.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-300 space-y-1">
                    <div>Readers: <span className="text-blue-400">{lockInfo.readers}</span></div>
                    <div>Waiting: <span className="text-yellow-400">{lockInfo.waiting}</span></div>
                    {lockInfo.holder && (
                      <div>Holder: <span className="text-green-400">{lockInfo.holder}</span></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* System Status */}
        {systemStatus && (
          <div className="glass-card p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">📊</span>
              </div>
              <h3 className="text-xl font-bold text-white">System Status</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-white mb-1">
                  {systemStatus.serverStatus?.servers?.length || 0}
                </div>
                <div className="text-sm text-gray-300">Active Servers</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-white mb-1">
                  {systemStatus.replicationMetrics?.totalChunks || 0}
                </div>
                <div className="text-sm text-gray-300">Total Chunks</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-white mb-1">
                  {systemStatus.mutualExclusionQueue?.queueLength || 0}
                </div>
                <div className="text-sm text-gray-300">Mutex Queue</div>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-white mb-1">
                  {systemStatus.cheatingStats?.totalActiveStudents || 0}
                </div>
                <div className="text-sm text-gray-300">Active Students</div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Configuration Modal */}
      {configModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="glass-card max-w-2xl mx-4 animate-scale-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">System Configuration</h3>
              <button
                onClick={() => setConfigModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-6 max-h-96 overflow-y-auto">
              {/* Cheating Detection */}
              <div className="p-4 bg-gray-800/50 rounded-lg">
                <h4 className="font-semibold text-white mb-3">Cheating Detection</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Enabled</span>
                    <input
                      type="checkbox"
                      checked={systemConfig.cheatingDetection.enabled}
                      onChange={(e) => handleConfigChange('cheatingDetection', 'enabled', e.target.checked)}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Sensitivity</span>
                    <select
                      value={systemConfig.cheatingDetection.sensitivity}
                      onChange={(e) => handleConfigChange('cheatingDetection', 'sensitivity', e.target.value)}
                      className="bg-gray-700 text-white rounded px-3 py-1"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Load Balancing */}
              <div className="p-4 bg-gray-800/50 rounded-lg">
                <h4 className="font-semibold text-white mb-3">Load Balancing</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Enabled</span>
                    <input
                      type="checkbox"
                      checked={systemConfig.loadBalancing.enabled}
                      onChange={(e) => handleConfigChange('loadBalancing', 'enabled', e.target.checked)}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Algorithm</span>
                    <select
                      value={systemConfig.loadBalancing.algorithm}
                      onChange={(e) => handleConfigChange('loadBalancing', 'algorithm', e.target.value)}
                      className="bg-gray-700 text-white rounded px-3 py-1"
                    >
                      <option value="round-robin">Round Robin</option>
                      <option value="least-connections">Least Connections</option>
                      <option value="weighted">Weighted</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Replication */}
              <div className="p-4 bg-gray-800/50 rounded-lg">
                <h4 className="font-semibold text-white mb-3">Replication</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Enabled</span>
                    <input
                      type="checkbox"
                      checked={systemConfig.replication.enabled}
                      onChange={(e) => handleConfigChange('replication', 'enabled', e.target.checked)}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Replication Factor</span>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={systemConfig.replication.replicationFactor}
                      onChange={(e) => handleConfigChange('replication', 'replicationFactor', parseInt(e.target.value))}
                      className="bg-gray-700 text-white rounded px-3 py-1 w-20"
                    />
                  </div>
                </div>
              </div>

              {/* Clock Sync */}
              <div className="p-4 bg-gray-800/50 rounded-lg">
                <h4 className="font-semibold text-white mb-3">Clock Synchronization</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Enabled</span>
                    <input
                      type="checkbox"
                      checked={systemConfig.clockSync.enabled}
                      onChange={(e) => handleConfigChange('clockSync', 'enabled', e.target.checked)}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Interval (seconds)</span>
                    <input
                      type="number"
                      min="10"
                      max="300"
                      value={systemConfig.clockSync.interval}
                      onChange={(e) => handleConfigChange('clockSync', 'interval', parseInt(e.target.value))}
                      className="bg-gray-700 text-white rounded px-3 py-1 w-20"
                    />
                  </div>
                </div>
              </div>

              {/* Mutex */}
              <div className="p-4 bg-gray-800/50 rounded-lg">
                <h4 className="font-semibold text-white mb-3">Mutual Exclusion</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Enabled</span>
                    <input
                      type="checkbox"
                      checked={systemConfig.mutex.enabled}
                      onChange={(e) => handleConfigChange('mutex', 'enabled', e.target.checked)}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Timeout (ms)</span>
                    <input
                      type="number"
                      min="1000"
                      max="30000"
                      value={systemConfig.mutex.timeout}
                      onChange={(e) => handleConfigChange('mutex', 'timeout', parseInt(e.target.value))}
                      className="bg-gray-700 text-white rounded px-3 py-1 w-24"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-4 mt-6 pt-6 border-t border-gray-700">
              <button
                onClick={() => setConfigModal(false)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-all duration-300"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateConfig}
                disabled={actionLoading.config}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all duration-300 disabled:opacity-50"
              >
                {actionLoading.config ? 'Updating...' : 'Update Configuration'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSystemControls;
