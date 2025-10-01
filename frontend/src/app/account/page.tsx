// frontend/src/app/account/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabaseClient';
import type { User } from '@supabase/supabase-js';
import { getApiUrl } from '@/lib';

export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [nameMessage, setNameMessage] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [isNameUpdating, setIsNameUpdating] = useState(false);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isPasswordUpdating, setIsPasswordUpdating] = useState(false);


  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        setFirstName(session.user.user_metadata?.first_name || '');
        setLastName(session.user.user_metadata?.last_name || '');
      } else {
        router.push('/login');
      }
      setLoading(false);
    };
    checkUser();
  }, [router]);

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsNameUpdating(true);
    setNameMessage(null);
    setNameError(null);

    try {
      const apiUrl = getApiUrl('/update-profile');
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, first_name: firstName, last_name: lastName }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.detail || 'Failed to update profile.');
      
      setNameMessage('Success! Your name has been updated.');
      
      // --- THIS IS THE NEW LOGIC ---
      // 1. Force Supabase to refresh the session with the latest user data from the database.
      await supabase.auth.refreshSession();

      // 2. After a short delay to show the success message, redirect to the dashboard.
      // The dashboard will now re-load with the fresh, updated session data.
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500); // 1.5-second delay

    } catch (err: any) {
      setNameError(err.message);
    } finally {
      setIsNameUpdating(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters long.');
      return;
    }

    setIsPasswordUpdating(true);
    setPasswordMessage(null);
    setPasswordError(null);

    try {
      const { error } = await supabase.auth.updateUser({ password: password });
      if (error) throw error;
      setPasswordMessage('Your password has been updated successfully!');
      setPassword('');
      setConfirmPassword('');
    } catch(err: any) {
      setPasswordError(err.message);
    } finally {
      setIsPasswordUpdating(false);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-background text-white flex items-center justify-center">
        <p className="text-lg text-gray-400">Loading your account...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-white pt-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Account Settings</h1>
        
        {/* Update Name Form */}
        <div className="bg-gray-900 border border-gray-800 p-8 rounded-2xl shadow-2xl mb-8">
          <h2 className="text-2xl font-bold mb-4">Update Your Name</h2>
          <form onSubmit={handleUpdateName} className="space-y-6">
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
            <button
              type="submit"
              disabled={isNameUpdating}
              className="w-full p-3 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-semibold transition-colors disabled:bg-gray-500"
            >
              {isNameUpdating ? 'Updating...' : 'Save Name'}
            </button>
            {nameError && <p className="text-red-400 text-center">{nameError}</p>}
            {nameMessage && <p className="text-green-400 text-center">{nameMessage}</p>}
          </form>
        </div>

        {/* Change Password Form */}
        <div className="bg-gray-900 border border-gray-800 p-8 rounded-2xl shadow-2xl">
          <h2 className="text-2xl font-bold mb-4">Change Password</h2>
          <form onSubmit={handleChangePassword} className="space-y-6">
            <input
              type="password"
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
              required
            />
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
              required
            />
            <button
              type="submit"
              disabled={isPasswordUpdating}
              className="w-full p-3 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-semibold transition-colors disabled:bg-gray-500"
            >
              {isPasswordUpdating ? 'Updating...' : 'Change Password'}
            </button>
            {passwordError && <p className="text-red-400 text-center">{passwordError}</p>}
            {passwordMessage && <p className="text-green-400 text-center">{passwordMessage}</p>}
          </form>
        </div>

      </div>
    </div>
  );
}