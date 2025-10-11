'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../supabaseClient';
import type { User } from '@supabase/supabase-js';
import Link from 'next/link';
import { getApiUrl } from '../../lib';
import { BookOpenIcon, UserGroupIcon } from '@heroicons/react/24/outline';


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


// --- (Your Reusable Icon and Profile Menu components remain unchanged here) ---
const PlayIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>;
const ResultsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>;
const UploaderIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>;
const SharingIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>;
const SettingsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06-.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>;

const ProfileMenu = ({ user, onLogout }: { user: User, onLogout: () => void }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const firstName = user.user_metadata?.first_name || '';
    const lastName = user.user_metadata?.last_name || '';
    const userName = `${firstName} ${lastName}`.trim() || user.email?.split('@')[0] || 'Student';
    const userInitials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || userName.substring(0, 2).toUpperCase();

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [menuRef]);

    return (
        <div className="relative" ref={menuRef}>
            <button onClick={() => setIsOpen(!isOpen)} className="flex items-center w-full space-x-4 p-4 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors border border-gray-700">
                <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0">
                    {userInitials}
                </div>
                <span className="font-semibold truncate">{userName}</span>
            </button>
            {isOpen && (
                <div className="absolute bottom-full mb-2 w-full bg-gray-800 border border-gray-700 rounded-lg shadow-lg p-2">
                    <ul className="space-y-1">
                        <li><Link href="/account" className="block px-3 py-2 text-gray-300 hover:bg-gray-700 rounded-md transition-colors">Account</Link></li>
                        <li><button onClick={onLogout} className="w-full text-left px-3 py-2 text-red-400 hover:bg-gray-700 rounded-md transition-colors">Logout</button></li>
                    </ul>
                </div>
            )}
        </div>
    );
};
const getOrdinalSuffix = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return s[(v - 20) % 10] || s[v] || s[0];
};

// --- Main Dashboard Page ---
export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [studySets, setStudySets] = useState<StudySet[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [timeSpan, setTimeSpan] = useState<'daily' | 'weekly' | 'monthly' | 'yearly' | 'all_time'>('all_time');
  const router = useRouter();

  useEffect(() => {
    const fetchDashboardData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        
        try {
          const [profileResponse, setsResponse, leaderboardResponse] = await Promise.all([
            supabase.from('profiles').select('id, cr_score').eq('id', session.user.id).single(),
            fetch(getApiUrl(`/my-study-sets/${session.user.id}`)),
            fetch(getApiUrl(`/leaderboard?timespan=${timeSpan}`))
          ]);

          if (profileResponse.error && profileResponse.error.code !== 'PGRST116') {
              throw profileResponse.error;
          }
          setProfile(profileResponse.data);

          if (!setsResponse.ok) throw new Error('Failed to fetch study sets.');
          const setsData = await setsResponse.json();
          setStudySets(setsData);
          
          if (!leaderboardResponse.ok) throw new Error('Failed to fetch leaderboard.');
          const leaderboardData = await leaderboardResponse.json();
          setLeaderboard(leaderboardData);

        } catch (error) {
          console.error("Error fetching dashboard data:", error);
        }
      } else {
        router.push('/login');
      }
      setLoading(false);
    };

    fetchDashboardData();

    const handleFocus = () => fetchDashboardData();
    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [router, timeSpan]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };
  
  // --- NEW: Filter study sets into two lists ---
  const myOriginalSets = studySets.filter(set => !set.title.startsWith('(Shared)'));
  const sharedWithMeSets = studySets.filter(set => set.title.startsWith('(Shared)'));

  if (loading) {
    return <p className="text-center text-white pt-40">Loading your dashboard...</p>;
  }
  
  if (!user) {
    return null;
  }
  
  const firstName = user.user_metadata?.first_name || '';
  const lastName = user.user_metadata?.last_name || '';
  const userName = `${firstName} ${lastName}`.trim() || user.email?.split('@')[0] || 'Student';
  const userInitials = (firstName.charAt(0) || '') + (lastName.charAt(0) || '');
  const crScore = profile?.cr_score ?? 0;
  
  return (
    <div className="h-screen bg-background text-white flex pt-20">
      
      <div className="flex-1 p-8 flex flex-col min-h-0">
        <div className="flex items-center space-x-6 mb-8 flex-shrink-0">
          <div className="w-24 h-24 bg-purple-600 rounded-full flex items-center justify-center text-4xl font-bold flex-shrink-0">
            {userInitials.toUpperCase() || userName.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <h1 className="text-4xl font-bold">{userName}</h1>
            <p className="text-gray-400 text-lg">{crScore} CR</p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 flex-1 min-h-0">
          
          <div className="flex flex-col min-h-0">
            <h2 className="text-2xl font-bold mb-4 flex-shrink-0">My Recent Study Sets</h2>
            <div className="flex-1 bg-gray-900 border border-gray-800 rounded-lg p-4 flex flex-col min-h-0">
              
              {/* --- Your Original Sets --- */}
              <div className="flex-1 overflow-y-auto pr-2">
                <h3 className="text-lg font-semibold text-gray-400 mb-3 flex items-center gap-2"><BookOpenIcon className="h-5 w-5"/> Your Sets</h3>
                {myOriginalSets.length > 0 ? (
                  <div className="space-y-3">
                    {myOriginalSets.slice(0, 4).map(set => (
                      <Link href={`/play/${set.id}`} key={set.id} className="block w-full text-left p-4 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 transition-colors flex justify-between items-center">
                        <span>{set.title}</span>
                        <span className="text-gray-500">&gt;</span>
                      </Link>
                    ))}
                  </div>
                ) : <p className="text-sm text-gray-500">You haven't created any sets yet.</p>}
              </div>

              {/* --- Divider for shared sets (only if there are any) --- */}
              {sharedWithMeSets.length > 0 && <hr className="border-gray-700 my-4"/>}

              {/* --- Shared With You Sets --- */}
              <div className="flex-1 overflow-y-auto pr-2">
                <h3 className="text-lg font-semibold text-gray-400 mb-3 flex items-center gap-2"><UserGroupIcon className="h-5 w-5"/> Shared With You</h3>
                {sharedWithMeSets.length > 0 ? (
                  <div className="space-y-3">
                    {sharedWithMeSets.slice(0, 4).map(set => (
                      <Link href={`/play/${set.id}`} key={set.id} className="block w-full text-left p-4 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 transition-colors flex justify-between items-center">
                        <span className="truncate">{set.title.replace('(Shared) ', '')}</span>
                        <span className="text-gray-500">&gt;</span>
                      </Link>
                    ))}
                  </div>
                ) : <p className="text-sm text-gray-500">No sets have been shared with you yet.</p>}
              </div>

              {myOriginalSets.length === 0 && sharedWithMeSets.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <p className="text-gray-400">You haven't created or received any study sets yet.</p>
                  <Link href="/uploader" className="mt-4 inline-block bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg">
                    Create your first set
                  </Link>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col min-h-0">
            {/* ... (Your Leaderboard component remains unchanged here) ... */}
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
                <h2 className="text-2xl font-bold">CR Leaderboard</h2>
                <div className="flex space-x-1 bg-gray-800 p-1 rounded-lg">
                    <button onClick={() => setTimeSpan('daily')} className={`px-3 py-1 rounded-md text-sm font-semibold transition-colors ${timeSpan === 'daily' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}>Daily</button>
                    <button onClick={() => setTimeSpan('weekly')} className={`px-3 py-1 rounded-md text-sm font-semibold transition-colors ${timeSpan === 'weekly' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}>Weekly</button>
                    <button onClick={() => setTimeSpan('monthly')} className={`px-3 py-1 rounded-md text-sm font-semibold transition-colors ${timeSpan === 'monthly' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}>Monthly</button>
                    <button onClick={() => setTimeSpan('yearly')} className={`px-3 py-1 rounded-md text-sm font-semibold transition-colors ${timeSpan === 'yearly' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}>Yearly</button>
                    <button onClick={() => setTimeSpan('all_time')} className={`px-3 py-1 rounded-md text-sm font-semibold transition-colors ${timeSpan === 'all_time' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}>All Time</button>
                </div>
            </div>
            <div className="bg-gray-900 p-4 rounded-lg border border-gray-800 overflow-y-auto flex-1">
              {leaderboard.length > 0 ? (
                leaderboard.map(entry => {
                    const fullName = `${entry.first_name || ''} ${entry.last_name || ''}`.trim();
                    const isCurrentUser = (entry.first_name === firstName && entry.last_name === lastName);
                    return (
                        <div key={entry.rank} className={`flex justify-between p-3 rounded-md ${isCurrentUser ? 'bg-purple-900 bg-opacity-50' : ''}`}>
                            <span>{entry.rank}{getOrdinalSuffix(entry.rank)}: {fullName || 'Anonymous'}</span>
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
      
      <div className="w-64 bg-gray-900 border-l border-gray-800 p-6 flex flex-col flex-shrink-0">
        <div className="space-y-4">
          <Link href="/sets" className="flex items-center justify-center gap-3 w-full p-4 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-semibold transition-colors text-lg"><PlayIcon /> Play</Link>
          <Link href="/results" className="flex items-center justify-center gap-3 w-full p-4 bg-gray-800 hover:bg-gray-700 rounded-lg text-white font-semibold transition-colors border border-gray-700"><ResultsIcon /> Results</Link>
          <Link href="/uploader" className="flex items-center justify-center gap-3 w-full p-4 bg-gray-800 hover:bg-gray-700 rounded-lg text-white font-semibold transition-colors border border-gray-700"><UploaderIcon /> Uploader</Link>
          <Link href="/sharing" className="flex items-center justify-center gap-3 w-full p-4 bg-gray-800 hover:bg-gray-700 rounded-lg text-white font-semibold transition-colors border border-gray-700"><SharingIcon /> Sharing</Link>
          <button className="flex items-center justify-center gap-3 w-full p-4 bg-gray-800 hover:bg-gray-700 rounded-lg text-white font-semibold transition-colors border border-gray-700"><SettingsIcon /> Settings</button>
        </div>
        <div className="mt-auto">
          <ProfileMenu user={user} onLogout={handleLogout} />
        </div>
      </div>
    </div>
  );
}