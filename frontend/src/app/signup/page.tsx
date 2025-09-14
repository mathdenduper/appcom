// frontend/src/app/signup/page.tsx
'use client'; // This is the crucial line we were missing.

import AuthForm from '../../components/AuthForm';

export default function SignupPage() {
  const handleAuthSuccess = (session: any) => {
    console.log("Signup successful!", session);
    // After signup, we can also redirect to the dashboard.
    window.location.href = '/dashboard';
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center pt-20">
        <AuthForm mode="signup" onAuthSuccess={handleAuthSuccess} />
    </div>
  );
}