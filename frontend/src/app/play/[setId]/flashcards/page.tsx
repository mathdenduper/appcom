'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getApiUrl } from '../../../../lib'; // Import our new, foolproof helper

// Define the structure of our data for type safety
interface StudyItem {
  id: string;
  question: string;
  answer: string;
}
interface StudySet {
  id: string;
  title: string;
}

export default function PlayPage() {
  const [studySet, setStudySet] = useState<StudySet | null>(null);
  const [studyItems, setStudyItems] = useState<StudyItem[]>([]);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const params = useParams();
  const router = useRouter();
  const setId = params.setId as string;

  useEffect(() => {
    if (!setId) return;

    const fetchStudySet = async () => {
      setLoading(true);
      setError(null);
      
      // --- THIS IS THE UPDATED PART ---
      // We now use our smart helper to get the correct URL for the study set endpoint.
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

  const handleNextCard = () => {
    if (isFlipped) {
        setIsFlipped(false);
        setTimeout(() => {
            setCurrentItemIndex((prevIndex) => (prevIndex + 1) % studyItems.length);
        }, 300);
    } else {
        setCurrentItemIndex((prevIndex) => (prevIndex + 1) % studyItems.length);
    }
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

  return (
    <div className="min-h-screen bg-background text-white flex flex-col items-center justify-center pt-24 px-4">
      <div className="w-full max-w-2xl">
        <h1 className="text-3xl font-bold text-center mb-4">{studySet.title}</h1>
        <p className="text-gray-400 text-center mb-8">
          Card {currentItemIndex + 1} of {studyItems.length}
        </p>

        <div 
            className="w-full h-80 perspective-1000 cursor-pointer"
            onClick={() => setIsFlipped(!isFlipped)}
        >
            <div 
                className={`relative w-full h-full transition-transform duration-700 transform-style-3d ${isFlipped ? 'rotate-y-cw-180' : ''}`}
            >
                {/* Front of the card (Question) */}
                <div className="absolute w-full h-full backface-hidden bg-gray-900 border border-gray-800 rounded-2xl flex items-center justify-center p-6 text-center">
                    <p className="text-2xl">{currentItem.question}</p>
                </div>
                {/* Back of the card (Answer) */}
                <div className="absolute w-full h-full backface-hidden bg-purple-900 border border-purple-700 rounded-2xl flex items-center justify-center p-6 text-center rotate-y-cw-180">
                    <p className="text-xl">{currentItem.answer}</p>
                </div>
            </div>
        </div>
        
        {/* Navigation buttons */}
        <div className="mt-8 flex justify-between items-center">
            <Link href="/dashboard" className="text-gray-400 hover:text-white transition-colors">&larr; Back to Dashboard</Link>
            <button 
                onClick={handleNextCard}
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-8 rounded-lg text-lg"
            >
                Next Card
            </button>
        </div>
      </div>
    </div>
  );
}
