// frontend/src/app/theme/page.tsx
'use client';

import { useTheme } from 'next-themes';
import { PaintBrushIcon, FireIcon, BeakerIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';

export default function ThemePage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return null; 
  }

  // Helper to determine the active theme, defaulting to 'dark'
  const activeTheme = theme === 'system' || !theme ? 'dark' : theme;

  return (
    <div className="min-h-screen bg-background text-foreground pt-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Appearance</h1>
        
        <div className="bg-muted border border-accent p-8 rounded-2xl shadow-2xl">
          <h2 className="text-2xl font-bold mb-6">Choose your colourway</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Default Theme */}
            <button
              onClick={() => setTheme('dark')} // 'dark' is our default theme name
              className={`flex flex-col items-center justify-center p-6 rounded-lg border-2 transition-all duration-200 ${
                activeTheme === 'dark' ? 'border-primary' : 'border-accent hover:border-primary/70'
              }`}
            >
              <PaintBrushIcon className="h-12 w-12 mb-3 text-purple-500" />
              <span className="font-semibold">Default</span>
            </button>

            {/* Crimson Theme */}
            <button
              onClick={() => setTheme('theme-crimson')}
              className={`flex flex-col items-center justify-center p-6 rounded-lg border-2 transition-all duration-200 ${
                activeTheme === 'theme-crimson' ? 'border-red-500' : 'border-accent hover:border-red-500/70'
              }`}
            >
              <FireIcon className="h-12 w-12 mb-3 text-red-500" />
              <span className="font-semibold">Crimson</span>
            </button>

            {/* Ocean Theme */}
            <button
              onClick={() => setTheme('theme-ocean')}
              className={`flex flex-col items-center justify-center p-6 rounded-lg border-2 transition-all duration-200 ${
                activeTheme === 'theme-ocean' ? 'border-cyan-500' : 'border-accent hover:border-cyan-500/70'
              }`}
            >
              <BeakerIcon className="h-12 w-12 mb-3 text-cyan-500" />
              <span className="font-semibold">Ocean</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}