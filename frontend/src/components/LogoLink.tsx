// frontend/src/components/LogoLink.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../supabaseClient';
import type { User } from '@supabase/supabase-js';

export default function LogoLink() {
  const [objUser, setObjUser] = useState<User | null>(null);
  const [bLoading, setBLoading] = useState(true);

  useEffect(() => {
    const checkUserInternal = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setObjUser(session?.user ?? null);
      setBLoading(false);
    };
    checkUserInternal();
  }, []);

  // Determine the correct destination based on login status
  const strHref = objUser ? '/dashboard' : '/';

  if (bLoading) {
    // Render a non-clickable placeholder while checking the session
    return <div className="text-2xl font-bold text-white">StudyAI</div>;
  }

  return (
    <Link href={strHref} className="text-2xl font-bold text-white">
      StudyAI
    </Link>
  );
}
