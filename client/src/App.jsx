import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import TeacherDashboard from './components/TeacherDashboard';
import StudentDashboard from './components/StudentDashboard';
import AdminDashboard from './components/AdminDashboard';
import ErrorBoundary from './components/ErrorBoundary';
import ToastContainer from './components/ToastContainer';
import Layout from './components/Layout';
import { initializeSocket } from './utils/socket';

// Student Pages
import StudentAvailableExams from './components/student/StudentAvailableExams';
import StudentJoinExam from './components/student/StudentJoinExam';
import StudentExamInterface from './components/student/StudentExamInterface';
import StudentViewMarks from './components/student/StudentViewMarks';
// Removed StudentAnalytics per requirements

// Teacher Pages
import TeacherCreateExam from './components/teacher/TeacherCreateExam';
import TeacherEditExam from './components/teacher/TeacherEditExam';
import TeacherExamManagement from './components/teacher/TeacherExamManagement';
import TeacherLiveMonitor from './components/teacher/TeacherLiveMonitor';
import TeacherResults from './components/teacher/TeacherResults';
import TeacherGradeManagement from './components/teacher/TeacherGradeManagement';
// Removed TeacherAnalytics per requirements
import TeacherManageStudents from './components/teacher/TeacherManageStudents';

// Admin Pages
// Removed Overview/Monitoring/Controls per requirements
// import AdminSystemOverview from './components/admin/AdminSystemOverview';
// import AdminLiveMonitoring from './components/admin/AdminLiveMonitoring';
// import AdminSystemControls from './components/admin/AdminSystemControls';
import AdminSystemLogs from './components/admin/AdminSystemLogs';

function App() {
  const [user, setUser] = useState(null);
  const [socket, setSocket] = useState(null);
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    // Check for existing user session
    const savedUser = localStorage.getItem('examUser');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        
        // Initialize socket connection
        const socketInstance = initializeSocket();
        socketInstance.emit('join-role', userData.role);
        setSocket(socketInstance);
      } catch (error) {
        console.error('Failed to restore user session:', error);
        localStorage.removeItem('examUser');
      }
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('examUser', JSON.stringify(userData));
    
    // Initialize socket connection
    const socketInstance = initializeSocket();
    socketInstance.emit('join-role', userData.role);
    setSocket(socketInstance);
  };

  const handleLogout = () => {
    if (socket) {
      socket.disconnect();
    }
    setUser(null);
    setSocket(null);
    localStorage.removeItem('examUser');
    addToast('Logged out successfully', 'info');
  };

  const addToast = (message, type = 'info', duration = 5000) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type, duration }]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const ProtectedRoute = ({ children, allowedRoles }) => {
  if (!user) {
      return <Navigate to="/login" replace />;
    }
    
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      return <Navigate to="/login" replace />;
    }
    
    return (
      <Layout user={user} onLogout={handleLogout}>
        {children}
      </Layout>
    );
  };

  return (
    <ErrorBoundary>
      <Router>
    <div className="min-h-screen bg-slate-900">
          <ToastContainer toasts={toasts} removeToast={removeToast} />
          
          <Routes>
            {/* Login Route */}
            <Route 
              path="/login" 
              element={
                user ? (
                  <Navigate to={`/${user.role.toLowerCase()}`} replace />
                ) : (
                  <Login onLogin={handleLogin} />
                )
              } 
            />
            
            {/* Student Routes */}
            <Route 
              path="/student" 
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentDashboard user={user} socket={socket} onLogout={handleLogout} addToast={addToast} />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/student/exams" 
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentAvailableExams user={user} socket={socket} onLogout={handleLogout} addToast={addToast} />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/student/join/:examId" 
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentJoinExam user={user} socket={socket} onLogout={handleLogout} addToast={addToast} />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/student/exam/:examId" 
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentExamInterface user={user} socket={socket} onLogout={handleLogout} addToast={addToast} />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/student/marks" 
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentViewMarks user={user} socket={socket} onLogout={handleLogout} addToast={addToast} />
                </ProtectedRoute>
              } 
            />
            {/* Student has only exams and results */}
            
            {/* Teacher Routes */}
            <Route 
              path="/teacher" 
              element={
                <ProtectedRoute allowedRoles={['teacher']}>
                  <TeacherDashboard user={user} socket={socket} onLogout={handleLogout} addToast={addToast} />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/teacher/create" 
              element={
                <ProtectedRoute allowedRoles={['teacher']}>
                  <TeacherCreateExam user={user} socket={socket} onLogout={handleLogout} addToast={addToast} />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/teacher/exams" 
              element={
                <ProtectedRoute allowedRoles={['teacher']}>
                  <TeacherExamManagement user={user} socket={socket} onLogout={handleLogout} addToast={addToast} />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/teacher/edit/:examId" 
              element={
                <ProtectedRoute allowedRoles={['teacher']}>
                  <TeacherEditExam user={user} socket={socket} onLogout={handleLogout} addToast={addToast} />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/teacher/monitor/:examId" 
              element={
                <ProtectedRoute allowedRoles={['teacher']}>
                  <TeacherLiveMonitor user={user} socket={socket} onLogout={handleLogout} addToast={addToast} />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/teacher/results" 
              element={
                <ProtectedRoute allowedRoles={['teacher']}>
                  <TeacherResults user={user} socket={socket} onLogout={handleLogout} addToast={addToast} />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/teacher/grades" 
              element={
                <ProtectedRoute allowedRoles={['teacher']}>
                  <TeacherGradeManagement user={user} socket={socket} onLogout={handleLogout} addToast={addToast} />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/teacher/manage-students" 
              element={
                <ProtectedRoute allowedRoles={['teacher']}>
                  <TeacherManageStudents user={user} socket={socket} onLogout={handleLogout} addToast={addToast} />
                </ProtectedRoute>
              } 
            />
            
            {/* Admin Routes */}
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard user={user} socket={socket} onLogout={handleLogout} addToast={addToast} />
                </ProtectedRoute>
              } 
            />
            {/* Admin restricted to dashboard and logs */}
            <Route 
              path="/admin/logs" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminSystemLogs user={user} socket={socket} onLogout={handleLogout} addToast={addToast} />
                </ProtectedRoute>
              } 
            />
            
            {/* Default Route */}
            <Route 
              path="/" 
              element={
                user ? (
                  <Navigate to={`/${user.role.toLowerCase()}`} replace />
                ) : (
                  <Navigate to="/login" replace />
                )
              } 
            />
            
            {/* Catch all route */}
            <Route 
              path="*" 
              element={
                <Navigate to={user ? `/${user.role.toLowerCase()}` : "/login"} replace />
              } 
            />
          </Routes>
    </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
