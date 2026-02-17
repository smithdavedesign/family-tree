import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom';
import { signInWithGoogle, signOut, getCurrentUser, restoreSession, supabase } from './auth';
import { ToastContainer } from './components/Toast';
import { ToastProvider } from './components/ui';
import { SearchProvider } from './context/SearchContext';

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
const StoryPage = lazy(() => import('./pages/StoryPage'));
const PersonPage = lazy(() => import('./pages/PersonPage'));
const AlbumPage = lazy(() => import('./pages/AlbumPage'));
const TreeMapPage = lazy(() => import('./pages/TreeMapPage'));
const TreeStoriesPage = lazy(() => import('./pages/TreeStoriesPage'));
const PricingPage = lazy(() => import('./pages/PricingPage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));

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

// Auth wrapper components
const ProtectedRoute = ({ children }) => {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const checkAuth = async () => {
      const session = await restoreSession();
      if (session) {
        setUser(session.user);
      } else {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;

  return children;
};

const PublicRoute = ({ children }) => {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const navigate = useNavigate();

  React.useEffect(() => {
    const checkAuth = async () => {
      const session = await restoreSession();
      if (session || await getCurrentUser()) {
        navigate('/');
      }
      setLoading(false);
    };
    checkAuth();
  }, [navigate]);

  if (loading) return <PageLoader />;
  return children;
};

function App() {
  return (
    <ToastProvider>
      <Router>
        <ToastContainer />
        <SearchProvider>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Protected Routes */}
              <Route path="/" element={<ProtectedRoute><TreeDashboard /></ProtectedRoute>} />
              <Route path="/trees" element={<ProtectedRoute><TreeDashboard /></ProtectedRoute>} />
              <Route path="/tree/:id" element={<ProtectedRoute><TreePage /></ProtectedRoute>} />
              <Route path="/tree/:id/timeline" element={<ProtectedRoute><TimelinePage /></ProtectedRoute>} />
              <Route path="/tree/:id/gallery" element={<ProtectedRoute><TreeGalleryPage /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><AccountSettings /></ProtectedRoute>} />
              <Route path="/tree/:treeId/person/:personId" element={<ProtectedRoute><PersonPage /></ProtectedRoute>} />
              <Route path="/tree/:treeId/albums" element={<ProtectedRoute><AlbumPage /></ProtectedRoute>} />
              <Route path="/tree/:treeId/album/:albumId" element={<ProtectedRoute><AlbumPage /></ProtectedRoute>} />
              <Route path="/tree/:treeId/map" element={<ProtectedRoute><TreeMapPage /></ProtectedRoute>} />
              <Route path="/tree/:treeId/stories" element={<ProtectedRoute><TreeStoriesPage /></ProtectedRoute>} />
              <Route path="/story/:id" element={<ProtectedRoute><StoryPage /></ProtectedRoute>} />
              <Route path="/search" element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />

              {/* Public/Auth Routes */}
              <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
              <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
              <Route path="/magic-link" element={<MagicLinkAuth />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/auth/confirm" element={<EmailConfirm />} />
              <Route path="/auth/verify-email" element={<VerifyEmail />} />
              <Route path="/invite/:token" element={<InviteAcceptPage />} />

              {/* Utilities & Legal */}
              <Route path="/auth-error" element={<AuthError />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/photo-picker-test" element={<PhotoPickerTest />} />
            </Routes>
          </Suspense>
        </SearchProvider>
      </Router>
    </ToastProvider>
  );
}

export default App;
