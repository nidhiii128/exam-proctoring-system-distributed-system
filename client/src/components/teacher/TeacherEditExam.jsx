import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getExam, updateExam } from '../../utils/api';
import LoadingSpinner from '../LoadingSpinner';

const TeacherEditExam = ({ user, addToast }) => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [examForm, setExamForm] = useState({
    title: '',
    description: '',
    duration: 30,
    questions: []
  });
  const [originalExam, setOriginalExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadExam();
  }, [examId]);

  const loadExam = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getExam(examId);
      if (response.data.success) {
        const examData = response.data.exam;
        setOriginalExam(examData);
        setExamForm({
          title: examData.title,
          description: examData.description || '',
          duration: examData.duration,
          questions: examData.questions || []
        });
      } else {
        setError(response.data.error || 'Failed to load exam.');
        addToast(response.data.error || 'Failed to load exam.', 'error');
      }
    } catch (err) {
      console.error('Error loading exam:', err);
      setError('Failed to connect to server or load exam.');
      addToast('Failed to connect to server or load exam.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const addQuestion = () => {
    setExamForm({
      ...examForm,
      questions: [...examForm.questions, {
        text: '',
        options: ['', '', '', ''],
        correctOption: 0
      }]
    });
  };

  const removeQuestion = (index) => {
    const questions = examForm.questions.filter((_, i) => i !== index);
    setExamForm({ ...examForm, questions });
  };

  const updateQuestion = (index, field, value) => {
    const questions = [...examForm.questions];
    questions[index] = { ...questions[index], [field]: value };
    setExamForm({ ...examForm, questions });
  };

  const moveQuestion = (index, direction) => {
    const questions = [...examForm.questions];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (newIndex >= 0 && newIndex < questions.length) {
      [questions[index], questions[newIndex]] = [questions[newIndex], questions[index]];
      setExamForm({ ...examForm, questions });
    }
  };

  const handleSaveExam = async () => {
    setSaving(true);
    try {
      const response = await updateExam(examId, {
        ...examForm,
        updatedBy: user.userId
      });

      if (response.data.success) {
        addToast(`Exam "${response.data.exam.title}" updated successfully!`, 'success');
        navigate('/teacher/exams');
      } else {
        addToast(response.data.error || 'Failed to update exam.', 'error');
      }
    } catch (error) {
      console.error('Failed to update exam:', error);
      addToast('Failed to update exam: ' + (error.response?.data?.error || error.message), 'error');
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = () => {
    if (!originalExam) return false;
    
    return (
      examForm.title !== originalExam.title ||
      examForm.description !== (originalExam.description || '') ||
      examForm.duration !== originalExam.duration ||
      JSON.stringify(examForm.questions) !== JSON.stringify(originalExam.questions || [])
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <LoadingSpinner text="Loading exam for editing..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100">
        <div className="modern-card text-center max-w-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-700 mb-6">{error}</p>
          <button onClick={() => navigate('/teacher/exams')} className="btn-primary">
            Back to Exams
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
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">✏️</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Edit Exam</h1>
                <p className="text-sm text-gray-600">Modify exam details and questions</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {hasChanges() && (
                <div className="flex items-center space-x-2 text-orange-600">
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">Unsaved changes</span>
                </div>
              )}
              <button onClick={() => navigate('/teacher/exams')} className="btn-secondary">
                Cancel
              </button>
              <button
                onClick={handleSaveExam}
                disabled={!examForm.title || examForm.questions.length === 0 || saving}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Saving...</span>
                  </div>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8 animate-slide-up">
          <div className="modern-card">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">📝</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Exam Details</h2>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Exam Title
                  </label>
                  <input
                    type="text"
                    value={examForm.title}
                    onChange={(e) => setExamForm({ ...examForm, title: e.target.value })}
                    className="input-field"
                    placeholder="Enter exam title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={examForm.duration}
                    onChange={(e) => setExamForm({ ...examForm, duration: parseInt(e.target.value) })}
                    className="input-field"
                    min="1"
                    max="180"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={examForm.description}
                  onChange={(e) => setExamForm({ ...examForm, description: e.target.value })}
                  className="input-field"
                  rows="3"
                  placeholder="Enter exam description..."
                />
              </div>
            </div>
          </div>

          <div className="modern-card">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">❓</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900">Questions</h3>
                <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
                  {examForm.questions.length} questions
                </span>
              </div>
              <button
                onClick={addQuestion}
                className="btn-primary flex items-center space-x-2"
              >
                <span>+</span>
                <span>Add Question</span>
              </button>
            </div>

            <div className="space-y-6">
              {examForm.questions.map((question, index) => (
                <div key={index} className="bg-gradient-to-r from-gray-50 to-blue-50 p-6 rounded-xl border border-gray-200">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center space-x-3">
                      <h4 className="font-semibold text-gray-800">Question {index + 1}</h4>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => moveQuestion(index, 'up')}
                          disabled={index === 0}
                          className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Move up"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => moveQuestion(index, 'down')}
                          disabled={index === examForm.questions.length - 1}
                          className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Move down"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() => removeQuestion(index)}
                      className="text-red-500 hover:text-red-700 p-1"
                      title="Delete question"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>

                  <div className="space-y-4">
                    <input
                      type="text"
                      value={question.text}
                      onChange={(e) => updateQuestion(index, 'text', e.target.value)}
                      className="input-field"
                      placeholder={`Enter question ${index + 1}...`}
                    />

                    <div className="space-y-3">
                      {question.options.map((option, optionIndex) => (
                        <div key={optionIndex} className="flex items-center space-x-3">
                          <input
                            type="radio"
                            name={`correct-${index}`}
                            checked={question.correctOption === optionIndex}
                            onChange={() => updateQuestion(index, 'correctOption', optionIndex)}
                            className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                          />
                          <input
                            type="text"
                            value={option}
                            onChange={(e) => {
                              const newOptions = [...question.options];
                              newOptions[optionIndex] = e.target.value;
                              updateQuestion(index, 'options', newOptions);
                            }}
                            className="input-field flex-1"
                            placeholder={`Option ${optionIndex + 1}`}
                          />
                          {question.correctOption === optionIndex && (
                            <span className="text-green-600 font-medium text-sm">✓ Correct</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}

              {examForm.questions.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-gray-400 text-2xl">❓</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">No Questions Yet</h3>
                  <p className="text-gray-600 mb-4">Add questions to create a complete exam.</p>
                  <button onClick={addQuestion} className="btn-primary">
                    Add First Question
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Save Actions */}
          <div className="flex justify-center pt-6">
            <div className="flex space-x-4">
              <button
                onClick={() => navigate('/teacher/exams')}
                className="btn-secondary px-8 py-3"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveExam}
                disabled={!examForm.title || examForm.questions.length === 0 || saving}
                className="btn-primary px-8 py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    <span>Saving Changes...</span>
                  </div>
                ) : (
                  'Save Exam'
                )}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TeacherEditExam;
