import React, { useEffect, useState, useRef } from 'react';
import { getStudentsForTeacher, addStudent, removeStudent, importStudentsCsv, clearAllStudents } from '../../utils/api';

const TeacherManageStudents = ({ user, addToast }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [uploading, setUploading] = useState(false);
  const [createAccounts, setCreateAccounts] = useState(true);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadStudents();
  }, [user.userId]);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const res = await getStudentsForTeacher(user.userId);
      setStudents(res.data.students || []);
    } catch (e) {
      addToast('Failed to load students', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!name || !rollNo) return addToast('Name and Roll No required', 'warning');
    try {
      await addStudent({ teacherId: user.userId, name, rollNo });
      setName('');
      setRollNo('');
      addToast('Student added', 'success');
      loadStudents();
    } catch (e) {
      addToast('Failed to add student', 'error');
    }
  };

  const handleRemove = async (studentId) => {
    try {
      await removeStudent(studentId);
      addToast('Removed student', 'info');
      setStudents(prev => prev.filter(s => s._id !== studentId));
    } catch (e) {
      addToast('Failed to remove student', 'error');
    }
  };

  const handleImport = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('teacherId', user.userId);
      if (createAccounts) form.append('createAccounts', 'true');
      const res = await importStudentsCsv(form);
      addToast('Imported students from CSV', 'success');
      // Use returned list if present, else reload
      if (res?.data?.students) {
        setStudents(res.data.students);
      } else {
        loadStudents();
      }
    } catch (e) {
      addToast('CSV import failed', 'error');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Remove all students?')) return;
    try {
      await clearAllStudents(user.userId);
      addToast('Cleared all students', 'success');
      setStudents([]);
    } catch (e) {
      addToast('Failed to clear students', 'error');
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Manage Students</h2>
        <p className="text-gray-600">Add, remove, or bulk import students for your exams.</p>
      </div>

      {/* Add student */}
      <form onSubmit={handleAdd} className="modern-card p-6 mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <input className="input-field" placeholder="Student name" value={name} onChange={e=>setName(e.target.value)} />
        <input className="input-field" placeholder="Roll number" value={rollNo} onChange={e=>setRollNo(e.target.value)} />
        <button type="submit" className="btn-primary">Add Student</button>
        <button type="button" onClick={handleClearAll} className="btn-secondary">Clear All</button>
      </form>

      {/* CSV import */}
      <div className="modern-card p-6 mb-6 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">Import from CSV</h3>
          <p className="text-sm text-gray-600">CSV with columns: name, rollNo</p>
        </div>
        <div className="flex items-center space-x-3">
          <label className="flex items-center space-x-2 text-sm text-gray-700">
            <input type="checkbox" checked={createAccounts} onChange={e=>setCreateAccounts(e.target.checked)} />
            <span>Create login accounts (email: rollNo@examproctor.com, password: student123)</span>
          </label>
          <input ref={fileInputRef} type="file" accept=".csv" onChange={e=>handleImport(e.target.files[0])} />
          <button disabled={uploading} className="btn-secondary disabled:opacity-50">{uploading?'Uploading...':'Upload'}</button>
        </div>
      </div>

      {/* Students table */}
      <div className="modern-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Registered Students</h3>
          <span className="text-sm text-gray-600">{students.length} total</span>
        </div>
        {loading ? (
          <div className="text-center text-gray-600">Loading...</div>
        ) : students.length === 0 ? (
          <div className="text-center text-gray-600">No students yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600">
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Roll No</th>
                  <th className="py-2 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map(s => (
                  <tr key={s._id} className="border-t">
                    <td className="py-2 pr-4">{s.name}</td>
                    <td className="py-2 pr-4">{s.rollNo}</td>
                    <td className="py-2 pr-4">
                      <button onClick={()=>handleRemove(s._id)} className="text-red-600 hover:underline">Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherManageStudents;


