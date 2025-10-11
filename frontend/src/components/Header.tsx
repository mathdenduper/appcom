'use client';

import { useEffect, useState, Fragment } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/supabaseClient';
import type { User } from '@supabase/supabase-js';
import Link from 'next/link';
import { Menu, Popover, Transition } from '@headlessui/react';
import { ChevronDownIcon, EnvelopeIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import LogoLink from './LogoLink';
import { getApiUrl } from '@/lib';

// --- INBOX POPOUT COMPONENT (WITH DECLINED STATE) ---
function InboxPopover({ user, onAction }: { user: User; onAction: () => void }) {
  const [shares, setShares] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchShares = async () => {
    setLoading(true);
    try {
      const response = await fetch(getApiUrl(`/shares/inbox/${user.id}`));
      if (!response.ok) throw new Error('Failed to fetch shares');
      const data = await response.json();
      setShares(data);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };
  
  // Refactored to handle both accept and decline
  const handleAction = async (share: any, action: 'accept' | 'decline') => {
      let endpoint = '';
      let payload: any = {};

      if (action === 'accept') {
          endpoint = '/shares/accept';
          payload = {
              share_id: share.id,
              recipient_id: user.id,
              study_set_id: share.study_set_id,
          };
      } else { // decline
          endpoint = '/shares/decline';
          payload = { share_id: share.id };
      }

      try {
        await fetch(getApiUrl(endpoint), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        fetchShares();
        onAction();
      } catch (error) {
        console.error(`Failed to ${action} share:`, error);
        alert(`Failed to ${action} share.`);
      }
  };

  const unreadCount = shares.filter(s => s.status === 'pending').length;

  return (
    <Popover className="relative">
      {({ open }) => (
        <>
          <Popover.Button
            onClick={() => !open && fetchShares()}
            className="relative p-2 rounded-full text-gray-300 hover:text-white hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
          >
            <EnvelopeIcon className="h-6 w-6" />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 block h-5 w-5 rounded-full bg-red-600 ring-2 ring-gray-800 text-xs font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </Popover.Button>
          <Transition
            as={Fragment}
            enter="transition ease-out duration-200"
            enterFrom="opacity-0 translate-y-1"
            enterTo="opacity-100 translate-y-0"
            leave="transition ease-in duration-150"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 translate-y-1"
          >
            <Popover.Panel className="absolute right-0 z-10 mt-2 w-80 origin-top-right rounded-md bg-gray-800 shadow-lg ring-1 ring-purple-600 focus:outline-none">
              <div className="p-4 border-b border-gray-700">
                <h3 className="text-lg font-semibold text-white">Inbox</h3>
              </div>
              <div className="p-2 max-h-96 overflow-y-auto">
                {loading ? <p className="text-center text-gray-300 py-4">Loading...</p>
                : shares.length > 0 ? (
                  <ul className="space-y-2">
                    {shares.map((share) => (
                      <li key={share.id} className={`p-3 rounded-md ${share.status !== 'pending' ? 'opacity-60' : 'bg-gray-700/50'}`}>
                        <p className="font-semibold text-white">{share.study_set_title || 'Untitled Set'}</p>
                        <p className="text-sm text-gray-300">
                          From: {share.sender_first_name || 'Unknown'} {share.sender_last_name || ''}
                        </p>
                        
                        {share.status === 'accepted' && (
                          <div className="mt-2 flex items-center gap-2 text-green-400 text-xs">
                            <CheckCircleIcon className="h-4 w-4" />
                            <span>Accepted</span>
                          </div>
                        )}

                        {share.status === 'declined' && (
                          <div className="mt-2 flex items-center gap-2 text-red-400 text-xs">
                            <XCircleIcon className="h-4 w-4" />
                            <span>Declined</span>
                          </div>
                        )}

                        {share.status === 'pending' && (
                          <div className="mt-2 flex items-center gap-2">
                            <button 
                              onClick={() => handleAction(share, 'decline')}
                              className="flex-1 px-3 py-1.5 text-sm bg-gray-600 hover:bg-gray-500 text-white font-semibold rounded-md transition-colors">
                              Decline
                            </button>
                            <button 
                              onClick={() => handleAction(share, 'accept')}
                              className="flex-1 px-3 py-1.5 text-sm bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-md transition-colors">
                              Accept
                            </button>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-center text-gray-300 py-8">Your inbox is empty.</p>
                )}
              </div>
            </Popover.Panel>
          </Transition>
        </>
      )}
    </Popover>
  );
}


// --- (The rest of your Header.tsx component remains unchanged) ---
export default function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [inboxShares, setInboxShares] = useState<any[]>([]);
  const [inboxLoading, setInboxLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const fetchInbox = async (currentUser: User) => {
    if (!currentUser) return;
    setInboxLoading(true);
    try {
      const response = await fetch(getApiUrl(`/shares/inbox/${currentUser.id}`));
      if (!response.ok) throw new Error('Failed to fetch shares');
      const data = await response.json();
      setInboxShares(data);
    } catch (error) {
      console.error(error);
    }
    setInboxLoading(false);
  };
  
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchInbox(session.user);
      } else {
        setInboxShares([]);
      }
    });
    const getInitialUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        if (user) {
            fetchInbox(user);
        }
    }
    getInitialUser();
    return () => subscription?.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const getInitials = () => {
    const firstName = user?.user_metadata?.first_name || '';
    const lastName = user?.user_metadata?.last_name || '';
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`;
    }
    return user?.email?.[0].toUpperCase() || '';
  };

  const isHomePage = pathname === '/';

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-black bg-opacity-30 backdrop-blur-lg border-b border-gray-800">
      <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
        <LogoLink />
        <div className="flex items-center space-x-4">
          {user && !isHomePage ? (
            <div className="flex items-center space-x-4">
              <InboxPopover user={user} onAction={() => user && fetchInbox(user)} />
              <Menu as="div" className="relative">
                <div>
                  <Menu.Button className="flex items-center text-sm rounded-full text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white">
                    <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center font-bold">
                      {getInitials()}
                    </div>
                  </Menu.Button>
                </div>
                <Transition as={Fragment} enter="transition ease-out duration-100" enterFrom="transform opacity-0 scale-95" enterTo="transform opacity-100 scale-100" leave="transition ease-in duration-75" leaveFrom="transform opacity-100 scale-100" leaveTo="transform opacity-0 scale-95">
                  <Menu.Items className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none">
                     <Menu.Item>
                        {({ active }) => (
                          <Link href="/account" className={`${active ? 'bg-gray-700' : ''} block px-4 py-2 text-sm text-gray-300`}>
                            Account
                          </Link>
                        )}
                      </Menu.Item>
                    <Menu.Item>
                       {({ active }) => (
                        <button onClick={handleSignOut} className={`${active ? 'bg-gray-700' : ''} w-full text-left block px-4 py-2 text-sm text-red-400`}>
                          Sign out
                        </button>
                      )}
                    </Menu.Item>
                  </Menu.Items>
                </Transition>
              </Menu>
            </div>
          ) : (
            <>
              <Link href="/login" className="text-gray-300 hover:text-white transition-colors">
                Sign In
              </Link>
              <Link href="/signup" className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}