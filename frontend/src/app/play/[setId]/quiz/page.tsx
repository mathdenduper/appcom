'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getApiUrl, trackUserAction } from '../../../../lib';
import { supabase } from '../../../../supabaseClient';
import type { User } from '@supabase/supabase-js';

// --- Data Structures for the Quiz ---
interface QuizQuestion {
  question: string;
  options: string[];
  correct_answer: string;
}

export default function QuizPage() {
  const [arrQuestions, setArrQuestions] = useState<QuizQuestion[]>([]);
  const [nCurrentQuestionIndex, setNCurrentQuestionIndex] = useState(0);
  const [strSelectedAnswer, setStrSelectedAnswer] = useState<string | null>(null);
  const [nScore, setNScore] = useState(0);
  const [bIsFinished, setBIsFinished] = useState(false);
  const [bLoading, setBLoading] = useState(true);
  const [strError, setStrError] = useState<string | null>(null);
  const [objUser, setObjUser] = useState<User | null>(null);

  const params = useParams();
  const strSetId = params.setId as string;
  const router = useRouter();

  useEffect(() => {
    const checkUserAndFetchQuiz = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setObjUser(session.user);
      } else {
        router.push('/login');
        return;
      }

      setBLoading(true);
      setStrError(null);
      const strApiUrl = getApiUrl(`/generate-quiz/${strSetId}`);
      try {
        const res = await fetch(strApiUrl);
        if (!res.ok) {
          const result = await res.json();
          throw new Error(result.detail || 'Failed to generate quiz.');
        }
        const data = await res.json();
        setArrQuestions(data);
      } catch (err: any) {
        setStrError(err.message);
      } finally {
        setBLoading(false);
      }
    };
    checkUserAndFetchQuiz();
  }, [strSetId, router]);

  const handleAnswerSelect = (strOption: string) => {
    if (strSelectedAnswer) return;
    setStrSelectedAnswer(strOption);
    if (strOption === arrQuestions[nCurrentQuestionIndex].correct_answer) {
      setNScore(nScore + 1);
    }
  };

  const handleNextQuestion = async () => {
    if (nCurrentQuestionIndex < arrQuestions.length - 1) {
      setNCurrentQuestionIndex(nCurrentQuestionIndex + 1);
      setStrSelectedAnswer(null);
    } else {
      if (objUser) {
        const nTotalQuestions = arrQuestions.length;

        try {
          const strApiUrl = getApiUrl('/log-quiz-attempt');
          await fetch(strApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: objUser.id,
              set_id: strSetId,
              score: nScore,
              total_questions: nTotalQuestions,
              points_to_add: nScore * 10
            }),
          });
        } catch (err) {
          console.error("Failed to log quiz attempt:", err);
        }

        const nPercentageScore = Math.round((nScore / nTotalQuestions) * 100);
        trackUserAction(objUser.id, 'quizzes_completed', 1);
        trackUserAction(objUser.id, 'SCORE_PERCENTAGE', nPercentageScore);
        if (nScore > 0) {
          trackUserAction(objUser.id, 'quiz_questions_correct', nScore);
        }
      }
      setBIsFinished(true);
    }
  };

  if (bLoading) {
    return (
      <div className="min-h-screen bg-background text-white flex items-center justify-center">
        <p className="text-lg text-gray-400">🧠 Generating your quiz...</p>
      </div>
    );
  }
  if (strError) {
    return (
      <div className="min-h-screen bg-background text-white flex flex-col items-center justify-center pt-24 px-4">
        <p className="text-center text-red-400">Error: {strError}</p>
        <Link href={`/play/${strSetId}`} className="text-purple-400 hover:underline mt-4">&larr; Back to Study Hub</Link>
      </div>
    );
  }
  if (arrQuestions.length === 0) {
    return (
      <div className="min-h-screen bg-background text-white flex flex-col items-center justify-center pt-24 px-4">
        <p className="text-center text-white">Could not generate a quiz for this study set.</p>
        <Link href={`/play/${strSetId}`} className="text-purple-400 hover:underline mt-4">&larr; Back to Study Hub</Link>
      </div>
    );
  }

  if (bIsFinished) {
    const nPercentage = Math.round((nScore / arrQuestions.length) * 100);
    return (
      <div className="min-h-screen bg-background text-white flex flex-col items-center justify-center text-center p-4">
        <h1 className="text-4xl font-bold">Quiz Complete!</h1>
        <p className="text-2xl text-gray-400 mt-4">Your score:</p>
        <p className="text-6xl font-bold text-purple-400 my-4">{nPercentage}%</p>
        <p className="text-lg text-gray-300">You answered {nScore} out of {arrQuestions.length} questions correctly.</p>
        <div className="flex gap-4 mt-8">
          <Link href={`/play/${strSetId}`} className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg">
            Study Again
          </Link>
          <Link href="/dashboard" className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const objCurrentQuestion = arrQuestions[nCurrentQuestionIndex];

  return (
    <div className="min-h-screen bg-background text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl self-start mb-4">
        <Link href={`/play/${strSetId}`} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          Back to Study Hub
        </Link>
      </div>

      <div className="w-full max-w-2xl">
        <p className="text-gray-400 text-center mb-4">Question {nCurrentQuestionIndex + 1} of {arrQuestions.length}</p>
        <h2 className="text-3xl font-bold text-center mb-8">{objCurrentQuestion.question}</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {objCurrentQuestion.options.map((strOption, nIndex) => {
            const bIsCorrect = strOption === objCurrentQuestion.correct_answer;
            let strButtonClass = "bg-gray-800 hover:bg-gray-700";
            if (strSelectedAnswer) {
              if (bIsCorrect) {
                strButtonClass = "bg-green-500 text-white";
              } else if (strOption === strSelectedAnswer) {
                strButtonClass = "bg-red-500 text-white";
              }
            }
            return (
              <button
                key={nIndex}
                onClick={() => handleAnswerSelect(strOption)}
                disabled={!!strSelectedAnswer}
                className={`p-4 rounded-lg text-left text-lg transition-colors duration-300 ${strButtonClass}`}
              >
                {strOption}
              </button>
            );
          })}
        </div>

        {strSelectedAnswer && (
          <div className="text-center mt-8">
            <button onClick={handleNextQuestion} className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-8 rounded-lg text-lg">
              {nCurrentQuestionIndex < arrQuestions.length - 1 ? 'Next Question' : 'Finish Quiz'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
