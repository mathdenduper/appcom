// Author: Tristan Bong
// Page name: uploader/page.tsx
// Page purpose: Allows users to upload PDFs or paste notes to generate a study set using AI
// Date created: 14/09/2025

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../supabaseClient';
import type { User } from '@supabase/supabase-js';
import { getApiUrl } from '../../lib';

// Function: Small SVG component used as an upload icon
const UploadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
       viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
    <polyline points="17 8 12 3 7 8"></polyline>
    <line x1="12" y1="3" x2="12" y2="15"></line>
  </svg>
);

// Function: Main component that manages upload and AI generation workflow
export default function UploaderPage() {
  // INPUT: Stores logged-in user data, file, text, and title
  const [objUser, setObjUser] = useState<User | null>(null);
  const [bLoadingUser, setBLoadingUser] = useState(true);
  const router = useRouter();

  const [objFile, setObjFile] = useState<File | null>(null);
  const [strText, setStrText] = useState('');
  const [strTitle, setStrTitle] = useState('');
  const [bIsProcessing, setBIsProcessing] = useState(false);
  const [strError, setStrError] = useState<string | null>(null);

  // PROCESS: Check if user is logged in and preload user session
  // OUTPUT: Redirects to /login if user is not authenticated
  useEffect(() => {
    const fnCheckUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setObjUser(session.user);
      } else {
        router.push('/login');
      }
      setBLoadingUser(false);
    };
    fnCheckUser();
  }, [router]);

  // Function: Handles file input selection
  // INPUT: Uploaded file from user
  // PROCESS: Stores file in state and clears any pasted text
  const fnHandleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setObjFile(e.target.files[0]);
      setStrText('');
    }
  };

  // Function: Handles the process of generating a study set using AI
  // INPUT: File upload or text notes, title, and user ID
  // PROCESS: Sends data to backend API and waits for AI response
  // OUTPUT: Redirects user to the generated study set or displays an error
  const fnHandleGenerate = async () => {
    if (!objUser) { setStrError('You must be logged in.'); return; }
    if (!strTitle.trim()) { setStrError('Please enter a title.'); return; }
    if (!objFile && !strText.trim()) { setStrError('Please upload a file or paste notes.'); return; }

    setBIsProcessing(true);
    setStrError(null);

    const formData = new FormData();
    formData.append('title', strTitle);
    formData.append('user_id', objUser.id);
    if (objFile) formData.append('file', objFile);
    if (strText) formData.append('text', strText);

    const strApiUrl = getApiUrl('/process-notes');

    try {
      const res = await fetch(strApiUrl, { method: 'POST', body: formData });
      const objResult = await res.json();
      if (!res.ok) throw new Error(objResult.detail || 'An error occurred.');

      // OUTPUT: Redirect user to the new study set
      router.push(`/play/${objResult.study_set_id}`);
    } catch (err: any) {
      setStrError(err.message);
    } finally {
      setBIsProcessing(false);
    }
  };

  // OUTPUT: Loading screen while verifying session
  if (bLoadingUser) {
    return <p className="text-center text-white pt-40">Loading...</p>;
  }

  // OUTPUT: Main upload UI
  return (
    <div className="min-h-screen bg-background text-white flex flex-col items-center justify-center pt-24 px-4">
      <div className="w-full max-w-2xl">
        <h1 className="text-4xl font-bold text-center mb-2">Create a New Study Set</h1>
        <p className="text-gray-400 text-center mb-8">Upload a PDF or paste your notes to get started.</p>

        <div className="bg-gray-900 border border-gray-800 p-8 rounded-2xl shadow-2xl space-y-6">
          {/* INPUT: Study set title */}
          <input
            type="text"
            placeholder="Enter a title..."
            value={strTitle}
            onChange={(e) => setStrTitle(e.target.value)}
            className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-purple-500"
          />

          {/* INPUT: File upload */}
          <div className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center">
            <label htmlFor="file-upload" className="cursor-pointer">
              <div className="flex flex-col items-center text-gray-400">
                <UploadIcon />
                <p className="mt-2">{objFile ? objFile.name : 'Drag & drop a file or click to upload'}</p>
              </div>
              <input
                id="file-upload"
                type="file"
                className="hidden"
                accept=".pdf,.txt"
                onChange={fnHandleFileChange}
              />
            </label>
          </div>

          <div className="text-center text-gray-500">OR</div>

          {/* INPUT: Textarea for direct notes */}
          <textarea
            value={strText}
            onChange={(e) => { setStrText(e.target.value); setObjFile(null); }}
            placeholder="Paste your notes directly here..."
            className="w-full h-48 bg-gray-800 border border-gray-700 rounded-lg p-4 text-gray-300 focus:ring-2 focus:ring-purple-500"
          />

          {/* PROCESS: AI generation trigger */}
          <button
            onClick={fnHandleGenerate}
            disabled={bIsProcessing}
            className="w-full p-3 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-semibold transition-colors disabled:bg-gray-500"
          >
            {bIsProcessing ? 'Generating Your Study Set...' : 'Generate with AI'}
          </button>

          {/* OUTPUT: Error message display */}
          {strError && <p className="text-red-400 text-center mt-4">{strError}</p>}
        </div>
      </div>
    </div>
  );
}
