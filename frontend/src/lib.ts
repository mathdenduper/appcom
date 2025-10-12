// Author: Tristan Bong
// Page name: lib.ts
// Page purpose: Provides helper functions for API URL resolution and user stat tracking
// Date created: 14/09/2025

export const getApiUrl = (path: string): string => {
    const baseUrlInternal = process.env.NEXT_PUBLIC_API_URL || '';  // INPUT: environment variable
    
    let finalUrlInternal: string;
    if (!baseUrlInternal) {
        // PROCESS: No base URL, use local /api proxy
        finalUrlInternal = `/api${path}`;
    } else {
        // PROCESS: Use the provided API base URL
        finalUrlInternal = `${baseUrlInternal}${path}`;
    }

    // PROCESS: Remove duplicate slashes except after "http(s):"
    // OUTPUT: final resolved URL
    return finalUrlInternal.replace(/([^:]\/)\/+/g, "$1");
};

/**
 * Sends a stat tracking request to the backend.
 * INPUT: userIdInternal (string) – user ID
 *        statTypeInternal (string) – type of stat to increment
 *        valueInternal (number) – value to increment by
 * PROCESS: Calls the /stats/update endpoint with JSON payload
 * OUTPUT: None (errors logged to console)
 */
export const trackUserAction = async (
  userIdInternal: string, 
  statTypeInternal: string, 
  valueInternal: number
) => {
  try {
    // PROCESS: Send POST request to API
    await fetch(getApiUrl('/stats/update'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        user_id: userIdInternal, 
        stat_type: statTypeInternal, 
        value: valueInternal 
      }),
    });
    // OUTPUT: Success – no return value
  } catch (errorInternal) {
    // OUTPUT: Log error if request fails
    console.error(`Failed to track action ${statTypeInternal}:`, errorInternal);
  }
};
