import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getExamForStudent, submitExam, getStudentMarks } from '../../utils/api';

const StudentExamInterface = ({ user, socket, onLogout, addToast }) => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [examStatus, setExamStatus] = useState('waiting'); // waiting, active, submitted, terminated
  const [warning, setWarning] = useState(null);
  const [marks, setMarks] = useState(null);
  const [showWarning, setShowWarning] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExam();
    
    if (socket) {
      // Ensure socket is in student room (needed after reconnects)
      socket.emit('join-role', 'student');
      // Join exam and start clock sync
      socket.emit('join-exam', examId, { userId: user.userId, rollNo: user.rollNo, name: user.name });
      // Extra confirmation to ensure teacher dashboards receive a join event even if timing issues occur
      socket.emit('student-joined-client', { examId, userId: user.userId, rollNo: user.rollNo, name: user.name });

      // Re-emit join after reconnects (e.g., nodemon restarts)
      const onReconnect = () => {
        socket.emit('join-role', 'student');
        socket.emit('join-exam', examId, { userId: user.userId, rollNo: user.rollNo, name: user.name });
        socket.emit('student-joined-client', { examId, userId: user.userId, rollNo: user.rollNo, name: user.name });
      };
      socket.on('connect', onReconnect);

      // Clock synchronization (active only)
      const onClockReq = (data) => {
        if (examStatus === 'active') {
          socket.emit('clock-sync-response', {
            clientTime: Date.now(),
            serverTimeReceived: data.serverTime
          });
        }
      };
      const onClockAdj = (data) => {
        if (examStatus === 'active') {
          console.log('Clock sync adjustment:', data.adjustment + 'ms');
        }
      };
      socket.on('clock-sync-request', onClockReq);
      socket.on('clock-sync-adjustment', onClockAdj);

      // Cheating detection
      socket.on('cheating-warning', (data) => {
        setWarning(data);
        setShowWarning(true);
        setTimeout(() => {
          setWarning(null);
          setShowWarning(false);
        }, 5000);
      });

      socket.on('cheating-termination', (data) => {
        setWarning(data);
        setShowWarning(true);
        setExamStatus('terminated');
      });
    }

    return () => {
      if (socket) {
        socket.off('connect');
        socket.off('clock-sync-request');
        socket.off('clock-sync-adjustment');
        socket.off('cheating-warning');
        socket.off('cheating-termination');
      }
    };
  }, [socket, user.userId, examId, examStatus]);

  // Timer effect
  useEffect(() => {
    let interval;
    if (examStatus === 'active' && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleSubmitExam(true); // Auto submit
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [examStatus, timeRemaining]);

  const loadExam = async () => {
    try {
      const response = await getExamForStudent(examId, user.userId);
      if (response.data.success) {
        const examData = response.data.exam;
        setExam(examData);
        setTimeRemaining(examData.duration * 60); // Convert to seconds
        setExamStatus('active');
      } else {
        addToast('Failed to load exam', 'error');
        navigate('/student/exams');
      }
    } catch (error) {
      console.error('Failed to load exam:', error);
      const msg = error?.response?.data?.error || 'Failed to load exam';
      addToast(msg, 'error');
      // If server says already submitted/blocked, send student away
      if (error?.response?.status === 409) {
        navigate('/student/exams');
      } else {
        navigate('/student/exams');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId, selectedOption) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: selectedOption
    }));
  };

  const handleSubmitExam = async (autoSubmitted = false) => {
    if (examStatus === 'terminated') return;

    try {
      const submissionData = {
        examId: exam.examId,
        userId: user.userId,
        rollNo: user.rollNo,
        name: user.name,
        answers: Object.entries(answers).map(([questionId, selectedOption]) => ({
          questionId,
          selectedOption
        }))
      };

      await submitExam(submissionData);
      // Mark locally so UI hides this exam even if DB is unavailable
      try {
        const key = 'studentSubmissions';
        const cache = JSON.parse(localStorage.getItem(key) || '{}');
        cache[exam.examId] = { status: 'submitted', submittedAt: Date.now() };
        localStorage.setItem(key, JSON.stringify(cache));
      } catch (_) {}
      setExamStatus('submitted');
      
      if (autoSubmitted) {
        addToast('Exam auto-submitted due to time expiry', 'info');
      } else {
        addToast('Exam submitted successfully!', 'success');
      }
      
      // Try to get marks
      setTimeout(async () => {
        try {
          const marksResponse = await getStudentMarks(user.userId, exam.examId);
          if (marksResponse.data.success) {
            setMarks(marksResponse.data);
          }
        } catch (error) {
          console.log('Marks not available yet');
        }
      }, 1000);

      // Redirect to student home after brief confirmation
      setTimeout(() => {
        navigate('/student');
      }, 1200);

    } catch (error) {
      console.error('Failed to submit exam:', error);
      addToast('Failed to submit exam. Please try again.', 'error');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getAnsweredCount = () => {
    return Object.keys(answers).length;
  };

  const getProgressPercentage = () => {
    if (!exam) return 0;
    return (getAnsweredCount() / exam.questions.length) * 100;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="modern-card text-center max-w-md animate-scale-in">
          <div className="relative mb-6">
            <div className="w-20 h-20 mx-auto bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Loading Exam...</h2>
          <p className="text-slate-400 mb-4">Please wait while we synchronize your exam environment</p>
          <div className="flex justify-center space-x-1">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
          </div>
        </div>
      </div>
    );
  }

  if (examStatus === 'submitted') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900 flex items-center justify-center">
        <div className="modern-card text-center max-w-lg animate-scale-in">
          <div className="relative mb-6">
            <div className="w-24 h-24 mx-auto bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500 rounded-full animate-pulse"></div>
          </div>
          <h2 className="text-3xl font-bold text-emerald-400 mb-2">Exam Submitted!</h2>
          <p className="text-slate-400 mb-6">Your answers have been recorded successfully and are being processed.</p>
          
          {marks ? (
            <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 p-6 rounded-xl mb-6 border border-emerald-500/20">
              <h3 className="font-semibold text-emerald-400 mb-2">Your Score</h3>
              <div className="text-4xl font-bold text-emerald-400 mb-2">{marks.marks}/{marks.maxMarks}</div>
              <div className="text-sm text-slate-400">
                {((marks.marks / marks.maxMarks) * 100).toFixed(1)}% Accuracy
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-xl mb-6 border border-yellow-200">
              <div className="flex items-center justify-center mb-2">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-yellow-500 border-t-transparent mr-2"></div>
                <p className="text-yellow-700 font-medium">Processing your results...</p>
              </div>
              <p className="text-sm text-yellow-600">Marks will be available once the teacher releases them.</p>
            </div>
          )}
          
          <div className="flex space-x-4 justify-center">
            <button onClick={() => navigate('/student/marks')} className="btn-primary">
              View All Marks
            </button>
            <button onClick={() => navigate('/student/exams')} className="btn-secondary">
              Back to Exams
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (examStatus === 'terminated') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <div className="modern-card text-center max-w-lg animate-scale-in">
          <div className="relative mb-6">
            <div className="w-24 h-24 mx-auto bg-gradient-to-r from-red-500 to-pink-600 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full animate-pulse"></div>
          </div>
          <h2 className="text-3xl font-bold text-red-600 mb-2">Exam Terminated</h2>
          <p className="text-gray-600 mb-6">
            Your exam has been terminated due to violation of exam rules and academic integrity policies.
          </p>
          <div className="bg-gradient-to-r from-red-50 to-pink-50 p-6 rounded-xl mb-6 border border-red-200">
            <div className="text-2xl font-bold text-red-600 mb-2">0 Marks</div>
            <p className="text-red-700 text-sm">Your marks have been set to zero as per the penalty policy.</p>
          </div>
          <button onClick={() => navigate('/student/exams')} className="btn-primary">
            Back to Exams
          </button>
        </div>
      </div>
    );
  }

  if (!exam) return null;

  if (!Array.isArray(exam.questions) || exam.questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="modern-card text-center max-w-md animate-scale-in">
          <div className="w-16 h-16 mx-auto mb-4 bg-yellow-100 rounded-full flex items-center justify-center">
            <span className="text-yellow-600 text-2xl">❓</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">No Questions Available</h2>
          <p className="text-gray-600 mb-6">This exam has no questions configured. Please contact your teacher.</p>
          <button onClick={() => navigate('/student/exams')} className="btn-primary">Back to Exams</button>
        </div>
      </div>
    );
  }

  const currentRaw = exam.questions[currentQuestion] || {};
  const currentQ = {
    questionId: currentRaw.questionId || `q-${currentQuestion}`,
    text: currentRaw.text || 'Question unavailable',
    options: Array.isArray(currentRaw.options) ? currentRaw.options : []
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-slate-800/80 backdrop-blur-md shadow-lg border-b border-slate-700/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">{exam.title}</h1>
                <p className="text-sm text-slate-400">{user.name} • {user.rollNo}</p>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              {/* Progress */}
              <div className="hidden md:block">
                <div className="text-sm text-slate-400 mb-1">Progress</div>
                <div className="w-32 bg-slate-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-emerald-500 to-teal-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${getProgressPercentage()}%` }}
                  ></div>
                </div>
                <div className="text-xs text-slate-500 mt-1">{getAnsweredCount()}/{exam.questions.length} answered</div>
              </div>
              
              {/* Timer */}
              <div className={`text-center px-4 py-2 rounded-xl ${
                timeRemaining <= 300 
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                  : timeRemaining <= 600
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}>
                <div className="text-xs font-medium mb-1">Time Remaining</div>
                <div className={`text-lg font-mono font-bold ${
                  timeRemaining <= 300 ? 'animate-pulse' : ''
                }`}>
                  {formatTime(timeRemaining)}
                </div>
              </div>
              
              <button 
                onClick={() => handleSubmitExam()} 
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold py-2 px-4 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-emerald-500/25"
              >
                Submit Exam
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Warning Popup */}
      {showWarning && warning && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className={`modern-card max-w-md mx-4 animate-scale-in ${
            warning.type === 'termination' 
              ? 'border-red-500/30 bg-red-500/10' 
              : 'border-amber-500/30 bg-amber-500/10'
          }`}>
            <div className="text-center">
              <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center ${
                warning.type === 'termination' 
                  ? 'bg-red-500/20' 
                  : 'bg-amber-500/20'
              }`}>
                <span className={`text-3xl ${
                  warning.type === 'termination' ? 'text-red-400' : 'text-amber-400'
                }`}>
                  {warning.type === 'termination' ? '🚫' : '⚠️'}
                </span>
              </div>
              <h3 className={`text-xl font-bold mb-2 ${
                warning.type === 'termination' ? 'text-red-400' : 'text-amber-400'
              }`}>
                {warning.type === 'termination' ? 'Exam Terminated' : 'Warning'}
              </h3>
              <p className="text-slate-300 mb-4">{warning.message}</p>
              <button 
                onClick={() => setShowWarning(false)}
                className={`px-6 py-2 rounded-xl font-medium transition-all duration-300 ${
                  warning.type === 'termination' 
                    ? 'bg-red-600 hover:bg-red-700 text-white' 
                    : 'bg-amber-600 hover:bg-amber-700 text-white'
                }`}
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Question Navigation */}
          <div className="lg:col-span-1">
            <div className="modern-card sticky top-24">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></span>
                Question Navigator
              </h3>
              <div className="grid grid-cols-5 lg:grid-cols-3 gap-3">
                {(exam.questions || []).map((q, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentQuestion(index)}
                    className={`w-10 h-10 text-sm font-medium rounded-xl transition-all duration-300 transform hover:scale-110 ${
                      currentQuestion === index
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25'
                        : answers[(q && q.questionId) || String(index)] !== undefined
                        ? 'bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500/30 hover:bg-emerald-500/30'
                        : 'bg-slate-700 text-slate-400 border-2 border-slate-600 hover:bg-slate-600'
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
              
              {/* Quick Stats */}
              <div className="mt-6 pt-4 border-t border-slate-700">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Answered:</span>
                    <span className="font-medium text-emerald-400">{getAnsweredCount()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Remaining:</span>
                    <span className="font-medium text-slate-400">{exam.questions.length - getAnsweredCount()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Progress:</span>
                    <span className="font-medium text-emerald-400">{getProgressPercentage().toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Question Content */}
          <div className="lg:col-span-3">
            <div className="modern-card animate-slide-up">
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg">
                      {currentQuestion + 1}
                    </div>
                    <div>
                      <div className="text-sm text-slate-400">
                        Question {currentQuestion + 1} of {exam.questions.length}
                      </div>
                      <div className="text-xs text-slate-500">
                        {answers[currentQ.questionId] !== undefined ? 'Answered' : 'Not answered'}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-slate-400">
                    {Math.round((currentQuestion + 1) / exam.questions.length * 100)}% Complete
                  </div>
                </div>
                <h2 className="text-xl font-semibold text-white leading-relaxed">
                  {currentQ.text}
                </h2>
              </div>

              <div className="space-y-4">
                {(currentQ.options || []).map((option, index) => (
                  <label 
                    key={index} 
                    className={`flex items-center space-x-4 cursor-pointer p-4 rounded-xl border-2 transition-all duration-300 hover:shadow-md ${
                      answers[currentQ.questionId] === index
                        ? 'border-emerald-500 bg-emerald-500/10'
                        : 'border-slate-600 hover:border-slate-500 hover:bg-slate-700/50'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${currentQ.questionId}`}
                      value={index}
                      checked={answers[currentQ.questionId] === index}
                      onChange={() => handleAnswerChange(currentQ.questionId, index)}
                      className="w-5 h-5 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div className="flex-1">
                      <span className="text-white font-medium">{option}</span>
                    </div>
                    {answers[currentQ.questionId] === index && (
                      <div className="w-6 h-6 bg-emerald-500 rounded-xl flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </label>
                ))}
              </div>

              <div className="flex justify-between mt-8 pt-6 border-t border-slate-700">
                <button
                  onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                  disabled={currentQuestion === 0}
                  className="bg-slate-700 text-slate-200 px-4 py-2 rounded-xl hover:bg-slate-600 transition-all duration-300 border border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span>Previous</span>
                </button>
                <button
                  onClick={() => setCurrentQuestion(Math.min(exam.questions.length - 1, currentQuestion + 1))}
                  disabled={currentQuestion === exam.questions.length - 1}
                  className="bg-slate-700 text-slate-200 px-4 py-2 rounded-xl hover:bg-slate-600 transition-all duration-300 border border-slate-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <span>Next</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentExamInterface;
