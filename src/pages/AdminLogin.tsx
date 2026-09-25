import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabaseClient } from '../supabaseClient'; // Ensure path is correct

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      // On success, redirect to the protected dashboard
      navigate('/admin');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <form onSubmit={handleLogin} className="p-8 bg-gray-800 rounded shadow-md w-96">
        <h2 className="mb-6 text-2xl font-bold text-white">Admin Login</h2>
        
        {error && <div className="p-3 mb-4 text-red-200 bg-red-800 rounded">{error}</div>}

        <div className="mb-4">
          <label className="block mb-2 text-gray-300">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 text-white bg-gray-700 rounded focus:outline-none"
            required
          />
        </div>

        <div className="mb-6">
          <label className="block mb-2 text-gray-300">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 text-white bg-gray-700 rounded focus:outline-none"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full p-2 text-white bg-orange-500 rounded hover:bg-orange-600 disabled:opacity-50"
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
}