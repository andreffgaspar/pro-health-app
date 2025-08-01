import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  conversation_id: string;
  created_at: string;
  read_at?: string;
  message_type: string;
}

interface ConversationWithUnread {
  id: string;
  athlete_id: string;
  professional_id: string;
  title?: string;
  created_at: string;
  updated_at: string;
  unread_count: number;
  other_party_name?: string;
}

interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  read_at?: string;
  created_at: string;
}

export const useRealtimeCommunication = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationWithUnread[]>([]);
  const [messages, setMessages] = useState<{ [conversationId: string]: Message[] }>({});
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchConversations = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          athlete:profiles!conversations_athlete_id_fkey(full_name),
          professional:profiles!conversations_professional_id_fkey(full_name)
        `)
        .or(`athlete_id.eq.${user.id},professional_id.eq.${user.id}`)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      
      // For each conversation, count unread messages
      const conversationsWithUnread = await Promise.all(
        (data || []).map(async (conv) => {
          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .neq('sender_id', user.id)
            .is('read_at', null);

          const isAthlete = user.id === conv.athlete_id;
          const otherParty = isAthlete 
            ? (conv.professional as any)?.full_name 
            : (conv.athlete as any)?.full_name;

          return {
            ...conv,
            unread_count: count || 0,
            other_party_name: otherParty || 'Usuário'
          };
        })
      );

      setConversations(conversationsWithUnread);
      
      // Calculate total unread count
      const totalUnread = conversationsWithUnread.reduce(
        (sum, conv) => sum + conv.unread_count, 
        0
      );
      setUnreadCount(totalUnread);
      
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      setMessages(prev => ({
        ...prev,
        [conversationId]: data || []
      }));
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const fetchNotifications = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw error;
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, read_at: new Date().toISOString() }
            : n
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markMessageAsRead = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('id', messageId);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  useEffect(() => {
    if (user?.id) {
      const fetchAllData = async () => {
        setLoading(true);
        await Promise.all([
          fetchConversations(),
          fetchNotifications()
        ]);
        setLoading(false);
      };

      fetchAllData();

      // Set up real-time subscriptions
      const conversationsChannel = supabase
        .channel('conversations-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'conversations',
            filter: `athlete_id=eq.${user.id},professional_id=eq.${user.id}`
          },
          (payload) => {
            console.log('Real-time conversation update:', payload);
            fetchConversations();
          }
        )
        .subscribe();

      const messagesChannel = supabase
        .channel('messages-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'messages'
          },
          (payload) => {
            console.log('Real-time message update:', payload);
            if (payload.new && 'conversation_id' in payload.new) {
              fetchMessages(payload.new.conversation_id as string);
            }
          }
        )
        .subscribe();

      const notificationsChannel = supabase
        .channel('notifications-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            console.log('Real-time notification update:', payload);
            fetchNotifications();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(conversationsChannel);
        supabase.removeChannel(messagesChannel);
        supabase.removeChannel(notificationsChannel);
      };
    }
  }, [user?.id]);

  return {
    conversations,
    messages,
    notifications,
    unreadCount,
    loading,
    fetchMessages,
    markNotificationAsRead,
    markMessageAsRead,
    refetchConversations: fetchConversations,
    refetchNotifications: fetchNotifications
  };
};