// Author: Tristan Bong
// Page name: LogoLink.tsx
// Page purpose: Displays the site logo and links to homepage or dashboard based on login status
// Date created: 14/09/2025

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../supabaseClient';
import type { User } from '@supabase/supabase-js';

export default function LogoLink() {
  // INPUT: None directly, uses Supabase session internally
  const [objUser, setObjUser] = useState<User | null>(null); // PROCESS: stores current user
  const [bLoading, setBLoading] = useState(true);            // PROCESS: loading state while checking session

  // PROCESS: Check if user is logged in on component mount
  useEffect(() => {
    const checkUserInternal = async () => {
      const { data: { session } } = await supabase.auth.getSession(); // INPUT: Supabase session
      setObjUser(session?.user ?? null); // OUTPUT: set current user state
      setBLoading(false);               // OUTPUT: set loading to false
    };
    checkUserInternal();
  }, []);

  // PROCESS: Determine link destination based on login status
  const strHref = objUser ? '/dashboard' : '/'; // OUTPUT: href for Link

  if (bLoading) {
    // OUTPUT: render placeholder while checking session
    return <div className="text-2xl font-bold text-white">StudyAI</div>;
  }

  // OUTPUT: render clickable logo linking to homepage or dashboard
  return (
    <Link href={strHref} className="text-2xl font-bold text-white">
      StudyAI
    </Link>
  );
}
