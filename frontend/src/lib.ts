// frontend/src/lib.ts

// This is our new, foolproof helper function to build the correct API URL
// for both development and production environments.
export const getApiUrl = (path: string): string => {
    // In production on Vercel, this will be your live Render URL.
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || ''; 
    
    // In development in Codespaces, it will be an empty string,
    // and we need to use the Caddy proxy path.
    let finalUrl: string;
    if (!baseUrl) {
        finalUrl = `/api${path}`; // e.g., returns '/api/study-set/some-id'
    } else {
        // In production, we construct the full URL.
        finalUrl = `${baseUrl}${path}`; // e.g., https://appcom.onrender.com/study-set/some-id
    }

    // THIS IS YOUR FOOLPROOF FIX:
    // It replaces any occurrence of '//' with '/', but ignores 'https://'.
    return finalUrl.replace(/([^:]\/)\/+/g, "$1");
};