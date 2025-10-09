// frontend/src/app/share/[setId]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { getApiUrl } from '@/lib';
import Link from 'next/link';

interface StudyItem {
  question: string;
  answer: string;
}

interface StudySet {
  title: string;
}

export default function SharedSetPage({ params }: { params: { setId: string } }) {
  const [studySet, setStudySet] = useState<StudySet | null>(null);
  const [studyItems, setStudyItems] = useState<StudyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params.setId) return;

    const fetchSetData = async () => {
      try {
        const response = await fetch(getApiUrl(`/study-set/${params.setId}`));
        if (!response.ok) {
          throw new Error('Study set not found.');
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

    fetchSetData();
  }, [params.setId]);

  if (loading) {
    return <div className="text-center text-gray-400 pt-40">Loading study set...</div>;
  }

  if (error) {
    return <div className="text-center text-red-400 pt-40">Error: {error}</div>;
  }

  return (
    <div className="min-h-screen bg-background text-white pt-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">{studySet?.title}</h1>
            <p className="text-gray-400">A study set shared with you.</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl p-6">
          <ul className="space-y-4">
            {studyItems.map((item, index) => (
              <li key={index} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                <p className="font-semibold text-purple-400 mb-2">Question:</p>
                <p className="text-white mb-4">{item.question}</p>
                <hr className="border-gray-700" />
                <p className="font-semibold text-purple-400 mt-4 mb-2">Answer:</p>
                <p className="text-white">{item.answer}</p>
              </li>
            ))}
          </ul>
        </div>
        <div className="text-center mt-8">
            <Link href="/signup" className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg">
                Create your own study sets
            </Link>
        </div>
      </div>
    </div>
  );
}