'use client';
import AuthForm from '../../components/AuthForm';

// This page is also simpler now.
// It only needs to display the AuthForm in 'signup' mode.
export default function SignupPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center pt-20">
        <AuthForm mode="signup" />
    </div>
  );
}