// Author: Tristan Bong
// Page name: quests/page.tsx
// Page purpose: Displays daily quests, tracks progress, and lets users claim rewards.
// Date created: 12/10/2025

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/supabaseClient';
import type { User } from '@supabase/supabase-js';
import { getApiUrl } from '@/lib';
import { CheckCircleIcon, StarIcon } from '@heroicons/react/24/solid';

interface Quest {
    id: number;
    title: string;
    description: string;
    type: string;
    target_value: number;
    difficulty: 'easy' | 'hard';
    reward: number;
}

interface QuestCompletion {
    id: number;
    quest_id: number;
    progress: number;
    is_claimed: boolean;
    quests: Quest;
}

// Function: Renders a single quest card with progress bar and claim button
const QuestCard = ({ objQc, fnOnClaim }: { objQc: QuestCompletion; fnOnClaim: (nCompletionId: number, nReward: number) => void; }) => {

    // PROCESS: Compute quest completion status
    const bIsCompleted = objQc.progress >= objQc.quests.target_value;
    const nProgressPercentage = Math.min(100, (objQc.progress / objQc.quests.target_value) * 100);

    // OUTPUT: Render quest UI with appropriate state (In Progress / Completed / Claimable)
    return (
        <div className={`bg-gray-800 border border-gray-700 rounded-lg p-6 flex flex-col ${objQc.is_claimed ? 'opacity-50' : ''}`}>
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-xl font-bold">{objQc.quests.title}</h3>
                    <p className="text-sm text-gray-400 mt-1">{objQc.quests.description}</p>
                </div>

                {/* OUTPUT: Display reward */}
                <div className="flex items-center gap-2 font-bold text-yellow-400 whitespace-nowrap">
                    <StarIcon className="h-5 w-5" />
                    <span>{objQc.quests.reward} CR</span>
                </div>
            </div>

            {/* PROCESS: Render progress bar */}
            <div className="mt-4 flex-grow flex flex-col justify-end">
                <div className="w-full bg-gray-700 rounded-full h-2.5 mb-2">
                    <div className="bg-purple-600 h-2.5 rounded-full" style={{ width: `${nProgressPercentage}%` }}></div>
                </div>

                {/* OUTPUT: Show progress text */}
                <div className="text-xs text-gray-400 text-right">
                    {objQc.quests.type === 'SCORE_PERCENTAGE' ? `${objQc.progress}%` : objQc.progress} / {objQc.quests.target_value}{objQc.quests.type === 'SCORE_PERCENTAGE' ? '%' : ''}
                </div>
            </div>

            {/* PROCESS + OUTPUT: Determine which button to render based on quest state */}
            <div className="mt-4">
                {objQc.is_claimed ? (
                    <button disabled className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-green-600 text-white font-semibold">
                        <CheckCircleIcon className="h-5 w-5" />
                        Completed
                    </button>
                ) : bIsCompleted ? (
                    <button 
                        onClick={() => fnOnClaim(objQc.id, objQc.quests.reward)} 
                        className="w-full py-2 px-4 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold transition-colors"
                    >
                        Claim Reward
                    </button>
                ) : (
                    <button disabled className="w-full py-2 px-4 rounded-lg bg-gray-700 text-gray-400 font-semibold cursor-not-allowed">
                        In Progress
                    </button>
                )}
            </div>
        </div>
    );
};


// Function: Handles fetching quests, authentication, and reward claiming
export default function QuestsPage() {
    // INPUT: Local state variables
    const [objUser, setObjUser] = useState<User | null>(null);
    const [arrQuests, setArrQuests] = useState<QuestCompletion[]>([]);
    const [bLoading, setBLoading] = useState(true);
    const router = useRouter();

    // Function: Fetch quests for the logged-in user
    const fnFetchQuests = async (objCurrentUser: User) => {
        // INPUT: objCurrentUser (User object)
        setBLoading(true);
        try {
            // PROCESS: Retrieve quests from API
            const res = await fetch(getApiUrl(`/quests/daily/${objCurrentUser.id}`));
            if (!res.ok) throw new Error("Failed to load quests.");

            // PROCESS: Parse JSON and sort by difficulty
            const arrData = await res.json();
            arrData.sort((a: QuestCompletion, b: QuestCompletion) => 
                (b.quests.difficulty > a.quests.difficulty) ? 1 : -1
            );

            // OUTPUT: Update state with fetched quests
            setArrQuests(arrData);
        } catch (err) {
            console.error(err);
        } finally {
            // PROCESS: Stop loading state
            setBLoading(false);
        }
    };

    // Function: Load user session on page load
    useEffect(() => {
        const fnGetInitialUser = async () => {
            // INPUT: None (retrieves session from Supabase)
            const { data: { session } } = await supabase.auth.getSession();

            // PROCESS: Determine if user is logged in
            if (session?.user) {
                setObjUser(session.user);
                fnFetchQuests(session.user); // OUTPUT: Fetch quests if user exists
            } else {
                // OUTPUT: Redirect to login page if not authenticated
                router.push('/login');
            }
        };
        fnGetInitialUser();
    }, [router]);

    // Function: Handles reward claiming
    const fnHandleClaim = async (nCompletionId: number, nReward: number) => {
        // INPUT: nCompletionId (quest completion ID), nReward (points to add)
        if (!objUser) return;
        try {
            // PROCESS: Send reward claim request to backend
            const res = await fetch(getApiUrl('/quests/claim-reward'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: objUser.id,
                    completion_id: nCompletionId,
                    points_to_add: nReward,
                })
            });

            // OUTPUT: If successful, refresh quest list
            if (!res.ok) throw new Error("Failed to claim reward.");
            fnFetchQuests(objUser);
        } catch (err) {
            console.error(err);
            alert("Failed to claim reward. Please try again."); // OUTPUT: Error alert
        }
    };

    // OUTPUT: Render main quest page UI
    return (
        <div className="min-h-screen bg-background text-white pt-24 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-4xl font-bold mb-2">Daily Quests</h1>
                <p className="text-gray-400 mb-8">Complete these quests before the day ends to earn CR points!</p>
                
                {bLoading ? (
                    // OUTPUT: Loading message
                    <p>Loading quests...</p>
                ) : (
                    // OUTPUT: Display all quest cards
                    <div className="space-y-6">
                        {arrQuests.map(objQc => (
                            <QuestCard 
                                key={objQc.id} 
                                objQc={objQc} 
                                fnOnClaim={fnHandleClaim} 
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
