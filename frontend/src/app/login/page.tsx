'use client';
import AuthForm from '../../components/AuthForm';

export default function LoginPage() {
  const handleAuthSuccess = (session: any) => {
    console.log("Login successful!", session);
    // In a real app, you would redirect to the dashboard
    window.location.href = '/'; // Redirect home for now
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <AuthForm mode="signin" onAuthSuccess={handleAuthSuccess} />
    </div>
  );
}