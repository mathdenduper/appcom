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

export default function ResultsPage() {
  const [objUser, setObjUser] = useState<User | null>(null);
  const [arrAttempts, setArrAttempts] = useState<QuizAttempt[]>([]);
  const [bLoading, setBLoading] = useState(true);
  const [strError, setStrError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fnFetchResultsData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setObjUser(session.user);
        try {
          const strApiUrl = getApiUrl(`/get-results/${session.user.id}`);
          const res = await fetch(strApiUrl);
          if (!res.ok) throw new Error('Failed to fetch results history.');
          const arrData = await res.json();
          setArrAttempts(arrData);
        } catch (err: any) {
          setStrError(err.message);
        }
      } else {
        router.push('/login');
      }
      setBLoading(false);
    };

    fnFetchResultsData();

    // Refetch when browser tab regains focus
    const fnHandleFocus = () => fnFetchResultsData();
    window.addEventListener('focus', fnHandleFocus);
    return () => window.removeEventListener('focus', fnHandleFocus);
  }, [router]);

  if (bLoading) {
    return (
      <div className="min-h-screen bg-background text-white flex items-center justify-center">
        <p className="text-lg text-gray-400">Loading your results...</p>
      </div>
    );
  }

  if (strError) {
    return <p className="text-center text-red-400 pt-40">Error: {strError}</p>;
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

        {arrAttempts.length > 0 ? (
          <div className="space-y-4">
            {arrAttempts.map(objAttempt => {
              const nPercentage = Math.round((objAttempt.score / objAttempt.total_questions) * 100);
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
