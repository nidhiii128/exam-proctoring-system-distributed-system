import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTeacherExams, deleteExam, archiveExam, restoreExam, duplicateExam, stopExam, startExam } from '../../utils/api';
import LoadingSpinner from '../LoadingSpinner';

const TeacherExamManagement = ({ user, addToast }) => {
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, active, archived, draft
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExams, setSelectedExams] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [examToDelete, setExamToDelete] = useState(null);

  useEffect(() => {
    loadExams();
  }, [user.userId]);

  const loadExams = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getTeacherExams(user.userId);
      if (response.data.success) {
        setExams(response.data.exams || []);
      } else {
        setError(response.data.error || 'Failed to load exams.');
        addToast(response.data.error || 'Failed to load exams.', 'error');
      }
    } catch (err) {
      console.error('Error loading teacher exams:', err);
      setError('Failed to connect to server or load exams.');
      addToast('Failed to connect to server or load exams.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExam = async (examId) => {
    try {
      await deleteExam(examId);
      setExams(prev => prev.filter(exam => exam.examId !== examId));
      addToast('Exam deleted successfully!', 'success');
      setShowDeleteModal(false);
      setExamToDelete(null);
    } catch (err) {
      console.error('Failed to delete exam:', err);
      addToast('Failed to delete exam: ' + (err.response?.data?.error || err.message), 'error');
    }
  };

  const handleArchiveExam = async (examId) => {
    try {
      await archiveExam(examId);
      setExams(prev => prev.map(exam => 
        exam.examId === examId ? { ...exam, status: 'archived' } : exam
      ));
      addToast('Exam archived successfully!', 'success');
    } catch (err) {
      console.error('Failed to archive exam:', err);
      addToast('Failed to archive exam: ' + (err.response?.data?.error || err.message), 'error');
    }
  };

  const handleRestoreExam = async (examId) => {
    try {
      await restoreExam(examId);
      setExams(prev => prev.map(exam => 
        exam.examId === examId ? { ...exam, status: 'draft' } : exam
      ));
      addToast('Exam restored successfully!', 'success');
    } catch (err) {
      console.error('Failed to restore exam:', err);
      addToast('Failed to restore exam: ' + (err.response?.data?.error || err.message), 'error');
    }
  };

  const handleDuplicateExam = async (examId) => {
    try {
      const response = await duplicateExam(examId);
      if (response.data.success) {
        const newExam = response.data.exam;
        setExams(prev => [newExam, ...prev]);
        addToast(`Exam duplicated successfully! New exam: "${newExam.title}"`, 'success');
      }
    } catch (err) {
      console.error('Failed to duplicate exam:', err);
      addToast('Failed to duplicate exam: ' + (err.response?.data?.error || err.message), 'error');
    }
  };

  const handleStopExam = async (examId) => {
    try {
      await stopExam(examId, user.userId);
      setExams(prev => prev.map(exam => 
        exam.examId === examId ? { ...exam, status: 'completed' } : exam
      ));
      addToast('Exam stopped successfully!', 'success');
    } catch (err) {
      console.error('Failed to stop exam:', err);
      addToast('Failed to stop exam: ' + (err.response?.data?.error || err.message), 'error');
    }
  };

  const handleStartExam = async (examId) => {
    try {
      await startExam(examId, user.userId);
      setExams(prev => prev.map(exam => 
        exam.examId === examId ? { ...exam, status: 'active', startTime: new Date().toISOString() } : exam
      ));
      addToast('Exam started! Students can now see it under Available Exams.', 'success');
      navigate(`/teacher/monitor/${examId}`);
    } catch (err) {
      console.error('Failed to start exam:', err);
      addToast('Failed to start exam: ' + (err.response?.data?.error || err.message), 'error');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'ended': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'draft': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'created': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'archived': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return '🟢';
      case 'completed': return '✅';
      case 'ended': return '✅';
      case 'draft': return '📝';
      case 'created': return '📝';
      case 'archived': return '📦';
      default: return '❓';
    }
  };

  const filteredExams = exams.filter(exam => {
    const matchesFilter = filter === 'all' || exam.status === filter;
    const matchesCreatedDraft = filter === 'draft' && exam.status === 'created';
    const matchesEndedCompleted = filter === 'completed' && exam.status === 'ended';
    const matchesSearch = searchTerm === '' || 
      exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exam.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return (matchesFilter || matchesCreatedDraft || matchesEndedCompleted) && matchesSearch;
  });

  const handleSelectExam = (examId) => {
    setSelectedExams(prev => 
      prev.includes(examId) 
        ? prev.filter(id => id !== examId)
        : [...prev, examId]
    );
  };

  const handleSelectAll = () => {
    if (selectedExams.length === filteredExams.length) {
      setSelectedExams([]);
    } else {
      setSelectedExams(filteredExams.map(exam => exam.examId));
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedExams.length === 0) {
      addToast('Please select exams to perform bulk action', 'warning');
      return;
    }

    try {
      for (const examId of selectedExams) {
        switch (action) {
          case 'archive':
            await archiveExam(examId);
            break;
          case 'restore':
            await restoreExam(examId);
            break;
          case 'delete':
            await deleteExam(examId);
            break;
        }
      }
      
      addToast(`Bulk ${action} completed successfully!`, 'success');
      setSelectedExams([]);
      loadExams();
    } catch (err) {
      console.error(`Failed to perform bulk ${action}:`, err);
      addToast(`Failed to perform bulk ${action}: ` + (err.response?.data?.error || err.message), 'error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <LoadingSpinner text="Loading your exams..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100">
        <div className="modern-card text-center max-w-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-700 mb-6">{error}</p>
          <button onClick={loadExams} className="btn-primary">
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
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">📚</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Exam Management</h1>
                <p className="text-sm text-gray-600">Manage all your exams</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button onClick={() => navigate('/teacher/create')} className="btn-primary">
                Create New Exam
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
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Manage Your Exams</h2>
          <p className="text-gray-600">Create, edit, and organize your exam collection.</p>
        </div>

        {/* Controls */}
        <div className="modern-card p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search exams..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field w-full sm:w-64"
                />
                <svg className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              {/* Filter */}
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="input-field"
              >
                <option value="all">All Exams</option>
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div className="flex space-x-3">
              {/* Bulk Actions */}
              {selectedExams.length > 0 && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleBulkAction('archive')}
                    className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm font-medium transition-all duration-300"
                  >
                    Archive Selected ({selectedExams.length})
                  </button>
                  <button
                    onClick={() => handleBulkAction('restore')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-all duration-300"
                  >
                    Restore Selected ({selectedExams.length})
                  </button>
                  <button
                    onClick={() => handleBulkAction('delete')}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-all duration-300"
                  >
                    Delete Selected ({selectedExams.length})
                  </button>
                </div>
              )}

              {/* Refresh */}
              <button
                onClick={loadExams}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-all duration-300"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Exams Grid */}
        {filteredExams.length === 0 ? (
          <div className="modern-card text-center py-12">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-gray-400 text-3xl">📚</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Exams Found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || filter !== 'all' 
                ? 'No exams match your current filters.' 
                : 'You haven\'t created any exams yet.'}
            </p>
            <button onClick={() => navigate('/teacher/create')} className="btn-primary">
              Create Your First Exam
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Select All */}
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={selectedExams.length === filteredExams.length && filteredExams.length > 0}
                onChange={handleSelectAll}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-600">
                Select all ({filteredExams.length} exams)
              </span>
            </div>

            {/* Exams List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredExams.map(exam => (
                <div key={exam.examId} className="modern-card p-6 hover:shadow-xl transition-all duration-300">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={selectedExams.includes(exam.examId)}
                        onChange={() => handleSelectExam(exam.examId)}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{exam.title}</h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(exam.status)}`}>
                          <span className="mr-1">{getStatusIcon(exam.status)}</span>
                          {exam.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-gray-600 mb-4 text-sm">
                    {exam.description || 'No description provided.'}
                  </p>

                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-700 mb-4">
                    <div>
                      <span className="font-medium">Duration:</span> {exam.duration} mins
                    </div>
                    <div>
                      <span className="font-medium">Questions:</span> {exam.questions?.length || 0}
                    </div>
                    <div>
                      <span className="font-medium">Created:</span> {new Date(exam.createdAt).toLocaleDateString()}
                    </div>
                    <div>
                      <span className="font-medium">Students:</span> {exam.studentCount || 0}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {/* Action Buttons */}
                    {(exam.status === 'draft' || exam.status === 'created') && (
                      <>
                        <button
                          onClick={() => navigate(`/teacher/edit/${exam.examId}`)}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-all duration-300"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleStartExam(exam.examId)}
                          className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-medium transition-all duration-300"
                        >
                          Start
                        </button>
                      </>
                    )}
                    
                    {exam.status === 'active' && (
                      <button
                        onClick={() => handleStopExam(exam.examId)}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium transition-all duration-300"
                      >
                        Stop
                      </button>
                    )}
                    
                    {(exam.status === 'completed' || exam.status === 'ended') && (
                      <button
                        onClick={() => navigate(`/teacher/results`)}
                        className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs font-medium transition-all duration-300"
                      >
                        View Results
                      </button>
                    )}

                    <button
                      onClick={() => handleDuplicateExam(exam.examId)}
                      className="px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded text-xs font-medium transition-all duration-300"
                    >
                      Duplicate
                    </button>

                    {exam.status === 'archived' ? (
                      <button
                        onClick={() => handleRestoreExam(exam.examId)}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-all duration-300"
                      >
                        Restore
                      </button>
                    ) : (
                      <button
                        onClick={() => handleArchiveExam(exam.examId)}
                        className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-xs font-medium transition-all duration-300"
                      >
                        Archive
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setExamToDelete(exam);
                        setShowDeleteModal(true);
                      }}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium transition-all duration-300"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && examToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="modern-card max-w-md mx-4 animate-scale-in border-red-200 bg-red-50/50">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center bg-red-100">
                <span className="text-3xl text-red-600">🗑️</span>
              </div>
              <h3 className="text-xl font-bold text-red-600 mb-2">Delete Exam</h3>
              <p className="text-gray-700 mb-4">
                Are you sure you want to delete "<strong>{examToDelete.title}</strong>"? 
                This action cannot be undone and will remove all associated data.
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setExamToDelete(null);
                  }}
                  className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteExam(examToDelete.examId)}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-all duration-300"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherExamManagement;
