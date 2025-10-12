// Author: Tristan Bong
// Page name: results/page.tsx
// Page purpose: Displays quiz results history for the logged-in user
// Date created: 14/09/2025

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../supabaseClient';
import type { User } from '@supabase/supabase-js';
import Link from 'next/link';
import { getApiUrl } from '../../lib';

interface QuizAttempt {
  id: string;
  created_at: string;
  score: number;
  total_questions: number;
  set_id: string;
  study_sets: {
    title: string;
  };
}

// Function: Main component that fetches and renders the user’s quiz results
export default function ResultsPage() {
  // INPUT: React state variables
  const [objUser, setObjUser] = useState<User | null>(null);
  const [arrAttempts, setArrAttempts] = useState<QuizAttempt[]>([]);
  const [bLoading, setBLoading] = useState(true);
  const [strError, setStrError] = useState<string | null>(null);
  const router = useRouter();

  // PROCESS: Fetch results data when the page loads
  useEffect(() => {
    const fnFetchResultsData = async () => {
      // INPUT: Retrieves current session from Supabase
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        // PROCESS: Save authenticated user to state
        setObjUser(session.user);

        try {
          // INPUT: Build API URL for results
          const strApiUrl = getApiUrl(`/get-results/${session.user.id}`);

          // PROCESS: Fetch quiz results from backend
          const res = await fetch(strApiUrl);
          if (!res.ok) throw new Error('Failed to fetch results history.');

          // PROCESS: Parse JSON response
          const arrData = await res.json();

          // OUTPUT: Store results data into state
          setArrAttempts(arrData);

        } catch (err: any) {
          // OUTPUT: Display error message if API fails
          setStrError(err.message);
        }
      } else {
        // OUTPUT: Redirect to login if no session
        router.push('/login');
      }

      // PROCESS: Stop loading state once finished
      setBLoading(false);
    };

    fnFetchResultsData();

    // PROCESS: Refetch data whenever user refocuses browser tab
    const fnHandleFocus = () => fnFetchResultsData();
    window.addEventListener('focus', fnHandleFocus);

    // OUTPUT: Cleanup event listener when component unmounts
    return () => window.removeEventListener('focus', fnHandleFocus);
  }, [router]);

  // OUTPUT: Show loading screen
  if (bLoading) {
    return (
      <div className="min-h-screen bg-background text-white flex items-center justify-center">
        <p className="text-lg text-gray-400">Loading your results...</p>
      </div>
    );
  }

  // OUTPUT: Show error message if fetching failed
  if (strError) {
    return <p className="text-center text-red-400 pt-40">Error: {strError}</p>;
  }

  // OUTPUT: Render results list or empty state
  return (
    <div className="min-h-screen bg-background text-white pt-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">My Results</h1>
          <Link href="/dashboard" className="text-purple-400 hover:underline">
            &larr; Back to Dashboard
          </Link>
        </div>

        {/* PROCESS + OUTPUT: Display past attempts */}
        {arrAttempts.length > 0 ? (
          <div className="space-y-4">
            {arrAttempts.map(objAttempt => {
              // PROCESS: Calculate percentage score
              const nPercentage = Math.round((objAttempt.score / objAttempt.total_questions) * 100);

              // OUTPUT: Render each result card
              return (
                <div key={objAttempt.id} className="bg-gray-900 border border-gray-800 p-4 rounded-lg flex items-center justify-between">
                  <div>
                    <h2 className="font-bold text-lg">{objAttempt.study_sets.title}</h2>
                    <p className="text-sm text-gray-400">
                      Completed on {new Date(objAttempt.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-xl text-purple-400">{nPercentage}%</p>
                    <p className="text-sm text-gray-400">{objAttempt.score} / {objAttempt.total_questions}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // OUTPUT: Empty state when no results exist
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
