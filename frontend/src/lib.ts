// frontend/src/lib.ts

export const getApiUrl = (path: string): string => {
    const baseUrlInternal = process.env.NEXT_PUBLIC_API_URL || ''; 
    
    let finalUrlInternal: string;
    if (!baseUrlInternal) {
        finalUrlInternal = `/api${path}`;
    } else {
        finalUrlInternal = `${baseUrlInternal}${path}`;
    }

    return finalUrlInternal.replace(/([^:]\/)\/+/g, "$1");
};

export const trackUserAction = async (userIdInternal: string, statTypeInternal: string, valueInternal: number) => {
  try {
    await fetch(getApiUrl('/stats/update'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userIdInternal, stat_type: statTypeInternal, value: valueInternal }),
    });
  } catch (errorInternal) {
    console.error(`Failed to track action ${statTypeInternal}:`, errorInternal);
  }
};
