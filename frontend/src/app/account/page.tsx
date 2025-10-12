// Author: Tristan Bong
// Page name: AccountPage.tsx
// Page purpose: Allows users to update their name and password
// Date created: 14/09/2025

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabaseClient';
import type { User } from '@supabase/supabase-js';
import { getApiUrl } from '@/lib';

export default function AccountPage() {
  // INPUT: user session data
  const [objUser, setObjUser] = useState<User | null>(null);
  const [bIsLoading, setBIsLoading] = useState(true);
  const router = useRouter();

  // INPUT & PROCESS: Name update state
  const [strFirstName, setStrFirstName] = useState('');
  const [strLastName, setStrLastName] = useState('');
  const [strNameMessage, setStrNameMessage] = useState<string | null>(null);
  const [strNameError, setStrNameError] = useState<string | null>(null);
  const [bIsNameUpdating, setBIsNameUpdating] = useState(false);

  // INPUT & PROCESS: Password change state
  const [strPassword, setStrPassword] = useState('');
  const [strConfirmPassword, setStrConfirmPassword] = useState('');
  const [strPasswordMessage, setStrPasswordMessage] = useState<string | null>(null);
  const [strPasswordError, setStrPasswordError] = useState<string | null>(null);
  const [bIsPasswordUpdating, setBIsPasswordUpdating] = useState(false);

  // PROCESS: Check if user is logged in and initialise fields
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setObjUser(session.user);
        setStrFirstName(session.user.user_metadata?.first_name || '');
        setStrLastName(session.user.user_metadata?.last_name || '');
      } else {
        router.push('/login'); // OUTPUT: redirect to login if not logged in
      }
      setBIsLoading(false);
    };
    checkUser();
  }, [router]);

  // PROCESS & OUTPUT: Handle name update
  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!objUser) return;
    setBIsNameUpdating(true);
    setStrNameMessage(null);
    setStrNameError(null);

    try {
      const strApiUrl = getApiUrl('/update-profile'); // INPUT: API endpoint
      const response = await fetch(strApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: objUser.id, first_name: strFirstName, last_name: strLastName }), // INPUT
      });
      const objResult = await response.json();
      if (!response.ok) throw new Error(objResult.detail || 'Failed to update profile.');

      setStrNameMessage('Success! Your name has been updated.'); // OUTPUT: success message

      await supabase.auth.refreshSession(); // PROCESS: refresh session

      setTimeout(() => router.push('/dashboard'), 1500); // OUTPUT: redirect after update

    } catch (err: any) {
      setStrNameError(err.message); // OUTPUT: error message
    } finally {
      setBIsNameUpdating(false); // PROCESS: reset loading state
    }
  };

  // PROCESS & OUTPUT: Handle password change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (strPassword !== strConfirmPassword) {
      setStrPasswordError('Passwords do not match.'); // OUTPUT
      return;
    }
    if (strPassword.length < 8) {
      setStrPasswordError('Password must be at least 8 characters long.'); // OUTPUT
      return;
    }

    setBIsPasswordUpdating(true);
    setStrPasswordMessage(null);
    setStrPasswordError(null);

    try {
      const { error } = await supabase.auth.updateUser({ password: strPassword }); // INPUT: new password
      if (error) throw error;
      setStrPasswordMessage('Your password has been updated successfully!'); // OUTPUT
      setStrPassword('');
      setStrConfirmPassword('');
    } catch(err: any) {
      setStrPasswordError(err.message); // OUTPUT
    } finally {
      setBIsPasswordUpdating(false); // PROCESS: reset loading state
    }
  };

  // OUTPUT: loading state before user data is fetched
  if (bIsLoading) {
    return (
      <div className="min-h-screen bg-background text-white flex items-center justify-center">
        <p className="text-lg text-gray-400">Loading your account...</p>
      </div>
    );
  }

  // OUTPUT: account page content
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
                value={strFirstName} // INPUT
                onChange={(e) => setStrFirstName(e.target.value)} // PROCESS
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
                required
              />
              <input
                type="text"
                placeholder="Last name"
                value={strLastName} // INPUT
                onChange={(e) => setStrLastName(e.target.value)} // PROCESS
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>
            <button
              type="submit"
              disabled={bIsNameUpdating} // PROCESS: disable button while updating
              className="w-full p-3 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-semibold transition-colors disabled:bg-gray-500"
            >
              {bIsNameUpdating ? 'Updating...' : 'Save Name'} // OUTPUT: button text
            </button>
            {strNameError && <p className="text-red-400 text-center">{strNameError}</p>} // OUTPUT
            {strNameMessage && <p className="text-green-400 text-center">{strNameMessage}</p>} // OUTPUT
          </form>
        </div>

        {/* Change Password Form */}
        <div className="bg-gray-900 border border-gray-800 p-8 rounded-2xl shadow-2xl">
          <h2 className="text-2xl font-bold mb-4">Change Password</h2>
          <form onSubmit={handleChangePassword} className="space-y-6">
            <input
              type="password"
              placeholder="New password"
              value={strPassword} // INPUT
              onChange={(e) => setStrPassword(e.target.value)} // PROCESS
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
              required
            />
            <input
              type="password"
              placeholder="Confirm new password"
              value={strConfirmPassword} // INPUT
              onChange={(e) => setStrConfirmPassword(e.target.value)} // PROCESS
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
              required
            />
            <button
              type="submit"
              disabled={bIsPasswordUpdating} // PROCESS
              className="w-full p-3 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-semibold transition-colors disabled:bg-gray-500"
            >
              {bIsPasswordUpdating ? 'Updating...' : 'Change Password'} // OUTPUT
            </button>
            {strPasswordError && <p className="text-red-400 text-center">{strPasswordError}</p>} // OUTPUT
            {strPasswordMessage && <p className="text-green-400 text-center">{strPasswordMessage}</p>} // OUTPUT
          </form>
        </div>

      </div>
    </div>
  );
}
