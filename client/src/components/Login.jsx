import React, { useState, useEffect } from 'react';
import { login } from '../utils/api';

const Login = ({ onLogin }) => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // Role selection removed – direct email/password login

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await login({ email: formData.email, password: formData.password });
      if (response.data.success) {
        onLogin(response.data.user);
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // Role cards removed

  const features = [
    { icon: '🕐', name: 'Clock Sync', desc: 'Berkeley Algorithm' },
    { icon: '🛡️', name: 'Cheating Detection', desc: 'Real-time monitoring' },
    { icon: '⚖️', name: 'Load Balancing', desc: 'Seamless failover' },
    { icon: '🔄', name: 'Replication', desc: 'Data consistency' },
    { icon: '📊', name: 'Live Monitoring', desc: 'System analytics' }
  ];

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900">
      {/* Geometric Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, #10b981 0%, transparent 50%),
                           radial-gradient(circle at 75% 75%, #14b8a6 0%, transparent 50%),
                           radial-gradient(circle at 50% 50%, #059669 0%, transparent 50%)`,
        }}></div>
      </div>

      {/* Animated Grid */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(16, 185, 129, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(16, 185, 129, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}></div>
      </div>

      {/* Floating Elements */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-emerald-400 rounded-full opacity-30 animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${4 + Math.random() * 6}s`
            }}
          ></div>
        ))}
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-7xl">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl mb-6 shadow-2xl shadow-emerald-500/25">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-6xl md:text-7xl font-bold text-white mb-6 bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              EduSecure Pro
            </h1>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
              Next-generation examination platform with AI-powered proctoring, real-time analytics, and advanced security protocols
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Login Form */}
            <div className="glass-card p-10">
              <div className="text-center mb-10">
                <h2 className="text-3xl font-bold text-white mb-3">Access Portal</h2>
                <p className="text-slate-400">Enter your credentials to continue</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-3">Email Address</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                        </svg>
                      </div>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full pl-12 pr-4 py-4 bg-slate-700/50 border border-slate-600 rounded-xl text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-300"
                        placeholder="your.email@edusecure.com"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-300 mb-3">Password</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full pl-12 pr-4 py-4 bg-slate-700/50 border border-slate-600 rounded-xl text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-300"
                        placeholder="••••••••••"
                      />
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-500/20 border border-red-500/50 text-red-300 p-4 rounded-xl text-sm backdrop-blur-sm flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-emerald-500/25"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                      Authenticating...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                      </svg>
                      Sign In
                    </div>
                  )}
                </button>
              </form>
            </div>

            {/* Features Showcase */}
            <div className="space-y-10">
              <div className="text-center">
                <h3 className="text-3xl font-bold text-white mb-4">Platform Capabilities</h3>
                <p className="text-slate-400">Enterprise-grade examination infrastructure</p>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {features.map((feature, index) => (
                  <div
                    key={index}
                    className="glass-card p-6 hover:scale-105 transition-all duration-300 group"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <span className="text-2xl">{feature.icon}</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-white mb-1">{feature.name}</h4>
                        <p className="text-sm text-slate-400">{feature.desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="glass-card p-8">
                <h4 className="font-semibold text-white mb-6 text-lg">System Health</h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">Server Status</span>
                    <span className="text-emerald-400 flex items-center">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full mr-2 animate-pulse"></div>
                      Operational
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">Active Sessions</span>
                    <span className="text-teal-400 font-semibold">2,847</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">System Load</span>
                    <span className="text-amber-400 font-semibold">34%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300">Uptime</span>
                    <span className="text-emerald-400 font-semibold">99.9%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
