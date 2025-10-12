// Author: Tristan Bong
// Page name: sharing/page.tsx
// Page purpose: Allows users to share their study sets with other users and view sent shares.
// Date created: 14/09/2025

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabaseClient';
import type { User } from '@supabase/supabase-js';
import { getApiUrl } from '@/lib';
import { ShareIcon, PaperAirplaneIcon, CheckCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

// --- Data Structures ---
interface StudySet {
  id: string;
  title: string;
}

interface SearchResultUser {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
}

interface SentShare {
  created_at: string;
  is_accepted: boolean;
  study_set_title: string;
  recipient_email: string;
}

// --- SHARE MODAL ---
/**
 * Component: ShareModal
 * Purpose: Modal that allows user to select a study set and recipient to share with.
 */
const ShareModal = ({
  objUser,
  arrStudySets,
  fnOnClose,
  fnOnShareSent,
}: {
  objUser: User;
  arrStudySets: StudySet[];
  fnOnClose: () => void;
  fnOnShareSent: () => void;
}) => {
  // INPUT: objUser, arrStudySets
  const [strSelectedSetId, setStrSelectedSetId] = useState<string>(arrStudySets[0]?.id || '');
  const [strSearchQuery, setStrSearchQuery] = useState('');
  const [arrSearchResults, setArrSearchResults] = useState<SearchResultUser[]>([]);
  const [bIsSearching, setBIsSearching] = useState(false);
  const [objSelectedRecipient, setObjSelectedRecipient] = useState<SearchResultUser | null>(null);

  // PROCESS: Search users by email when query >= 3 characters
  useEffect(() => {
    if (strSearchQuery.length < 3) {
      setArrSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setBIsSearching(true);
      const res = await fetch(
        getApiUrl(`/users/search?query=${strSearchQuery}&current_user_id=${objUser.id}`)
      );
      const arrData = await res.json();
      setArrSearchResults(arrData);
      setBIsSearching(false);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [strSearchQuery, objUser.id]);

  // PROCESS: Share selected set with selected recipient
  const fnHandleShare = async () => {
    if (!strSelectedSetId || !objSelectedRecipient) return;
    try {
      await fetch(getApiUrl('/share-set'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_id: objUser.id,
          recipient_id: objSelectedRecipient.id,
          study_set_id: strSelectedSetId,
        }),
      });
      // OUTPUT: Notify parent that share was sent and close modal
      fnOnShareSent();
      fnOnClose();
    } catch (err) {
      console.error('Error sharing set:', err);
    }
  };

  // OUTPUT: Render share modal UI
  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <h2 className="text-2xl text-white font-bold">Share a Study Set</h2>
          <button onClick={fnOnClose} className="p-1 rounded-full hover:bg-gray-700">
            <XMarkIcon className="h-6 w-6 text-white" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Step 1: Select set */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              1. Choose a set to share
            </label>
            <select
              value={strSelectedSetId}
              onChange={e => setStrSelectedSetId(e.target.value)}
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
            >
              {arrStudySets.map(objSet => (
                <option key={objSet.id} value={objSet.id}>
                  {objSet.title}
                </option>
              ))}
            </select>
          </div>

          {/* Step 2: Search recipient */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              2. Find a user to share with (by email)
            </label>
            <input
              type="text"
              value={strSearchQuery}
              onChange={e => {
                setStrSearchQuery(e.target.value);
                setObjSelectedRecipient(null);
              }}
              placeholder="Start typing an email..."
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
            />
            {arrSearchResults.length > 0 && !objSelectedRecipient && (
              <ul className="mt-2 border border-gray-700 rounded-lg bg-gray-800 text-white max-h-48 overflow-y-auto">
                {arrSearchResults.map(objResult => (
                  <li
                    key={objResult.id}
                    onClick={() => {
                      setObjSelectedRecipient(objResult);
                      setStrSearchQuery(objResult.email);
                      setArrSearchResults([]);
                    }}
                    className="p-3 hover:bg-gray-700 cursor-pointer"
                  >
                    {objResult.first_name || ''} {objResult.last_name || ''} ({objResult.email})
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-700 flex justify-end gap-4">
          <button
            onClick={fnOnClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 font-semibold rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={fnHandleShare}
            disabled={!objSelectedRecipient}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg disabled:opacity-50"
          >
            <PaperAirplaneIcon className="h-5 w-5" />
            Send Share
          </button>
        </div>
      </div>
    </div>
  );
};

// --- MAIN SHARING PAGE ---
/**
 * Component: SharingPage
 * Purpose: Main page to view sent shares and initiate sharing new study sets.
 */
export default function SharingPage() {
  const [objUser, setObjUser] = useState<User | null>(null);
  const [arrSentShares, setArrSentShares] = useState<SentShare[]>([]);
  const [arrMyStudySets, setArrMyStudySets] = useState<StudySet[]>([]);
  const [bLoading, setBLoading] = useState(true);
  const [bIsShareModalOpen, setBIsShareModalOpen] = useState(false);

  // PROCESS: Fetch sent shares and my study sets
  const fnFetchPageData = async (currentUser: User) => {
    try {
      const [resSentShares, resMySets] = await Promise.all([
        fetch(getApiUrl(`/shares/sent/${currentUser.id}`)),
        fetch(getApiUrl(`/my-study-sets/${currentUser.id}`)),
      ]);
      if (!resSentShares.ok) throw new Error('Failed to fetch sent shares');
      if (!resMySets.ok) throw new Error('Failed to fetch study sets');

      // OUTPUT: Update state with fetched data
      setArrSentShares(await resSentShares.json());
      setArrMyStudySets(await resMySets.json());
    } catch (err) {
      console.error(err);
    }
  };

  // INPUT: Supabase session
  // PROCESS: On page load, get user session and fetch page data
  useEffect(() => {
    const fnFetchInitialData = async () => {
      setBLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setObjUser(session.user);
        await fnFetchPageData(session.user);
      }
      setBLoading(false);
    };
    fnFetchInitialData();
  }, []);

  if (bLoading) {
    return <p className="text-center text-gray-400 pt-40">Loading...</p>;
  }

  // OUTPUT: Render main sharing page
  return (
    <>
      {bIsShareModalOpen && objUser && (
        <ShareModal
          objUser={objUser}
          arrStudySets={arrMyStudySets}
          fnOnClose={() => setBIsShareModalOpen(false)}
          fnOnShareSent={() => objUser && fnFetchPageData(objUser)}
        />
      )}

      <div className="min-h-screen bg-background text-white pt-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold">Sharing Centre</h1>
            <button
              onClick={() => setBIsShareModalOpen(true)}
              disabled={arrMyStudySets.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShareIcon className="h-5 w-5" />
              Share a New Set
            </button>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl p-6">
            <h2 className="text-2xl font-bold mb-6">Your Sent Shares</h2>
            {arrSentShares.length > 0 ? (
              <ul className="space-y-4">
                {arrSentShares.map((objShare, idx) => (
                  <li
                    key={idx}
                    className="bg-gray-800 border border-gray-700 rounded-lg p-4 flex items-center justify-between gap-4"
                  >
                    <div>
                      <h3 className="font-semibold text-lg">{objShare.study_set_title}</h3>
                      <p className="text-sm text-gray-400">Sent to: {objShare.recipient_email}</p>
                    </div>
                    {objShare.is_accepted ? (
                      <span className="text-xs font-bold text-green-400 flex items-center gap-1.5">
                        <CheckCircleIcon className="h-4 w-4" />
                        Accepted
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-yellow-400">PENDING</span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400">You haven't shared any sets yet.</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
