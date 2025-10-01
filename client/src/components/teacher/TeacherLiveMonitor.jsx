import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { startExam, stopExam, releaseMarks, getExamResults, getExamDetails } from '../../utils/api';

const TeacherLiveMonitor = ({ user, socket, onLogout, addToast }) => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [liveEvents, setLiveEvents] = useState([]);
  const [results, setResults] = useState([]);
  const [joinedStudents, setJoinedStudents] = useState(new Set());
  const [examStats, setExamStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    submittedStudents: 0,
    warningsIssued: 0,
    terminatedStudents: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExamData();
    
    if (socket) {
      // ensure we receive teacher-room broadcasts
      socket.emit('join-role', 'teacher');
      // rejoin on reconnect to resume live updates after navigation/refresh
      const onReconnect = () => {
        socket.emit('join-role', 'teacher');
        // pull latest snapshot so we see events that happened while away
        loadExamData();
      };
      socket.on('connect', onReconnect);
      // Listen for live events
      socket.on('student-warning', (data) => {
        setLiveEvents(prev => [...prev, { ...data, type: 'warning', timestamp: Date.now() }]);
        setExamStats(prev => ({ ...prev, warningsIssued: prev.warningsIssued + 1 }));
      });

      socket.on('student-terminated', (data) => {
        setLiveEvents(prev => [...prev, { ...data, type: 'terminated', timestamp: Date.now() }]);
        setExamStats(prev => ({
          ...prev,
          terminatedStudents: prev.terminatedStudents + 1,
          activeStudents: Math.max(0, prev.activeStudents - 1)
        }));
        // Show only one result row per student (terminated)
        setResults(prev => {
          const key = data.rollNo || data.userId;
          const filtered = prev.filter(r => r.studentId !== key);
          return [{
            studentName: data.name,
            studentId: key,
            marks: 0,
            maxMarks: (data.maxMarks ?? ((exam?.questions?.length || 0) * 10)) || 0,
            status: 'terminated'
          }, ...filtered];
        });
      });

      socket.on('student-submitted', (data) => {
        setExamStats(prev => ({
          ...prev,
          submittedStudents: prev.submittedStudents + 1,
          activeStudents: Math.max(0, prev.activeStudents - 1)
        }));
        setLiveEvents(prev => [...prev, { ...data, type: 'submitted', timestamp: Date.now() }]);
        // Upsert single result per student
        setResults(prev => {
          const key = data.rollNo || data.userId;
          const filtered = prev.filter(r => r.studentId !== key);
          return [{
            studentName: data.name,
            studentId: key,
            marks: data.marks ?? 0,
            maxMarks: (data.maxMarks ?? ((exam?.questions?.length || 0) * 10)) || 0,
            status: 'submitted'
          }, ...filtered];
        });
      });

      socket.on('student-joined', (data) => {
        // De-duplicate very recent identical join events for the same user
        setLiveEvents(prev => {
          const now = Date.now();
          const last = prev[prev.length - 1];
          if (last && last.type === 'joined' && last.userId === data.userId && now - last.timestamp < 2000) {
            return prev; // skip duplicate within 2s
          }
          return [...prev, { ...data, type: 'joined', timestamp: now }];
        });
        setJoinedStudents(prevSet => {
          const next = new Set(prevSet);
          if (!next.has(data.userId)) {
            next.add(data.userId);
            setExamStats(prev => ({ ...prev, totalStudents: prev.totalStudents + 1, activeStudents: prev.activeStudents + 1 }));
          }
          return next;
        });
      });
    }

    return () => {
      if (socket) {
        socket.off('connect');
        socket.off('student-warning');
        socket.off('student-terminated');
        socket.off('student-submitted');
        socket.off('student-joined');
      }
    };
  }, [socket, examId]);

  const loadExamData = async () => {
    try {
      // Load exam details and results in parallel
      const [detailsRes, resultsRes] = await Promise.all([
        getExamDetails(examId),
        getExamResults(examId)
      ]);

      if (detailsRes.data?.success) {
        // Compose a minimal exam object for the header card
        const d = detailsRes.data.exam;
        setExam({
          examId: d.examId,
          title: d.title,
          duration: d.duration,
          status: d.status,
          questions: new Array(d.questionCount || 0).fill(0)
        });
      }
      if (resultsRes.data?.success) {
        setResults(resultsRes.data.submissions || resultsRes.data.results || []);
        
        // Calculate stats from results
        const stats = {
          totalStudents: (resultsRes.data.submissions || resultsRes.data.results || []).length || 0,
          activeStudents: (resultsRes.data.submissions || resultsRes.data.results || []).filter(r => r.status === 'active').length || 0,
          submittedStudents: (resultsRes.data.submissions || resultsRes.data.results || []).filter(r => r.status === 'submitted').length || 0,
          warningsIssued: (resultsRes.data.submissions || resultsRes.data.results || []).filter(r => r.warnings && r.warnings.length > 0).length || 0,
          terminatedStudents: (resultsRes.data.submissions || resultsRes.data.results || []).filter(r => r.status === 'terminated').length || 0
        };
        setExamStats(stats);
      }
    } catch (error) {
      console.error('Failed to load exam data:', error);
      addToast('Failed to load exam data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleStartExam = async () => {
    try {
      await startExam(examId, user.userId);
      addToast('Exam started successfully!', 'success');
      // Reset stats when starting new exam
      setExamStats({
        totalStudents: 0,
        activeStudents: 0,
        submittedStudents: 0,
        warningsIssued: 0,
        terminatedStudents: 0
      });
      setLiveEvents([]);
    } catch (error) {
      console.error('Failed to start exam:', error);
      addToast('Failed to start exam: ' + (error.response?.data?.error || error.message), 'error');
    }
  };

  const handleStopExam = async () => {
    try {
      await stopExam(examId, user.userId);
      addToast('Exam stopped successfully!', 'success');
    } catch (error) {
      console.error('Failed to stop exam:', error);
      addToast('Failed to stop exam: ' + (error.response?.data?.error || error.message), 'error');
    }
  };

  const handleReleaseMarks = async () => {
    try {
      await releaseMarks(examId, user.userId);
      addToast('Marks released successfully!', 'success');
    } catch (error) {
      console.error('Failed to release marks:', error);
      addToast('Failed to release marks: ' + (error.response?.data?.error || error.message), 'error');
    }
  };

  const getEventIcon = (type) => {
    const icons = {
      joined: '👤',
      submitted: '✅',
      warning: '⚠️',
      terminated: '🚫'
    };
    return icons[type] || '📝';
  };

  const getEventColor = (type) => {
    const colors = {
      joined: 'bg-blue-50 border-blue-400 text-blue-800',
      submitted: 'bg-green-50 border-green-400 text-green-800',
      warning: 'bg-yellow-50 border-yellow-400 text-yellow-800',
      terminated: 'bg-red-50 border-red-400 text-red-800'
    };
    return colors[type] || 'bg-gray-50 border-gray-400 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="modern-card text-center max-w-md animate-scale-in">
          <div className="relative mb-6">
            <div className="w-20 h-20 mx-auto bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Loading Exam...</h2>
          <p className="text-gray-600">Preparing live monitoring dashboard</p>
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
          <button onClick={() => navigate('/teacher')} className="btn-primary">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-lg border-b border-white/20 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">👨‍🏫</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Live Monitor</h1>
                <p className="text-sm text-gray-600">Welcome, {user.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button onClick={() => navigate('/teacher')} className="btn-secondary">
                Back to Dashboard
              </button>
              <button onClick={onLogout} className="btn-secondary">
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Exam Info Card */}
        <div className="modern-card mb-8">
          <div className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{exam.title}</h2>
                <p className="text-gray-600">Duration: {exam.duration} minutes • {exam.questions?.length || 0} questions</p>
              </div>
              <div className="flex space-x-4">
                <button onClick={handleStopExam} className="btn-primary">
                  Stop Exam
                </button>
                <button onClick={handleReleaseMarks} className="btn-secondary">
                  Release Marks
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="modern-card text-center p-6">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-white text-xl">👥</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{examStats.totalStudents}</div>
            <div className="text-sm text-gray-600">Total Students</div>
          </div>
          
          <div className="modern-card text-center p-6">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-white text-xl">✅</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{examStats.activeStudents}</div>
            <div className="text-sm text-gray-600">Active</div>
          </div>
          
          <div className="modern-card text-center p-6">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-white text-xl">📝</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{examStats.submittedStudents}</div>
            <div className="text-sm text-gray-600">Submitted</div>
          </div>
          
          <div className="modern-card text-center p-6">
            <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-white text-xl">⚠️</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{examStats.warningsIssued}</div>
            <div className="text-sm text-gray-600">Warnings</div>
          </div>
          
          <div className="modern-card text-center p-6">
            <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-white text-xl">🚫</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{examStats.terminatedStudents}</div>
            <div className="text-sm text-gray-600">Terminated</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Live Events */}
          <div className="modern-card">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">📊</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900">Live Events</h3>
                <div className="flex items-center space-x-2 ml-auto">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-600">Live</span>
                </div>
              </div>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {liveEvents.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-gray-400 text-2xl">📊</span>
                    </div>
                    <p className="text-gray-500">No events yet. Events will appear here when students join the exam.</p>
                  </div>
                ) : (
                  liveEvents.map((event, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border-l-4 transition-all duration-300 ${getEventColor(event.type)}`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{getEventIcon(event.type)}</span>
                          <div>
                            <div className="font-medium">
                              {event.rollNo ? `${event.rollNo}` : `Student ${event.userId}`}: {event.type === 'terminated' ? 'Exam Terminated' : 
                                                      event.type === 'submitted' ? 'Exam Submitted' :
                                                      event.type === 'warning' ? 'Warning Issued' : 'Joined Exam'}
                            </div>
                            <div className="text-sm opacity-75">
                              {event.name ? `${event.name}` : 'Activity detected'}
                            </div>
                          </div>
                        </div>
                        <span className="text-sm opacity-75">
                          {new Date(event.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Student Results */}
          <div className="modern-card">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">📈</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900">Student Results</h3>
              </div>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {results.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-gray-400 text-2xl">📊</span>
                    </div>
                    <p className="text-gray-500">No results yet. Results will appear here as students submit their exams.</p>
                  </div>
                ) : (
                  results.map((result, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium text-gray-900">{result.studentName}</div>
                          <div className="text-sm text-gray-600">ID: {result.studentId}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-gray-900">
                            {result.marks}/{result.maxMarks}
                          </div>
                          <div className="text-sm text-gray-600">
                            {result.maxMarks > 0 ? ((result.marks / result.maxMarks) * 100).toFixed(1) : '0.0'}%
                          </div>
                        </div>
                      </div>
                      {result.warnings && result.warnings.length > 0 && (
                        <div className="mt-2 text-sm text-yellow-600">
                          ⚠️ {result.warnings.length} warning(s) issued
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TeacherLiveMonitor;
