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

    console.log('🔄 Fetching conversations for user:', user.id);

    try {
      // First, get accepted relationships to filter conversations
      const { data: relationships, error: relError } = await supabase
        .from('athlete_professional_relationships')
        .select('athlete_id, professional_id')
        .or(`athlete_id.eq.${user.id},professional_id.eq.${user.id}`)
        .eq('status', 'accepted');

      if (relError) throw relError;

      console.log('Found relationships:', relationships);

      // Extract valid user IDs that this user can communicate with
      const validUserIds = relationships?.map(rel => 
        rel.athlete_id === user.id ? rel.professional_id : rel.athlete_id
      ) || [];

      console.log('Valid user IDs for conversations:', validUserIds);

      if (validUserIds.length === 0) {
        console.log('No valid relationships found, clearing conversations');
        setConversations([]);
        setUnreadCount(0);
        return;
      }

      // Fetch conversations where user is participant AND the other party is in valid relationships
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
      
      console.log('Raw conversations found:', data);
      
      // Filter conversations to only include valid relationships
      const validConversations = (data || []).filter(conv => {
        const otherUserId = conv.athlete_id === user.id ? conv.professional_id : conv.athlete_id;
        const isValid = validUserIds.includes(otherUserId);
        console.log(`Conversation ${conv.id}: otherUser=${otherUserId}, isValid=${isValid}`);
        return isValid;
      });

      console.log('Valid conversations after filtering:', validConversations);

      // For each valid conversation, count unread messages and get other party name
      const conversationsWithUnread = await Promise.all(
        validConversations.map(async (conv) => {
          // First, let's see what messages exist in this conversation
          const { data: allMessages } = await supabase
            .from('messages')
            .select('id, sender_id, read_at, created_at, content')
            .eq('conversation_id', conv.id);
          
          console.log(`Messages in conversation ${conv.id}:`, allMessages?.map(m => ({
            id: m.id,
            sender_id: m.sender_id,
            read_at: m.read_at,
            content: m.content?.substring(0, 20) + '...',
            is_from_current_user: m.sender_id === user.id
          })));
          
          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .neq('sender_id', user.id)
            .is('read_at', null);

          console.log(`Unread count for conversation ${conv.id}:`, count);

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

      console.log('Final conversations with unread counts:', conversationsWithUnread);

      setConversations(conversationsWithUnread);
      
      // Calculate total unread count
      const totalUnread = conversationsWithUnread.reduce(
        (sum, conv) => sum + conv.unread_count, 
        0
      );
      
      console.log('Total unread count:', totalUnread);
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

  const markConversationAsRead = async (conversationId: string) => {
    if (!user?.id) return;
    
    console.log('Marking conversation as read:', conversationId, 'for user:', user.id);
    
    try {
      // First check what messages we're trying to update
      const { data: checkMessages } = await supabase
        .from('messages')
        .select('id, sender_id, read_at, content')
        .eq('conversation_id', conversationId)
        .neq('sender_id', user.id)
        .is('read_at', null);
        
      console.log('Messages to be marked as read:', checkMessages);

      // Mark all unread messages in this conversation as read
      const { data, error } = await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .neq('sender_id', user.id)
        .is('read_at', null)
        .select();

      if (error) throw error;
      
      console.log('Messages marked as read:', data);
      
      // Update local state immediately for better UX
      if (data && data.length > 0) {
        // Update conversations state to reflect read messages
        setConversations(prev => 
          prev.map(conv => 
            conv.id === conversationId 
              ? { ...conv, unread_count: Math.max(0, conv.unread_count - data.length) }
              : conv
          )
        );
        
        // Update total unread count
        setUnreadCount(prev => Math.max(0, prev - data.length));
      }
      
      // Refresh conversations to ensure consistency
      fetchConversations();
    } catch (error) {
      console.error('Error marking conversation as read:', error);
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

      // Set up real-time subscriptions with debugging
      console.log('🚀 Setting up realtime subscriptions for user:', user.id);
      
      // Use a more specific channel name and simpler configuration
      const messagesChannel = supabase
        .channel('public:messages')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages'
          },
          async (payload) => {
            console.log('🆕 New message inserted:', payload);
            
            if (payload.new) {
              const newMessage = payload.new as any;
              console.log('📝 Message details:', {
                id: newMessage.id,
                conversation_id: newMessage.conversation_id,
                sender_id: newMessage.sender_id,
                content: newMessage.content?.substring(0, 30),
                is_from_other_user: newMessage.sender_id !== user.id
              });
              
              // If this is a message from another user, update immediately
              if (newMessage.sender_id !== user.id) {
                console.log('💬 Message from other user - updating...');
                
                // First update the messages for this conversation
                await fetchMessages(newMessage.conversation_id);
                
                // Then update conversations to refresh unread counts
                await fetchConversations();
              }
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'messages'
          },
          async (payload) => {
            console.log('📝 Message updated:', payload);
            
            if (payload.new) {
              const updatedMessage = payload.new as any;
              await fetchMessages(updatedMessage.conversation_id);
              await fetchConversations();
            }
          }
        )
        .subscribe((status, err) => {
          console.log('📡 Messages subscription status:', status);
          if (err) {
            console.error('❌ Messages subscription error:', err);
          }
          if (status === 'SUBSCRIBED') {
            console.log('✅ Successfully subscribed to messages');
          }
        });

      const conversationsChannel = supabase
        .channel('public:conversations')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'conversations'
          },
          async (payload) => {
            console.log('🔄 Conversation updated:', payload);
            await fetchConversations();
          }
        )
        .subscribe((status, err) => {
          console.log('📡 Conversations subscription status:', status);
          if (err) {
            console.error('❌ Conversations subscription error:', err);
          }
        });

      const notificationsChannel = supabase
        .channel('public:notifications')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            console.log('🔔 Notification update:', payload);
            fetchNotifications();
          }
        )
        .subscribe();

      // Fallback: Poll for updates every 5 seconds when document is visible
      const pollInterval = setInterval(() => {
        if (!document.hidden) {
          console.log('🔄 Polling for updates...');
          fetchConversations();
        }
      }, 5000);

      return () => {
        console.log('🧹 Cleaning up subscriptions...');
        supabase.removeChannel(messagesChannel);
        supabase.removeChannel(conversationsChannel);
        supabase.removeChannel(notificationsChannel);
        clearInterval(pollInterval);
      };
    }
  }, [user?.id, conversations]);

  return {
    conversations,
    messages,
    notifications,
    unreadCount,
    loading,
    fetchMessages,
    markNotificationAsRead,
    markMessageAsRead,
    markConversationAsRead,
    refetchConversations: fetchConversations,
    refetchNotifications: fetchNotifications
  };
};