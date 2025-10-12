'use client';

import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';

interface ToastProps {
  message: string | null;
  show: boolean;
}

export default function Toast({ message, show }: ToastProps) {
  const [bIsVisible, setBIsVisible] = useState(false);

  // This effect handles the fade-in and fade-out animations
  useEffect(() => {
    if (show) {
      setBIsVisible(true);
    } else {
      // Delay hiding to allow for fade-out animation
      const nTimer = setTimeout(() => setBIsVisible(false), 300); // Matches the duration
      return () => clearTimeout(nTimer);
    }
  }, [show]);

  if (!bIsVisible) {
    return null;
  }

  return (
    <div
      className={`fixed bottom-5 right-5 flex items-center gap-4 p-4 rounded-lg shadow-lg bg-card border border-border text-foreground transition-opacity duration-300 ${
        show ? 'opacity-100' : 'opacity-0'
      }`}
      role="alert"
    >
      <CheckCircleIcon className="h-6 w-6 text-green-500 flex-shrink-0" />
      <span className="font-semibold">{message}</span>
    </div>
  );
}
