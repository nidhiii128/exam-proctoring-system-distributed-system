import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getExamForStudent, submitExam, getStudentMarks } from '../utils/api';

const StudentDashboard = ({ user, socket, onLogout, addToast }) => {
  const [stats, setStats] = useState({
    totalExams: 0,
    completedExams: 0,
    averageScore: 0,
    activeExams: 0
  });

  useEffect(() => {
    // Load student stats
    loadStudentStats();
  }, []);

  const loadStudentStats = async () => {
    try {
      // This would typically come from an API
      // For now, we'll use mock data
      setStats({
        totalExams: 5,
        completedExams: 3,
        averageScore: 85.5,
        activeExams: 2
      });
    } catch (error) {
      console.error('Failed to load student stats:', error);
    }
  };

  return (
    <div>
        <div className="mb-10">
          <h2 className="text-4xl font-bold text-white mb-3">Student Portal</h2>
          <p className="text-slate-400 text-lg">Welcome back, {user.name}! Manage your examinations and track your academic journey.</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="modern-card">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium">Total Exams</p>
                  <p className="text-2xl font-bold text-white">{stats.totalExams}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="modern-card">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium">Completed</p>
                  <p className="text-2xl font-bold text-white">{stats.completedExams}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="modern-card">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium">Average Score</p>
                  <p className="text-2xl font-bold text-white">{stats.averageScore}%</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="modern-card">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium">Active Exams</p>
                  <p className="text-2xl font-bold text-white">{stats.activeExams}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-10">
          <Link to="/student/exams" className="modern-card hover:shadow-emerald-500/10 transition-all duration-300 transform hover:-translate-y-2 group">
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-emerald-500/25">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Available Exams</h3>
              <p className="text-slate-400 text-sm mb-6">Browse and join available examinations</p>
              <div className="text-emerald-400 font-medium group-hover:text-emerald-300 flex items-center justify-center">
                <span>View Exams</span>
                <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>

          <Link to="/student/marks" className="modern-card hover:shadow-emerald-500/10 transition-all duration-300 transform hover:-translate-y-2 group">
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-emerald-500/25">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">View Results</h3>
              <p className="text-slate-400 text-sm mb-6">Check your exam results and performance</p>
              <div className="text-emerald-400 font-medium group-hover:text-emerald-300 flex items-center justify-center">
                <span>View Results</span>
                <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>

          <div className="modern-card hover:shadow-emerald-500/10 transition-all duration-300 transform hover:-translate-y-2 group">
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-slate-600 to-slate-700 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Performance Analytics</h3>
              <p className="text-slate-400 text-sm mb-6">Track your academic progress over time</p>
              <div className="text-slate-500 font-medium flex items-center justify-center">
                <span>Coming Soon</span>
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="modern-card">
          <div className="p-8">
            <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
              <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center mr-4">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              Recent Activity
            </h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-4 p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-white">Completed: Data Structures Exam</div>
                  <div className="text-sm text-slate-400">Score: 85/100 • 2 hours ago</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
                <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-white">Started: Algorithms Exam</div>
                  <div className="text-sm text-slate-400">In progress • 1 day ago</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 p-4 bg-amber-500/10 rounded-xl border border-amber-500/20">
                <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-white">Warning: Tab switching detected</div>
                  <div className="text-sm text-slate-400">During Database Systems exam • 3 days ago</div>
                </div>
              </div>
            </div>
          </div>
        </div>
    </div>
  );
};

export default StudentDashboard;
