// Author: Tristan Bong
// Page name: AuthForm.tsx
// Page purpose: Handles user authentication form for sign-in and sign-up
// Date created: 14/09/2025

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '../supabaseClient';

interface AuthFormProps {
  mode: 'signin' | 'signup';
}

export default function AuthForm({ mode }: AuthFormProps) {
  // INPUT: User-entered first name, last name, email, and password
  const [strFirstName, setStrFirstName] = useState('');
  const [strLastName, setStrLastName] = useState('');
  const [strEmail, setStrEmail] = useState('');
  const [strPassword, setStrPassword] = useState('');
  const [strError, setStrError] = useState<string | null>(null);
  const [bLoading, setBLoading] = useState(false);

  // FUNCTION: Handles form submission for sign-in or sign-up
  const handleSubmit = async (evtEvent: React.FormEvent) => {
    evtEvent.preventDefault(); // PROCESS: Prevent default form behaviour
    setBLoading(true);         // PROCESS: Show loading state
    setStrError(null);         // PROCESS: Reset previous errors

    try {
      // PROCESS: Call Supabase API based on mode
      let authResponseInternal;
      if (mode === 'signup') {
        // INPUT: strEmail, strPassword, strFirstName, strLastName
        authResponseInternal = await supabase.auth.signUp({ 
          email: strEmail, 
          password: strPassword,
          options: {
            data: {
              first_name: strFirstName,
              last_name: strLastName,
            }
          }
        });
      } else {
        // INPUT: strEmail, strPassword
        authResponseInternal = await supabase.auth.signInWithPassword({ email: strEmail, password: strPassword });
      }

      // PROCESS: Check for errors in the Supabase response
      if (authResponseInternal.error) throw authResponseInternal.error;

      // OUTPUT: Redirect user to dashboard upon successful authentication
      window.location.href = '/dashboard';

    } catch (errInternal: any) {
      // OUTPUT: Set error message to display in UI
      setStrError(errInternal.message || 'An error occurred.');
    } finally {
      // PROCESS: Hide loading state
      setBLoading(false);
    }
  };

  // RENDER: Form UI
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
            {/* INPUT: First Name */}
            <input
              type="text"
              placeholder="First name"
              value={strFirstName}
              onChange={(e) => setStrFirstName(e.target.value)}
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
              required
            />
            {/* INPUT: Last Name */}
            <input
              type="text"
              placeholder="Last name"
              value={strLastName}
              onChange={(e) => setStrLastName(e.target.value)}
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>
        )}
        {/* INPUT: Email */}
        <input
          type="email"
          placeholder="Email"
          value={strEmail}
          onChange={(e) => setStrEmail(e.target.value)}
          className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
          required
        />
        {/* INPUT: Password */}
        <input
          type="password"
          placeholder="Password"
          value={strPassword}
          onChange={(e) => setStrPassword(e.target.value)}
          className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
          required
        />
        {/* PROCESS/OUTPUT: Submit button triggers handleSubmit */}
        <button
          type="submit"
          disabled={bLoading}
          className="w-full p-3 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-semibold transition-colors disabled:bg-gray-500"
        >
          {bLoading ? 'Processing...' : (mode === 'signin' ? 'Sign In' : 'Create account')}
        </button>
        
        {/* OUTPUT: Display errors */}
        {strError && <p className="text-red-400 text-center mt-4">{strError}</p>}
      </form>

      {/* OUTPUT: Link to toggle between sign-in and sign-up */}
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
