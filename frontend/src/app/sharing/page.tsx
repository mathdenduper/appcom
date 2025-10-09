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
  study_sets: { title: string; };
  recipient: { email: string; };
}

// --- Share Modal Component ---
const ShareModal = ({ user, studySets, onClose, onShareSent }: { user: User, studySets: StudySet[], onClose: () => void, onShareSent: () => void }) => {
  const [selectedSet, setSelectedSet] = useState<string>(studySets[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResultUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<SearchResultUser | null>(null);

  useEffect(() => {
    if (searchQuery.length < 3) {
      setSearchResults([]);
      return;
    }

    const search = setTimeout(async () => {
      setIsSearching(true);
      const response = await fetch(getApiUrl(`/users/search?query=${searchQuery}&current_user_id=${user.id}`));
      const data = await response.json();
      setSearchResults(data);
      setIsSearching(false);
    }, 500); // Debounce search

    return () => clearTimeout(search);
  }, [searchQuery, user.id]);

  const handleShare = async () => {
    if (!selectedSet || !selectedRecipient) {
      alert('Please select a study set and a recipient.');
      return;
    }
    try {
      const response = await fetch(getApiUrl('/share-set'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_id: user.id,
          recipient_email: selectedRecipient.email,
          study_set_id: selectedSet,
        }),
      });
      if (!response.ok) throw new Error('Failed to share set');
      onShareSent(); // This will refresh the list of sent shares on the main page
      onClose();
    } catch (error) {
      console.error(error);
      alert('Error sharing set.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold">Share a Study Set</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">1. Choose a set to share</label>
            <select
              value={selectedSet}
              onChange={(e) => setSelectedSet(e.target.value)}
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
            >
              {studySets.map(set => <option key={set.id} value={set.id}>{set.title}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">2. Find a user to share with (by email)</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSelectedRecipient(null); // Clear selection when typing
              }}
              placeholder="Start typing an email..."
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
            />
             {searchResults.length > 0 && !selectedRecipient && (
                <ul className="mt-2 border border-gray-700 rounded-lg bg-gray-800">
                    {searchResults.map(result => (
                        <li 
                            key={result.id} 
                            onClick={() => {
                                setSelectedRecipient(result);
                                setSearchQuery(result.email);
                                setSearchResults([]);
                            }}
                            className="p-3 hover:bg-gray-700 cursor-pointer"
                        >
                            {result.first_name} {result.last_name} ({result.email})
                        </li>
                    ))}
                </ul>
            )}
          </div>
        </div>
        <div className="p-6 border-t border-gray-700 flex justify-end gap-4">
            <button onClick={onClose} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 font-semibold rounded-lg">Cancel</button>
            <button onClick={handleShare} disabled={!selectedRecipient} className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg disabled:opacity-50">
              <PaperAirplaneIcon className="h-5 w-5" />
              Send Share
            </button>
        </div>
      </div>
    </div>
  );
};


// --- MAIN SHARING PAGE ---
export default function SharingPage() {
  const [user, setUser] = useState<User | null>(null);
  const [sentShares, setSentShares] = useState<SentShare[]>([]);
  const [myStudySets, setMyStudySets] = useState<StudySet[]>([]);
  const [loading, setLoading] = useState(true);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const fetchPageData = async (currentUser: User) => {
    try {
      const [sentRes, setsRes] = await Promise.all([
        fetch(getApiUrl(`/shares/sent/${currentUser.id}`)),
        fetch(getApiUrl(`/my-study-sets/${currentUser.id}`))
      ]);
      if (!sentRes.ok) throw new Error('Failed to fetch sent shares');
      if (!setsRes.ok) throw new Error('Failed to fetch study sets');
      setSentShares(await sentRes.json());
      setMyStudySets(await setsRes.json());
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        await fetchPageData(session.user);
      }
      setLoading(false);
    };
    fetchInitialData();
  }, []);

  if (loading) {
    return <p className="text-center text-gray-400 pt-40">Loading...</p>;
  }

  return (
    <>
      {isShareModalOpen && user && (
        <ShareModal 
          user={user} 
          studySets={myStudySets}
          onClose={() => setIsShareModalOpen(false)}
          onShareSent={() => user && fetchPageData(user)}
        />
      )}
      <div className="min-h-screen bg-background text-white pt-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold">Sharing Centre</h1>
            <button 
              onClick={() => setIsShareModalOpen(true)}
              disabled={myStudySets.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShareIcon className="h-5 w-5" />
              Share a New Set
            </button>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl p-6">
            <h2 className="text-2xl font-bold mb-6">Your Sent Shares</h2>
            {sentShares.length > 0 ? (
              <ul className="space-y-4">
                {sentShares.map((item, index) => (
                  <li key={index} className="bg-gray-800 border border-gray-700 rounded-lg p-4 flex items-center justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-lg">{item.study_sets.title}</h3>
                      <p className="text-sm text-gray-400">Sent to: {item.recipient.email}</p>
                    </div>
                    {item.is_accepted ? (
                       <span className="text-xs font-bold text-green-400 flex items-center gap-1.5">
                          <CheckCircleIcon className="h-4 w-4"/>
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