import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import TreePage from './pages/TreePage';
import TreeDashboard from './pages/TreeDashboard';
import PrivacyPolicy from './pages/PrivacyPolicy';
import AuthError from './pages/AuthError';
import { signInWithGoogle, signOut, getCurrentUser, restoreSession, supabase } from './auth';
import { ToastContainer } from './components/Toast';

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
          <button
            onClick={handleSignIn}
            className="w-full px-6 py-3 bg-teal-600 text-white rounded-lg shadow hover:bg-teal-700 transition font-semibold"
          >
            🌳 Sign In with Google
          </button>
        ) : (
          <div>
            <p className="text-gray-700 mb-4">Welcome back, {user.email}!</p>
            <p className="text-sm text-gray-500">Redirecting to your trees...</p>
          </div>
        )}
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <ToastContainer />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/trees" element={<TreeDashboard />} />
        <Route path="/tree/:id" element={<TreePage />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/auth-error" element={<AuthError />} />
      </Routes>
    </Router>
  );
}

export default App;
