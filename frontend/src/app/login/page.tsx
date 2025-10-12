// Author: Tristan Bong
// Page name: login/page.tsx
// Page purpose: Allows users to login
// Date created: 14/09/2025

'use client';

import AuthForm from '../../components/AuthForm';

// --- Login Page Component ---
export default function LoginPage() {
  // INPUT: None – this page does not take props or state

  // PROCESS: Simply renders the AuthForm component in "signin" mode
  // No additional logic or side effects needed

  // OUTPUT: Display full-page login form centered on the screen
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center pt-20">
      <AuthForm mode="signin" />
    </div>
  );
}
