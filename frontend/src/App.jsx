import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import InterviewSetupPage from './pages/InterviewSetupPage';
import InterviewPage from './pages/InterviewPage';
import ResultsPage from './pages/ResultsPage';
import ResumeAnalyzerPage from './pages/ResumeAnalyzerPage';
import DashboardPage from './pages/DashboardPage';

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <div className="min-h-screen flex flex-col">
                    <Navbar />
                    <main className="flex-1">
                        <Routes>
                            {/* Public */}
                            <Route path="/" element={<LandingPage />} />
                            <Route path="/login" element={<LoginPage />} />
                            <Route path="/signup" element={<SignupPage />} />

                            {/* Protected */}
                            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                            <Route path="/interview/setup" element={<ProtectedRoute><InterviewSetupPage /></ProtectedRoute>} />
                            <Route path="/interview/live" element={<ProtectedRoute><InterviewPage /></ProtectedRoute>} />
                            <Route path="/interview/results/:id" element={<ProtectedRoute><ResultsPage /></ProtectedRoute>} />
                            <Route path="/resume" element={<ProtectedRoute><ResumeAnalyzerPage /></ProtectedRoute>} />

                            {/* Fallback */}
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </main>
                </div>
                <Toaster
                    position="top-right"
                    toastOptions={{
                        style: { background: '#1e293b', color: '#f1f5f9', border: '1px solid #334155' },
                        success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
                        error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
                    }}
                />
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
