'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
  const pathname = usePathname();
  
  // We only show the Sign In/Up buttons on the homepage ('/').
  const showAuthButtons = pathname === '/';

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-black bg-opacity-30 backdrop-blur-lg border-b border-gray-800">
      <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
        <div className="text-2xl font-bold text-white">
          <Link href="/">StudyAI</Link>
        </div>
        <div className="flex items-center space-x-4">
          {showAuthButtons ? (
            <>
              <Link href="/login" className="text-gray-300 hover:text-white transition-colors">
                Sign In
              </Link>
              <Link href="/signup" className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                Sign Up
              </Link>
            </>
          ) : (
            // This is a placeholder to prevent the layout from shifting on other pages.
            // It has a fixed width to match the space taken by the buttons.
            <div style={{ width: '170px', height: '40px' }} />
          )}
        </div>
      </nav>
    </header>
  );
}