import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTeacherAnalytics, getExamAnalytics, exportTeacherReport } from '../../utils/api';
import LoadingSpinner from '../LoadingSpinner';

const TeacherAnalytics = ({ user, addToast }) => {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState({
    overview: {},
    examPerformance: [],
    studentProgress: [],
    cheatingIncidents: [],
    timeDistribution: [],
    gradeDistribution: []
  });
  const [selectedExam, setSelectedExam] = useState(null);
  const [examAnalytics, setExamAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState('30'); // days
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadAnalytics();
  }, [user.userId, dateRange]);

  useEffect(() => {
    if (selectedExam) {
      loadExamAnalytics(selectedExam);
    }
  }, [selectedExam]);

  const loadAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getTeacherAnalytics(user.userId, { days: dateRange });
      if (response.data.success) {
        setAnalytics(response.data.analytics);
      } else {
        setError(response.data.error || 'Failed to load analytics.');
        addToast(response.data.error || 'Failed to load analytics.', 'error');
      }
    } catch (err) {
      console.error('Error loading teacher analytics:', err);
      setError('Failed to connect to server or load analytics.');
      addToast('Failed to connect to server or load analytics.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadExamAnalytics = async (examId) => {
    try {
      const response = await getExamAnalytics(examId);
      if (response.data.success) {
        setExamAnalytics(response.data.analytics);
      }
    } catch (err) {
      console.error('Error loading exam analytics:', err);
      addToast('Failed to load exam analytics.', 'error');
    }
  };

  const handleExportReport = async (format = 'pdf') => {
    setExporting(true);
    try {
      const response = await exportTeacherReport(user.userId, format);
      
      // Create blob and download
      const blob = new Blob([response.data], { 
        type: format === 'pdf' ? 'application/pdf' : 'text/csv' 
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `teacher_report_${user.name}_${new Date().toISOString().split('T')[0]}.${format}`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      addToast(`Report exported successfully as ${format.toUpperCase()}!`, 'success');
    } catch (err) {
      console.error('Failed to export report:', err);
      addToast('Failed to export report: ' + (err.response?.data?.error || err.message), 'error');
    } finally {
      setExporting(false);
    }
  };

  const getGradeColor = (grade) => {
    switch (grade) {
      case 'A+': case 'A': return 'text-green-600 bg-green-100';
      case 'B+': case 'B': return 'text-blue-600 bg-blue-100';
      case 'C': return 'text-yellow-600 bg-yellow-100';
      case 'F': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <LoadingSpinner text="Loading analytics data..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100">
        <div className="modern-card text-center max-w-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-700 mb-6">{error}</p>
          <button onClick={loadAnalytics} className="btn-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <header className="bg-white/80 backdrop-blur-md shadow-lg border-b border-white/20 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">📊</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Analytics Dashboard</h1>
                <p className="text-sm text-gray-600">Comprehensive performance insights</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="input-field"
              >
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="365">Last year</option>
              </select>
              <button
                onClick={() => handleExportReport('pdf')}
                disabled={exporting}
                className="btn-secondary disabled:opacity-50"
              >
                {exporting ? 'Exporting...' : 'Export PDF'}
              </button>
              <button onClick={() => navigate('/teacher')} className="btn-secondary">
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Performance Analytics</h2>
          <p className="text-gray-600">Detailed insights into your teaching effectiveness and student performance.</p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="modern-card text-center p-6">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-white text-xl">📝</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{analytics.overview.totalExams || 0}</div>
            <div className="text-sm text-gray-600">Total Exams</div>
          </div>
          
          <div className="modern-card text-center p-6">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-white text-xl">👥</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{analytics.overview.totalStudents || 0}</div>
            <div className="text-sm text-gray-600">Total Students</div>
          </div>
          
          <div className="modern-card text-center p-6">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-white text-xl">📊</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{analytics.overview.averageScore || 0}%</div>
            <div className="text-sm text-gray-600">Average Score</div>
          </div>
          
          <div className="modern-card text-center p-6">
            <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-white text-xl">⚠️</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{analytics.overview.cheatingIncidents || 0}</div>
            <div className="text-sm text-gray-600">Cheating Incidents</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Exam Performance */}
          <div className="lg:col-span-2">
            <div className="modern-card p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">📈</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900">Exam Performance</h3>
              </div>
              
              <div className="space-y-4">
                {analytics.examPerformance?.length > 0 ? (
                  analytics.examPerformance.map((exam, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-semibold text-gray-800">{exam.title}</h4>
                        <span className="text-sm text-gray-600">{exam.date}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Students:</span> {exam.studentCount}
                        </div>
                        <div>
                          <span className="text-gray-600">Avg Score:</span> {exam.averageScore}%
                        </div>
                        <div>
                          <span className="text-gray-600">Pass Rate:</span> {exam.passRate}%
                        </div>
                      </div>
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${exam.averageScore}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-gray-400 text-2xl">📊</span>
                    </div>
                    <p className="text-gray-500">No exam performance data available</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Grade Distribution */}
          <div className="lg:col-span-1">
            <div className="modern-card p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">🎯</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900">Grade Distribution</h3>
              </div>
              
              <div className="space-y-3">
                {analytics.gradeDistribution?.length > 0 ? (
                  analytics.gradeDistribution.map((grade, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getGradeColor(grade.grade)}`}>
                        {grade.grade}
                      </span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(grade.count / analytics.overview.totalStudents) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600 w-8">{grade.count}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-gray-400 text-2xl">🎯</span>
                    </div>
                    <p className="text-gray-500">No grade data available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Cheating Incidents */}
        <div className="mt-8">
          <div className="modern-card p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">🚨</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900">Cheating Incidents</h3>
            </div>
            
            <div className="space-y-4">
              {analytics.cheatingIncidents?.length > 0 ? (
                analytics.cheatingIncidents.map((incident, index) => (
                  <div key={index} className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold text-red-800">{incident.type}</h4>
                        <p className="text-red-700 text-sm">{incident.message}</p>
                      </div>
                      <span className="text-xs text-red-600">{incident.timestamp}</span>
                    </div>
                    <div className="text-sm text-red-600">
                      <span className="font-medium">Student:</span> {incident.studentId} | 
                      <span className="font-medium ml-2">Exam:</span> {incident.examTitle}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-green-600 text-2xl">✅</span>
                  </div>
                  <p className="text-green-600 font-medium">No cheating incidents detected!</p>
                  <p className="text-gray-500 text-sm mt-1">Your students are maintaining academic integrity</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Detailed Exam Analytics */}
        {selectedExam && examAnalytics && (
          <div className="mt-8">
            <div className="modern-card p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm">🔍</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Detailed Analysis: {selectedExam}</h3>
                </div>
                <button
                  onClick={() => setSelectedExam(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">Question Analysis</h4>
                  <div className="space-y-2">
                    {examAnalytics.questionAnalysis?.map((question, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium">Q{index + 1}</span>
                          <span className="text-sm text-gray-600">{question.correctRate}% correct</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${question.correctRate}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">Time Analysis</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Average Time:</span>
                      <span className="text-sm font-medium">{examAnalytics.averageTime} mins</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Fastest Completion:</span>
                      <span className="text-sm font-medium">{examAnalytics.fastestTime} mins</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Slowest Completion:</span>
                      <span className="text-sm font-medium">{examAnalytics.slowestTime} mins</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default TeacherAnalytics;
