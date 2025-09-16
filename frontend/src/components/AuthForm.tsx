'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '../supabaseClient';

interface AuthFormProps {
  mode: 'signin' | 'signup';
}

export default function AuthForm({ mode }: AuthFormProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let authResponse;
      if (mode === 'signup') {
        // --- THIS IS THE CORRECTED PART ---
        // We sign up the user. Because email confirmation is off in Supabase,
        // this action will also automatically log them in.
        authResponse = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: {
              first_name: firstName,
              last_name: lastName,
            }
          }
        });
      } else {
        // The login process remains the same.
        authResponse = await supabase.auth.signInWithPassword({ email, password });
      }

      // Check for any errors from Supabase
      if (authResponse.error) throw authResponse.error;

      // After a successful signup OR signin, we now redirect immediately.
      window.location.href = '/dashboard';

    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-md">
      <h2 className="text-3xl font-bold text-white text-center mb-2">
        {mode === 'signin' ? 'Welcome Back' : 'Create an Account'}
      </h2>
      <p className="text-gray-400 text-center mb-8">
        {mode === 'signin' ? 'Sign in to continue.' : 'Get started in seconds.'}
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {mode === 'signup' && (
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="First name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
              required
            />
            <input
              type="text"
              placeholder="Last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>
        )}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full p-3 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-semibold transition-colors disabled:bg-gray-500"
        >
          {loading ? 'Processing...' : (mode === 'signin' ? 'Sign In' : 'Create account')}
        </button>
        
        {error && <p className="text-red-400 text-center mt-4">{error}</p>}
      </form>

      <div className="text-center mt-6">
        <p className="text-gray-400">
          {mode === 'signin' ? "Don't have an account? " : "Already have an account? "}
          <Link href={mode === 'signin' ? '/signup' : '/login'} className="text-purple-400 hover:underline">
            {mode === 'signin' ? 'Sign up' : 'Sign in'}
          </Link>
        </p>
      </div>
    </div>
  );
}