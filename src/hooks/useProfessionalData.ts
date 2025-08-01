import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface AthleteRelationship {
  id: string;
  athlete_id: string;
  specialty: string;
  status: string;
  accepted_at: string;
  athlete: {
    user_id: string;
    full_name: string;
    email?: string;
  };
}

interface PendingInvitation {
  id: string;
  athlete_id: string;
  specialty: string;
  status: string;
  invited_at: string;
  athlete: {
    full_name: string;
    user_id: string;
  };
}

interface Session {
  id: string;
  title: string;
  session_date: string;
  start_time: string;
  end_time: string;
  athlete_id: string;
  status: string;
  session_type: string;
  athlete?: {
    full_name: string;
  };
}

export const useProfessionalData = () => {
  const { user } = useAuth();
  const [myAthletes, setMyAthletes] = useState<AthleteRelationship[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMyAthletes = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('athlete_professional_relationships')
        .select(`
          id,
          athlete_id,
          specialty,
          status,
          accepted_at,
          athlete:profiles!athlete_professional_relationships_athlete_id_fkey(full_name, user_id)
        `)
        .eq('professional_id', user.id)
        .eq('status', 'accepted')
        .eq('is_active', true)
        .order('accepted_at', { ascending: false });

      if (error) throw error;
      setMyAthletes(data || []);
    } catch (error) {
      console.error('Error fetching my athletes:', error);
    }
  };

  const fetchPendingInvitations = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('athlete_professional_relationships')
        .select(`
          id,
          athlete_id,
          specialty,
          status,
          invited_at,
          athlete:profiles!athlete_professional_relationships_athlete_id_fkey(full_name, user_id)
        `)
        .eq('professional_id', user.id)
        .eq('status', 'pending')
        .order('invited_at', { ascending: false });

      if (error) throw error;
      setPendingInvitations(data || []);
    } catch (error) {
      console.error('Error fetching pending invitations:', error);
    }
  };

  const fetchSessions = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          id,
          title,
          session_date,
          start_time,
          end_time,
          athlete_id,
          status,
          session_type,
          athlete:profiles!sessions_athlete_id_fkey(full_name)
        `)
        .eq('professional_id', user.id)
        .order('session_date', { ascending: true });

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  const fetchAllData = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    await Promise.all([
      fetchMyAthletes(),
      fetchPendingInvitations(),
      fetchSessions()
    ]);
    setLoading(false);
  };

  useEffect(() => {
    if (user?.id) {
      fetchAllData();

      // Set up real-time subscriptions
      const relationshipsChannel = supabase
        .channel('professional-relationships-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'athlete_professional_relationships',
            filter: `professional_id=eq.${user.id}`
          },
          (payload) => {
            console.log('Real-time relationship update:', payload);
            fetchMyAthletes();
            fetchPendingInvitations();
          }
        )
        .subscribe();

      const sessionsChannel = supabase
        .channel('professional-sessions-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'sessions',
            filter: `professional_id=eq.${user.id}`
          },
          (payload) => {
            console.log('Real-time session update:', payload);
            fetchSessions();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(relationshipsChannel);
        supabase.removeChannel(sessionsChannel);
      };
    }
  }, [user?.id]);

  return {
    myAthletes,
    pendingInvitations,
    sessions,
    loading,
    refetchAthletes: fetchMyAthletes,
    refetchInvitations: fetchPendingInvitations,
    refetchSessions: fetchSessions,
    refetchAll: fetchAllData
  };
};