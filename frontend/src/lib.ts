// frontend/src/lib.ts

// This is our new, foolproof helper function with added debugging logs.
export const getApiUrl = (path: string): string => {
    // --- DEBUGGING LOGS START ---
    console.log("--- [lib.ts] Running getApiUrl ---");
    console.log("[lib.ts] Received path:", path);

    // This will show us the value from your Vercel environment variables in production.
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || ''; 
    console.log("[lib.ts] Found baseUrl:", baseUrl || "'' (empty string is correct for development)");
    // --- DEBUGGING LOGS END ---
    
    let finalUrl: string;
    if (!baseUrl) {
        // This is the path for your development server (Codespaces)
        finalUrl = `/api${path}`;
    } else {
        // This is the path for your live production server (Vercel/Render)
        // This logic now correctly handles any trailing slashes.
        finalUrl = baseUrl.endsWith('/') ? `${baseUrl.slice(0, -1)}${path}` : `${baseUrl}${path}`;
    }

    // --- FINAL DEBUGGING LOG ---
    console.log("[lib.ts] Constructed finalUrl:", finalUrl);
    return finalUrl;
};