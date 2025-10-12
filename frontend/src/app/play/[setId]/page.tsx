// Author: Tristan Bong
// Page name: play/[setId]/page.tsx
// Page purpose: Allows users to select how they want to study a given set (Flashcards, Quiz, etc.)
// Date created: 14/09/2025

'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getApiUrl } from '../../../lib';

// --- Data Structure for the Study Set ---
interface StudySet {
  id: string;
  title: string;
}

// --- Icon Components ---
const FlashcardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="2" ry="2"></rect>
    <line x1="2" y1="12" x2="22" y2="12"></line>
  </svg>
);

const QuizIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
    <polyline points="14 2 14 8 20 8"></polyline>
    <line x1="16" y1="13" x2="8" y2="13"></line>
    <line x1="16" y1="17" x2="8" y2="17"></line>
    <polyline points="10 9 9 9 8 9"></polyline>
  </svg>
);

const TimedGameIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12 6 12 12 16 14"></polyline>
  </svg>
);

// --- Main Page Component ---
// Function purpose: Displays the study hub for a selected study set with mode options (Flashcards, Quiz, Timed Game)
export default function GameSelectPage() {

  // INPUT: State variables for storing study set data and fetch status
  const [objStudySet, setObjStudySet] = useState<StudySet | null>(null);
  const [bLoading, setBLoading] = useState(true);
  const [strError, setStrError] = useState<string | null>(null);

  // INPUT: Fetch setId from the URL
  const params = useParams();
  const strSetId = params.setId as string;

  // --- Fetch Study Set Info ---
  // Function purpose: Fetches study set data from API based on setId
  useEffect(() => {
    if (!strSetId) return;

    const fetchStudySetInfo = async () => {

      // PROCESS: Reset loading and error states
      setBLoading(true);
      setStrError(null);

      // INPUT: Construct the API endpoint
      const strApiUrl = getApiUrl(`/study-set/${strSetId}`);

      try {
        // PROCESS: Make API request to get study set data
        const res = await fetch(strApiUrl);
        if (!res.ok) {
          const result = await res.json();
          throw new Error(result.detail || 'Failed to fetch study set.');
        }

        // PROCESS: Parse the returned JSON
        const data = await res.json();

        // OUTPUT: Store the study set info in state
        setObjStudySet(data.study_set);

      } catch (err: any) {
        // OUTPUT: Store error message in state
        setStrError(err.message);
      } finally {
        // OUTPUT: Set loading state to false when done
        setBLoading(false);
      }
    };

    // PROCESS: Trigger the fetch on component mount
    fetchStudySetInfo();
  }, [strSetId]);

  // --- Conditional Renders (Outputs based on process states) ---

  // OUTPUT: Loading screen
  if (bLoading) return <p className="text-center text-white pt-40">Loading study hub...</p>;

  // OUTPUT: Error screen
  if (strError) return <p className="text-center text-red-400 pt-40">Error: {strError}</p>;

  // OUTPUT: Study set not found
  if (!objStudySet) {
    return (
      <div className="min-h-screen bg-background text-white flex flex-col items-center justify-center pt-24 px-4">
        <p className="text-center text-white">This study set could not be found.</p>
        <Link href="/dashboard" className="text-purple-400 hover:underline mt-4">&larr; Back to Dashboard</Link>
      </div>
    );
  }

  // --- MAIN OUTPUT: Study Hub Interface ---
  return (
    <div className="min-h-screen bg-background text-white flex flex-col items-center justify-center pt-24 px-4">
      <div className="w-full max-w-2xl text-center">
        {/* INPUT: Title from fetched study set */}
        <h1 className="text-4xl font-bold mb-2">{objStudySet.title}</h1>

        <p className="text-lg text-gray-400 mb-10">Choose a way to study</p>
        
        {/* PROCESS: Display 3 study mode options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* OUTPUT: Flashcards option */}
          <Link href={`/play/${strSetId}/flashcards`}
            className="bg-gray-900 border border-gray-800 p-6 rounded-2xl hover:border-purple-600 hover:scale-105 transition-transform flex flex-col items-center">
            <FlashcardIcon />
            <h3 className="text-xl font-semibold mt-4">Flashcards</h3>
            <p className="text-gray-400 text-sm mt-2">Review your notes with classic cards.</p>
          </Link>
          
          {/* OUTPUT: Quiz option */}
          <Link href={`/play/${strSetId}/quiz`}
            className="bg-gray-900 border border-gray-800 p-6 rounded-2xl hover:border-purple-600 hover:scale-105 transition-transform flex flex-col items-center">
            <QuizIcon />
            <h3 className="text-xl font-semibold mt-4">Quiz (MCQ)</h3>
            <p className="text-gray-400 text-sm mt-2">Test your knowledge with multiple choice.</p>
          </Link>

          {/* OUTPUT: Timed game option (disabled) */}
          <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl flex flex-col items-center opacity-50 cursor-not-allowed">
            <TimedGameIcon />
            <h3 className="text-xl font-semibold mt-4">Timed Game</h3>
            <p className="text-gray-400 text-sm mt-2">Race against the clock to answer quickly.</p>
            <span className="text-xs text-purple-400 mt-4">(Coming Soon)</span>
          </div>
        </div>
        
        {/* OUTPUT: Back navigation */}
        <div className="mt-12">
          <Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors">&larr; Back to Dashboard</Link>
        </div>
      </div>
    </div>
  );
}
