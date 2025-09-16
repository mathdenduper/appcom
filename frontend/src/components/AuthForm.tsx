'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '../supabaseClient'; // We still use our client

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
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // This is the new, professional PKCE flow.
    // We send the user to Supabase, and Supabase sends them back
    // to our /auth/callback route.
    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          },
          // Supabase will now use the /auth/callback route we created
        }
      });
      if (error) {
        setError(error.message);
        setLoading(false);
      } else {
        setSuccessMessage("Success! Please check your email to confirm your account.");
        setLoading(false);
      }
    } else {
      // The sign-in flow is also updated.
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
        setLoading(false);
      }
      // On success, Supabase's helpers will automatically handle the session
      // and the redirect will be managed by our callback route.
    }
  };

  if (successMessage) {
    return (
        <div className="bg-gray-900 border border-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-md text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Check Your Inbox!</h2>
            <p className="text-gray-300">{successMessage}</p>
            <Link href="/" className="text-purple-400 hover:underline mt-6 inline-block">
                Back to Home
            </Link>
        </div>
    );
  }

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
            <input type="text" placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500" required />
            <input type="text" placeholder="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500" required />
          </div>
        )}
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500" required />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500" required />
        <button type="submit" disabled={loading} className="w-full p-3 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-semibold transition-colors disabled:bg-gray-500">
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