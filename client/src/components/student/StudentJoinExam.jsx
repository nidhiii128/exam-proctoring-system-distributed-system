import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getExamDetails } from '../../utils/api';

const StudentJoinExam = ({ user, socket, onLogout, addToast }) => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    loadExamDetails();
  }, [examId]);

  const loadExamDetails = async () => {
    try {
      const response = await getExamDetails(examId);
      if (response.data.success) {
        setExam(response.data.exam);
      } else {
        addToast('Exam not found or not available', 'error');
        navigate('/student/exams');
      }
    } catch (error) {
      console.error('Failed to load exam details:', error);
      addToast('Failed to load exam details', 'error');
      navigate('/student/exams');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinExam = async () => {
    if (!exam || exam.status !== 'active') {
      addToast('This exam is not currently active', 'error');
      return;
    }

    setJoining(true);
    try {
      // Simulate joining process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Navigate to exam interface
      navigate(`/student/exam/${examId}`);
      addToast('Successfully joined the exam!', 'success');
    } catch (error) {
      console.error('Failed to join exam:', error);
      addToast('Failed to join exam. Please try again.', 'error');
    } finally {
      setJoining(false);
    }
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
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Loading Exam...</h2>
          <p className="text-gray-600">Preparing exam environment</p>
        </div>
      </div>
    );
  }

  if (!exam) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <div className="modern-card text-center max-w-md animate-scale-in">
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-red-500 to-pink-600 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-red-600 mb-2">Exam Not Found</h2>
          <p className="text-gray-600 mb-6">The exam you're looking for doesn't exist or is no longer available.</p>
          <button onClick={() => navigate('/student/exams')} className="btn-primary">
            Back to Exams
          </button>
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
                <h1 className="text-xl font-bold text-gray-900">Join Exam</h1>
                <p className="text-sm text-gray-600">{user.name} • {user.rollNo}</p>
              </div>
            </div>
            <button onClick={onLogout} className="btn-secondary">
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="modern-card animate-slide-up">
          <div className="p-8">
            {/* Exam Header */}
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl">📝</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{exam.title}</h1>
              <p className="text-gray-600">Please review the exam details and guidelines before joining</p>
            </div>

            {/* Exam Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white text-sm">⏱️</span>
                  </span>
                  Exam Duration
                </h3>
                <div className="text-2xl font-bold text-blue-600 mb-2">{exam.duration} minutes</div>
                <p className="text-sm text-gray-600">Total time allocated for this exam</p>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white text-sm">❓</span>
                  </span>
                  Questions
                </h3>
                <div className="text-2xl font-bold text-green-600 mb-2">{exam.questions?.length || 0}</div>
                <p className="text-sm text-gray-600">Total questions in this exam</p>
              </div>
            </div>

            {/* Student Information */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-200 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center mr-3">
                  <span className="text-white text-sm">👤</span>
                </span>
                Student Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <div className="text-lg font-semibold text-gray-900">{user.name}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Roll Number</label>
                  <div className="text-lg font-semibold text-gray-900">{user.rollNo}</div>
                </div>
              </div>
            </div>

            {/* Exam Guidelines */}
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-xl border border-yellow-200 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center mr-3">
                  <span className="text-white text-sm">📋</span>
                </span>
                Exam Guidelines & Academic Integrity
              </h3>
              <div className="space-y-3 text-sm text-gray-700">
                <div className="flex items-start space-x-3">
                  <span className="text-yellow-600 mt-1">•</span>
                  <span>Ensure you have a stable internet connection throughout the exam</span>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-yellow-600 mt-1">•</span>
                  <span>Do not switch tabs or open other applications during the exam</span>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-yellow-600 mt-1">•</span>
                  <span>Do not use copy-paste shortcuts (Ctrl+C, Ctrl+V, etc.)</span>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-yellow-600 mt-1">•</span>
                  <span>Answer all questions honestly and to the best of your ability</span>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-yellow-600 mt-1">•</span>
                  <span>Any violation of academic integrity will result in immediate termination</span>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-yellow-600 mt-1">•</span>
                  <span>The exam will auto-submit when time expires</span>
                </div>
              </div>
            </div>

            {/* Warning Notice */}
            <div className="bg-gradient-to-r from-red-50 to-pink-50 p-6 rounded-xl border border-red-200 mb-8">
              <div className="flex items-center space-x-3 mb-3">
                <span className="text-2xl">⚠️</span>
                <h3 className="text-lg font-semibold text-red-800">Important Notice</h3>
              </div>
              <p className="text-sm text-red-700">
                This exam is monitored by our advanced cheating detection system. Any suspicious activity 
                will result in warnings and potential termination. Please ensure you follow all guidelines 
                to maintain academic integrity.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/student/exams')}
                className="btn-secondary px-8 py-3"
              >
                Back to Exams
              </button>
              <button
                onClick={handleJoinExam}
                disabled={exam.status !== 'active' || joining}
                className="btn-primary px-8 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {joining ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    <span>Joining Exam...</span>
                  </div>
                ) : (
                  'Join Exam Now'
                )}
              </button>
            </div>

            {/* Status Indicator */}
            <div className="mt-6 text-center">
              <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
                exam.status === 'active' 
                  ? 'bg-green-100 text-green-800 border border-green-200' 
                  : 'bg-gray-100 text-gray-800 border border-gray-200'
              }`}>
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  exam.status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-gray-500'
                }`}></div>
                Exam Status: {exam.status === 'active' ? 'Active' : 'Inactive'}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentJoinExam;
