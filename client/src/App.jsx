import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import TreePage from './pages/TreePage';
import { signInWithGoogle, signOut, getCurrentUser } from './auth';

function Home() {
  const navigate = useNavigate();

  // Check for session on mount to handle redirect back from Google
  React.useEffect(() => {
    getCurrentUser().then(user => {
      if (user) {
        // In a real app, we'd fetch the user's tree ID. 
        // For now, we'll assume they have one or redirect to a dashboard.
        // Let's redirect to the "Skywalker" tree we seeded if we can, 
        // or just a default route.
        // For this demo, we'll just log it.
        console.log("User is logged in:", user);
      }
    });
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
      <h1 className="text-4xl font-bold mb-8 text-teal-700">Roots & Branches</h1>
      <p className="mb-8 text-gray-600">Your family history, visualized.</p>

      <div className="space-y-4">
        <button
          onClick={signInWithGoogle}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
        >
          Sign in with Google
        </button>

        {/* Temporary link for testing since we don't have a tree list page yet */}
        <div className="mt-8 p-4 border rounded bg-white">
          <p className="text-sm text-gray-500 mb-2">Dev Links:</p>
          <Link to="/tree/tree-123" className="text-teal-600 hover:underline">
            View Demo Tree (ID: tree-123)
          </Link>
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
