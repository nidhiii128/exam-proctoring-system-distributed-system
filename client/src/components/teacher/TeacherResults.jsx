import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllExams, getExamResults, releaseMarks, releaseMarksForStudent, acquireWriteLock, releaseWriteLock, updateStudentMarks } from '../../utils/api';
import LockStatus from '../LockStatus';

const TeacherResults = ({ user, socket, onLogout, addToast }) => {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasWriteLock, setHasWriteLock] = useState(false);
  const [lockStatus, setLockStatus] = useState(null);
  const [editingMarks, setEditingMarks] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [analytics, setAnalytics] = useState({
    totalStudents: 0,
    averageScore: 0,
    passRate: 0,
    gradeDistribution: {}
  });
  const [isLocking, setIsLocking] = useState(false);

  useEffect(() => {
    loadExams();
    // Restore persisted UI state
    try {
      const persisted = sessionStorage.getItem('teacherResultsState');
      if (persisted) {
        const state = JSON.parse(persisted);
        if (state.selectedExam) {
          setSelectedExam(state.selectedExam);
          loadExamResults(state.selectedExam.examId);
        }
        if (state.hasWriteLock) setHasWriteLock(true);
        if (state.isEditing) setIsEditing(true);
      }
    } catch (e) {}
  }, []);

  // Persist state whenever these change
  useEffect(() => {
    try {
      sessionStorage.setItem('teacherResultsState', JSON.stringify({ selectedExam, hasWriteLock, isEditing }));
    } catch (e) {}
  }, [selectedExam, hasWriteLock, isEditing]);

  const loadExams = async () => {
    try {
      const res = await getAllExams();
      if (res.data?.success) {
        const list = (res.data.exams || []).map(e => ({
          examId: e.examId,
          title: e.title,
          duration: e.duration,
          totalQuestions: e.questionCount || (e.questions?.length || 0),
          createdAt: e.createdAt || e.startTime || new Date(),
          status: e.status || 'created'
        }));
        setExams(list);
      } else {
        setExams([]);
      }
    } catch (error) {
      console.error('Failed to load exams:', error);
      addToast('Failed to load exams', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadExamResults = async (examId) => {
    try {
      const response = await getExamResults(examId);
      if (response.data.success) {
        const rows = response.data.submissions || response.data.results || [];
        // Map the API response fields to the expected frontend fields
        const mappedResults = rows.map(result => ({
          ...result,
          studentName: result.name || result.studentName || 'Unknown Student',
          studentId: result.userId || result.studentId || result.rollNo || 'N/A',
          rollNo: result.rollNo || result.userId || 'N/A'
        }));
        setResults(mappedResults);
        calculateAnalytics(mappedResults);
      }
    } catch (error) {
      console.error('Failed to load exam results:', error);
      addToast('Failed to load exam results', 'error');
    }
  };

  const handleAcquireWriteLock = async () => {
    if (!selectedExam) {
      addToast('Please select an exam first to update marks.', 'warning');
      return;
    }
    try {
      if (isLocking) return;
      setIsLocking(true);

      console.log('Acquiring write lock for exam:', selectedExam.examId);
      console.log('Current results:', results);

      // Optimistically enable editing so UI is responsive
      setHasWriteLock(true);
      setIsEditing(true);

      const response = await acquireWriteLock(selectedExam.examId, user.userId);
      // Normalize lockStatus to an object compatible with LockStatus component
      const rawStatus = response?.data?.lockStatus;
      const normalizedStatus = Array.isArray(rawStatus)
        ? { hasLock: true, type: 'write', holders: [user.userId], queue: [] }
        : (rawStatus || { hasLock: true, type: 'write', holders: [user.userId], queue: [] });
      setLockStatus(normalizedStatus);
      // Initialize editing marks with current values
      const initialEditingMarks = {};
      results.forEach(result => {
        initialEditingMarks[result.studentId] = {
          marks: result.marks || 0,
          maxMarks: result.maxMarks || 0
        };
      });
      console.log('Initial editing marks:', initialEditingMarks);
      setEditingMarks(initialEditingMarks);
      console.log('State after lock acquisition - hasWriteLock:', true, 'isEditing:', true);
      addToast('Write lock acquired. You can now edit marks.', 'success');
    } catch (error) {
      console.error('Failed to acquire write lock:', error);
      // Revert optimistic state
      setHasWriteLock(false);
      setIsEditing(false);
      if (error.response?.status === 423) {
        addToast('System is busy. Please wait and try again.', 'warning');
      } else {
        addToast('Failed to acquire write lock', 'error');
      }
    }
    finally {
      setIsLocking(false);
    }
  };

  const handleReleaseWriteLock = async () => {
    if (!selectedExam) return;
    try {
      console.log('Saving changes and releasing write lock for exam:', selectedExam.examId);
      
      // Save all edited marks
      const updatePromises = Object.entries(editingMarks).map(async ([studentId, marks]) => {
        try {
          await updateStudentMarks(selectedExam.examId, studentId, marks.marks, marks.maxMarks);
        } catch (error) {
          console.error(`Failed to update marks for student ${studentId}:`, error);
        }
      });
      
      await Promise.all(updatePromises);
      
      // Release all marks to make them visible to students
      await releaseMarks(selectedExam.examId, user.userId);
      
      // Release write lock
      await releaseWriteLock(selectedExam.examId, user.userId);
      
      setHasWriteLock(false);
      setIsEditing(false);
      setLockStatus(null);
      setEditingMarks({});
      
      // Reload results to show updated marks
      await loadExamResults(selectedExam.examId);
      
      addToast('Changes saved and marks released to students.', 'success');
    } catch (error) {
      console.error('Failed to save changes and release write lock:', error);
      addToast('Failed to save changes', 'error');
    }
  };

  const handleMarkChange = (studentId, field, value) => {
    setEditingMarks(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: parseInt(value) || 0
      }
    }));
  };

  const handleReleaseMarks = async () => {
    if (!selectedExam) return;
    try {
      console.log('Releasing marks for exam:', selectedExam.examId);
      await releaseMarks(selectedExam.examId, user.userId);
      addToast('Marks released successfully', 'success');
      await loadExamResults(selectedExam.examId);
    } catch (error) {
      console.error('Failed to release marks:', error);
      if (error.response?.status === 423) {
        addToast('Write lock not acquired. Please click Update button first.', 'warning');
      } else {
      addToast('Failed to release marks', 'error');
      }
    }
  };

  const calculateAnalytics = (resultsData) => {
    if (!resultsData || resultsData.length === 0) {
      setAnalytics({
        totalStudents: 0,
        averageScore: 0,
        passRate: 0,
        gradeDistribution: {}
      });
      return;
    }

    const totalStudents = resultsData.length;
    const totalMarks = resultsData.reduce((sum, result) => sum + result.marks, 0);
    const totalMaxMarks = resultsData.reduce((sum, result) => sum + result.maxMarks, 0);
    const averageScore = totalMaxMarks > 0 ? (totalMarks / totalMaxMarks) * 100 : 0;
    const passedStudents = resultsData.filter(result => (result.marks / result.maxMarks) * 100 >= 50).length;
    const passRate = (passedStudents / totalStudents) * 100;

    // Grade distribution
    const gradeDistribution = {
      'A+': resultsData.filter(r => (r.marks / r.maxMarks) * 100 >= 90).length,
      'A': resultsData.filter(r => (r.marks / r.maxMarks) * 100 >= 80 && (r.marks / r.maxMarks) * 100 < 90).length,
      'B+': resultsData.filter(r => (r.marks / r.maxMarks) * 100 >= 70 && (r.marks / r.maxMarks) * 100 < 80).length,
      'B': resultsData.filter(r => (r.marks / r.maxMarks) * 100 >= 60 && (r.marks / r.maxMarks) * 100 < 70).length,
      'C+': resultsData.filter(r => (r.marks / r.maxMarks) * 100 >= 50 && (r.marks / r.maxMarks) * 100 < 60).length,
      'F': resultsData.filter(r => (r.marks / r.maxMarks) * 100 < 50).length
    };

    setAnalytics({
      totalStudents,
      averageScore: averageScore.toFixed(1),
      passRate: passRate.toFixed(1),
      gradeDistribution
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

  const exportResults = () => {
    if (!selectedExam || results.length === 0) {
      addToast('No results to export', 'error');
      return;
    }

    const csvContent = [
      ['Student ID', 'Student Name', 'Marks', 'Max Marks', 'Percentage', 'Grade', 'Status', 'Warnings'],
      ...results.map(result => [
        result.studentId,
        result.studentName,
        result.marks,
        result.maxMarks,
        ((result.marks / result.maxMarks) * 100).toFixed(1) + '%',
        getGrade((result.marks / result.maxMarks) * 100).grade,
        result.status,
        result.warnings ? result.warnings.length : 0
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedExam.title}_results.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    addToast('Results exported successfully!', 'success');
  };

  // Auto-release write lock when navigating away, closing tab, or losing connection
  useEffect(() => {
    if (!hasWriteLock) return;

    const releaseViaBeacon = () => {
      try {
        if (!selectedExam) return;
        const url = `http://localhost:5000/api/exam/${selectedExam.examId}/release-write-lock`;
        const data = new Blob([JSON.stringify({ userId: user.userId })], { type: 'application/json' });
        if (navigator.sendBeacon) {
          navigator.sendBeacon(url, data);
        }
      } catch (e) {}
    };

    const handleBeforeUnload = () => {
      releaseViaBeacon();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      try { handleBeforeUnload(); } catch (e) {}
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasWriteLock, selectedExam, user.userId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="modern-card text-center max-w-md animate-scale-in">
          <div className="relative mb-6">
            <div className="w-20 h-20 mx-auto bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent"></div>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Loading Results...</h2>
          <p className="text-gray-600">Fetching exam results and analytics</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Lock Status */}
      {lockStatus && (
        <LockStatus 
          resourceId="marks-chunk-0"
          lockStatus={lockStatus}
          onRefresh={() => setLockStatus(null)}
        />
      )}
      
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-lg border-b border-white/20 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">👨‍🏫</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Exam Results & Analytics</h1>
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
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Exam Results & Analytics</h2>
          <p className="text-gray-600">Analyze student performance and generate detailed reports.</p>
        </div>

        {/* Exam Selection */}
        <div className="modern-card mb-8">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Exam to View Results</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {exams.map((exam) => (
                <button
                  key={exam.examId}
                  onClick={() => {
                    setSelectedExam(exam);
                    try { sessionStorage.setItem('teacherResultsState', JSON.stringify({ selectedExam: exam, hasWriteLock, isEditing })); } catch (e) {}
                    loadExamResults(exam.examId);
                  }}
                  className={`p-4 rounded-lg border-2 text-left transition-all duration-300 cursor-pointer ${
                    selectedExam?.examId === exam.examId
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">{exam.title}</h4>
                    {selectedExam?.examId === exam.examId && (
                      <span className="text-blue-600 text-sm">✓ Selected</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>Duration: {exam.duration} minutes</div>
                    <div>Questions: {exam.totalQuestions}</div>
                    <div>Created: {new Date(exam.createdAt).toLocaleDateString()}</div>
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      exam.status === 'completed' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {exam.status}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {selectedExam && (
          <>

            {/* Grade Distribution removed per requirement */}

            {/* Results Table */}
            <div className="modern-card mb-8">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                  <h3 className="text-lg font-semibold text-gray-900">Student Results</h3>
                    {isEditing && (
                      <div className="mt-2 flex items-center space-x-2 text-blue-600">
                        <span className="text-sm">✏️ Editing Mode</span>
                        <span className="text-xs bg-blue-100 px-2 py-1 rounded">Click Done & Release to save changes</span>
                      </div>
                    )}
                    {/* Debug info - remove in production */}
                    <div className="mt-1 text-xs text-gray-500">
                      Debug: hasWriteLock={hasWriteLock ? 'true' : 'false'}, isEditing={isEditing ? 'true' : 'false'}
                    </div>
                  </div>
                  <div className="space-x-3">
                    {!hasWriteLock ? (
                      <div className="space-x-2">
                        <button onClick={handleAcquireWriteLock} className="btn-primary" disabled={isLocking || hasWriteLock}>
                          🔒 Update Marks
                        </button>
                        <button onClick={handleReleaseMarks} className="btn-secondary" disabled={!selectedExam}>
                          Release Marks
                        </button>
                      </div>
                    ) : (
                      <>
                        <button onClick={handleReleaseWriteLock} className="btn-primary">
                          ✅ Done & Release
                        </button>
                        <button onClick={handleReleaseMarks} className="btn-secondary" disabled={!hasWriteLock}>
                          Release Marks
                        </button>
                      </>
                    )}
                    <button onClick={exportResults} className="btn-primary">Export CSV</button>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roll No</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marks</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {results.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                            No results available for this exam yet.
                          </td>
                        </tr>
                      ) : (
                        results.map((result, index) => {
                          const currentMarks = editingMarks[result.studentId] || { marks: result.marks || 0, maxMarks: result.maxMarks || 0 };
                          const percentage = currentMarks.maxMarks > 0 ? (currentMarks.marks / currentMarks.maxMarks) * 100 : 0;
                          
                          return (
                            <tr key={index} className={`hover:bg-gray-50 ${isEditing ? 'bg-blue-50' : ''}`}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{result.rollNo}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{result.studentName}</div>
                          </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {/* Debug: Show current state */}
                                <div className="text-xs text-red-500 mb-1">
                                  Debug: isEditing={isEditing ? 'true' : 'false'}, hasWriteLock={hasWriteLock ? 'true' : 'false'}
                                </div>
                                {isEditing ? (
                                  <div className="flex items-center space-x-2">
                                    <input
                                      type="number"
                                      min="0"
                                      value={currentMarks.marks}
                                      onChange={(e) => handleMarkChange(result.studentId, 'marks', e.target.value)}
                                      className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                                    />
                                    <span>/</span>
                                    <input
                                      type="number"
                                      min="0"
                                      value={currentMarks.maxMarks}
                                      onChange={(e) => handleMarkChange(result.studentId, 'maxMarks', e.target.value)}
                                      className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                                    />
                                    <span className="text-xs text-gray-500">
                                      ({percentage.toFixed(1)}%)
                                    </span>
                                  </div>
                                ) : (
                                  <div>
                                    {result.marks}/{result.maxMarks}
                                    <span className="text-xs text-gray-500 ml-2">
                                      ({percentage.toFixed(1)}%)
                                    </span>
                                  </div>
                                )}
                              </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                                {isEditing ? (
                                  <span className="text-sm text-blue-600 font-medium">Editing...</span>
                                ) : (
                                  <button
                                    onClick={async () => {
                                      try {
                                        console.log('Releasing marks for student:', result.studentId, 'in exam:', selectedExam.examId);
                                        await releaseMarksForStudent(selectedExam.examId, result.studentId);
                                        addToast('Marks released for student', 'success');
                                        await loadExamResults(selectedExam.examId);
                                      } catch (error) {
                                        console.error('Failed to release marks for student:', error);
                                        if (error.response?.status === 423) {
                                          addToast('System is busy. Please wait and try again.', 'warning');
                                        } else {
                                          addToast('Failed to release marks for student', 'error');
                                        }
                                      }
                                    }}
                                    className="btn-secondary"
                                  >
                                    Release for Student
                                  </button>
                                )}
                          </td>
                        </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}

        {!selectedExam && (
          <div className="modern-card text-center py-12">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-gray-400 text-3xl">📊</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Select an Exam</h3>
            <p className="text-gray-600 mb-4">Choose an exam from the list above to view detailed results and analytics.</p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
              <div className="flex items-center space-x-2 text-blue-800">
                <span className="text-lg">💡</span>
                <div className="text-sm">
                  <strong>Tip:</strong> Click on any exam card above to select it, then you can update marks for that exam's students.
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default TeacherResults;
