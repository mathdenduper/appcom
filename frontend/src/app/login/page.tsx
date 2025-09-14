'use client'; 
import AuthForm from '../../components/AuthForm';

// This page is now much simpler.
// It only needs to display the AuthForm in 'signin' mode.
export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center pt-20">
        <AuthForm mode="signin" />
    </div>
  );
}