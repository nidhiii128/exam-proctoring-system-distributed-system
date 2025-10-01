import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getExamResults, releaseMarks } from '../../utils/api';

const TeacherGradeManagement = ({ user, socket, onLogout, addToast }) => {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingMarks, setEditingMarks] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadExams();
  }, []);

  const loadExams = async () => {
    try {
      // This would typically come from an API
      // For now, we'll use mock data
      const mockExams = [
        {
          examId: 'exam1',
          title: 'Data Structures & Algorithms',
          duration: 60,
          totalQuestions: 20,
          createdAt: '2024-01-15',
          status: 'completed',
          marksReleased: false
        },
        {
          examId: 'exam2',
          title: 'Database Systems',
          duration: 45,
          totalQuestions: 15,
          createdAt: '2024-01-20',
          status: 'completed',
          marksReleased: true
        },
        {
          examId: 'exam3',
          title: 'Computer Networks',
          duration: 90,
          totalQuestions: 25,
          createdAt: '2024-01-25',
          status: 'active',
          marksReleased: false
        }
      ];
      setExams(mockExams);
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
        setResults(response.data.results || []);
        // Initialize editing marks
        const initialEditingMarks = {};
        (response.data.results || []).forEach(result => {
          initialEditingMarks[result.studentId] = result.marks;
        });
        setEditingMarks(initialEditingMarks);
      }
    } catch (error) {
      console.error('Failed to load exam results:', error);
      addToast('Failed to load exam results', 'error');
    }
  };

  const handleMarkChange = (studentId, newMark) => {
    setEditingMarks(prev => ({
      ...prev,
      [studentId]: Math.max(0, Math.min(selectedExam?.maxMarks || 100, newMark))
    }));
  };

  const saveMarks = async () => {
    if (!selectedExam) return;

    setSaving(true);
    try {
      // This would typically update marks via API
      // For now, we'll simulate the update
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update results with new marks
      setResults(prev => prev.map(result => ({
        ...result,
        marks: editingMarks[result.studentId] || result.marks
      })));
      
      addToast('Marks updated successfully!', 'success');
    } catch (error) {
      console.error('Failed to save marks:', error);
      addToast('Failed to save marks', 'error');
    } finally {
      setSaving(false);
    }
  };

  const releaseExamMarks = async () => {
    if (!selectedExam) return;

    try {
      await releaseMarks(selectedExam.examId, user.userId);
      
      // Update exam status
      setExams(prev => prev.map(exam => 
        exam.examId === selectedExam.examId 
          ? { ...exam, marksReleased: true }
          : exam
      ));
      
      addToast('Marks released to students!', 'success');
    } catch (error) {
      console.error('Failed to release marks:', error);
      addToast('Failed to release marks', 'error');
    }
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

  const hasUnsavedChanges = () => {
    return results.some(result => 
      editingMarks[result.studentId] !== undefined && 
      editingMarks[result.studentId] !== result.marks
    );
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
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Loading Grade Management...</h2>
          <p className="text-gray-600">Fetching exam data and student results</p>
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
                <h1 className="text-xl font-bold text-gray-900">Grade Management</h1>
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
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Grade Management</h2>
          <p className="text-gray-600">Review, edit, and release student grades for your exams.</p>
        </div>

        {/* Exam Selection */}
        <div className="modern-card mb-8">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Exam to Manage Grades</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {exams.map((exam) => (
                <button
                  key={exam.examId}
                  onClick={() => {
                    setSelectedExam(exam);
                    loadExamResults(exam.examId);
                  }}
                  className={`p-4 rounded-lg border-2 text-left transition-all duration-300 ${
                    selectedExam?.examId === exam.examId
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <h4 className="font-semibold text-gray-900 mb-2">{exam.title}</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>Duration: {exam.duration} minutes</div>
                    <div>Questions: {exam.totalQuestions}</div>
                    <div>Created: {new Date(exam.createdAt).toLocaleDateString()}</div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        exam.status === 'completed' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {exam.status}
                      </span>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        exam.marksReleased 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {exam.marksReleased ? 'Released' : 'Pending'}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {selectedExam && (
          <>
            {/* Exam Info and Actions */}
            <div className="modern-card mb-8">
              <div className="p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{selectedExam.title}</h3>
                    <p className="text-gray-600">Duration: {selectedExam.duration} minutes • {selectedExam.totalQuestions} questions</p>
                  </div>
                  <div className="flex space-x-4">
                    {hasUnsavedChanges() && (
                      <button
                        onClick={saveMarks}
                        disabled={saving}
                        className="btn-primary"
                      >
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                    )}
                    {!selectedExam.marksReleased && (
                      <button
                        onClick={releaseExamMarks}
                        className="btn-secondary"
                      >
                        Release Marks
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Grade Management Table */}
            <div className="modern-card">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Student Grades</h3>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Marks</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Edit Marks</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Percentage</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {results.map((result, index) => {
                        const currentMarks = editingMarks[result.studentId] !== undefined ? editingMarks[result.studentId] : result.marks;
                        const percentage = (currentMarks / result.maxMarks) * 100;
                        const gradeInfo = getGrade(percentage);
                        const hasChanges = editingMarks[result.studentId] !== undefined && editingMarks[result.studentId] !== result.marks;
                        
                        return (
                          <tr key={index} className={`hover:bg-gray-50 ${hasChanges ? 'bg-yellow-50' : ''}`}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{result.studentName}</div>
                                <div className="text-sm text-gray-500">ID: {result.studentId}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{result.marks}/{result.maxMarks}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="number"
                                  min="0"
                                  max={result.maxMarks}
                                  value={currentMarks}
                                  onChange={(e) => handleMarkChange(result.studentId, parseInt(e.target.value) || 0)}
                                  className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-500">/{result.maxMarks}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className={`text-sm font-medium ${
                                percentage >= 80 ? 'text-green-600' : 
                                percentage >= 60 ? 'text-blue-600' : 
                                percentage >= 40 ? 'text-yellow-600' : 'text-red-600'
                              }`}>
                                {percentage.toFixed(1)}%
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${gradeInfo.color}`}>
                                {gradeInfo.grade}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                result.status === 'submitted' ? 'bg-green-100 text-green-800' :
                                result.status === 'terminated' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {result.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex space-x-2">
                                {hasChanges && (
                                  <button
                                    onClick={() => {
                                      const newEditingMarks = { ...editingMarks };
                                      delete newEditingMarks[result.studentId];
                                      setEditingMarks(newEditingMarks);
                                    }}
                                    className="text-red-600 hover:text-red-800 text-sm"
                                  >
                                    Reset
                                  </button>
                                )}
                                {result.warnings && result.warnings.length > 0 && (
                                  <button
                                    onClick={() => {
                                      // Show warnings modal
                                      addToast(`${result.warnings.length} warning(s) issued to this student`, 'warning');
                                    }}
                                    className="text-yellow-600 hover:text-yellow-800 text-sm"
                                  >
                                    View Warnings
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Summary */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{results.length}</div>
                      <div className="text-sm text-gray-600">Total Students</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">
                        {results.length > 0 ? (results.reduce((sum, result) => {
                          const marks = editingMarks[result.studentId] !== undefined ? editingMarks[result.studentId] : result.marks;
                          return sum + marks;
                        }, 0) / results.length).toFixed(1) : 0}
                      </div>
                      <div className="text-sm text-gray-600">Average Marks</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">
                        {results.filter(result => {
                          const marks = editingMarks[result.studentId] !== undefined ? editingMarks[result.studentId] : result.marks;
                          return (marks / result.maxMarks) * 100 >= 50;
                        }).length}
                      </div>
                      <div className="text-sm text-gray-600">Passed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">
                        {Object.keys(editingMarks).filter(studentId => 
                          editingMarks[studentId] !== results.find(r => r.studentId === studentId)?.marks
                        ).length}
                      </div>
                      <div className="text-sm text-gray-600">Modified</div>
                    </div>
                  </div>
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
            <p className="text-gray-600">Choose an exam from the list above to manage student grades.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default TeacherGradeManagement;
