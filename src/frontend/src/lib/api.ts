const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const fetcher = async (url: string) => {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: {
      'x-user-id': '00000000-0000-0000-0000-000000000001', // Mocking user for dev
    },
  });
  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data.');
    throw error;
  }
  return res.json();
};
