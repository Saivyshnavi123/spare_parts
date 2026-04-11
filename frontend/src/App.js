import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Login from './auth/Login';
import Register from './auth/Register';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';

// Redirects already-logged-in users away from public pages (login, register)
const PublicRoute = ({ children }) => {
  const role = localStorage.getItem('userRole');
  if (!role) return children;
  return <Navigate to={role === 'admin' ? '/admin-dashboard' : '/user-dashboard'} replace />;
};

// Redirects unauthenticated users to login; wrong-role users to their own dashboard
const ProtectedRoute = ({ children, requiredRole }) => {
  const role = localStorage.getItem('userRole');
  if (!role) return <Navigate to="/login" replace />;
  if (requiredRole && role !== requiredRole) {
    return <Navigate to={role === 'admin' ? '/admin-dashboard' : '/user-dashboard'} replace />;
  }
  return children;
};

function App() {
  return (
    <Router>
      <div className="App">
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="colored"
        />
        <Routes>
          <Route path="/"
            element={<Navigate to="/login" replace />}
          />
          <Route path="/login"
            element={<PublicRoute><Login /></PublicRoute>}
          />
          <Route path="/register"
            element={<PublicRoute><Register /></PublicRoute>}
          />
          <Route path="/user-dashboard"
            element={<ProtectedRoute requiredRole="customer"><UserDashboard /></ProtectedRoute>}
          />
          <Route path="/admin-dashboard"
            element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>}
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
