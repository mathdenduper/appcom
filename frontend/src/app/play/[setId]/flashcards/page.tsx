'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../../supabaseClient';
import Link from 'next/link';
import { getApiUrl } from '../../../../lib';
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

export default function FlashcardsPage() {
  const [studySet, setStudySet] = useState<StudySet | null>(null);
  const [studyItems, setStudyItems] = useState<StudyItem[]>([]);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // --- NEW: State for tracking CR rewards ---
  const [seenCards, setSeenCards] = useState<Set<string>>(new Set());
  const [flippedCards, setFlippedCards] = useState<Set<string>>(new Set());
  const [user, setUser] = useState<User | null>(null);

  const params = useParams();
  const router = useRouter();
  const setId = params.setId as string;

  // This effect runs once to get the current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);
  
  // This effect fetches the study set data
  useEffect(() => {
    if (!setId) return;

    const fetchStudySet = async () => {
      setLoading(true);
      setError(null);
      const apiUrl = getApiUrl(`/study-set/${setId}`);
      try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
          const result = await response.json();
          throw new Error(result.detail || 'Failed to fetch study set.');
        }
        const data = await response.json();
        setStudySet(data.study_set);
        setStudyItems(data.study_items);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchStudySet();
  }, [setId]);

  // --- NEW: Function to award CR points ---
  const awardPoints = async (points: number) => {
    if (!user) return; // Can't award points if we don't know who the user is
    try {
      const apiUrl = getApiUrl('/award-cr');
      await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, points: points }),
      });
      console.log(`Awarded ${points} CR to user ${user.id}`);
    } catch (error) {
      console.error("Failed to award CR points:", error);
    }
  };

  // --- NEW: Effect to award points for seeing a card ---
  useEffect(() => {
    if (studyItems.length > 0) {
      const currentCardId = studyItems[currentItemIndex].id;
      if (!seenCards.has(currentCardId)) {
        awardPoints(1); // Award 1 CR for seeing a new card
        setSeenCards(new Set(seenCards).add(currentCardId));
      }
    }
  }, [currentItemIndex, studyItems]);


  const handleFlipCard = () => {
    const currentCardId = studyItems[currentItemIndex].id;
    // We only award points when flipping from question to answer
    if (!isFlipped && !flippedCards.has(currentCardId)) {
      awardPoints(2); // Award 2 CR for flipping a card for the first time
      setFlippedCards(new Set(flippedCards).add(currentCardId));
    }
    setIsFlipped(!isFlipped);
  };

  const handlePreviousCard = () => {
    if (currentItemIndex > 0) {
        setIsFlipped(false);
        setTimeout(() => {
            setCurrentItemIndex((prevIndex) => prevIndex - 1);
        }, 300);
    }
  };

  const handleNextCard = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentItemIndex((prevIndex) => (prevIndex + 1));
    }, 300);
  };
  
  if (loading) {
    return <p className="text-center text-white pt-40">Loading study set...</p>;
  }
  if (error) {
    return <p className="text-center text-red-400 pt-40">Error: {error}</p>;
  }
  if (!studySet || studyItems.length === 0) {
    return (
        <div className="min-h-screen bg-background text-white flex flex-col items-center justify-center pt-24 px-4">
            <p className="text-center text-white">This study set is empty or could not be found.</p>
            <Link href="/dashboard" className="text-purple-400 hover:underline mt-4">&larr; Back to Dashboard</Link>
        </div>
    );
  }

  const currentItem = studyItems[currentItemIndex];
  const isFirstCard = currentItemIndex === 0;
  const isLastCard = currentItemIndex === studyItems.length - 1;

  return (
    <div className="min-h-screen bg-background text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl self-start mb-4">
          <Link href={`/play/${setId}`} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            Back to Study Hub
          </Link>
      </div>

      <div className="w-full max-w-2xl">
        <h1 className="text-3xl font-bold text-center mb-4">{studySet.title}</h1>
        <p className="text-gray-400 text-center mb-8">
          Card {currentItemIndex + 1} of {studyItems.length}
        </p>

        <div 
            className="w-full h-80 perspective-1000 cursor-pointer"
            onClick={handleFlipCard}
        >
            <div 
                className={`relative w-full h-full transition-transform duration-700 transform-style-3d ${isFlipped ? 'rotate-y-cw-180' : ''}`}
            >
                <div className="absolute w-full h-full backface-hidden bg-gray-900 border border-gray-800 rounded-2xl flex items-center justify-center p-6 text-center">
                    <p className="text-2xl">{currentItem.question}</p>
                </div>
                <div className="absolute w-full h-full backface-hidden bg-purple-900 border border-purple-700 rounded-2xl flex items-center justify-center p-6 text-center rotate-y-cw-180">
                    <p className="text-xl">{currentItem.answer}</p>
                </div>
            </div>
        </div>
        
        <div className="mt-8 flex justify-between items-center">
            <button 
                onClick={handlePreviousCard}
                disabled={isFirstCard}
                className={`bg-gray-800 hover:bg-gray-700 text-white font-semibold py-3 px-8 rounded-lg text-lg transition-colors ${isFirstCard ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                Previous
            </button>
            
            {isLastCard ? (
                <Link href="/dashboard" className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-lg text-lg">
                    Finish
                </Link>
            ) : (
                <button 
                    onClick={handleNextCard}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-8 rounded-lg text-lg"
                >
                    Next Card
                </button>
            )}
        </div>
      </div>
    </div>
  );
}