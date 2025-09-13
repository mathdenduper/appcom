'use client'; 

import { useState, useEffect } from 'react';

// Header Component
const Header = () => {
  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-black bg-opacity-30 backdrop-blur-lg border-b border-gray-800">
      <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
        <div className="text-2xl font-bold text-white">
          StudyAI
        </div>
        <div className="flex items-center space-x-4">
          <button className="text-gray-300 hover:text-white transition-colors">
            Sign In
          </button>
          <button className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
            Sign Up
          </button>
        </div>
      </nav>
    </header>
  );
};

// Updated Typewriter Animation Component with refined cursor logic
const Typewriter = ({ words }: { words: string[] }) => {
    const [wordIndex, setWordIndex] = useState(0);
    const [charIndex, setCharIndex] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [currentText, setCurrentText] = useState('');
    
    const typingSpeed = 100;
    const deletingSpeed = 50;
    const pauseDelay = 2000;

    useEffect(() => {
        let timeoutId: NodeJS.Timeout;

        if (isPaused) {
            // If paused, wait for the delay before starting to delete
            timeoutId = setTimeout(() => {
                setIsPaused(false);
                setIsDeleting(true);
            }, pauseDelay);
        } else if (isDeleting) {
            // If deleting, remove characters
            if (charIndex > 0) {
                timeoutId = setTimeout(() => setCharIndex(charIndex - 1), deletingSpeed);
            } else {
                setIsDeleting(false);
                setWordIndex((prev) => (prev + 1) % words.length);
            }
        } else {
            // If typing, add characters
            if (charIndex < words[wordIndex].length) {
                timeoutId = setTimeout(() => setCharIndex(charIndex + 1), typingSpeed);
            } else {
                // Word is fully typed, start the pause
                setIsPaused(true);
            }
        }

        setCurrentText(words[wordIndex].substring(0, charIndex));
        return () => clearTimeout(timeoutId);
    }, [charIndex, wordIndex, isDeleting, isPaused, words]);

    return (
        <span className="text-purple-400">
            {currentText}
            {/* The cursor now has a conditional class for blinking */}
            <span className={`typewriter-cursor ${isPaused ? 'blinking' : ''}`}></span>
        </span>
    );
};


// Hero Section Component
const Hero = () => {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center text-center pt-20">
      <h1 className="text-5xl md:text-7xl font-extrabold text-white leading-tight">
        Meet StudyAI
      </h1>
      <p className="text-xl md:text-2xl text-gray-400 mt-6 max-w-3xl mx-auto">
        Your smartest friend for any{' '}
        <Typewriter words={['subject', 'lecture', 'exam', 'topic']} />
      </p>
      <div className="mt-10 flex justify-center items-center gap-4">
        <button className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-8 rounded-lg text-lg transition-transform transform hover:scale-105">
          Get Started - It's Free
        </button>
        <a href="#ai-preview" className="bg-transparent border-2 border-gray-700 hover:border-purple-600 hover:bg-gray-800 text-white font-semibold py-3 px-8 rounded-lg text-lg transition-colors">
          See how it works
        </a>
      </div>
    </div>
  );
};

// AI Demo Section Component
const Demo = () => {
    return (
        <div id="ai-preview" className="py-20 px-4 min-h-screen flex flex-col justify-center">
            <div className="text-center mb-12">
                <h2 className="text-4xl font-bold text-white">Try the AI Instantly</h2>
                <p className="text-lg text-gray-400 mt-4">Paste some of your notes below to see a live preview.</p>
            </div>
            
            <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8 items-start">
                {/* Input Area */}
                <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
                    <textarea 
                        className="w-full h-64 bg-gray-800 border border-gray-700 rounded-lg p-4 text-gray-300 focus:ring-2 focus:ring-purple-600 focus:border-purple-600 transition"
                        placeholder="Paste your notes here..."
                    ></textarea>
                    <button className="mt-4 w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg transition-colors">
                        Generate Preview
                    </button>
                </div>

                {/* Preview Area */}
                <div className="bg-gray-900 p-6 rounded-xl border border-gray-800 min-h-[344px]">
                    <h3 className="font-semibold text-white text-lg mb-4">Generated Flashcards:</h3>
                    <div className="space-y-3 text-gray-400">
                        <p className="italic">Your AI-generated preview will appear here...</p>
                    </div>
                </div>
            </div>
        </div>
    );
};


export default function Home() {
  const [message, setMessage] = useState('Connecting to the server...');

  // This is the new, non-visual code that handles the connection.
  useEffect(() => {
    // In production, this uses the Vercel environment variable.
    // In development (Codespaces), it uses the '/api' proxy.
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api'; 
    
    fetch(apiUrl)
      .then(response => response.json())
      .then(data => {
        setMessage(data.message);
      })
      .catch(error => {
        console.error("Failed to fetch from API:", error);
        setMessage("Failed to connect. Please ensure both servers are running.");
      });
  }, []);

  return (
    <div className="bg-background text-white">
      <Header />
      <main className="container mx-auto px-6">
        <Hero />
        <Demo />
        {/* This is the temporary connection status message */}
        <footer className="text-center py-8 text-gray-500 border-t border-gray-800">
            <p>Connection Status: {message}</p>
        </footer>
      </main>
    </div>
  );
}