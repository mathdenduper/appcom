// frontend/src/app/login/page.tsx
'use client'; // This is the crucial line we were missing.

import AuthForm from '../../components/AuthForm';

export default function LoginPage() {
  const handleAuthSuccess = (session: any) => {
    console.log("Login successful!", session);
    // When a user logs in, we redirect them to their dashboard.
    window.location.href = '/dashboard'; 
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center pt-20">
        <AuthForm mode="signin" onAuthSuccess={handleAuthSuccess} />
    </div>
  );
}