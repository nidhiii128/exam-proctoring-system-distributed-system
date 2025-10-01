import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAvailableExams } from '../../utils/api';

const StudentAvailableExams = ({ user, socket, onLogout, addToast }) => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadExams();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadExams, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const loadExams = async () => {
    try {
      setRefreshing(true);
      const response = await getAvailableExams(user.userId);
      if (response.data.success) {
        setExams(response.data.exams);
      }
    } catch (error) {
      console.error('Failed to load exams:', error);
      addToast('Failed to load available exams', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800 border-green-200', text: 'Active' },
      upcoming: { color: 'bg-blue-100 text-blue-800 border-blue-200', text: 'Upcoming' },
      completed: { color: 'bg-gray-100 text-gray-800 border-gray-200', text: 'Completed' },
      expired: { color: 'bg-red-100 text-red-800 border-red-200', text: 'Expired' }
    };
    
    const config = statusConfig[status] || statusConfig.completed;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const getSubmissionStatus = (examId) => {
    // This would typically come from the API
    const submissions = JSON.parse(localStorage.getItem('studentSubmissions') || '{}');
    const submission = submissions[examId];
    
    if (!submission) return null;
    
    const statusConfig = {
      submitted: { color: 'bg-green-100 text-green-800', text: 'Submitted', icon: '✅' },
      warning: { color: 'bg-yellow-100 text-yellow-800', text: 'Warning', icon: '⚠️' },
      terminated: { color: 'bg-red-100 text-red-800', text: 'Terminated', icon: '🚫' }
    };
    
    const config = statusConfig[submission.status] || statusConfig.submitted;
    
    return (
      <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <span className="mr-1">{config.icon}</span>
        {config.text}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="modern-card text-center max-w-md animate-scale-in">
          <div className="relative mb-6">
            <div className="w-20 h-20 mx-auto bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Loading Exams...</h2>
          <p className="text-gray-600">Fetching available exams for you</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-lg border-b border-white/20 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">🎓</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Available Exams</h1>
                <p className="text-sm text-gray-600">Welcome, {user.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={loadExams}
                disabled={refreshing}
                className="btn-secondary flex items-center space-x-2"
              >
                <svg className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
              </button>
              <Link to="/student/marks" className="btn-secondary">
                View Marks
              </Link>
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
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Available Exams</h2>
          <p className="text-gray-600">Select an exam to begin. Make sure you have a stable internet connection.</p>
        </div>

        {exams.length === 0 ? (
          <div className="modern-card text-center py-12">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-gray-400 text-3xl">📝</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Exams Available</h3>
            <p className="text-gray-600 mb-6">There are currently no active exams. Check back later or contact your teacher.</p>
            <button onClick={loadExams} className="btn-primary">
              Refresh Exams
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exams.map((exam) => (
              <div key={exam.examId} className="modern-card hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{exam.title}</h3>
                      <p className="text-sm text-gray-600 mb-3">{exam.description || 'No description available'}</p>
                    </div>
                    {getStatusBadge(exam.status)}
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Duration:</span>
                      <span className="font-medium text-gray-900">{exam.duration} minutes</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Questions:</span>
                      <span className="font-medium text-gray-900">{exam.questions?.length || 0} questions</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Created by:</span>
                      <span className="font-medium text-gray-900">{exam.createdBy?.name || 'Unknown'}</span>
                    </div>
                    {exam.startTime && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Start Time:</span>
                        <span className="font-medium text-gray-900">
                          {new Date(exam.startTime).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Submission Status */}
                  {getSubmissionStatus(exam.examId) && (
                    <div className="mb-4">
                      {getSubmissionStatus(exam.examId)}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex space-x-3">
                    {exam.status === 'active' && !getSubmissionStatus(exam.examId) ? (
                      <Link
                        to={`/student/join/${exam.examId}`}
                        className="btn-primary flex-1 text-center"
                      >
                        Join Exam
                      </Link>
                    ) : exam.status === 'upcoming' ? (
                      <button
                        disabled
                        className="btn-secondary flex-1 text-center opacity-50 cursor-not-allowed"
                      >
                        Not Available Yet
                      </button>
                    ) : getSubmissionStatus(exam.examId) ? (
                      <Link
                        to={`/student/marks`}
                        className="btn-secondary flex-1 text-center"
                      >
                        View Results
                      </Link>
                    ) : (
                      <button
                        disabled
                        className="btn-secondary flex-1 text-center opacity-50 cursor-not-allowed"
                      >
                        Exam Closed
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="modern-card text-center p-4">
            <div className="text-2xl font-bold text-blue-600">{exams.length}</div>
            <div className="text-sm text-gray-600">Total Exams</div>
          </div>
          <div className="modern-card text-center p-4">
            <div className="text-2xl font-bold text-green-600">
              {exams.filter(exam => exam.status === 'active').length}
            </div>
            <div className="text-sm text-gray-600">Active</div>
          </div>
          <div className="modern-card text-center p-4">
            <div className="text-2xl font-bold text-blue-600">
              {exams.filter(exam => exam.status === 'upcoming').length}
            </div>
            <div className="text-sm text-gray-600">Upcoming</div>
          </div>
          <div className="modern-card text-center p-4">
            <div className="text-2xl font-bold text-gray-600">
              {exams.filter(exam => getSubmissionStatus(exam.examId)).length}
            </div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentAvailableExams;
