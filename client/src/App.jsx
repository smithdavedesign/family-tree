import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import TreePage from './pages/TreePage';
import { signInWithGoogle, signOut, getCurrentUser, supabase } from './auth';

function Home() {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(true);
  const [user, setUser] = React.useState(null);
  const [creating, setCreating] = React.useState(false);

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

  const handleCreateTree = async () => {
    setCreating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch('/api/trees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: `${user.email?.split('@')[0]}'s Family Tree`
        })
      });

      if (response.ok) {
        const newTree = await response.json();
        navigate(`/tree/${newTree.id}`);
      } else {
        alert('Failed to create tree');
      }
    } catch (err) {
      console.error("Error creating tree:", err);
      alert('Error creating tree');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-teal-50 to-blue-50">
      <div className="text-center max-w-md">
        <h1 className="text-5xl font-bold mb-4 text-teal-700">Roots & Branches</h1>
        <p className="mb-8 text-gray-600 text-lg">Your family history, visualized.</p>

        <div className="space-y-4">
          {!user ? (
            <button
              onClick={signInWithGoogle}
              className="px-8 py-4 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 transition transform hover:scale-105 font-semibold"
            >
              Sign in with Google
            </button>
          ) : (
            <div className="bg-white rounded-lg shadow-lg p-8">
              <p className="mb-4 text-xl font-semibold text-gray-800">Welcome, {user.email?.split('@')[0]}!</p>
              <p className="text-gray-500 mb-6">You don't have any trees yet.</p>
              <button
                onClick={handleCreateTree}
                disabled={creating}
                className="w-full px-6 py-3 bg-teal-600 text-white rounded-lg shadow hover:bg-teal-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? 'Creating...' : '🌳 Create Your First Family Tree'}
              </button>
            </div>
          )}
        </div>
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
