'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabaseClient';
import type { User } from '@supabase/supabase-js';
import { getApiUrl } from '@/lib';

export default function AccountPage() {
  const [objUser, setObjUser] = useState<User | null>(null);
  const [bIsLoading, setBIsLoading] = useState(true);
  const router = useRouter();

  const [strFirstName, setStrFirstName] = useState('');
  const [strLastName, setStrLastName] = useState('');
  const [strNameMessage, setStrNameMessage] = useState<string | null>(null);
  const [strNameError, setStrNameError] = useState<string | null>(null);
  const [bIsNameUpdating, setBIsNameUpdating] = useState(false);

  const [strPassword, setStrPassword] = useState('');
  const [strConfirmPassword, setStrConfirmPassword] = useState('');
  const [strPasswordMessage, setStrPasswordMessage] = useState<string | null>(null);
  const [strPasswordError, setStrPasswordError] = useState<string | null>(null);
  const [bIsPasswordUpdating, setBIsPasswordUpdating] = useState(false);


  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setObjUser(session.user);
        setStrFirstName(session.user.user_metadata?.first_name || '');
        setStrLastName(session.user.user_metadata?.last_name || '');
      } else {
        router.push('/login');
      }
      setBIsLoading(false);
    };
    checkUser();
  }, [router]);

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!objUser) return;
    setBIsNameUpdating(true);
    setStrNameMessage(null);
    setStrNameError(null);

    try {
      const strApiUrl = getApiUrl('/update-profile');
      const response = await fetch(strApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: objUser.id, first_name: strFirstName, last_name: strLastName }),
      });
      const objResult = await response.json();
      if (!response.ok) throw new Error(objResult.detail || 'Failed to update profile.');
      
      setStrNameMessage('Success! Your name has been updated.');
      
      await supabase.auth.refreshSession();

      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);

    } catch (err: any) {
      setStrNameError(err.message);
    } finally {
      setBIsNameUpdating(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (strPassword !== strConfirmPassword) {
      setStrPasswordError('Passwords do not match.');
      return;
    }
    if (strPassword.length < 8) {
      setStrPasswordError('Password must be at least 8 characters long.');
      return;
    }

    setBIsPasswordUpdating(true);
    setStrPasswordMessage(null);
    setStrPasswordError(null);

    try {
      const { error } = await supabase.auth.updateUser({ password: strPassword });
      if (error) throw error;
      setStrPasswordMessage('Your password has been updated successfully!');
      setStrPassword('');
      setStrConfirmPassword('');
    } catch(err: any) {
      setStrPasswordError(err.message);
    } finally {
      setBIsPasswordUpdating(false);
    }
  };


  if (bIsLoading) {
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
                value={strFirstName}
                onChange={(e) => setStrFirstName(e.target.value)}
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
                required
              />
              <input
                type="text"
                placeholder="Last name"
                value={strLastName}
                onChange={(e) => setStrLastName(e.target.value)}
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>
            <button
              type="submit"
              disabled={bIsNameUpdating}
              className="w-full p-3 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-semibold transition-colors disabled:bg-gray-500"
            >
              {bIsNameUpdating ? 'Updating...' : 'Save Name'}
            </button>
            {strNameError && <p className="text-red-400 text-center">{strNameError}</p>}
            {strNameMessage && <p className="text-green-400 text-center">{strNameMessage}</p>}
          </form>
        </div>

        {/* Change Password Form */}
        <div className="bg-gray-900 border border-gray-800 p-8 rounded-2xl shadow-2xl">
          <h2 className="text-2xl font-bold mb-4">Change Password</h2>
          <form onSubmit={handleChangePassword} className="space-y-6">
            <input
              type="password"
              placeholder="New password"
              value={strPassword}
              onChange={(e) => setStrPassword(e.target.value)}
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
              required
            />
            <input
              type="password"
              placeholder="Confirm new password"
              value={strConfirmPassword}
              onChange={(e) => setStrConfirmPassword(e.target.value)}
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
              required
            />
            <button
              type="submit"
              disabled={bIsPasswordUpdating}
              className="w-full p-3 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-semibold transition-colors disabled:bg-gray-500"
            >
              {bIsPasswordUpdating ? 'Updating...' : 'Change Password'}
            </button>
            {strPasswordError && <p className="text-red-400 text-center">{strPasswordError}</p>}
            {strPasswordMessage && <p className="text-green-400 text-center">{strPasswordMessage}</p>}
          </form>
        </div>

      </div>
    </div>
  );
}
