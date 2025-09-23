'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../supabaseClient';
import type { User } from '@supabase/supabase-js';
import Link from 'next/link';
import { getApiUrl } from '../../lib';

// --- Data Structures for the Results Page ---
interface QuizAttempt {
  id: string;
  created_at: string;
  score: number;
  total_questions: number;
  set_id: string;
  study_sets: { // This comes from the database join
    title: string;
  };
}

export default function ResultsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // --- THIS IS THE UPDATED DATA FETCHING LOGIC ---
  useEffect(() => {
    const fetchResultsData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        try {
          const apiUrl = getApiUrl(`/get-results/${session.user.id}`);
          const response = await fetch(apiUrl);
          if (!response.ok) {
            throw new Error('Failed to fetch results history.');
          }
          const data = await response.json();
          setAttempts(data);
        } catch (err: any) {
          setError(err.message);
        }
      } else {
        router.push('/login');
      }
      setLoading(false);
    };

    fetchResultsData();

    // This professional trick refetches data when you navigate back to this browser tab
    const handleFocus = () => fetchResultsData();
    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [router]);

  if (loading) {
    return (
        <div className="min-h-screen bg-background text-white flex items-center justify-center">
            <p className="text-lg text-gray-400">Loading your results...</p>
        </div>
    );
  }
  if (error) {
    return <p className="text-center text-red-400 pt-40">Error: {error}</p>;
  }

  return (
    <div className="min-h-screen bg-background text-white pt-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold">My Results</h1>
            <Link href="/dashboard" className="text-purple-400 hover:underline">
                &larr; Back to Dashboard
            </Link>
        </div>
        
        {attempts.length > 0 ? (
          <div className="space-y-4">
            {attempts.map(attempt => {
              const percentage = Math.round((attempt.score / attempt.total_questions) * 100);
              return (
                <div key={attempt.id} className="bg-gray-900 border border-gray-800 p-4 rounded-lg flex items-center justify-between">
                  <div>
                    <h2 className="font-bold text-lg">{attempt.study_sets.title}</h2>
                    <p className="text-sm text-gray-400">
                      Completed on {new Date(attempt.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-xl text-purple-400">{percentage}%</p>
                    <p className="text-sm text-gray-400">{attempt.score} / {attempt.total_questions}</p>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-16 px-4 bg-gray-900 border border-gray-800 rounded-lg">
            <h2 className="text-2xl font-semibold">No Results Found</h2>
            <p className="text-gray-400 mt-2">You haven't completed any quizzes yet.</p>
            <Link href="/sets" className="mt-6 inline-block bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg">
                Play a Study Set
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}