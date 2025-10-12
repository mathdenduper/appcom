// Author: Tristan Bong
// Page name: signup/page.tsx
// Page purpose: Signup page for new users. Displays the AuthForm in signup mode.
// Date created: 14/09/2025

'use client';

import AuthForm from '../../components/AuthForm';

/**
 * Component: SignupPage
 * Purpose: Displays the signup form for new users.
 * INPUT: None
 * PROCESS: Renders AuthForm component in 'signup' mode
 * OUTPUT: Signup UI
 */
export default function SignupPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center pt-20">
      <AuthForm mode="signup" />
    </div>
  );
}
