'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../supabaseClient';
import type { User } from '@supabase/supabase-js';

// This is a new helper function to build the correct API URL for both dev and prod
const getApiUrl = (path: string): string => {
    // In production on Vercel, this will be your live Render URL.
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || ''; 
    
    // In development in Codespaces, it will be an empty string,
    // and we need to use the Caddy proxy path.
    if (!baseUrl) {
        return `/api${path}`; // e.g., returns '/api/process-notes'
    }

    // In production, we construct the full URL, safely handling any slashes.
    // This prevents the double slash bug.
    return new URL(path, baseUrl).toString(); // e.g., https://appcom.onrender.com/process-notes
};


const UploadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>;

export default function UploaderPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState('');
  const [title, setTitle] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
      } else {
        router.push('/login');
      }
      setLoadingUser(false);
    };
    checkUser();
  }, [router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setText('');
    }
  };

  const handleGenerate = async () => {
    if (!user) {
        setError('You must be logged in to create a study set.');
        return;
    }
    if (!title.trim()) {
      setError('Please enter a title for your study set.');
      return;
    }
    if (!file && !text.trim()) {
      setError('Please upload a file or paste some notes.');
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    
    const formData = new FormData();
    formData.append('title', title);
    formData.append('user_id', user.id);
    if (file) formData.append('file', file);
    if (text) formData.append('text', text);

    // We now use our smart helper function to get the correct URL
    const apiUrl = getApiUrl('/process-notes');

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || 'An unknown error occurred during processing.');
      }
      
      router.push(`/play/${result.study_set_id}`);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };
  
  if (loadingUser) {
    return <p className="text-center text-white pt-40">Loading...</p>;
  }

  return (
    <div className="min-h-screen bg-background text-white flex flex-col items-center justify-center pt-24 px-4">
      <div className="w-full max-w-2xl">
        <h1 className="text-4xl font-bold text-center mb-2">Create a New Study Set</h1>
        <p className="text-gray-400 text-center mb-8">Upload a PDF or paste your notes to get started.</p>

        <div className="bg-gray-900 border border-gray-800 p-8 rounded-2xl shadow-2xl space-y-6">
          <input
            type="text"
            placeholder="Enter a title for your study set..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
          />
          <div className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center">
            <label htmlFor="file-upload" className="cursor-pointer">
              <div className="flex flex-col items-center text-gray-400">
                <UploadIcon />
                <p className="mt-2">
                  {file ? 'File selected:' : 'Drag & drop a file or click to upload'}
                </p>
                {file && <p className="font-semibold text-purple-400 mt-1">{file.name}</p>}
              </div>
              <input id="file-upload" type="file" className="hidden" accept=".pdf,.txt" onChange={handleFileChange} />
            </label>
          </div>
          <div className="text-center text-gray-500">OR</div>
          <textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setFile(null);
            }}
            placeholder="Paste your notes directly here..."
            className="w-full h-48 bg-gray-800 border border-gray-700 rounded-lg p-4 text-gray-300 focus:ring-2 focus:ring-purple-500"
          ></textarea>
          <button
            onClick={handleGenerate}
            disabled={isProcessing}
            className="w-full p-3 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-semibold transition-colors disabled:bg-gray-500"
          >
            {isProcessing ? 'Generating Your Study Set...' : 'Generate with AI'}
          </button>
          
          {error && <p className="text-red-400 text-center mt-4">{error}</p>}
        </div>
      </div>
    </div>
  );
}