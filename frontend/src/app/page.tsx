'use client'; 

import { useEffect, useState } from 'react';

export default function Home() {
  const [message, setMessage] = useState('Loading...');

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
    
    fetch(apiUrl)
      .then(response => response.json())
      .then(data => {
        setMessage(data.message);
      })
      .catch(error => {
        console.error("Failed to fetch from API:", error);
        setMessage("Failed to connect to the back-end.");
      });
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-900 text-white">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">StudyAI Front-end</h1>
        <p className="text-lg">This is the Next.js user interface.</p>
        <div className="mt-8 p-4 bg-gray-800 rounded-lg">
          <p>Message from the back-end:</p>
          <p className="font-mono text-green-400">{message}</p>
        </div>
      </div>
    </main>
  );
}