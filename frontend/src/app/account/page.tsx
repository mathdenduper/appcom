// Author: Tristan Bong
// Page name: account/page.tsx
// Page purpose: Allows users to update their name and password
// Date created: 14/09/2025

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabaseClient';
import type { User } from '@supabase/supabase-js';
import { getApiUrl } from '@/lib';

// Function: Main component for managing account settings
export default function AccountPage() {
  // INPUT: current user session and profile data
  const [objUser, setObjUser] = useState<User | null>(null);
  const [bIsLoading, setBIsLoading] = useState(true);
  const router = useRouter();

  // INPUT & PROCESS: name update fields
  const [strFirstName, setStrFirstName] = useState('');
  const [strLastName, setStrLastName] = useState('');
  const [strNameMessage, setStrNameMessage] = useState<string | null>(null);
  const [strNameError, setStrNameError] = useState<string | null>(null);
  const [bIsNameUpdating, setBIsNameUpdating] = useState(false);

  // INPUT & PROCESS: password change fields
  const [strPassword, setStrPassword] = useState('');
  const [strConfirmPassword, setStrConfirmPassword] = useState('');
  const [strPasswordMessage, setStrPasswordMessage] = useState<string | null>(null);
  const [strPasswordError, setStrPasswordError] = useState<string | null>(null);
  const [bIsPasswordUpdating, setBIsPasswordUpdating] = useState(false);

  // Function: Checks user session and preloads data
  // PROCESS: verifies login, loads user info, redirects if not logged in
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setObjUser(session.user);
        setStrFirstName(session.user.user_metadata?.first_name || '');
        setStrLastName(session.user.user_metadata?.last_name || '');
      } else {
        router.push('/login'); // OUTPUT: redirect user if no session is found
      }
      setBIsLoading(false);
    };
    checkUser();
  }, [router]);

  // Function: Handles updating of first and last name
  // INPUT: user ID, new first and last name
  // PROCESS: sends update request to API, refreshes Supabase session
  // OUTPUT: success or error messages with redirect
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

      setStrNameMessage('Success! Your name has been updated.'); // OUTPUT: success feedback to user
      await supabase.auth.refreshSession(); // PROCESS: refresh session data
      setTimeout(() => router.push('/dashboard'), 1500); // OUTPUT: redirect after update
    } catch (err: any) {
      setStrNameError(err.message); // OUTPUT: display error feedback
    } finally {
      setBIsNameUpdating(false); // PROCESS: reset updating state
    }
  };

  // Function: Handles password changes for the user
  // INPUT: new password and confirmation
  // PROCESS: validates match and length, sends password update to Supabase
  // OUTPUT: success or error feedback
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (strPassword !== strConfirmPassword) {
      setStrPasswordError('Passwords do not match.'); // OUTPUT: validation message
      return;
    }
    if (strPassword.length < 8) {
      setStrPasswordError('Password must be at least 8 characters long.'); // OUTPUT: validation message
      return;
    }

    setBIsPasswordUpdating(true);
    setStrPasswordMessage(null);
    setStrPasswordError(null);

    try {
      const { error } = await supabase.auth.updateUser({ password: strPassword });
      if (error) throw error;
      setStrPasswordMessage('Your password has been updated successfully!'); // OUTPUT: success message
      setStrPassword('');
      setStrConfirmPassword('');
    } catch (err: any) {
      setStrPasswordError(err.message); // OUTPUT: error feedback
    } finally {
      setBIsPasswordUpdating(false); // PROCESS: reset updating state
    }
  };

  // OUTPUT: show loading screen before user data is ready
  if (bIsLoading) {
    return (
      <div className="min-h-screen bg-background text-white flex items-center justify-center">
        <p className="text-lg text-gray-400">Loading your account...</p>
      </div>
    );
  }

  // OUTPUT: render account settings page UI
  return (
    <div className="min-h-screen bg-background text-white pt-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Account Settings</h1>
        
        {/* Section: Update Name */}
        <div className="bg-gray-900 border border-gray-800 p-8 rounded-2xl shadow-2xl mb-8">
          <h2 className="text-2xl font-bold mb-4">Update Your Name</h2>
          <form onSubmit={handleUpdateName} className="space-y-6">
            <div className="flex gap-4">
              <input
                type="text"
                placeholder="First name"
                value={strFirstName} // INPUT: user-provided first name
                onChange={(e) => setStrFirstName(e.target.value)} // PROCESS: updates first name state
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
                required
              />
              <input
                type="text"
                placeholder="Last name"
                value={strLastName} // INPUT: user-provided last name
                onChange={(e) => setStrLastName(e.target.value)} // PROCESS: updates last name state
                className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>
            <button
              type="submit"
              disabled={bIsNameUpdating} // PROCESS: disables button during submission
              className="w-full p-3 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-semibold transition-colors disabled:bg-gray-500"
            >
              {bIsNameUpdating ? 'Updating...' : 'Save Name'} {/* OUTPUT: button text based on state */}
            </button>
            {strNameError && <p className="text-red-400 text-center">{strNameError}</p>} {/* OUTPUT: display name update error */}
            {strNameMessage && <p className="text-green-400 text-center">{strNameMessage}</p>} {/* OUTPUT: display name update success */}
          </form>
        </div>

        {/* Section: Change Password */}
        <div className="bg-gray-900 border border-gray-800 p-8 rounded-2xl shadow-2xl">
          <h2 className="text-2xl font-bold mb-4">Change Password</h2>
          <form onSubmit={handleChangePassword} className="space-y-6">
            <input
              type="password"
              placeholder="New password"
              value={strPassword} // INPUT: new password from user
              onChange={(e) => setStrPassword(e.target.value)} // PROCESS: updates password state
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
              required
            />
            <input
              type="password"
              placeholder="Confirm new password"
              value={strConfirmPassword} // INPUT: confirm password field
              onChange={(e) => setStrConfirmPassword(e.target.value)} // PROCESS: updates confirmation state
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
              required
            />
            <button
              type="submit"
              disabled={bIsPasswordUpdating} // PROCESS: disables button during update
              className="w-full p-3 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-semibold transition-colors disabled:bg-gray-500"
            >
              {bIsPasswordUpdating ? 'Updating...' : 'Change Password'} {/* OUTPUT: show button status */}
            </button>
            {strPasswordError && <p className="text-red-400 text-center">{strPasswordError}</p>} {/* OUTPUT: display password error */}
            {strPasswordMessage && <p className="text-green-400 text-center">{strPasswordMessage}</p>} {/* OUTPUT: display password success */}
          </form>
        </div>
      </div>
    </div>
  );
}
