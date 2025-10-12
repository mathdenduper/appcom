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
  const [arrShares, setArrShares] = useState<any[]>([]);
  const [bLoading, setBLoading] = useState(true);

  const fetchSharesInternal = async () => {
    setBLoading(true);
    try {
      const responseInternal = await fetch(getApiUrl(`/shares/inbox/${user.id}`));
      if (!responseInternal.ok) throw new Error('Failed to fetch shares');
      const arrData = await responseInternal.json();
      setArrShares(arrData);
    } catch (errInternal) {
      console.error(errInternal);
    }
    setBLoading(false);
  };
  
  const handleActionInternal = async (objShare: any, strAction: 'accept' | 'decline') => {
      let strEndpoint = '';
      let objPayload: any = {};

      if (strAction === 'accept') {
          strEndpoint = '/shares/accept';
          objPayload = {
              share_id: objShare.id,
              recipient_id: user.id,
              study_set_id: objShare.study_set_id,
          };
      } else {
          strEndpoint = '/shares/decline';
          objPayload = { share_id: objShare.id };
      }

      try {
        await fetch(getApiUrl(strEndpoint), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(objPayload),
        });
        fetchSharesInternal();
        onAction();
      } catch (errInternal) {
        console.error(`Failed to ${strAction} share:`, errInternal);
        alert(`Failed to ${strAction} share.`);
      }
  };

  const nUnreadCount = arrShares.filter(s => s.status === 'pending').length;

  return (
    <Popover className="relative">
      {({ open }) => (
        <>
          <Popover.Button
            onClick={() => !open && fetchSharesInternal()}
            className="relative p-2 rounded-full text-gray-300 hover:text-white hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
          >
            <EnvelopeIcon className="h-6 w-6" />
            {nUnreadCount > 0 && (
              <span className="absolute top-0 right-0 block h-5 w-5 rounded-full bg-red-600 ring-2 ring-gray-800 text-xs font-bold flex items-center justify-center">
                {nUnreadCount}
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
                {bLoading ? <p className="text-center text-gray-300 py-4">Loading...</p>
                : arrShares.length > 0 ? (
                  <ul className="space-y-2">
                    {arrShares.map((objShare) => (
                      <li key={objShare.id} className={`p-3 rounded-md ${objShare.status !== 'pending' ? 'opacity-60' : 'bg-gray-700/50'}`}>
                        <p className="font-semibold text-white">{objShare.study_set_title || 'Untitled Set'}</p>
                        <p className="text-sm text-gray-300">
                          From: {objShare.sender_first_name || 'Unknown'} {objShare.sender_last_name || ''}
                        </p>
                        
                        {objShare.status === 'accepted' && (
                          <div className="mt-2 flex items-center gap-2 text-green-400 text-xs">
                            <CheckCircleIcon className="h-4 w-4" />
                            <span>Accepted</span>
                          </div>
                        )}

                        {objShare.status === 'declined' && (
                          <div className="mt-2 flex items-center gap-2 text-red-400 text-xs">
                            <XCircleIcon className="h-4 w-4" />
                            <span>Declined</span>
                          </div>
                        )}

                        {objShare.status === 'pending' && (
                          <div className="mt-2 flex items-center gap-2">
                            <button 
                              onClick={() => handleActionInternal(objShare, 'decline')}
                              className="flex-1 px-3 py-1.5 text-sm bg-gray-600 hover:bg-gray-500 text-white font-semibold rounded-md transition-colors">
                              Decline
                            </button>
                            <button 
                              onClick={() => handleActionInternal(objShare, 'accept')}
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


// --- HEADER COMPONENT ---
export default function Header() {
  const [objUser, setObjUser] = useState<User | null>(null);
  const [arrInboxShares, setArrInboxShares] = useState<any[]>([]);
  const [bInboxLoading, setBInboxLoading] = useState(true);
  const router = useRouter();
  const strPathname = usePathname();

  const fetchInboxInternal = async (currentUser: User) => {
    if (!currentUser) return;
    setBInboxLoading(true);
    try {
      const responseInternal = await fetch(getApiUrl(`/shares/inbox/${currentUser.id}`));
      if (!responseInternal.ok) throw new Error('Failed to fetch shares');
      const arrData = await responseInternal.json();
      setArrInboxShares(arrData);
    } catch (errInternal) {
      console.error(errInternal);
    }
    setBInboxLoading(false);
  };
  
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setObjUser(session?.user ?? null);
      if (session?.user) {
        fetchInboxInternal(session.user);
      } else {
        setArrInboxShares([]);
      }
    });
    const getInitialUserInternal = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        setObjUser(user);
        if (user) {
            fetchInboxInternal(user);
        }
    }
    getInitialUserInternal();
    return () => subscription?.unsubscribe();
  }, []);

  const handleSignOutInternal = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const getInitialsInternal = () => {
    const strFirstName = objUser?.user_metadata?.first_name || '';
    const strLastName = objUser?.user_metadata?.last_name || '';
    if (strFirstName && strLastName) {
      return `${strFirstName[0]}${strLastName[0]}`;
    }
    return objUser?.email?.[0].toUpperCase() || '';
  };

  const bIsHomePage = strPathname === '/';

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-black bg-opacity-30 backdrop-blur-lg border-b border-gray-800">
      <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
        <LogoLink />
        <div className="flex items-center space-x-4">
          {objUser && !bIsHomePage ? (
            <div className="flex items-center space-x-4">
              <InboxPopover user={objUser} onAction={() => objUser && fetchInboxInternal(objUser)} />
              <Menu as="div" className="relative">
                <div>
                  <Menu.Button className="flex items-center text-sm rounded-full text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white">
                    <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center font-bold">
                      {getInitialsInternal()}
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
                        <button onClick={handleSignOutInternal} className={`${active ? 'bg-gray-700' : ''} w-full text-left block px-4 py-2 text-sm text-red-400`}>
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
