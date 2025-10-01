import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSystemLogs, clearSystemLogs } from '../../utils/api';

const AdminSystemLogs = ({ user, socket, onLogout, addToast }) => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [logFilter, setLogFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadLogs();
    
    // Auto-refresh every 10 seconds if enabled
    let interval;
    if (autoRefresh) {
      interval = setInterval(loadLogs, 10000);
    }
    
    return () => clearInterval(interval);
  }, [logFilter, severityFilter, autoRefresh]);

  const loadLogs = async () => {
    try {
      const response = await getSystemLogs({ 
        limit: 100,
        type: logFilter === 'all' ? undefined : logFilter,
        severity: severityFilter === 'all' ? undefined : severityFilter
      });
      if (response.data.success) {
        setLogs(response.data.logs || []);
      }
    } catch (error) {
      console.error('Failed to load logs:', error);
      addToast('Failed to load system logs', 'error');
    } finally {
      setLoading(false);
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

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical': return '🚨';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': 
      default: return 'ℹ️';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'cheating_detection': return '🛡️';
      case 'clock_sync': return '🕐';
      case 'load_balancing': return '⚖️';
      case 'replication': return '🔄';
      case 'read_write_lock': return '🔒';
      case 'mutual_exclusion': return '🔐';
      case 'system': return '🖥️';
      case 'user_action': return '👤';
      case 'exam_event': return '📝';
      case 'authentication': return '🔑';
      case 'api_request': return '🌐';
      case 'database': return '🗄️';
      case 'performance': return '⚡';
      case 'security': return '🔐';
      case 'system_error': return '💥';
      default: return '📋';
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const exportLogs = () => {
    const csvContent = [
      ['Timestamp', 'Type', 'Severity', 'Message', 'User ID', 'Exam ID'],
      ...logs.map(log => [
        formatTimestamp(log.timestamp),
        log.type,
        log.severity,
        log.message.replace(/,/g, ';'), // Replace commas to avoid CSV issues
        log.userId || '',
        log.examId || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system-logs-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    addToast('Logs exported successfully!', 'success');
  };

  const clearLogs = async () => {
    if (window.confirm('Are you sure you want to clear all logs? This action cannot be undone.')) {
      try {
        const response = await clearSystemLogs();
        if (response.data.success) {
          setLogs([]);
          addToast(`Successfully cleared ${response.data.clearedCount} logs`, 'success');
        }
      } catch (error) {
        console.error('Failed to clear logs:', error);
        addToast('Failed to clear logs', 'error');
      }
    }
  };

  if (loading && logs.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="glass-card text-center p-8 animate-scale-in">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Loading System Logs...</h2>
          <p className="text-gray-300">Fetching system logs and events</p>
        </div>
      </div>
    );
  }

  const filteredLogs = logs.filter(log => {
    const matchesSearch = !searchTerm || 
      log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.userId && log.userId.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesSearch;
  });

  return (
    <div>
      {/* Header */}
      <header className="bg-slate-800/80 backdrop-blur-md shadow-lg border-b border-slate-700/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                <span className="text-white text-lg">📋</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">System Logs</h1>
                <p className="text-slate-400">Monitor system events and activities</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/admin')}
                className="bg-slate-700 text-slate-200 px-4 py-2 rounded-xl hover:bg-slate-600 transition-all duration-300 border border-slate-600"
              >
                Back to Dashboard
              </button>
              <button
                onClick={onLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-700 transition-all duration-300"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Controls */}
          <div className="glass-card p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                <select
                  value={logFilter}
                  onChange={(e) => setLogFilter(e.target.value)}
                  className="bg-gray-800/50 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="cheating_detection">Cheating Detection</option>
                  <option value="clock_sync">Clock Sync</option>
                  <option value="load_balancing">Load Balancing</option>
                  <option value="replication">Replication</option>
                  <option value="read_write_lock">Read/Write Locks</option>
                  <option value="mutual_exclusion">Mutual Exclusion</option>
                  <option value="system">System</option>
                  <option value="user_action">User Actions</option>
                  <option value="exam_event">Exam Events</option>
                  <option value="authentication">Authentication</option>
                  <option value="api_request">API Requests</option>
                  <option value="database">Database</option>
                  <option value="performance">Performance</option>
                  <option value="security">Security</option>
                  <option value="system_error">System Errors</option>
                </select>

                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  className="bg-gray-800/50 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Severities</option>
                  <option value="critical">Critical</option>
                  <option value="error">Error</option>
                  <option value="warning">Warning</option>
                  <option value="info">Info</option>
                </select>

                <input
                  type="text"
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-gray-800/50 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
                />
              </div>

              <div className="flex items-center space-x-3">
                <label className="flex items-center space-x-2 text-sm text-gray-300">
                  <input
                    type="checkbox"
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500"
                  />
                  <span>Auto-refresh</span>
                </label>

                <button
                  onClick={exportLogs}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all duration-300 text-sm"
                >
                  Export CSV
                </button>

                <button
                  onClick={clearLogs}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-all duration-300 text-sm"
                >
                  Clear Logs
                </button>
              </div>
            </div>
          </div>

          {/* Logs Display */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">System Events</h2>
              <div className="text-sm text-gray-400">
                Showing {filteredLogs.length} of {logs.length} logs
              </div>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredLogs.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-gray-400 text-2xl">📋</span>
                  </div>
                  <p className="text-gray-400">No logs found matching your criteria</p>
                </div>
              ) : (
                filteredLogs.map((log, index) => (
                  <div
                    key={log.logId || index}
                    className={`p-4 rounded-lg border ${getSeverityColor(log.severity)}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">{getTypeIcon(log.type)}</span>
                        <span className="text-lg">{getSeverityIcon(log.severity)}</span>
                        <div>
                          <span className="font-medium text-sm">
                            {log.type.replace('_', ' ').toUpperCase()}
                          </span>
                          <span className="text-xs opacity-75 ml-2">
                            {formatTimestamp(log.timestamp)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-sm mb-2">{log.message}</p>
                    
                    {(log.userId || log.examId) && (
                      <div className="flex items-center space-x-4 text-xs opacity-75">
                        {log.userId && (
                          <span>User: {log.userId}</span>
                        )}
                        {log.examId && (
                          <span>Exam: {log.examId}</span>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminSystemLogs;