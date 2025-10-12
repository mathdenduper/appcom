'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabaseClient';
import type { User } from '@supabase/supabase-js';
import Link from 'next/link';
import { getApiUrl } from '@/lib';
import { PlusIcon, BookOpenIcon, UserGroupIcon, TrashIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface StudySet {
  id: string;
  title: string;
  created_at: string;
}

// --- CONFIRMATION MODAL COMPONENT ---
const ConfirmationModal = ({ setToDelete, onCancel, onConfirm, isDeleting }: { setToDelete: StudySet, onCancel: () => void, onConfirm: () => void, isDeleting: boolean }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-md">
                <div className="p-6 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-900/50">
                        <ExclamationTriangleIcon className="h-6 w-6 text-red-400" aria-hidden="true" />
                    </div>
                    <h2 className="mt-4 text-2xl font-bold text-white">Delete Study Set</h2>
                    <p className="mt-2 text-gray-400">
                        Are you sure you want to permanently delete the set <strong className="text-white">"{setToDelete.title}"</strong>? This action cannot be undone.
                    </p>
                </div>
                <div className="p-6 border-t border-gray-700 flex justify-end gap-4 bg-gray-800/50 rounded-b-2xl">
                    <button onClick={onCancel} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 font-semibold rounded-lg transition-colors">
                        Cancel
                    </button>
                    <button 
                        onClick={onConfirm}
                        disabled={isDeleting}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
                    >
                        {isDeleting ? 'Deleting...' : 'Delete Set'}
                    </button>
                </div>
            </div>
        </div>
    );
};


export default function MySetsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [studySets, setStudySets] = useState<StudySet[]>([]);
  const [loading, setLoading] = useState(true);
  const [setToDelete, setSetToDelete] = useState<StudySet | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const fetchSets = async (currentUser: User) => {
    try {
        const response = await fetch(getApiUrl(`/my-study-sets/${currentUser.id}`));
        if (!response.ok) throw new Error('Failed to fetch study sets');
        const data = await response.json();
        setStudySets(data);
    } catch (error) {
        console.error(error);
    }
  };

  useEffect(() => {
    const getInitialUser = async () => {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            setUser(session.user);
            await fetchSets(session.user);
        } else {
            router.push('/login');
        }
        setLoading(false);
    };
    getInitialUser();
  }, [router]);

  const handleConfirmDelete = async () => {
    if (!setToDelete || !user) return;
    setIsDeleting(true);
    try {
        const response = await fetch(getApiUrl(`/delete-set/${setToDelete.id}`),{
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: user.id }),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to delete set.');
        }
        await fetchSets(user); // Refetch the sets to update the list
    } catch (error: any) {
        console.error(error);
        alert(error.message);
    } finally {
        setIsDeleting(false);
        setSetToDelete(null);
    }
  };

  const myOriginalSets = studySets.filter(set => !set.title.startsWith('(Shared)'));
  const sharedWithMeSets = studySets.filter(set => set.title.startsWith('(Shared)'));

  if (loading) {
    return <div className="text-center text-gray-400 pt-40">Loading your sets...</div>;
  }

  return (
    <>
      {setToDelete && (
        <ConfirmationModal 
            setToDelete={setToDelete}
            onCancel={() => setSetToDelete(null)}
            onConfirm={handleConfirmDelete}
            isDeleting={isDeleting}
        />
      )}
      {/* UPDATED: This container now controls the overall page layout and scrolling */}
      <div className="h-screen bg-background text-white flex flex-col">
        <div className="pt-24 px-4 sm:px-6 lg:px-8 max-w-4xl w-full mx-auto flex flex-col flex-1 min-h-0">
          <div className="flex justify-between items-center mb-8 flex-shrink-0">
            <h1 className="text-4xl font-bold">My Study Sets</h1>
            <Link href="/uploader" className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors">
              <PlusIcon className="h-5 w-5" />
              Create New
            </Link>
          </div>

          {/* UPDATED: This div now handles the layout and sizing of the two containers */}
          <div className="flex-1 grid grid-rows-2 gap-8 min-h-0 pb-8">
            
            {/* Section 1: Your Original Sets */}
            <div className="flex flex-col min-h-0">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-3 flex-shrink-0"><BookOpenIcon className="h-6 w-6"/> Your Sets</h2>
                {/* UPDATED: This div now scrolls internally */}
                <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl p-6 overflow-y-auto">
                {myOriginalSets.length > 0 ? (
                    <ul className="space-y-4">
                    {myOriginalSets.map(set => (
                        <li
                        key={set.id}
                        className="bg-gray-800 border border-gray-700 rounded-lg flex items-stretch justify-between gap-4"
                        >
                        <Link
                            href={`/play/${set.id}`}
                            className="flex-grow p-4 hover:bg-gray-700 rounded-l-lg transition-colors"
                        >
                            <div>
                            <h3 className="font-semibold text-lg">{set.title}</h3>
                            <p className="text-sm text-gray-400">
                                Created on: {new Date(set.created_at).toLocaleDateString()}
                            </p>
                            </div>
                        </Link>
                        <button
                            onClick={() => setSetToDelete(set)}
                            className="px-4 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded-r-lg transition-colors flex items-center"
                            title="Delete Set"
                        >
                            <TrashIcon className="h-5 w-5" />
                        </button>
                        </li>
                    ))}
                    </ul>
                ) : (
                    <p className="text-gray-400 text-center py-4">You haven't created any study sets yet.</p>
                )}
                </div>
            </div>

            {/* Section 2: Sets Shared With You */}
            <div className="flex flex-col min-h-0">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-3 flex-shrink-0"><UserGroupIcon className="h-6 w-6"/> Shared With You</h2>
                {/* UPDATED: This div now scrolls internally */}
                <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl p-6 overflow-y-auto">
                {sharedWithMeSets.length > 0 ? (
                    <ul className="space-y-4">
                    {sharedWithMeSets.map(set => (
                        <li
                        key={set.id}
                        className="bg-gray-800 border border-gray-700 rounded-lg flex items-stretch justify-between gap-4"
                        >
                        <Link
                            href={`/play/${set.id}`}
                            className="flex-grow p-4 hover:bg-gray-700 rounded-l-lg transition-colors"
                        >
                            <div>
                            <h3 className="font-semibold text-lg">{set.title}</h3>
                            <p className="text-sm text-gray-400">
                                Created on: {new Date(set.created_at).toLocaleDateString()}
                            </p>
                            </div>
                        </Link>
                        <button
                            onClick={() => setSetToDelete(set)}
                            className="px-4 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded-r-lg transition-colors flex items-center"
                            title="Delete Set"
                        >
                            <TrashIcon className="h-5 w-5" />
                        </button>
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
      </div>
    </>
  );
}