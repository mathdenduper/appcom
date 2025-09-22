'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../supabaseClient';
import type { User } from '@supabase/supabase-js';
import Link from 'next/link';
import { getApiUrl } from '../../lib';

// Data structure for a study set
interface StudySet {
  id: string;
  title: string;
  created_at: string;
}

export default function AllSetsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [studySets, setStudySets] = useState<StudySet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkUserAndFetchSets = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        
        try {
          // This calls our existing backend endpoint to get all study sets
          const apiUrl = getApiUrl(`/my-study-sets/${session.user.id}`);
          const response = await fetch(apiUrl);
          if (!response.ok) {
            throw new Error('Failed to fetch your study sets.');
          }
          const data = await response.json();
          setStudySets(data);
        } catch (err: any) {
          setError(err.message);
        }
      } else {
        router.push('/login');
      }
      setLoading(false);
    };
    checkUserAndFetchSets();
  }, [router]);

  if (loading) {
    return (
        <div className="min-h-screen bg-background text-white flex items-center justify-center">
            <p className="text-lg text-gray-400">Loading your study sets...</p>
        </div>
    );
  }

  if (error) {
    return <p className="text-center text-red-400 pt-40">Error: {error}</p>;
  }

  return (
    <div className="min-h-screen bg-background text-white pt-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold">My Study Sets</h1>
            <Link href="/uploader" className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                Create New Set
            </Link>
        </div>

        {studySets.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {studySets.map(set => (
              // Each card now links to the study hub for that specific set
              <Link href={`/play/${set.id}`} key={set.id} className="block p-6 bg-gray-900 border border-gray-800 rounded-lg hover:border-purple-600 hover:scale-105 transition-transform">
                <h2 className="text-xl font-bold truncate">{set.title}</h2>
                <p className="text-sm text-gray-400 mt-2">
                  Created: {new Date(set.created_at).toLocaleDateString()}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 px-4 bg-gray-900 border border-gray-800 rounded-lg">
              <h2 className="text-2xl font-semibold">No Study Sets Found</h2>
              <p className="text-gray-400 mt-2">You haven't created any study sets yet. Get started now!</p>
              <Link href="/uploader" className="mt-6 inline-block bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg">
                  Create your first set
              </Link>
          </div>
        )}
      </div>
    </div>
  );
}