import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStudentAnalytics } from '../../utils/api';
import LoadingSpinner from '../LoadingSpinner';

const StudentAnalytics = ({ user, addToast }) => {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState({
    overview: {},
    examHistory: [],
    performanceTrend: [],
    strengths: [],
    weaknesses: [],
    recommendations: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState('30'); // days

  useEffect(() => {
    loadAnalytics();
  }, [user.userId, dateRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getStudentAnalytics(user.userId, { days: dateRange });
      if (response.data.success) {
        setAnalytics(response.data.analytics);
      } else {
        setError(response.data.error || 'Failed to load analytics.');
        addToast(response.data.error || 'Failed to load analytics.', 'error');
      }
    } catch (err) {
      console.error('Error loading student analytics:', err);
      setError('Failed to connect to server or load analytics.');
      addToast('Failed to connect to server or load analytics.', 'error');
    } finally {
      setLoading(false);
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

  const getPerformanceColor = (score) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <LoadingSpinner text="Loading your performance data..." />
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white/80 backdrop-blur-md shadow-lg border-b border-white/20 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">📊</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Performance Analytics</h1>
                <p className="text-sm text-gray-600">Track your academic progress</p>
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
              <button onClick={() => navigate('/student')} className="btn-secondary">
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Your Performance Insights</h2>
          <p className="text-gray-600">Understand your strengths, track progress, and improve your performance.</p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="modern-card text-center p-6">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-white text-xl">📝</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{analytics.overview.totalExams || 0}</div>
            <div className="text-sm text-gray-600">Exams Taken</div>
          </div>
          
          <div className="modern-card text-center p-6">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-white text-xl">📊</span>
            </div>
            <div className={`text-2xl font-bold ${getPerformanceColor(analytics.overview.averageScore || 0)}`}>
              {analytics.overview.averageScore || 0}%
            </div>
            <div className="text-sm text-gray-600">Average Score</div>
          </div>
          
          <div className="modern-card text-center p-6">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-white text-xl">🏆</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{analytics.overview.highestScore || 0}%</div>
            <div className="text-sm text-gray-600">Highest Score</div>
          </div>
          
          <div className="modern-card text-center p-6">
            <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-white text-xl">📈</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{analytics.overview.improvementRate || 0}%</div>
            <div className="text-sm text-gray-600">Improvement Rate</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Performance Trend */}
          <div className="modern-card p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">📈</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900">Performance Trend</h3>
            </div>
            
            <div className="space-y-4">
              {analytics.performanceTrend?.length > 0 ? (
                analytics.performanceTrend.map((exam, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-semibold text-gray-800">{exam.title}</h4>
                      <span className="text-sm text-gray-600">{exam.date}</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className={`font-medium ${getPerformanceColor(exam.score)}`}>
                        {exam.score}%
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getGradeColor(exam.grade)}`}>
                        {exam.grade}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          exam.score >= 90 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                          exam.score >= 80 ? 'bg-gradient-to-r from-blue-500 to-cyan-500' :
                          exam.score >= 70 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                          'bg-gradient-to-r from-red-500 to-pink-500'
                        }`}
                        style={{ width: `${exam.score}%` }}
                      ></div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-gray-400 text-2xl">📈</span>
                  </div>
                  <p className="text-gray-500">No performance data available yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Strengths & Weaknesses */}
          <div className="space-y-6">
            {/* Strengths */}
            <div className="modern-card p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">💪</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900">Your Strengths</h3>
              </div>
              
              <div className="space-y-2">
                {analytics.strengths?.length > 0 ? (
                  analytics.strengths.map((strength, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                      <span className="text-green-800 font-medium">{strength}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-500 text-sm">Complete more exams to identify your strengths</p>
                  </div>
                )}
              </div>
            </div>

            {/* Weaknesses */}
            <div className="modern-card p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">🎯</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900">Areas for Improvement</h3>
              </div>
              
              <div className="space-y-2">
                {analytics.weaknesses?.length > 0 ? (
                  analytics.weaknesses.map((weakness, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                      <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">!</span>
                      </div>
                      <span className="text-yellow-800 font-medium">{weakness}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-500 text-sm">Great job! No major weaknesses identified</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="modern-card p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm">💡</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900">Personalized Recommendations</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analytics.recommendations?.length > 0 ? (
              analytics.recommendations.map((recommendation, index) => (
                <div key={index} className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-sm">💡</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-purple-800 mb-1">{recommendation.title}</h4>
                      <p className="text-purple-700 text-sm">{recommendation.description}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-gray-400 text-2xl">💡</span>
                </div>
                <p className="text-gray-500">Complete more exams to get personalized recommendations</p>
              </div>
            )}
          </div>
        </div>

        {/* Exam History */}
        <div className="mt-8">
          <div className="modern-card p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">📚</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900">Exam History</h3>
            </div>
            
            <div className="space-y-4">
              {analytics.examHistory?.length > 0 ? (
                analytics.examHistory.map((exam, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-semibold text-gray-800">{exam.title}</h4>
                      <span className="text-sm text-gray-600">{exam.date}</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Score:</span> 
                        <span className={`ml-1 font-medium ${getPerformanceColor(exam.score)}`}>
                          {exam.score}%
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Grade:</span> 
                        <span className={`ml-1 px-2 py-1 rounded-full text-xs font-medium ${getGradeColor(exam.grade)}`}>
                          {exam.grade}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Duration:</span> {exam.duration} mins
                      </div>
                      <div>
                        <span className="text-gray-600">Status:</span> 
                        <span className={`ml-1 px-2 py-1 rounded-full text-xs font-medium ${
                          exam.status === 'completed' ? 'bg-green-100 text-green-800' :
                          exam.status === 'terminated' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {exam.status}
                        </span>
                      </div>
                    </div>
                    {exam.warnings && exam.warnings.length > 0 && (
                      <div className="mt-2 p-2 bg-yellow-50 rounded border border-yellow-200">
                        <p className="text-yellow-800 text-xs">
                          <span className="font-medium">Warnings:</span> {exam.warnings.length} incident(s)
                        </p>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-gray-400 text-2xl">📚</span>
                  </div>
                  <p className="text-gray-500">No exam history available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentAnalytics;
