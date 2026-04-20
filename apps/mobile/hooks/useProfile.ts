import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Profile } from '../types/profile';

async function fetchProfile(): Promise<Profile> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('profiles')
    .select('id, plan, plan_expires_at, streak_freeze_count')
    .eq('id', user.id)
    .single();

  if (error) throw error;
  return data as Profile;
}

/**
 * Reads the authenticated user's profile from Supabase.
 * Cache: 5 minutes. Use queryClient.invalidateQueries(['profile'])
 * after a purchase to refresh the plan.
 */
export function useProfile() {
  return useQuery<Profile, Error>({
    queryKey: ['profile'],
    queryFn: fetchProfile,
    staleTime: 1000 * 60 * 5,
  });
}
