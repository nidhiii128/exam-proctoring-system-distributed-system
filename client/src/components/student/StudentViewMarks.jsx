import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getStudentAllMarks, getStudentMarks, acquireReadLock, releaseReadLock } from '../../utils/api';
import LockStatus from '../LockStatus';

const StudentViewMarks = ({ user, socket, onLogout, addToast }) => {
  const [marks, setMarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lockStatus, setLockStatus] = useState(null);
  const [stats, setStats] = useState({
    totalExams: 0,
    averageScore: 0,
    highestScore: 0,
    totalMarks: 0
  });
  const [viewBlocked, setViewBlocked] = useState(false);
  const [activeReadLocks, setActiveReadLocks] = useState({}); // examId -> true

  useEffect(() => {
    let mounted = true;
    // Socket listeners for immediate updates when teacher edits
    try {
      if (socket) {
        // Always bind; socket may (re)connect later
        socket.on('marks-update-start', (p) => {
          if (!p) return;
          // Start blocking if broadcast for any exam or specifically for this student
          if (p.examId || p.userId === user.userId) {
            setViewBlocked(true);
            addToast('Teacher is updating marks. Please wait...', 'warning');
          }
        });
        socket.on('marks-update-end', (p) => {
          if (!p) return;
          if (p.examId || p.userId === user.userId) {
            setViewBlocked(false);
            loadMarks();
            addToast('Marks updated. Refreshed.', 'success');
          }
        });
      }
    } catch (e) {}
    const holdReadLock = async () => {
      try {
        await acquireReadLock(user.userId);
      } catch (e) {
        // If busy, we still proceed to show pending state
      } finally {
        if (mounted) loadMarks();
      }
    };
    holdReadLock();
    return () => {
      mounted = false;
      // Best-effort release
      try { releaseReadLock(user.userId); } catch (e) {}
      // sendBeacon fallback
      try {
        const url = `http://localhost:5000/api/submission/${user.userId}/release-read-lock`;
        const blob = new Blob([JSON.stringify({})], { type: 'application/json' });
        if (navigator.sendBeacon) navigator.sendBeacon(url, blob);
      } catch (e) {}
      try { if (socket) { socket.off('marks-update-start'); socket.off('marks-update-end'); } } catch (e) {}
    };
  }, []);

  const loadMarks = async () => {
    try {
      const response = await getStudentAllMarks(user.userId);
      if (response.data.success) {
        const submissions = Array.isArray(response.data.submissions) ? response.data.submissions : [];
        console.log('Loaded submissions:', submissions);
        setMarks(submissions);
        
        // Show lock status in console for debugging
        if (response.data.lockStatus) {
          console.log('Lock Status:', response.data.lockStatus);
          console.log('Chunk ID:', response.data.chunkId);
          setLockStatus(response.data.lockStatus);
          const isWrite = response.data.lockStatus?.type === 'write';
          setViewBlocked(!!isWrite);
        }
      }
    } catch (error) {
      console.error('Failed to load marks:', error);
      if (error.response?.status === 423) {
        setViewBlocked(true);
        addToast('System is busy. Teacher is updating marks. Please wait and try again.', 'warning');
      } else {
        addToast('Failed to load marks', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAcquireRead = async (examId) => {
    try {
      await acquireReadLock(user.userId);
      setActiveReadLocks(prev => ({ ...prev, [examId]: true }));
      try {
        const res = await getStudentMarks(user.userId, examId);
        if (res.data?.success) {
          // Optional: show toast via prop if provided
          console.log(`Marks for exam ${examId}:`, res.data.marks, '/', res.data.maxMarks);
        }
      } catch (e) {}
    } catch (error) {
      console.error('Failed to acquire read lock:', error);
    }
  };

  const handleReleaseRead = async (examId) => {
    try {
      await releaseReadLock(user.userId);
      setActiveReadLocks(prev => {
        const next = { ...prev };
        delete next[examId];
        return next;
      });
    } catch (error) {
      console.error('Failed to release read lock:', error);
    }
  };

  const calculateStats = (marksData) => {
    if (!marksData || marksData.length === 0) return;

    const totalExams = marksData.length;
    const totalMarks = marksData.reduce((sum, mark) => sum + mark.marks, 0);
    const totalMaxMarks = marksData.reduce((sum, mark) => sum + mark.maxMarks, 0);
    const averageScore = totalMaxMarks > 0 ? (totalMarks / totalMaxMarks) * 100 : 0;
    const highestScore = Math.max(...marksData.map(mark => (mark.marks / mark.maxMarks) * 100));

    setStats({
      totalExams,
      averageScore: averageScore.toFixed(1),
      highestScore: highestScore.toFixed(1),
      totalMarks
    });
  };

  const getGrade = (percentage) => {
    if (percentage >= 90) return { grade: 'A+', color: 'text-green-600 bg-green-100' };
    if (percentage >= 80) return { grade: 'A', color: 'text-green-600 bg-green-100' };
    if (percentage >= 70) return { grade: 'B+', color: 'text-blue-600 bg-blue-100' };
    if (percentage >= 60) return { grade: 'B', color: 'text-blue-600 bg-blue-100' };
    if (percentage >= 50) return { grade: 'C+', color: 'text-yellow-600 bg-yellow-100' };
    if (percentage >= 40) return { grade: 'C', color: 'text-yellow-600 bg-yellow-100' };
    if (percentage >= 30) return { grade: 'D', color: 'text-orange-600 bg-orange-100' };
    return { grade: 'F', color: 'text-red-600 bg-red-100' };
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      submitted: { color: 'bg-green-100 text-green-800 border-green-200', text: 'Submitted', icon: '✅' },
      warning: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', text: 'Warning', icon: '⚠️' },
      terminated: { color: 'bg-red-100 text-red-800 border-red-200', text: 'Terminated', icon: '🚫' },
      pending: { color: 'bg-gray-100 text-gray-800 border-gray-200', text: 'Pending', icon: '⏳' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.color}`}>
        <span className="mr-1">{config.icon}</span>
        {config.text}
      </span>
    );
  };

  // Poll periodically to react quickly when teacher acquires/release the write lock
  useEffect(() => {
    const id = setInterval(() => {
      loadMarks();
    }, 5000);
    return () => clearInterval(id);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="modern-card text-center max-w-md animate-scale-in">
          <div className="relative mb-6">
            <div className="w-20 h-20 mx-auto bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Loading Marks...</h2>
          <p className="text-gray-600">Fetching your exam results</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {viewBlocked && (
        <div className="fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 flex items-center space-x-3 bg-yellow-100 border border-yellow-200 text-yellow-800">
          <span className="text-2xl">⛔</span>
          <div>
            <div className="font-semibold">Teacher is updating marks.</div>
            <div className="text-sm">Viewing is temporarily disabled. This will auto-refresh.</div>
          </div>
          <button onClick={loadMarks} className="ml-auto p-1 rounded-full hover:bg-yellow-200">🔄</button>
        </div>
      )}
      {/* Lock Status */}
      <LockStatus 
        resourceId={lockStatus?.resourceId || 'marks-chunk'}
        lockStatus={lockStatus}
        onRefresh={loadMarks}
      />
      
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-lg border-b border-white/20 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">🎓</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">My Marks & Results</h1>
                <p className="text-sm text-gray-600">Welcome, {user.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/student/exams" className="btn-secondary">
                Available Exams
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
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Exam Results & Performance</h2>
          <p className="text-gray-600">Track your academic progress and performance across all exams.</p>
        </div>

        {/* Stats removed per requirement */}

        {/* Marks List */}
        {viewBlocked ? (
          <div className="modern-card text-center py-12">
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-yellow-600 text-3xl">⏳</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Teacher is updating marks</h3>
            <p className="text-gray-600">Please wait. This page will refresh automatically once available.</p>
          </div>
        ) : marks.length === 0 ? (
          <div className="modern-card text-center py-12">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-gray-400 text-3xl">📊</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Results Yet</h3>
            <p className="text-gray-600 mb-6">You haven't completed any exams yet. Start by taking an available exam.</p>
            <Link to="/student/exams" className="btn-primary">
              View Available Exams
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Exam Results</h3>
            {marks.map((mark, index) => {
              const percentage = mark.maxMarks > 0 ? (mark.marks / mark.maxMarks) * 100 : 0;
              const gradeInfo = getGrade(percentage);
              
              return (
                <div key={mark.submissionId || index} className="modern-card hover:shadow-lg transition-all duration-300">
                  <div className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex-1 mb-4 lg:mb-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="text-lg font-semibold text-gray-900">{mark.examTitle}</h4>
                          {getStatusBadge(mark.status)}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Exam Date:</span>
                            <div>{new Date(mark.submittedAt).toLocaleDateString()}</div>
                          </div>
                          <div>
                            <span className="font-medium">Duration:</span>
                            <div>{mark.examDuration} minutes</div>
                          </div>
                          <div>
                            <span className="font-medium">Questions:</span>
                            <div>{mark.totalQuestions} questions</div>
                          </div>
                          <div>
                            <span className="font-medium">Answered:</span>
                            <div>{mark.answeredQuestions || 0} questions</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-6">
                        {/* Marks Display - Only show if released */}
                        {mark.marksReleased ? (
                          <>
                            {/* Score Display */}
                            <div className="text-center">
                              <div className="text-3xl font-bold text-gray-900 mb-1">
                                {mark.marks}/{mark.maxMarks}
                              </div>
                              <div className="text-sm text-gray-600">Marks</div>
                            </div>
                            
                            {/* Percentage */}
                            <div className="text-center">
                              <div className={`text-2xl font-bold ${percentage >= 60 ? 'text-green-600' : percentage >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                                {percentage.toFixed(1)}%
                              </div>
                              <div className="text-sm text-gray-600">Percentage</div>
                            </div>
                            
                            {/* Grade */}
                            <div className="text-center">
                              <div className={`inline-flex items-center px-3 py-1 rounded-full text-lg font-bold ${gradeInfo.color}`}>
                                {gradeInfo.grade}
                              </div>
                              <div className="text-sm text-gray-600 mt-1">Grade</div>
                            </div>
                          </>
                        ) : (
                          <div className="text-center">
                            <div className="text-2xl font-bold text-gray-500 mb-1">
                              Results Pending
                            </div>
                            <div className="text-sm text-gray-600">Awaiting teacher approval</div>
                          </div>
                        )}
                        {/* Read/Release buttons for lock per exam */}
                        <div className="flex items-center space-x-2">
                          {!activeReadLocks[mark.examId] ? (
                            <button onClick={() => handleAcquireRead(mark.examId)} className="btn-secondary">Read</button>
                          ) : (
                            <button onClick={() => handleReleaseRead(mark.examId)} className="btn-secondary">Release Read</button>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Performance Bar - Only show if marks released */}
                    {mark.marksReleased && (
                      <div className="mt-4">
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>Performance</span>
                          <span>{percentage.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-500 ${
                              percentage >= 80 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                              percentage >= 60 ? 'bg-gradient-to-r from-blue-500 to-cyan-500' :
                              percentage >= 40 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                              'bg-gradient-to-r from-red-500 to-pink-500'
                            }`}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                    
                    {/* Additional Info */}
                    {mark.warnings && mark.warnings.length > 0 && (
                      <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                        <h5 className="font-medium text-yellow-900 mb-1">Warnings Issued:</h5>
                        <ul className="text-sm text-yellow-800">
                          {mark.warnings.map((warning, idx) => (
                            <li key={idx} className="flex items-center space-x-2">
                              <span>⚠️</span>
                              <span>{warning}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Performance Insights */}
        {marks.length > 0 && (
          <div className="mt-8 modern-card p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <span className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-3">
                <span className="text-white text-sm">💡</span>
              </span>
              Performance Insights
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Strengths</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Consistent performance across multiple exams</li>
                  <li>• Good time management during exams</li>
                  <li>• Strong understanding of core concepts</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Areas for Improvement</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Focus on areas with lower scores</li>
                  <li>• Practice more sample questions</li>
                  <li>• Review exam feedback carefully</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default StudentViewMarks;
