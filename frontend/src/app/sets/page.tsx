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

const ConfirmationModal = ({ objSetToDelete, fnOnCancel, fnOnConfirm, bIsDeleting }: { objSetToDelete: StudySet, fnOnCancel: () => void, fnOnConfirm: () => void, bIsDeleting: boolean }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-md">
                <div className="p-6 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-900/50">
                        <ExclamationTriangleIcon className="h-6 w-6 text-red-400" aria-hidden="true" />
                    </div>
                    <h2 className="mt-4 text-2xl font-bold text-white">Delete Study Set</h2>
                    <p className="mt-2 text-gray-400">
                        Are you sure you want to permanently delete the set <strong className="text-white">"{objSetToDelete.title}"</strong>? This action cannot be undone.
                    </p>
                </div>
                <div className="p-6 border-t border-gray-700 flex justify-end gap-4 bg-gray-800/50 rounded-b-2xl">
                    <button onClick={fnOnCancel} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 font-semibold rounded-lg transition-colors">
                        Cancel
                    </button>
                    <button 
                        onClick={fnOnConfirm}
                        disabled={bIsDeleting}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
                    >
                        {bIsDeleting ? 'Deleting...' : 'Delete Set'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default function MySetsPage() {
  const [objUser, setObjUser] = useState<User | null>(null);
  const [arrStudySets, setArrStudySets] = useState<StudySet[]>([]);
  const [bLoading, setBLoading] = useState(true);
  const [objSetToDelete, setObjSetToDelete] = useState<StudySet | null>(null);
  const [bIsDeleting, setBIsDeleting] = useState(false);
  const router = useRouter();

  const fnFetchSets = async (currentUser: User) => {
    try {
        const strApiUrl = getApiUrl(`/my-study-sets/${currentUser.id}`);
        const res = await fetch(strApiUrl);
        if (!res.ok) throw new Error('Failed to fetch study sets');
        const arrData = await res.json();
        setArrStudySets(arrData);
    } catch (err) {
        console.error(err);
    }
  };

  useEffect(() => {
    const fnGetInitialUser = async () => {
        setBLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            setObjUser(session.user);
            await fnFetchSets(session.user);
        } else {
            router.push('/login');
        }
        setBLoading(false);
    };
    fnGetInitialUser();
  }, [router]);

  const fnHandleConfirmDelete = async () => {
    if (!objSetToDelete || !objUser) return;
    setBIsDeleting(true);
    try {
        const strApiUrl = getApiUrl(`/delete-set/${objSetToDelete.id}`);
        const res = await fetch(strApiUrl,{
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: objUser.id }),
        });
        if (!res.ok) {
            const objErrorData = await res.json();
            throw new Error(objErrorData.detail || 'Failed to delete set.');
        }
        await fnFetchSets(objUser);
    } catch (err: any) {
        console.error(err);
        alert(err.message);
    } finally {
        setBIsDeleting(false);
        setObjSetToDelete(null);
    }
  };

  const arrMyOriginalSets = arrStudySets.filter(objSet => !objSet.title.startsWith('(Shared)'));
  const arrSharedWithMeSets = arrStudySets.filter(objSet => objSet.title.startsWith('(Shared)'));

  if (bLoading) {
    return <div className="text-center text-gray-400 pt-40">Loading your sets...</div>;
  }

  return (
    <>
      {objSetToDelete && (
        <ConfirmationModal 
            objSetToDelete={objSetToDelete}
            fnOnCancel={() => setObjSetToDelete(null)}
            fnOnConfirm={fnHandleConfirmDelete}
            bIsDeleting={bIsDeleting}
        />
      )}

      <div className="h-screen bg-background text-white flex flex-col">
        <div className="pt-24 px-4 sm:px-6 lg:px-8 max-w-4xl w-full mx-auto flex flex-col flex-1 min-h-0">
          <div className="flex justify-between items-center mb-8 flex-shrink-0">
            <h1 className="text-4xl font-bold">My Study Sets</h1>
            <Link href="/uploader" className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors">
              <PlusIcon className="h-5 w-5" />
              Create New
            </Link>
          </div>

          <div className="flex-1 grid grid-rows-2 gap-8 min-h-0 pb-8">

            <div className="flex flex-col min-h-0">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-3 flex-shrink-0"><BookOpenIcon className="h-6 w-6"/> Your Sets</h2>
                <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl p-6 overflow-y-auto">
                {arrMyOriginalSets.length > 0 ? (
                    <ul className="space-y-4">
                    {arrMyOriginalSets.map(objSet => (
                        <li key={objSet.id} className="bg-gray-800 border border-gray-700 rounded-lg flex items-stretch justify-between gap-4">
                        <Link href={`/play/${objSet.id}`} className="flex-grow p-4 hover:bg-gray-700 rounded-l-lg transition-colors">
                            <div>
                            <h3 className="font-semibold text-lg">{objSet.title}</h3>
                            <p className="text-sm text-gray-400">Created on: {new Date(objSet.created_at).toLocaleDateString()}</p>
                            </div>
                        </Link>
                        <button
                            onClick={() => setObjSetToDelete(objSet)}
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

            <div className="flex flex-col min-h-0">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-3 flex-shrink-0"><UserGroupIcon className="h-6 w-6"/> Shared With You</h2>
                <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl p-6 overflow-y-auto">
                {arrSharedWithMeSets.length > 0 ? (
                    <ul className="space-y-4">
                    {arrSharedWithMeSets.map(objSet => (
                        <li key={objSet.id} className="bg-gray-800 border border-gray-700 rounded-lg flex items-stretch justify-between gap-4">
                        <Link href={`/play/${objSet.id}`} className="flex-grow p-4 hover:bg-gray-700 rounded-l-lg transition-colors">
                            <div>
                            <h3 className="font-semibold text-lg">{objSet.title}</h3>
                            <p className="text-sm text-gray-400">Created on: {new Date(objSet.created_at).toLocaleDateString()}</p>
                            </div>
                        </Link>
                        <button
                            onClick={() => setObjSetToDelete(objSet)}
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
