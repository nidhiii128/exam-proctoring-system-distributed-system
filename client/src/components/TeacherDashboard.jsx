import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createExam, startExam, getExamResults, releaseMarks } from '../utils/api';

const TeacherDashboard = ({ user, socket, onLogout, addToast }) => {
  const [stats, setStats] = useState({
    totalExams: 0,
    activeExams: 0,
    totalStudents: 0,
    averageScore: 0
  });

  useEffect(() => {
    // Load teacher stats
    loadTeacherStats();
  }, []);

  const loadTeacherStats = async () => {
    try {
      // This would typically come from an API
      // For now, we'll use mock data
      setStats({
        totalExams: 8,
        activeExams: 2,
        totalStudents: 45,
        averageScore: 78.5
      });
    } catch (error) {
      console.error('Failed to load teacher stats:', error);
    }
  };

  return (
            <div>
        <div className="mb-10">
          <h2 className="text-4xl font-bold text-white mb-3">Instructor Portal</h2>
          <p className="text-slate-400 text-lg">Welcome back, {user.name}! Create examinations, monitor student progress, and manage academic assessments.</p>
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

          <div className="modern-card">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm font-medium">Total Students</p>
                  <p className="text-2xl font-bold text-white">{stats.totalStudents}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
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
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          <Link to="/teacher/create" className="modern-card hover:shadow-emerald-500/10 transition-all duration-300 transform hover:-translate-y-2 group">
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-emerald-500/25">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Create Exam</h3>
              <p className="text-slate-400 text-sm mb-6">Design and create new examinations</p>
              <div className="text-emerald-400 font-medium group-hover:text-emerald-300 flex items-center justify-center">
                <span>Create Now</span>
                <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>

          <Link to="/teacher/exams" className="modern-card hover:shadow-emerald-500/10 transition-all duration-300 transform hover:-translate-y-2 group">
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-emerald-500/25">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Manage Exams</h3>
              <p className="text-slate-400 text-sm mb-6">View, edit, and organize examinations</p>
              <div className="text-emerald-400 font-medium group-hover:text-emerald-300 flex items-center justify-center">
                <span>Manage</span>
                <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>

          <Link to="/teacher/results" className="modern-card hover:shadow-emerald-500/10 transition-all duration-300 transform hover:-translate-y-2 group">
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-emerald-500/25">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">View Results</h3>
              <p className="text-slate-400 text-sm mb-6">Analyze exam results and performance</p>
              <div className="text-emerald-400 font-medium group-hover:text-emerald-300 flex items-center justify-center">
                <span>View Results</span>
                <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>

          <Link to="/teacher/manage-students" className="modern-card hover:shadow-emerald-500/10 transition-all duration-300 transform hover:-translate-y-2 group">
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-emerald-500/25">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">Manage Students</h3>
              <p className="text-slate-400 text-sm mb-6">View and manage student information</p>
              <div className="text-emerald-400 font-medium group-hover:text-emerald-300 flex items-center justify-center">
                <span>Manage</span>
                <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </Link>
        </div>

        {/* Additional Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Removed Analytics and Grade Management cards per requirement */}
                </div>

        {/* Recent Activity */}
        <div className="modern-card">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <span className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-3">
                <span className="text-white text-sm">🕒</span>
              </span>
              Recent Activity
            </h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-4 p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">✅</span>
              </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">Exam "Data Structures" completed</div>
                  <div className="text-sm text-gray-600">25 students participated • 2 hours ago</div>
            </div>
          </div>
              
              <div className="flex items-center space-x-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">📝</span>
                    </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">New exam "Algorithms" created</div>
                  <div className="text-sm text-gray-600">30 questions • 1 day ago</div>
                  </div>
                </div>

              <div className="flex items-center space-x-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">⚠️</span>
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">Warning issued to student during exam</div>
                  <div className="text-sm text-gray-600">Tab switching detected • 2 days ago</div>
                          </div>
                        </div>
                  </div>
                </div>
          </div>
    </div>
  );
};

export default TeacherDashboard;
