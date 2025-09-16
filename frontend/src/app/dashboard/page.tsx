'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../supabaseClient';
import type { User } from '@supabase/supabase-js';
import Link from 'next/link';
import { getApiUrl } from '../../lib';

// --- Reusable Icon Components ---
// NOTE: These are now correctly defined at the top level of the file.
const PlayIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>;
const ResultsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>;
const UploaderIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>;
const SharingIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>;
const SettingsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06-.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>;

// --- Data Structures ---
interface StudySet {
  id: string;
  title: string;
  created_at: string;
}

// --- Profile Menu Component ---
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
                        <li><a href="#" className="block px-3 py-2 text-gray-300 hover:bg-gray-700 rounded-md transition-colors">Account</a></li>
                        <li><a href="#" className="block px-3 py-2 text-gray-300 hover:bg-gray-700 rounded-md transition-colors">Theme</a></li>
                        <li><button onClick={onLogout} className="w-full text-left px-3 py-2 text-red-400 hover:bg-gray-700 rounded-md transition-colors">Logout</button></li>
                    </ul>
                </div>
            )}
        </div>
    );
};


// --- Main Dashboard Page ---
export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [studySets, setStudySets] = useState<StudySet[]>([]);
  const router = useRouter();

  useEffect(() => {
    const checkUserAndFetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        
        try {
          const apiUrl = getApiUrl(`/my-study-sets/${session.user.id}`);
          const response = await fetch(apiUrl);
          if (!response.ok) {
            throw new Error('Failed to fetch study sets.');
          }
          const data = await response.json();
          setStudySets(data);
        } catch (error) {
          console.error("Error fetching study sets:", error);
        }

      } else {
        router.push('/login');
      }
      setLoading(false);
    };
    checkUserAndFetchData();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
        <div className="min-h-screen bg-background text-white flex items-center justify-center">
            <p className="text-lg text-gray-400">Loading your dashboard...</p>
        </div>
    );
  }
  
  if (!user) {
    return null;
  }
  
  const userName = user.user_metadata?.first_name || user.email?.split('@')[0] || 'Student';
  const userInitials = (user.user_metadata?.first_name?.charAt(0) || '') + (user.user_metadata?.last_name?.charAt(0) || '');
  const crScore = 1600; // Placeholder
  const leaderboard = [
    { rank: 23, name: 'Jayden Chen', score: 1685 },
    { rank: 24, name: 'Kevin Park', score: 1675 },
  ];

  return (
    // This is the main container with the correct full-screen layout
    <div className="h-screen bg-background text-white flex">
      
      {/* --- Main Content Area (with padding for the header) --- */}
      <div className="flex-1 p-8 pt-24 flex flex-col min-h-0">
        {/* Profile Header (doesn't grow or shrink) */}
        <div className="flex items-center space-x-6 mb-8 flex-shrink-0">
          <div className="w-24 h-24 bg-purple-600 rounded-full flex items-center justify-center text-4xl font-bold flex-shrink-0">
            {userInitials.toUpperCase() || userName.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <h1 className="text-4xl font-bold">{userName}</h1>
            <p className="text-gray-400 text-lg">{crScore} CR</p>
          </div>
        </div>

        {/* This container will grow to fill the remaining vertical space */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 flex-1 min-h-0">
          
          {/* My Recent Study Sets Column (now a flex container) */}
          <div className="flex flex-col min-h-0">
            <h2 className="text-2xl font-bold mb-4 flex-shrink-0">My Recent Study Sets</h2>
            <div className="space-y-3 overflow-y-auto pr-4 flex-1 bg-gray-900 border border-gray-800 rounded-lg p-4">
              {studySets.length > 0 ? (
                studySets.slice(0, 8).map(set => (
                  <Link href={`/play/${set.id}`} key={set.id} className="block w-full text-left p-4 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 transition-colors flex justify-between items-center">
                    <span>{set.title}</span>
                    <span className="text-gray-500">&gt;</span>
                  </Link>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                    <p className="text-gray-400">You haven't created any study sets yet.</p>
                    <Link href="/uploader" className="mt-4 inline-block bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg">
                        Create your first set
                    </Link>
                </div>
              )}
            </div>
          </div>

          {/* CR Leaderboard Column (now a flex container) */}
          <div className="flex flex-col min-h-0">
            <h2 className="text-2xl font-bold mb-4 flex-shrink-0">CR Leaderboard</h2>
            <div className="bg-gray-900 p-4 rounded-lg border border-gray-800 overflow-y-auto flex-1">
              {leaderboard.map(entry => (
                <div key={entry.rank} className={`flex justify-between p-3 rounded-md`}>
                  <span>{entry.rank}th: {entry.name}</span>
                  <span className="font-semibold">{entry.score}Cr</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* --- Right Sidebar (Navigation) (with padding for the header) --- */}
      <div className="w-64 bg-gray-900 border-l border-gray-800 p-6 flex flex-col flex-shrink-0 pt-24">
        <div className="space-y-4">
            <Link href={studySets.length > 0 ? `/play/${studySets[0].id}` : '/uploader'} className="flex items-center justify-center gap-3 w-full p-4 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-semibold transition-colors text-lg"><PlayIcon /> Play</Link>
            <button className="flex items-center justify-center gap-3 w-full p-4 bg-gray-800 hover:bg-gray-700 rounded-lg text-white font-semibold transition-colors border border-gray-700"><ResultsIcon /> Results</button>
            <Link href="/uploader" className="flex items-center justify-center gap-3 w-full p-4 bg-gray-800 hover:bg-gray-700 rounded-lg text-white font-semibold transition-colors border border-gray-700"><UploaderIcon /> Uploader</Link>
            <button className="flex items-center justify-center gap-3 w-full p-4 bg-gray-800 hover:bg-gray-700 rounded-lg text-white font-semibold transition-colors border border-gray-700"><SharingIcon /> Sharing</button>
            <button className="flex items-center justify-center gap-3 w-full p-4 bg-gray-800 hover:bg-gray-700 rounded-lg text-white font-semibold transition-colors border border-gray-700"><SettingsIcon /> Settings</button>
        </div>
        <div className="mt-auto">
            <ProfileMenu user={user} onLogout={handleLogout} />
        </div>
      </div>

    </div>
  );
}