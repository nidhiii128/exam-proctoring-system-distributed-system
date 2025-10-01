import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSystemStatus } from '../../utils/api';

const AdminSystemOverview = ({ user, socket, onLogout, addToast }) => {
  const navigate = useNavigate();
  const [systemStatus, setSystemStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeExams: 0,
    totalSubmissions: 0,
    systemUptime: '99.9%'
  });

  useEffect(() => {
    loadSystemData();
    
    // Refresh data every 30 seconds
    const interval = setInterval(loadSystemData, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const loadSystemData = async () => {
    try {
      const response = await getSystemStatus();
      if (response.data.success) {
        setSystemStatus(response.data.status);
      }
      
      // Mock stats for now
      setStats({
        totalUsers: 156,
        activeExams: 3,
        totalSubmissions: 1247,
        systemUptime: '99.9%'
      });
    } catch (error) {
      console.error('Failed to load system data:', error);
      addToast('Failed to load system data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-400';
      case 'warning': return 'text-yellow-400';
      case 'error': return 'text-red-400';
      default: return 'text-gray-400';
    }
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
          <h2 className="text-xl font-semibold text-white mb-2">Loading System Overview...</h2>
          <p className="text-gray-300">Initializing distributed systems monitoring</p>
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
                <h1 className="text-xl font-bold text-white">System Overview</h1>
                <p className="text-sm text-gray-300">Distributed Systems Monitoring & Control</p>
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
          <h2 className="text-3xl font-bold text-white mb-2">System Overview</h2>
          <p className="text-gray-300">Monitor the health and performance of all distributed systems components.</p>
        </div>

        {/* System Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="glass-card text-center p-6">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-white text-xl">👥</span>
            </div>
            <div className="text-2xl font-bold text-white">{stats.totalUsers}</div>
            <div className="text-sm text-gray-300">Total Users</div>
          </div>
          
          <div className="glass-card text-center p-6">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-white text-xl">📝</span>
            </div>
            <div className="text-2xl font-bold text-white">{stats.activeExams}</div>
            <div className="text-sm text-gray-300">Active Exams</div>
          </div>
          
          <div className="glass-card text-center p-6">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-white text-xl">📊</span>
            </div>
            <div className="text-2xl font-bold text-white">{stats.totalSubmissions}</div>
            <div className="text-sm text-gray-300">Total Submissions</div>
          </div>
          
          <div className="glass-card text-center p-6">
            <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-white text-xl">⏱️</span>
            </div>
            <div className="text-2xl font-bold text-white">{stats.systemUptime}</div>
            <div className="text-sm text-gray-300">System Uptime</div>
          </div>
        </div>

        {/* System Status Cards */}
        {systemStatus && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Server Status */}
            <div className="glass-card p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">🖥️</span>
                </div>
                <h3 className="text-lg font-semibold text-white">Server Status</h3>
              </div>
              <div className="space-y-3">
                {systemStatus.serverStatus?.servers?.map((server, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className={`text-sm ${getStatusColor(server.status)}`}>
                      {server.id}
                    </span>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-700 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            server.load > 80 ? 'bg-red-500' : 
                            server.load > 60 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${server.load}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-300">{server.load}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Replication */}
            <div className="glass-card p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">🔄</span>
                </div>
                <h3 className="text-lg font-semibold text-white">Replication</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Total Chunks:</span>
                  <span className="text-white font-medium">{systemStatus.replicationMetrics?.totalChunks || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Replicated:</span>
                  <span className="text-green-400 font-medium">{systemStatus.replicationMetrics?.replicatedChunks || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Factor:</span>
                  <span className="text-blue-400 font-medium">{systemStatus.replicationMetrics?.replicationFactor || 0}</span>
                </div>
              </div>
            </div>

            {/* Mutual Exclusion */}
            <div className="glass-card p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">🔒</span>
                </div>
                <h3 className="text-lg font-semibold text-white">Mutex Queue</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Queue Length:</span>
                  <span className="text-white font-medium">{systemStatus.mutualExclusionQueue?.queueLength || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Current Holder:</span>
                  <span className="text-yellow-400 font-medium">{systemStatus.mutualExclusionQueue?.currentHolder || 'None'}</span>
                </div>
              </div>
            </div>

            {/* Cheating Stats */}
            <div className="glass-card p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">🛡️</span>
                </div>
                <h3 className="text-lg font-semibold text-white">Cheating Detection</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Active Students:</span>
                  <span className="text-white font-medium">{systemStatus.cheatingStats?.totalActiveStudents || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">With Warnings:</span>
                  <span className="text-yellow-400 font-medium">{systemStatus.cheatingStats?.studentsWithWarnings || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-300">Terminated:</span>
                  <span className="text-red-400 font-medium">{systemStatus.cheatingStats?.terminatedStudents || 0}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* System Health Overview */}
        <div className="glass-card p-6 mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm">📈</span>
            </div>
            <h2 className="text-xl font-bold text-white">System Health Overview</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-white text-2xl">✅</span>
              </div>
              <div className="text-2xl font-bold text-white mb-1">98.5%</div>
              <div className="text-sm text-gray-300">System Uptime</div>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-white text-2xl">⚡</span>
              </div>
              <div className="text-2xl font-bold text-white mb-1">23ms</div>
              <div className="text-sm text-gray-300">Avg Response Time</div>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-white text-2xl">🔗</span>
              </div>
              <div className="text-2xl font-bold text-white mb-1">1,247</div>
              <div className="text-sm text-gray-300">Active Connections</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <button
            onClick={() => navigate('/admin/monitoring')}
            className="glass-card p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <span className="text-white text-2xl">📊</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Live Monitoring</h3>
              <p className="text-gray-300 text-sm mb-4">Real-time system metrics and performance</p>
              <div className="text-green-400 font-medium group-hover:text-green-300">Monitor Now →</div>
            </div>
          </button>

          <button
            onClick={() => navigate('/admin/controls')}
            className="glass-card p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <span className="text-white text-2xl">⚙️</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">System Controls</h3>
              <p className="text-gray-300 text-sm mb-4">Manage and control system components</p>
              <div className="text-blue-400 font-medium group-hover:text-blue-300">Control Now →</div>
            </div>
          </button>

          <button
            onClick={() => navigate('/admin/logs')}
            className="glass-card p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <span className="text-white text-2xl">📋</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">System Logs</h3>
              <p className="text-gray-300 text-sm mb-4">View and analyze system logs</p>
              <div className="text-purple-400 font-medium group-hover:text-purple-300">View Logs →</div>
            </div>
          </button>

          <div className="glass-card p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <span className="text-white text-2xl">🔧</span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">System Maintenance</h3>
              <p className="text-gray-300 text-sm mb-4">Perform system maintenance tasks</p>
              <div className="text-yellow-400 font-medium group-hover:text-yellow-300">Coming Soon →</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminSystemOverview;
