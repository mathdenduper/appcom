// Author: Tristan Bong
// Page name: Toast.tsx
// Page purpose: Displays a toast notification with fade-in and fade-out animations
// Date created: 14/09/2025

'use client';

import { CheckCircleIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';

interface ToastProps {
  message: string | null; // INPUT: the message to display in the toast
  show: boolean;           // INPUT: whether the toast should currently be shown
}

export default function Toast({ message, show }: ToastProps) {
  // PROCESS: visibility state for fade-in/fade-out
  const [bIsVisible, setBIsVisible] = useState(false);

  // PROCESS: handle fade-in and fade-out animations based on show prop
  useEffect(() => {
    if (show) {
      // OUTPUT: make toast visible immediately
      setBIsVisible(true);
    } else {
      // PROCESS: delay hiding for fade-out animation
      const nTimer = setTimeout(() => setBIsVisible(false), 300); // Matches CSS transition duration
      return () => clearTimeout(nTimer); // Cleanup timer
    }
  }, [show]);

  // OUTPUT: nothing rendered if toast not visible
  if (!bIsVisible) {
    return null;
  }

  // OUTPUT: toast component with icon and message
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
