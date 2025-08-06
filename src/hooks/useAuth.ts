import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLoginLogger } from '@/hooks/useLoginLogger';

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  user_type: 'athlete' | 'professional' | null;
  created_at: string;
  updated_at: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { 
    generateSessionId, 
    logStart, 
    logSuccess, 
    logError, 
    logTimeout 
  } = useLoginLogger();
  
  const [currentSessionId] = useState(() => generateSessionId());

  useEffect(() => {
    let isMounted = true;
    
    logStart('auth_initialization', 'Initializing auth system', { sessionId: currentSessionId }, currentSessionId);
    
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return;
        
        logStart('auth_state_change', `Auth state changed: ${event}`, { 
          event, 
          hasSession: !!session, 
          hasUser: !!session?.user 
        }, currentSessionId, session?.user?.id);
        
        setSession(session);
        setUser(session?.user ?? null);
        
        // Fetch profile when user logs in, or set loading to false if no user
        if (session?.user) {
          logStart('profile_fetch_trigger', 'Triggering profile fetch', { 
            userId: session.user.id 
          }, currentSessionId, session.user.id);
          
          // Use a small delay to prevent race conditions
          setTimeout(() => {
            if (isMounted) {
              fetchProfile(session.user.id);
            }
          }, 100);
        } else {
          logSuccess('auth_state_cleared', 'User logged out, clearing state', {}, currentSessionId);
          setProfile(null);
          setLoading(false);
        }
      }
    );

    // THEN check for existing session
    logStart('session_check', 'Checking for existing session', {}, currentSessionId);
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      
      logSuccess('session_check', 'Session check completed', { 
        hasSession: !!session, 
        hasUser: !!session?.user 
      }, currentSessionId, session?.user?.id);
      
      // Only update state if this is the first check
      if (!user && !profile) {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          logStart('existing_session_profile_fetch', 'Fetching profile for existing session', { 
            userId: session.user.id 
          }, currentSessionId, session.user.id);
          fetchProfile(session.user.id);
        } else {
          logSuccess('no_existing_session', 'No existing session found', {}, currentSessionId);
          setLoading(false);
        }
      }
    }).catch((error) => {
      if (isMounted) {
        logError('session_check', error, currentSessionId);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    const stepStart = Date.now();
    await logStart('fetch_profile', 'Starting profile fetch', { userId }, currentSessionId, userId);
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        await logError('fetch_profile', error, currentSessionId, userId);
        console.error('Error fetching profile:', error);
        setLoading(false);
        return;
      }

      const duration = Date.now() - stepStart;
      await logSuccess('fetch_profile', 'Profile fetched successfully', { 
        profile: data, 
        duration 
      }, currentSessionId, userId);
      
      setProfile(data as Profile);
      setLoading(false);
      
      await logSuccess('loading_completed', 'Auth loading completed successfully', { 
        totalDuration: Date.now() - stepStart,
        hasProfile: true 
      }, currentSessionId, userId);
    } catch (error) {
      await logError('fetch_profile', error, currentSessionId, userId);
      console.error('Error fetching profile:', error);
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string, userType: 'athlete' | 'professional') => {
    try {
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
            user_type: userType
          }
        }
      });

      if (error) {
        toast({
          title: "Erro no cadastro",
          description: error.message,
          variant: "destructive"
        });
        return { error };
      }

      toast({
        title: "Cadastro realizado!",
        description: "Verifique seu email para confirmar a conta."
      });

      return { data, error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: "Erro no cadastro",
        description: errorMessage,
        variant: "destructive"
      });
      return { error: { message: errorMessage } };
    }
  };

  const signIn = async (email: string, password: string) => {
    const loginSessionId = generateSessionId();
    const loginStart = Date.now();
    
    await logStart('sign_in_attempt', 'Starting sign in process', { 
      email: email.substring(0, 3) + '***', // Hide email for privacy
      timestamp: new Date().toISOString() 
    }, loginSessionId);
    
    try {
      await logStart('auth_signin_call', 'Calling Supabase signInWithPassword', {}, loginSessionId);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        await logError('auth_signin_call', error, loginSessionId);
        toast({
          title: "Erro no login",
          description: error.message,
          variant: "destructive"
        });
        return { error };
      }

      const loginDuration = Date.now() - loginStart;
      await logSuccess('auth_signin_call', 'Supabase signIn successful', { 
        userId: data.user?.id,
        hasSession: !!data.session,
        duration: loginDuration 
      }, loginSessionId, data.user?.id);

      toast({
        title: "Login realizado!",
        description: "Bem-vindo de volta!"
      });

      await logSuccess('sign_in_completed', 'Sign in process completed', { 
        totalDuration: loginDuration,
        userId: data.user?.id 
      }, loginSessionId, data.user?.id);

      return { data, error: null };
    } catch (error) {
      await logError('sign_in_attempt', error, loginSessionId);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: "Erro no login",
        description: errorMessage,
        variant: "destructive"
      });
      return { error: { message: errorMessage } };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        toast({
          title: "Erro ao sair",
          description: error.message,
          variant: "destructive"
        });
        return { error };
      }

      // The onAuthStateChange will handle clearing the state
      toast({
        title: "Logout realizado",
        description: "Até logo!"
      });

      return { error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: "Erro ao sair",
        description: errorMessage,
        variant: "destructive"
      });
      return { error: { message: errorMessage } };
    }
  };

  return {
    user,
    session,
    profile,
    loading,
    signUp,
    signIn,
    signOut
  };
};