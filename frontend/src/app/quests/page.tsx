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

const QuestCard = ({ qc, onClaim }: { qc: QuestCompletion; onClaim: (completionId: number, reward: number) => void; }) => {
    const isCompleted = qc.progress >= qc.quests.target_value;
    const progressPercentage = Math.min(100, (qc.progress / qc.quests.target_value) * 100);

    return (
        <div className={`bg-gray-800 border border-gray-700 rounded-lg p-6 flex flex-col ${qc.is_claimed ? 'opacity-50' : ''}`}>
            <div className="flex justify-between items-start">
                <div>
                    <h3 className="text-xl font-bold">{qc.quests.title}</h3>
                    <p className="text-sm text-gray-400 mt-1">{qc.quests.description}</p>
                </div>
                <div className="flex items-center gap-2 font-bold text-yellow-400 whitespace-nowrap">
                    <StarIcon className="h-5 w-5" />
                    <span>{qc.quests.reward} CR</span>
                </div>
            </div>
            <div className="mt-4 flex-grow flex flex-col justify-end">
                <div className="w-full bg-gray-700 rounded-full h-2.5 mb-2">
                    <div className="bg-purple-600 h-2.5 rounded-full" style={{ width: `${progressPercentage}%` }}></div>
                </div>
                <div className="text-xs text-gray-400 text-right">
                    {qc.quests.type === 'SCORE_PERCENTAGE' ? `${qc.progress}%` : qc.progress} / {qc.quests.target_value}{qc.quests.type === 'SCORE_PERCENTAGE' ? '%' : ''}
                </div>
            </div>
            <div className="mt-4">
                {qc.is_claimed ? (
                    <button disabled className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-green-600 text-white font-semibold">
                        <CheckCircleIcon className="h-5 w-5" />
                        Completed
                    </button>
                ) : isCompleted ? (
                    <button onClick={() => onClaim(qc.id, qc.quests.reward)} className="w-full py-2 px-4 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold transition-colors">
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


export default function QuestsPage() {
    const [user, setUser] = useState<User | null>(null);
    const [quests, setQuests] = useState<QuestCompletion[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const fetchQuests = async (currentUser: User) => {
        setLoading(true);
        try {
            const response = await fetch(getApiUrl(`/quests/daily/${currentUser.id}`));
            if (!response.ok) throw new Error("Failed to load quests.");
            const data = await response.json();
            data.sort((a: QuestCompletion, b: QuestCompletion) => (b.quests.difficulty > a.quests.difficulty) ? 1 : -1);
            setQuests(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        const getInitialUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                setUser(session.user);
                fetchQuests(session.user);
            } else {
                router.push('/login');
            }
        };
        getInitialUser();
    }, [router]);

    const handleClaim = async (completionId: number, reward: number) => {
        if (!user) return;
        try {
            const response = await fetch(getApiUrl('/quests/claim-reward'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: user.id,
                    completion_id: completionId,
                    points_to_add: reward,
                })
            });
            if (!response.ok) throw new Error("Failed to claim reward.");
            await fetchQuests(user);
        } catch (error) {
            console.error(error);
            alert("Failed to claim reward. Please try again.");
        }
    };

    return (
        <div className="min-h-screen bg-background text-white pt-24 px-4 sm:px-6 lg:px-8">
            {/* --- THIS IS THE FIX --- */}
            {/* Changed max-w-4xl to max-w-2xl for a better centered column */}
            <div className="max-w-2xl mx-auto">
                <h1 className="text-4xl font-bold mb-2">Daily Quests</h1>
                <p className="text-gray-400 mb-8">Complete these quests before the day ends to earn CR points!</p>
                
                {loading ? <p>Loading quests...</p> : (
                    // Changed the grid layout to a simple vertical space-y-6 for stacking
                    <div className="space-y-6">
                        {quests.map(qc => (
                            <QuestCard key={qc.id} qc={qc} onClaim={handleClaim} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
