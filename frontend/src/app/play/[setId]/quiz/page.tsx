'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getApiUrl } from '../../../../lib';
import { supabase } from '../../../../supabaseClient'; // We need this to get the user ID

// --- Data Structures for the Quiz ---
interface QuizQuestion {
  question: string;
  options: string[];
  correct_answer: string;
}

export default function QuizPage() {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const params = useParams();
  const setId = params.setId as string;
  const router = useRouter();

  useEffect(() => {
    if (!setId) return;

    const fetchQuiz = async () => {
      setLoading(true);
      setError(null);
      const apiUrl = getApiUrl(`/generate-quiz/${setId}`);
      try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
          const result = await response.json();
          throw new Error(result.detail || 'Failed to generate quiz.');
        }
        const data = await response.json();
        setQuestions(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [setId]);

  const handleAnswerSelect = (option: string) => {
    if (selectedAnswer) return;
    setSelectedAnswer(option);
    if (option === questions[currentQuestionIndex].correct_answer) {
      setScore(score + 1);
    }
  };

  const handleNextQuestion = async () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
    } else {
      // --- THIS IS THE NEW PART ---
      // When the quiz is finished, we now await the CR points award.
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const pointsToAward = score * 10; // e.g., 10 points per correct answer
        if (pointsToAward > 0) {
            try {
                const apiUrl = getApiUrl('/award-cr');
                // We now wait for this to finish before proceeding
                await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user_id: user.id, points: pointsToAward }),
                });
            } catch (error) {
                console.error("Failed to award CR points:", error);
                // We don't block the user if this fails, just log the error.
            }
        }
      }
      // Only now do we mark the quiz as finished.
      setIsFinished(true);
    }
  };

  if (loading) {
    return (
        <div className="min-h-screen bg-background text-white flex items-center justify-center">
            <p className="text-lg text-gray-400">🧠 Generating your quiz...</p>
        </div>
    );
  }
  if (error) {
    return (
        <div className="min-h-screen bg-background text-white flex flex-col items-center justify-center pt-24 px-4">
            <p className="text-center text-red-400">Error: {error}</p>
            <Link href={`/play/${setId}`} className="text-purple-400 hover:underline mt-4">&larr; Back to Study Hub</Link>
        </div>
    );
  }
  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-background text-white flex flex-col items-center justify-center pt-24 px-4">
        <p className="text-center text-white">Could not generate a quiz for this study set.</p>
        <Link href={`/play/${setId}`} className="text-purple-400 hover:underline mt-4">&larr; Back to Study Hub</Link>
      </div>
    );
  }

  if (isFinished) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <div className="min-h-screen bg-background text-white flex flex-col items-center justify-center text-center p-4">
        <h1 className="text-4xl font-bold">Quiz Complete!</h1>
        <p className="text-2xl text-gray-400 mt-4">Your score:</p>
        <p className="text-6xl font-bold text-purple-400 my-4">{percentage}%</p>
        <p className="text-lg text-gray-300">You answered {score} out of {questions.length} questions correctly.</p>
        <div className="flex gap-4 mt-8">
            <Link href={`/play/${setId}`} className="bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg">
                Study Again
            </Link>
            <Link href="/dashboard" className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg">
                Back to Dashboard
            </Link>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-background text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl self-start mb-4">
          <Link href={`/play/${setId}`} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
              Back to Study Hub
          </Link>
      </div>

      <div className="w-full max-w-2xl">
          <p className="text-gray-400 text-center mb-4">Question {currentQuestionIndex + 1} of {questions.length}</p>
          <h2 className="text-3xl font-bold text-center mb-8">{currentQuestion.question}</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentQuestion.options.map((option, index) => {
              const isCorrect = option === currentQuestion.correct_answer;
              let buttonClass = "bg-gray-800 hover:bg-gray-700";
              if (selectedAnswer) {
                  if (isCorrect) {
                      buttonClass = "bg-green-500 text-white";
                  } else if (option === selectedAnswer) {
                      buttonClass = "bg-red-500 text-white";
                  }
              }
              return (
              <button
                  key={index}
                  onClick={() => handleAnswerSelect(option)}
                  disabled={!!selectedAnswer}
                  className={`p-4 rounded-lg text-left text-lg transition-colors duration-300 ${buttonClass}`}
              >
                  {option}
              </button>
              );
          })}
          </div>

          {selectedAnswer && (
              <div className="text-center mt-8">
                  <button onClick={handleNextQuestion} className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-8 rounded-lg text-lg">
                      {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Finish Quiz'}
                  </button>
              </div>
          )}
      </div>
    </div>
  );
}