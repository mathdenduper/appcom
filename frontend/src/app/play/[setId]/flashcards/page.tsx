// Author: Tristan Bong
// Page name: flashcards/page.tsx
// Page purpose: Allows users to study with flashcards
// Date created: 14/09/2025

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../../supabaseClient';
import Link from 'next/link';
import { getApiUrl, trackUserAction } from '../../../../lib';
import type { User } from '@supabase/supabase-js';

// --- Data Structures ---
interface StudyItem {
  id: string;
  question: string;
  answer: string;
}
interface StudySet {
  id: string;
  title: string;
}

// --- Flashcards Page ---
export default function FlashcardsPage() {
  // INPUT:
  // - URL param: setId
  // - User session from Supabase
  // - Study set data from API
  const [stSet, setStSet] = useState<StudySet | null>(null);
  const [astItems, setAstItems] = useState<StudyItem[]>([]);
  const [nCurrentIndex, setNCurrentIndex] = useState(0);
  const [bIsFlipped, setBIsFlipped] = useState(false);
  const [bLoading, setBLoading] = useState(true);
  const [strError, setStrError] = useState<string | null>(null);
  const [setSeenCards, setSetSeenCards] = useState<Set<string>>(new Set());
  const [setFlippedCards, setSetFlippedCards] = useState<Set<string>>(new Set());
  const [usrCurrent, setUsrCurrent] = useState<User | null>(null);
  const [bNavigating, setBNavigating] = useState(false);

  const params = useParams();
  const router = useRouter();
  const strSetId = params.setId as string;

  // PROCESS: Fetch current user from Supabase
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUsrCurrent(user);
    };
    fetchUser();
  }, []);

  // PROCESS: Fetch study set and its items
  useEffect(() => {
    if (!strSetId) return;
    const fetchStudySet = async () => {
      setBLoading(true);
      setStrError(null);
      const strApiUrl = getApiUrl(`/study-set/${strSetId}`);
      try {
        const res = await fetch(strApiUrl);
        if (!res.ok) {
          const result = await res.json();
          throw new Error(result.detail || 'Failed to fetch study set.');
        }
        const data = await res.json();
        setStSet(data.study_set);
        setAstItems(data.study_items);
      } catch (err: any) {
        setStrError(err.message);
      } finally {
        setBLoading(false);
      }
    };
    fetchStudySet();
  }, [strSetId]);

  // PROCESS: Award points for seen cards
  const awardPoints = async (nPoints: number) => {
    if (!usrCurrent) return;
    try {
      const strApiUrl = getApiUrl('/award-cr');
      await fetch(strApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            user_id: usrCurrent.id, 
            points_to_add: nPoints 
        }),
      });
    } catch (err) {
      console.error("Failed to award CR points:", err);
    }
  };

  useEffect(() => {
    if (astItems.length > 0 && usrCurrent && astItems[nCurrentIndex]) {
      const strCardId = astItems[nCurrentIndex].id;
      if (!setSeenCards.has(strCardId)) {
        awardPoints(1);
        setSetSeenCards(new Set(setSeenCards).add(strCardId));
      }
    }
  }, [nCurrentIndex, astItems, usrCurrent]);

  // PROCESS: Flip card and award points if flipped for first time
  const handleFlipCard = () => {
    if (astItems.length === 0 || !usrCurrent) return;
    const strCardId = astItems[nCurrentIndex].id;

    if (!bIsFlipped && !setFlippedCards.has(strCardId)) {
      awardPoints(2);
      trackUserAction(usrCurrent.id, 'flashcards_flipped', 1);
      setSetFlippedCards(new Set(setFlippedCards).add(strCardId));
    }
    setBIsFlipped(!bIsFlipped);
  };

  // PROCESS: Navigate cards
  const handlePreviousCard = useCallback(() => {
    if (bNavigating || nCurrentIndex === 0) return;
    setBNavigating(true);
    setBIsFlipped(false);
    setTimeout(() => {
      setNCurrentIndex((prev) => prev - 1);
      setBNavigating(false);
    }, 300);
  }, [bNavigating, nCurrentIndex]);

  const handleNextCard = useCallback(() => {
    if (bNavigating || nCurrentIndex >= astItems.length - 1) return;
    setBNavigating(true);
    setBIsFlipped(false);
    setTimeout(() => {
      setNCurrentIndex((prev) => prev + 1);
      setBNavigating(false);
    }, 300);
  }, [bNavigating, nCurrentIndex, astItems.length]);

  // PROCESS: Keyboard shortcuts for flipping and navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === ' ') {
        event.preventDefault();
        handleFlipCard();
      } else if (event.key === 'ArrowRight') {
        handleNextCard();
      } else if (event.key === 'ArrowLeft') {
        handlePreviousCard();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNextCard, handlePreviousCard]);

  // OUTPUT: Loading or error states
  if (bLoading) return <p className="text-center text-white pt-40">Loading study set...</p>;
  if (strError) return <p className="text-center text-red-400 pt-40">Error: {strError}</p>;
  if (!stSet || astItems.length === 0) {
    return (
      <div className="min-h-screen bg-background text-white flex flex-col items-center justify-center pt-24 px-4">
        <p className="text-center text-white">This study set is empty or could not be found.</p>
        <Link href="/dashboard" className="text-purple-400 hover:underline mt-4">&larr; Back to Dashboard</Link>
      </div>
    );
  }

  // OUTPUT: Main flashcard interface
  const objCurrentItem = astItems[nCurrentIndex];
  const bIsFirstCard = nCurrentIndex === 0;
  const bIsLastCard = nCurrentIndex === astItems.length - 1;

  return (
    <div className="min-h-screen bg-background text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl self-start mb-4">
        <Link href={`/play/${strSetId}`} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Back to Study Hub
        </Link>
      </div>

      <div className="w-full max-w-2xl">
        <h1 className="text-3xl font-bold text-center mb-4">{stSet.title}</h1>
        <p className="text-gray-400 text-center mb-8">
          Card {nCurrentIndex + 1} of {astItems.length}
        </p>

        <div className="w-full h-80 perspective-1000 cursor-pointer" onClick={handleFlipCard}>
          <div className={`relative w-full h-full transition-transform duration-700 transform-style-3d ${bIsFlipped ? 'rotate-y-cw-180' : ''}`}>
            <div className="absolute w-full h-full backface-hidden bg-gray-900 border border-gray-800 rounded-2xl flex items-center justify-center p-6 text-center">
              <p className="text-2xl">{objCurrentItem.question}</p>
            </div>
            <div className="absolute w-full h-full backface-hidden bg-purple-900 border border-purple-700 rounded-2xl flex items-center justify-center p-6 text-center rotate-y-cw-180">
              <p className="text-xl">{objCurrentItem.answer}</p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-between items-center">
          <button
            onClick={handlePreviousCard}
            disabled={bIsFirstCard || bNavigating}
            className={`bg-gray-800 hover:bg-gray-700 text-white font-semibold py-3 px-8 rounded-lg text-lg transition-colors ${(bIsFirstCard || bNavigating) ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Previous
          </button>

          {bIsLastCard ? (
            <Link href="/dashboard" className={`bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-lg text-lg ${bNavigating ? 'opacity-50 pointer-events-none' : ''}`}>
              Finish
            </Link>
          ) : (
            <button
              onClick={handleNextCard}
              disabled={bNavigating}
              className={`bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-8 rounded-lg text-lg transition-colors ${bNavigating ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Next Card
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
