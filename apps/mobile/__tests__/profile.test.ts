import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useProfile } from '../hooks/useProfile';

// Mock supabase entirely — avoids network calls and SecureStore native issues
jest.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'user-1' } },
      }),
    },
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: {
          id: 'user-1',
          plan: 'free',
          plan_expires_at: null,
          streak_freeze_count: 0,
        },
        error: null,
      }),
    }),
  },
}));

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: qc }, children);
  };
}

describe('useProfile', () => {
  it('returns plan: free for a new user', async () => {
    const { result } = renderHook(() => useProfile(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.plan).toBe('free');
    expect(result.current.data?.streak_freeze_count).toBe(0);
  });

  it('returns plan: premium when DB row has premium', async () => {
    // Override the mock for this test only
    const { supabase } = require('../lib/supabase');
    (supabase.from as jest.Mock).mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: {
          id: 'user-1',
          plan: 'premium',
          plan_expires_at: '2027-01-01T00:00:00Z',
          streak_freeze_count: 2,
        },
        error: null,
      }),
    });

    const { result } = renderHook(() => useProfile(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.plan).toBe('premium');
    expect(result.current.data?.plan_expires_at).toBe('2027-01-01T00:00:00Z');
  });

  it('returns error state when not authenticated', async () => {
    const { supabase } = require('../lib/supabase');
    (supabase.auth.getUser as jest.Mock).mockResolvedValueOnce({
      data: { user: null },
    });

    const { result } = renderHook(() => useProfile(), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as Error).message).toBe('Not authenticated');
  });
});
