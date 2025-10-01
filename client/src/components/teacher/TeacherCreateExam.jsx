import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createExam, downloadExamCsvTemplate, importExamCsv } from '../../utils/api';

const TeacherCreateExam = ({ user, socket, onLogout, addToast }) => {
  const navigate = useNavigate();
  const [examForm, setExamForm] = useState(() => {
    try {
      const cached = localStorage.getItem('teacher_create_exam_draft');
      if (cached) return JSON.parse(cached);
    } catch {}
    return { title: '', description: '', duration: 30, questions: [] };
  });
  const [isCreating, setIsCreating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [downloadingTpl, setDownloadingTpl] = useState(false);
  const fileInputRefTop = React.useRef(null);
  const fileInputRefSave = React.useRef(null);

  // Persist draft to avoid accidental loss after imports or reloads
  useEffect(() => {
    try {
      localStorage.setItem('teacher_create_exam_draft', JSON.stringify(examForm));
    } catch {}
  }, [examForm]);

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

  const handleCreateExam = async () => {
    if (!examForm.title.trim()) {
      addToast('Please enter an exam title', 'error');
      return;
    }

    if (examForm.questions.length === 0) {
      addToast('Please add at least one question', 'error');
      return;
    }

    // Validate all questions
    for (let i = 0; i < examForm.questions.length; i++) {
      const question = examForm.questions[i];
      if (!question.text.trim()) {
        addToast(`Please enter text for question ${i + 1}`, 'error');
        return;
      }
      
      const hasValidOptions = question.options.some(option => option.trim() !== '');
      if (!hasValidOptions) {
        addToast(`Please add at least one option for question ${i + 1}`, 'error');
        return;
      }
    }

    setIsCreating(true);
    try {
      const response = await createExam({
        ...examForm,
        createdBy: user.userId
      });
      
      if (response.data.success) {
        addToast('Exam created successfully!', 'success');
        try { localStorage.removeItem('teacher_create_exam_draft'); } catch {}
        navigate('/teacher');
      }
    } catch (error) {
      console.error('Failed to create exam:', error);
      addToast('Failed to create exam: ' + (error.response?.data?.error || error.message), 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const parseCsvQuestions = (text) => {
    // Robust CSV parser with BOM/header normalization similar to server
    const stripBOM = (s) => s.replace(/^\uFEFF/, '');
    const normalizeKey = (k) => stripBOM(String(k || '')).trim().toLowerCase();

    const parseLine = (line) => {
      const cells = [];
      let cur = '';
      let inQ = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
          if (inQ && line[i + 1] === '"') { cur += '"'; i++; continue; }
          inQ = !inQ; continue;
        }
        if (ch === ',' && !inQ) { cells.push(cur); cur = ''; continue; }
        cur += ch;
      }
      cells.push(cur);
      return cells;
    };

    const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length <= 1) return [];

    const rawHeaderCells = parseLine(lines[0]).map(normalizeKey);
    const pick = (...keys) => {
      const want = keys.map(k => normalizeKey(k));
      for (const w of want) {
        const idx = rawHeaderCells.findIndex(h => h === w);
        if (idx !== -1) return idx;
      }
      return -1;
    };
    const idx = {
      q: pick('question','ques','questiontext','q'),
      a: pick('optionsa','optiona','opt a','a'),
      b: pick('optionsb','optionb','opt b','b'),
      c: pick('optionsc','optionc','opt c','c'),
      d: pick('optionsd','optiond','opt d','d'),
      ans: pick('correctansweroption','answer','correct','ans')
    };

    const rows = lines.slice(1).map((line) => {
      const cells = parseLine(line);
      const val = (i) => (i >= 0 && i < cells.length) ? stripBOM(String(cells[i] || '').trim()) : '';
      const opts = [val(idx.a), val(idx.b), val(idx.c), val(idx.d)];
      const ansChar = normalizeKey(val(idx.ans) || 'a');
      const ansIndex = { a:0, b:1, c:2, d:3 }[ansChar] ?? 0;
      return {
        text: val(idx.q),
        options: opts,
        correctOption: ansIndex
      };
    }).filter(q => q.text && Array.isArray(q.options) && q.options.some(o => o && o.length));

    return rows;
  };

  const handleImportCsv = async (file) => {
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      const questions = parseCsvQuestions(text);
      if (questions.length === 0) {
        addToast('No valid questions found in CSV', 'warning');
        return;
      }
      setExamForm(prev => ({ ...prev, questions: [...prev.questions, ...questions] }));
      addToast(`Imported ${questions.length} questions`, 'success');
    } catch (e) {
      addToast('Failed to parse CSV', 'error');
    } finally {
      setImporting(false);
    }
  };

  const handleImportCsvToDb = async (file) => {
    if (!file) return;
    setImporting(true);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('title', examForm.title || 'Imported Exam');
      form.append('duration', String(examForm.duration || 30));
      form.append('createdBy', user.userId);
      const res = await importExamCsv(form);
      if (res.data?.success) {
        const ex = res.data.exam;
        setExamForm(prev => ({ ...prev, title: ex.title, duration: ex.duration, questions: ex.questions || [] }));
        addToast(`Imported ${ex.questions?.length || 0} questions and saved to DB`, 'success');
      } else {
        addToast(res.data?.error || 'Import failed', 'error');
      }
    } catch (e) {
      addToast('Import to DB failed', 'error');
    } finally {
      setImporting(false);
      if (fileInputRefSave.current) fileInputRefSave.current.value = '';
    }
  };

  const handleDownloadTemplate = async () => {
    setDownloadingTpl(true);
    try {
      const res = await downloadExamCsvTemplate();
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sample_questions.csv';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      addToast('Failed to download template', 'error');
    } finally {
      setDownloadingTpl(false);
    }
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Create New Exam</h1>
                <p className="text-sm text-slate-400">Welcome, {user.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button onClick={() => navigate('/teacher')} className="bg-slate-700 text-slate-200 px-4 py-2 rounded-xl hover:bg-slate-600 transition-all duration-300 border border-slate-600">
                Back to Dashboard
              </button>
              <button onClick={onLogout} className="bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-700 transition-all duration-300">
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="modern-card animate-slide-up">
          <div className="p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white">Create New Exam</h2>
            </div>
            
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Exam Title *
                  </label>
                  <input
                    type="text"
                    value={examForm.title}
                    onChange={(e) => setExamForm({ ...examForm, title: e.target.value })}
                    className="input-field"
                    placeholder="Enter exam title"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Duration (minutes) *
                  </label>
                  <input
                    type="number"
                    value={examForm.duration}
                    onChange={(e) => setExamForm({ ...examForm, duration: parseInt(e.target.value) || 30 })}
                    className="input-field"
                    min="1"
                    max="180"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Description
                </label>
                <textarea
                  value={examForm.description}
                  onChange={(e) => setExamForm({ ...examForm, description: e.target.value })}
                  className="input-field"
                  rows="3"
                  placeholder="Enter exam description (optional)"
                />
              </div>

              {/* Questions Section */}
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-800">Questions ({examForm.questions.length})</h3>
                  <div className="flex items-center space-x-3">
                    <button onClick={handleDownloadTemplate} className="btn-secondary" disabled={downloadingTpl}>
                      {downloadingTpl ? 'Downloading...' : 'Download CSV Template'}
                    </button>
                    <label className="btn-secondary cursor-pointer">
                      <input ref={fileInputRefTop} type="file" accept=".csv" className="hidden" onChange={(e)=>handleImportCsv(e.target.files[0])} />
                      {importing ? 'Importing...' : 'Import CSV'}
                    </label>
                    <label className="btn-secondary cursor-pointer">
                      <input ref={fileInputRefSave} type="file" accept=".csv" className="hidden" onChange={(e)=>handleImportCsvToDb(e.target.files[0])} />
                      {importing ? 'Importing...' : 'Import & Save to DB'}
                    </label>
                    <button 
                      onClick={addQuestion} 
                      className="btn-primary flex items-center space-x-2"
                    >
                      <span>+</span>
                      <span>Add Question</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-6">
                  {examForm.questions.map((question, index) => (
                    <div key={index} className="bg-gradient-to-r from-gray-50 to-blue-50 p-6 rounded-xl border border-gray-200">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-semibold text-gray-800">Question {index + 1}</h4>
                        <button
                          onClick={() => removeQuestion(index)}
                          className="text-red-500 hover:text-red-700 p-1 transition-colors duration-200"
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
                          required
                        />

                        <div className="space-y-3">
                          <label className="block text-sm font-medium text-gray-700">Options</label>
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
                                <span className="text-green-600 font-medium text-sm flex items-center">
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  Correct
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {examForm.questions.length === 0 && (
                  <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-gray-400 text-2xl">❓</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">No Questions Added</h3>
                    <p className="text-gray-500 mb-4">Add questions to create your exam</p>
                    <div className="flex items-center justify-center space-x-3">
                      <button onClick={addQuestion} className="btn-primary">Add First Question</button>
                      <label className="btn-secondary cursor-pointer">
                        <input type="file" accept=".csv" className="hidden" onChange={(e)=>handleImportCsv(e.target.files[0])} />
                        {importing ? 'Importing...' : 'Import CSV'}
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-center pt-6 border-t border-gray-200">
                <button
                  onClick={handleCreateExam}
                  disabled={!examForm.title || examForm.questions.length === 0 || isCreating}
                  className="btn-primary px-8 py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      <span>Creating Exam...</span>
                    </div>
                  ) : (
                    'Create Exam'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Exam Preview */}
        {examForm.questions.length > 0 && (
          <div className="mt-8 modern-card">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <span className="w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mr-3">
                  <span className="text-white text-sm">👁️</span>
                </span>
                Exam Preview
              </h3>
              
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200 mb-4">
                <h4 className="text-xl font-bold text-gray-900 mb-2">{examForm.title || 'Untitled Exam'}</h4>
                {examForm.description && (
                  <p className="text-gray-600 mb-3">{examForm.description}</p>
                )}
                <div className="flex space-x-4 text-sm text-gray-600">
                  <span>Duration: {examForm.duration} minutes</span>
                  <span>Questions: {examForm.questions.length}</span>
                </div>
              </div>

              <div className="space-y-4">
                {examForm.questions.slice(0, 3).map((question, index) => (
                  <div key={index} className="p-4 bg-white rounded-lg border border-gray-200">
                    <h5 className="font-medium text-gray-900 mb-2">
                      Q{index + 1}: {question.text || 'Question text...'}
                    </h5>
                    <div className="space-y-2">
                      {question.options.map((option, optionIndex) => (
                        <div key={optionIndex} className="flex items-center space-x-2 text-sm">
                          <span className={`w-4 h-4 rounded-full border-2 ${
                            question.correctOption === optionIndex 
                              ? 'bg-green-500 border-green-500' 
                              : 'border-gray-300'
                          }`}></span>
                          <span className={question.correctOption === optionIndex ? 'text-green-700 font-medium' : 'text-gray-600'}>
                            {option || `Option ${optionIndex + 1}...`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                
                {examForm.questions.length > 3 && (
                  <div className="text-center text-gray-500 text-sm">
                    ... and {examForm.questions.length - 3} more questions
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default TeacherCreateExam;
