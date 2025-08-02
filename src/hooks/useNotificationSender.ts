import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Hook para enviar notificações via edge function
export const useSendNotification = () => {
  const sendNotification = async (payload: {
    userId: string;
    title: string;
    body: string;
    type: 'message' | 'appointment' | 'training' | 'nutrition' | 'system';
    data?: any;
    targetPlatforms?: ('web' | 'mobile' | 'email')[];
  }) => {
    try {
      const { data, error } = await supabase.functions.invoke('send-notification', {
        body: payload
      });

      if (error) throw error;
      
      console.log('Notificação enviada:', data);
      return { success: true, data };
      
    } catch (error) {
      console.error('Erro ao enviar notificação:', error);
      return { success: false, error };
    }
  };

  return { sendNotification };
};

// Hook para escutar notificações em tempo real
export const useRealtimeNotifications = (userId?: string) => {
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('Nova notificação em tempo real:', payload);
          
          // Mostrar notificação nativa se o usuário permitiu
          if ('Notification' in window && Notification.permission === 'granted') {
            const notif = payload.new as any;
            new Notification(notif.title, {
              body: notif.message,
              icon: '/favicon.ico',
              tag: `notification-${notif.id}`,
              data: notif.data
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);
};