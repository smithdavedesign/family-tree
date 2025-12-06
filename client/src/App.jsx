import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { signInWithGoogle, signOut, getCurrentUser, restoreSession, supabase } from './auth';
import { ToastContainer } from './components/Toast';
import { ToastProvider } from './components/ui';

// Lazy load page components for code splitting
const TreePage = lazy(() => import('./pages/TreePage'));
const TreeDashboard = lazy(() => import('./pages/TreeDashboard'));
const TimelinePage = lazy(() => import('./pages/TimelinePage'));
const TreeGalleryPage = lazy(() => import('./pages/TreeGalleryPage'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const AuthError = lazy(() => import('./pages/AuthError'));
const PhotoPickerTest = lazy(() => import('./pages/PhotoPickerTest'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const MagicLinkAuth = lazy(() => import('./pages/MagicLinkAuth'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const InviteAcceptPage = lazy(() => import('./pages/InviteAcceptPage'));
const AccountSettings = lazy(() => import('./pages/AccountSettings'));
const Register = lazy(() => import('./pages/Register'));
const Login = lazy(() => import('./pages/Login'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const EmailConfirm = lazy(() => import('./pages/EmailConfirm'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));

// Loading component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
);

supabase.auth.onAuthStateChange((event, session) => {
  if (session) {
    console.log("Token scopes:", session.provider_token);
  }
});

function Home() {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(true);
  const [user, setUser] = React.useState(null);
  // The 'creating' state is removed as per the instruction's implied change for handleCreateTree's new location/logic.

  // Check for session on mount
  React.useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    // Try to restore existing session
    const session = await restoreSession();

    if (session && session.user) {
      setUser(session.user);

      // Redirect to tree dashboard instead of first tree
      navigate('/trees');
      return;
    } else {
      // No session, check if user just logged in
      const currentUser = await getCurrentUser();
      setUser(currentUser);

      if (currentUser) {
        navigate('/trees');
        return;
      }
    }

    setLoading(false);
  };

  const handleSignIn = async () => {
    await signInWithGoogle();
  };

  if (loading) {
    return <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 flex items-center justify-center">
      <div>Loading...</div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
        <h1 className="text-4xl font-bold text-teal-800 mb-2">Roots & Branches</h1>
        <p className="text-gray-600 mb-8">Discover and preserve your family history</p>

        {!user ? (
          <div className="space-y-3">
            <button
              onClick={handleSignIn}
              className="w-full px-6 py-3 bg-teal-600 text-white rounded-lg shadow hover:bg-teal-700 transition font-semibold"
            >
              🌳 Sign In with Google
            </button>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or</span>
              </div>
            </div>
            <Link
              to="/magic-link"
              className="block w-full px-6 py-3 bg-white text-teal-600 border-2 border-teal-600 rounded-lg hover:bg-teal-50 transition font-semibold text-center"
            >
              📧 Sign In with Email
            </Link>
          </div>
        ) : (
          <div>
            <p className="text-gray-700 mb-4">Welcome back, {user.email}!</p>
            <p className="text-sm text-gray-500">Redirecting to your trees...</p>
          </div>
        )}
        <div className="mt-8 pt-6 border-t border-gray-100 flex justify-center gap-6 text-sm text-gray-500">
          <Link to="/privacy" className="hover:text-teal-600 transition-colors">Privacy Policy</Link>
          <Link to="/terms" className="hover:text-teal-600 transition-colors">Terms of Service</Link>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <ToastProvider>
      <Router>
        <ToastContainer />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/trees" element={<TreeDashboard />} />
            <Route path="/tree/:id" element={<TreePage />} />
            <Route path="/tree/:id/timeline" element={<TimelinePage />} />
            <Route path="/tree/:id/gallery" element={<TreeGalleryPage />} />
            <Route path="/invite/:token" element={<InviteAcceptPage />} />
            <Route path="/magic-link" element={<MagicLinkAuth />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/auth/confirm" element={<EmailConfirm />} />
            <Route path="/auth/verify-email" element={<VerifyEmail />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/auth-error" element={<AuthError />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/settings" element={<AccountSettings />} />
            <Route path="/photo-picker-test" element={<PhotoPickerTest />} />
          </Routes>
        </Suspense>
      </Router>
    </ToastProvider>
  );
}

export default App;
