// frontend/src/components/LogoLink.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../supabaseClient';
import type { User } from '@supabase/supabase-js';

export default function LogoLink() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };
    checkUser();
  }, []);

  // Determine the correct destination based on login status
  const href = user ? '/dashboard' : '/';

  if (loading) {
    // Render a non-clickable placeholder while checking the session
    return <div className="text-2xl font-bold text-white">StudyAI</div>;
  }

  return (
    <Link href={href} className="text-2xl font-bold text-white">
      StudyAI
    </Link>
  );
}