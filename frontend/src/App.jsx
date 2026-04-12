import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import EmployeeDashboard from './pages/EmployeeDashboard';
import SubmitRequest from './pages/SubmitRequest';
import MyRequests from './pages/MyRequests';
import ManagerDashboard from './pages/ManagerDashboard';
import ManagerRequests from './pages/ManagerRequests';
import NotFound from './pages/NotFound';

// Guards
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: '#1e2536',
            color: '#fff',
            border: '1px solid #2e3a52',
            borderRadius: '12px',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />

      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Employee routes */}
        <Route element={<ProtectedRoute roles={['employee']} />}>
          <Route path="/dashboard" element={<EmployeeDashboard />} />
          <Route path="/submit" element={<SubmitRequest />} />
          <Route path="/submit/:id" element={<SubmitRequest />} />
          <Route path="/my-requests" element={<MyRequests />} />
        </Route>

        {/* Manager routes */}
        <Route element={<ProtectedRoute roles={['manager']} />}>
          <Route path="/manager" element={<ManagerDashboard />} />
          <Route path="/manager/requests" element={<ManagerRequests />} />
        </Route>

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
