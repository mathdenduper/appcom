// frontend/src/lib.ts

// This is our final, foolproof helper function to build the correct API URL
// for both development and production environments.
export const getApiUrl = (path: string): string => {
    // In production on Vercel, this will be your live Render URL
    // from the environment variables. The trailing slash is important.
    const baseUrl = process.env.NEXT_PUBLIC_API_URL; 
    
    // In development in Codespaces, the baseUrl will be undefined,
    // and we need to use the Caddy proxy path.
    if (!baseUrl) {
        return `/api${path}`; // e.g., returns '/api/process-notes'
    }

    // In production, we construct the full URL.
    // This logic now correctly handles the slashes to prevent the double slash bug.
    const finalUrl = baseUrl.endsWith('/') ? `${baseUrl.slice(0, -1)}${path}` : `${baseUrl}${path}`;
    
    return finalUrl; // e.g., https://appcom.onrender.com/process-notes
};