import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import TreePage from './pages/TreePage';
import { signInWithGoogle, signOut, getCurrentUser } from './auth';

function Home() {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(true);
  const [user, setUser] = React.useState(null);

  // Check for session on mount
  React.useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    const currentUser = await getCurrentUser();
    setUser(currentUser);

    if (currentUser) {
      // Fetch user's trees
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        const response = await fetch('/api/trees', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.ok) {
          const trees = await response.json();
          if (trees.length > 0) {
            console.log("Found tree, redirecting...", trees[0].id);
            navigate(`/tree/${trees[0].id}`);
            return;
          }
        }
      } catch (err) {
        console.error("Error fetching trees:", err);
      }
    }
    setLoading(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
      <h1 className="text-4xl font-bold mb-8 text-teal-700">Roots & Branches</h1>
      <p className="mb-8 text-gray-600">Your family history, visualized.</p>

      <div className="space-y-4">
        {!user ? (
          <button
            onClick={signInWithGoogle}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
          >
            Sign in with Google
          </button>
        ) : (
          <div className="text-center">
            <p className="mb-4 text-lg">Welcome back, {user.email}!</p>
            <p className="text-gray-500">You don't have any trees yet.</p>
            {/* Future: Add "Create Tree" button here */}
          </div>
        )}
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/tree/:id" element={<TreePage />} />
      </Routes>
    </Router>
  );
}

export default App;
