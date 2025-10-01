import React, { useState, useEffect } from 'react';
import { simulateEvent } from '../utils/api';

const AdminDashboard = ({ user, socket, onLogout }) => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('monitoring');

  useEffect(() => {
    setLoading(false);
  }, []);



  const handleSimulateEvent = async (eventType) => {
    try {
      await simulateEvent(eventType, { userId: 'demo-user' });
      // Refresh status after simulation
      setTimeout(loadSystemStatus, 1000);
    } catch (error) {
      console.error('Failed to simulate event:', error);
    }
  };



  const tabs = [
    { id: 'monitoring', name: 'Live Monitoring', icon: '📊' },
    { id: 'controls', name: 'System Controls', icon: '⚙️' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="glass-card text-center p-8 animate-scale-in">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Loading System Status...</h2>
          <p className="text-gray-300">Initializing distributed systems monitoring</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-10">
        <h2 className="text-4xl font-bold text-white mb-3">System Administration</h2>
        <p className="text-slate-400 text-lg">Monitor system health, view logs, and manage distributed systems infrastructure.</p>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700/50 rounded-t-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative py-4 px-6 font-medium text-sm transition-all duration-300 rounded-t-lg ${
                  activeTab === tab.id
                    ? 'text-white bg-gradient-to-r from-emerald-600 to-teal-600 shadow-lg shadow-emerald-500/25'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <span className="flex items-center space-x-2">
                  <span className="text-lg">{tab.icon}</span>
                  <span>{tab.name}</span>
                </span>
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/30 rounded-t-full"></div>
                )}
            </button>
            ))}
          </nav>
          </div>
        </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {activeTab === 'monitoring' && (
          <div className="space-y-8 animate-slide-up">
            <div className="glass-card p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">📊</span>
                </div>
                <h2 className="text-xl font-bold text-white">Real-time System Monitoring</h2>
                <div className="flex items-center space-x-2 ml-auto">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-300">Live</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Live Metrics */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Live Metrics</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">CPU Usage</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-700 rounded-full h-2">
                          <div className="bg-green-500 h-2 rounded-full" style={{ width: '45%' }}></div>
                        </div>
                        <span className="text-sm text-white">45%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Memory Usage</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-700 rounded-full h-2">
                          <div className="bg-blue-500 h-2 rounded-full" style={{ width: '67%' }}></div>
                        </div>
                        <span className="text-sm text-white">67%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Network I/O</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-700 rounded-full h-2">
                          <div className="bg-purple-500 h-2 rounded-full" style={{ width: '23%' }}></div>
                        </div>
                        <span className="text-sm text-white">23%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Active Processes */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Active Processes</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                      <span className="text-gray-300">Clock Sync Service</span>
                      <span className="text-green-400 text-sm">Running</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                      <span className="text-gray-300">Cheating Detection</span>
                      <span className="text-green-400 text-sm">Running</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                      <span className="text-gray-300">Load Balancer</span>
                      <span className="text-green-400 text-sm">Running</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded-lg">
                      <span className="text-gray-300">Replication Manager</span>
                      <span className="text-green-400 text-sm">Running</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'controls' && (
          <div className="space-y-8 animate-slide-up">
            <div className="glass-card p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">⚙️</span>
                </div>
                <h2 className="text-xl font-bold text-white">System Controls</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <button
                  onClick={() => handleSimulateEvent('cheating')}
                  className="p-4 bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-500/30 rounded-lg hover:from-red-500/30 hover:to-pink-500/30 transition-all duration-300 text-left"
                >
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-2xl">🛡️</span>
                    <span className="font-semibold text-white">Simulate Cheating</span>
                  </div>
                  <p className="text-sm text-gray-300">Trigger cheating detection system</p>
                </button>

                <button
                  onClick={() => handleSimulateEvent('load')}
                  className="p-4 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 rounded-lg hover:from-blue-500/30 hover:to-cyan-500/30 transition-all duration-300 text-left"
                >
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-2xl">⚖️</span>
                    <span className="font-semibold text-white">Add Load</span>
                  </div>
                  <p className="text-sm text-gray-300">Simulate high server load</p>
                </button>

                <button
                  onClick={() => handleSimulateEvent('replication')}
                  className="p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-lg hover:from-purple-500/30 hover:to-pink-500/30 transition-all duration-300 text-left"
                >
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-2xl">🔄</span>
                    <span className="font-semibold text-white">Create Chunk</span>
                  </div>
                  <p className="text-sm text-gray-300">Create new replication chunk</p>
                </button>
              </div>
            </div>

          </div>
        )}

      </main>
    </div>
  );
};

export default AdminDashboard;
