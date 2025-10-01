import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navigation = ({ user, onLogout }) => {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const getNavItems = () => {
    switch (user.role) {
      case 'student':
        return [
          { path: '/student', label: 'Dashboard', icon: '🏠' },
          { path: '/student/exams', label: 'Available Exams', icon: '📚' },
          { path: '/student/marks', label: 'View Marks', icon: '📊' }
        ];
      case 'teacher':
        return [
          { path: '/teacher', label: 'Dashboard', icon: '🏠' },
          { path: '/teacher/create', label: 'Create Exam', icon: '📝' },
          { path: '/teacher/exams', label: 'Manage Exams', icon: '📚' },
          { path: '/teacher/manage-students', label: 'Manage Students', icon: '🧑‍🎓' },
          { path: '/teacher/results', label: 'Results', icon: '📈' }
        ];
      case 'admin':
        // Restrict admin to just Dashboard and System Logs
        return [
          { path: '/admin', label: 'Dashboard', icon: '🏠' },
          { path: '/admin/logs', label: 'System Logs', icon: '📋' }
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  const isActive = (path) => {
    if (path === `/${user.role}`) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className={`bg-slate-800/95 backdrop-blur-xl border-r border-slate-700/50 transition-all duration-300 relative ${
      isCollapsed ? 'w-16' : 'w-72'
    }`}>
      {/* Header */}
      <div className="p-6 border-b border-slate-700/50">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/25">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          {!isCollapsed && (
            <div>
              <h1 className="text-xl font-bold text-white">EduSecure Pro</h1>
              <p className="text-sm text-slate-400">Examination Platform</p>
            </div>
          )}
        </div>
      </div>

      {/* User Info */}
      <div className="p-6 border-b border-slate-700/50">
        <div className="flex items-center space-x-4">
          <div className="w-10 h-10 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
            <span className="text-white text-sm font-bold">
              {user.name?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white truncate">{user.name}</p>
              <p className="text-xs text-slate-400 capitalize">{user.role}</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="p-4 space-y-3">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center space-x-4 px-4 py-3 rounded-xl transition-all duration-300 group relative ${
              isActive(item.path)
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25'
                : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
            }`}
            title={isCollapsed ? item.label : ''}
          >
            <span className="text-xl flex-shrink-0">{item.icon}</span>
            {!isCollapsed && (
              <span className="text-sm font-medium truncate">{item.label}</span>
            )}
            {isActive(item.path) && (
              <div className="absolute right-2 w-2 h-2 bg-white rounded-full"></div>
            )}
          </Link>
        ))}
      </nav>

      {/* Collapse Toggle */}
      <div className="absolute bottom-6 left-6">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-10 h-10 bg-slate-700 hover:bg-slate-600 rounded-xl flex items-center justify-center transition-all duration-300 border border-slate-600"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg
            className={`w-5 h-5 text-slate-300 transition-transform duration-300 ${
              isCollapsed ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* Logout Button */}
      <div className="p-4 border-t border-slate-700/50 mt-auto">
        <button
          onClick={onLogout}
          className={`w-full flex items-center space-x-4 px-4 py-3 rounded-xl transition-all duration-300 text-red-400 hover:bg-red-500/20 hover:text-red-300 ${
            isCollapsed ? 'justify-center' : ''
          }`}
          title={isCollapsed ? 'Logout' : ''}
        >
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {!isCollapsed && <span className="text-sm font-medium">Logout</span>}
        </button>
      </div>
    </div>
  );
};

export default Navigation;
