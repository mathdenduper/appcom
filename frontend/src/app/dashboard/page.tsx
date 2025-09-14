'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../supabaseClient';
import type { User } from '@supabase/supabase-js';

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      // Check for an active session with Supabase
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setUser(session.user);
      } else {
        // If no session is found, redirect to the login page
        router.push('/login');
      }
      setLoading(false);
    };

    checkUser();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/'); // Redirect to the homepage after logout
  };

  if (loading) {
    return <p className="text-center text-white pt-40">Loading...</p>;
  }
  
  if (!user) {
    return null; // Or another loading state while redirecting
  }

  return (
    <div className="min-h-screen bg-background text-white flex flex-col items-center justify-center pt-20">
      <div className="text-center bg-gray-900 p-8 rounded-xl border border-gray-800">
        <h1 className="text-4xl font-bold text-white">Welcome to your Dashboard!</h1>
        <p className="text-lg text-gray-400 mt-4">You are now logged in as:</p>
        <p className="text-purple-400 font-mono mt-2">{user.email}</p>
        <button 
          onClick={handleLogout}
          className="mt-8 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
        >
          Logout
        </button>
      </div>
    </div>
  );
}