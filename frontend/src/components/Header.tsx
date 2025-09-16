// frontend/src/components/Header.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import LogoLink from './LogoLink'; // Import our new, smart component

export default function Header() {
  const pathname = usePathname();
  const showAuthButtons = pathname === '/';

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-black bg-opacity-30 backdrop-blur-lg border-b border-gray-800">
      <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
        {/* The old, simple Link is now replaced by our smart LogoLink */}
        <LogoLink />
        
        <div className="flex items-center space-x-4">
          {showAuthButtons ? (
            <>
              <Link href="/login" className="text-gray-300 hover:text-white transition-colours">
                Sign In
              </Link>
              <Link href="/signup" className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-colours">
                Sign Up
              </Link>
            </>
          ) : (
            <div style={{ width: '170px', height: '40px' }} />
          )}
        </div>
      </nav>
    </header>
  );
}