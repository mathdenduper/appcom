'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../supabaseClient';
import type { User } from '@supabase/supabase-js';
import Link from 'next/link';
import { getApiUrl } from '../../lib';
import { BookOpenIcon, UserGroupIcon, StarIcon } from '@heroicons/react/24/outline';

// --- Data Structures ---
interface StudySet {
  id: string;
  title: string;
  created_at: string;
}
interface Profile {
    id: string;
    cr_score: number;
}
interface LeaderboardEntry {
    rank: number;
    first_name: string | null;
    last_name: string | null;
    cr_score: number;
}

// --- Icons ---
const PlayIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>;
const ResultsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>;
const UploaderIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>;
const SharingIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>;
const SettingsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06-.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>;

// --- Profile Menu ---
const ProfileMenu = ({ user: objUser, onLogout: fnOnLogout }: { user: User, onLogout: () => void }) => {
    const [bIsOpen, setBIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const strFirstName = objUser.user_metadata?.first_name || '';
    const strLastName = objUser.user_metadata?.last_name || '';
    const strUserName = `${strFirstName} ${strLastName}`.trim() || objUser.email?.split('@')[0] || 'Student';
    const strUserInitials = `${strFirstName.charAt(0)}${strLastName.charAt(0)}`.toUpperCase() || strUserName.substring(0, 2).toUpperCase();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setBIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [menuRef]);

    return (
        <div className="relative" ref={menuRef}>
            <button onClick={() => setBIsOpen(!bIsOpen)} className="flex items-center w-full space-x-4 p-4 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors border border-gray-700">
                <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0">
                    {strUserInitials}
                </div>
                <span className="font-semibold truncate">{strUserName}</span>
            </button>
            {bIsOpen && (
                <div className="absolute bottom-full mb-2 w-full bg-gray-800 border border-gray-700 rounded-lg shadow-lg p-2">
                    <ul className="space-y-1">
                        <li><Link href="/account" className="block px-3 py-2 text-gray-300 hover:bg-gray-700 rounded-md transition-colors">Account</Link></li>
                        <li><button onClick={fnOnLogout} className="w-full text-left px-3 py-2 text-red-400 hover:bg-gray-700 rounded-md transition-colors">Logout</button></li>
                    </ul>
                </div>
            )}
        </div>
    );
};

const getOrdinalSuffix = (n: number) => {
    const arrSuffix = ["th", "st", "nd", "rd"];
    const nV = n % 100;
    return arrSuffix[(nV - 20) % 10] || arrSuffix[nV] || arrSuffix[0];
};

// --- Main Dashboard Page ---
export default function DashboardPage() {
  const [objUser, setObjUser] = useState<User | null>(null);
  const [objProfile, setObjProfile] = useState<Profile | null>(null);
  const [bIsLoading, setBIsLoading] = useState(true);
  const [arrStudySets, setArrStudySets] = useState<StudySet[]>([]);
  const [arrLeaderboard, setArrLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [strTimeSpan, setStrTimeSpan] = useState<'daily' | 'weekly' | 'monthly' | 'yearly' | 'all_time'>('all_time');
  const router = useRouter();

  useEffect(() => {
    const fetchDashboardData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setObjUser(session.user);
        
        try {
          const [profileResponse, setsResponse, leaderboardResponse] = await Promise.all([
            supabase.from('profiles').select('id, cr_score').eq('id', session.user.id).single(),
            fetch(getApiUrl(`/my-study-sets/${session.user.id}`)),
            fetch(getApiUrl(`/leaderboard?timespan=${strTimeSpan}`))
          ]);

          if (profileResponse.error && profileResponse.error.code !== 'PGRST116') {
              throw profileResponse.error;
          }
          setObjProfile(profileResponse.data);

          if (!setsResponse.ok) throw new Error('Failed to fetch study sets.');
          const arrSetsData = await setsResponse.json();
          setArrStudySets(arrSetsData);
          
          if (!leaderboardResponse.ok) throw new Error('Failed to fetch leaderboard.');
          const arrLeaderboardData = await leaderboardResponse.json();
          setArrLeaderboard(arrLeaderboardData);

        } catch (error) {
          console.error("Error fetching dashboard data:", error);
        }
      } else {
        router.push('/login');
      }
      setBIsLoading(false);
    };

    fetchDashboardData();

    const handleFocus = () => fetchDashboardData();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [router, strTimeSpan]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };
  
  const arrMyOriginalSets = arrStudySets.filter(set => !set.title.startsWith('(Shared)'));
  const arrSharedWithMeSets = arrStudySets.filter(set => set.title.startsWith('(Shared)'));

  if (bIsLoading) return <p className="text-center text-white pt-40">Loading your dashboard...</p>;
  if (!objUser) return null;

  const strFirstName = objUser.user_metadata?.first_name || '';
  const strLastName = objUser.user_metadata?.last_name || '';
  const strUserName = `${strFirstName} ${strLastName}`.trim() || objUser.email?.split('@')[0] || 'Student';
  const strUserInitials = (strFirstName.charAt(0) || '') + (strLastName.charAt(0) || '');
  const nCrScore = objProfile?.cr_score ?? 0;
  
  return (
    <div className="h-screen bg-background text-white flex pt-20">
      {/* --- Main Content --- */}
      <div className="flex-1 p-8 flex flex-col min-h-0">
        <div className="flex items-center space-x-6 mb-8 flex-shrink-0">
          <div className="w-24 h-24 bg-purple-600 rounded-full flex items-center justify-center text-4xl font-bold flex-shrink-0">
            {strUserInitials.toUpperCase() || strUserName.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <h1 className="text-4xl font-bold">{strUserName}</h1>
            <p className="text-gray-400 text-lg">{nCrScore} CR</p>
          </div>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 flex-1 min-h-0">

          {/* --- Recent Study Sets --- */}
          <div className="flex flex-col min-h-0">
            <h2 className="text-2xl font-bold mb-4 flex-shrink-0">My Recent Study Sets</h2>
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 flex flex-col flex-1 min-h-0">

              {/* Your Sets */}
              <div className="flex flex-col flex-1 min-h-0 border-b border-gray-700 pb-4">
                <h3 className="text-lg font-semibold text-gray-400 mb-3 flex items-center gap-2 flex-shrink-0">
                  <BookOpenIcon className="h-5 w-5"/> Your Sets
                </h3>
                <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                  {arrMyOriginalSets.length > 0 ? (
                    arrMyOriginalSets.map(objSet => (
                      <Link href={`/play/${objSet.id}`} key={objSet.id} className="block w-full text-left p-4 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 transition-colors flex justify-between items-center">
                        <span>{objSet.title}</span>
                        <span className="text-gray-500">&gt;</span>
                      </Link>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 pl-1">You haven't created any sets yet.</p>
                  )}
                </div>
              </div>

              {/* Shared With You */}
              <div className="flex flex-col flex-1 min-h-0 pt-4">
                <h3 className="text-lg font-semibold text-gray-400 mb-3 flex items-center gap-2 flex-shrink-0">
                  <UserGroupIcon className="h-5 w-5"/> Shared With You
                </h3>
                <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                  {arrSharedWithMeSets.length > 0 ? (
                    arrSharedWithMeSets.slice(0, 8).map(objSet => (
                      <Link href={`/play/${objSet.id}`} key={objSet.id} className="block w-full text-left p-4 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 transition-colors flex justify-between items-center">
                        <span className="truncate">{objSet.title.replace('(Shared) ', '')}</span>
                        <span className="text-gray-500">&gt;</span>
                      </Link>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 pl-1">No sets have been shared with you yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
          {/* --- End Recent Study Sets --- */}

          {/* --- Leaderboard --- */}
          <div className="flex flex-col min-h-0">
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
                <h2 className="text-2xl font-bold">CR Leaderboard</h2>
                <div className="flex space-x-1 bg-gray-800 p-1 rounded-lg">
                    {['daily','weekly','monthly','yearly','all_time'].map(span => (
                        <button key={span} onClick={() => setStrTimeSpan(span as any)} className={`px-3 py-1 rounded-md text-sm font-semibold transition-colors ${strTimeSpan === span ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}>
                          {span.replace('_',' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </button>
                    ))}
                </div>
            </div>
            <div className="bg-gray-900 p-4 rounded-lg border border-gray-800 overflow-y-auto flex-1">
              {arrLeaderboard.length > 0 ? (
                arrLeaderboard.map(entry => {
                    const strFullName = `${entry.first_name || ''} ${entry.last_name || ''}`.trim();
                    const bIsCurrentUser = (entry.first_name === strFirstName && entry.last_name === strLastName);
                    return (
                        <div key={entry.rank} className={`flex justify-between p-3 rounded-md ${bIsCurrentUser ? 'bg-purple-900 bg-opacity-50' : ''}`}>
                            <span>{entry.rank}{getOrdinalSuffix(entry.rank)}: {strFullName || 'Anonymous'}</span>
                            <span className="font-semibold text-purple-400">{entry.cr_score}CR</span>
                        </div>
                    )
                })
              ) : (
                <p className="text-gray-400 text-center py-4">No leaderboard data available for this period.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* --- Sidebar --- */}
      <div className="w-64 bg-gray-900 border-l border-gray-800 p-6 flex flex-col flex-shrink-0">
        <div className="space-y-4">
          <Link href="/sets" className="flex items-center justify-center gap-3 w-full p-4 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-semibold transition-colors text-lg"><PlayIcon /> Play</Link>
          <Link href="/results" className="flex items-center justify-center gap-3 w-full p-4 bg-gray-800 hover:bg-gray-700 rounded-lg text-white font-semibold transition-colors border border-gray-700"><ResultsIcon /> Results</Link>
          <Link href="/uploader" className="flex items-center justify-center gap-3 w-full p-4 bg-gray-800 hover:bg-gray-700 rounded-lg text-white font-semibold transition-colors border border-gray-700"><UploaderIcon /> Uploader</Link>
          <Link href="/sharing" className="flex items-center justify-center gap-3 w-full p-4 bg-gray-800 hover:bg-gray-700 rounded-lg text-white font-semibold transition-colors border border-gray-700"><SharingIcon /> Sharing</Link>
          <Link href="/quests" className="flex items-center justify-center gap-3 w-full p-4 bg-gray-800 hover:bg-gray-700 rounded-lg text-white font-semibold transition-colors border border-gray-700">
            <StarIcon className="h-6 w-6"/> Quests
          </Link>
          <Link href="/account" className="flex items-center justify-center gap-3 w-full p-4 bg-gray-800 hover:bg-gray-700 rounded-lg text-white font-semibold transition-colors border border-gray-700"><SettingsIcon /> Settings</Link>
        </div>
        <div className="mt-auto">
          <ProfileMenu user={objUser} onLogout={handleLogout} />
        </div>
      </div>
    </div>
  );
}
