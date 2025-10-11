'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabaseClient';
import type { User } from '@supabase/supabase-js';
import Link from 'next/link';
import { getApiUrl } from '@/lib';
import { PlusIcon, BookOpenIcon, UserGroupIcon } from '@heroicons/react/24/outline';

interface StudySet {
  id: string;
  title: string;
  created_at: string;
}

export default function MySetsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [studySets, setStudySets] = useState<StudySet[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchSets = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        try {
          const response = await fetch(getApiUrl(`/my-study-sets/${session.user.id}`));
          if (!response.ok) throw new Error('Failed to fetch study sets');
          const data = await response.json();
          setStudySets(data);
        } catch (error) {
          console.error(error);
        }
      } else {
        router.push('/login');
      }
      setLoading(false);
    };
    fetchSets();
  }, [router]);

  // Filter sets into two lists: original and shared
  const myOriginalSets = studySets.filter(set => !set.title.startsWith('(Shared)'));
  const sharedWithMeSets = studySets.filter(set => set.title.startsWith('(Shared)'));

  if (loading) {
    return <div className="text-center text-gray-400 pt-40">Loading your sets...</div>;
  }

  return (
    <div className="min-h-screen bg-background text-white pt-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">My Study Sets</h1>
          <Link href="/uploader" className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors">
            <PlusIcon className="h-5 w-5" />
            Create New
          </Link>
        </div>

        {/* Section 1: Your Original Sets */}
        <div className="mb-12">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3"><BookOpenIcon className="h-6 w-6"/> Your Sets</h2>
            <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl p-6">
            {myOriginalSets.length > 0 ? (
                <ul className="space-y-4">
                {myOriginalSets.map(set => (
                    <li key={set.id}>
                    <Link href={`/play/${set.id}`} className="block w-full text-left p-4 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 transition-colors flex justify-between items-center">
                        <div>
                        <h3 className="font-semibold text-lg">{set.title}</h3>
                        <p className="text-sm text-gray-400">
                            Created on: {new Date(set.created_at).toLocaleDateString()}
                        </p>
                        </div>
                        <span className="text-gray-500">&gt;</span>
                    </Link>
                    </li>
                ))}
                </ul>
            ) : (
                <p className="text-gray-400 text-center py-4">You haven't created any study sets yet.</p>
            )}
            </div>
        </div>

        {/* Section 2: Sets Shared With You */}
        <div>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3"><UserGroupIcon className="h-6 w-6"/> Shared With You</h2>
            <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl p-6">
            {sharedWithMeSets.length > 0 ? (
                <ul className="space-y-4">
                {sharedWithMeSets.map(set => (
                    <li key={set.id}>
                    <Link href={`/play/${set.id}`} className="block w-full text-left p-4 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 transition-colors flex justify-between items-center">
                        <div>
                        <h3 className="font-semibold text-lg">{set.title.replace('(Shared) ', '')}</h3>
                        <p className="text-sm text-gray-400">
                            Accepted on: {new Date(set.created_at).toLocaleDateString()}
                        </p>
                        </div>
                        <span className="text-gray-500">&gt;</span>
                    </Link>
                    </li>
                ))}
                </ul>
            ) : (
                <p className="text-gray-400 text-center py-4">No sets have been shared with you yet.</p>
            )}
            </div>
        </div>

      </div>
    </div>
  );
}