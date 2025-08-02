import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

// Tipos para notificações móveis
interface LocalNotificationConfig {
  title: string;
  body: string;
  id: number;
  schedule?: {
    at: Date;
    repeats?: boolean;
    every?: 'year' | 'month' | 'week' | 'day' | 'hour' | 'minute' | 'second';
  };
  sound?: string;
  attachments?: Array<{
    id: string;
    url: string;
    options?: any;
  }>;
  actionTypeId?: string;
  extra?: any;
}

interface PushNotificationToken {
  value: string;
  type: 'ios' | 'android';
}

export const useCapacitorNotifications = () => {
  const { user } = useAuth();
  const [isCapacitorAvailable, setIsCapacitorAvailable] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Verificar se Capacitor está disponível
  useEffect(() => {
    const checkCapacitor = async () => {
      try {
        // @ts-ignore - Capacitor será carregado dinamicamente
        const { Capacitor } = await import('@capacitor/core');
        setIsCapacitorAvailable(Capacitor.isNativePlatform());
        
        if (Capacitor.isNativePlatform()) {
          await initializeNotifications();
        }
      } catch (error) {
        console.log('Capacitor não disponível - modo web');
        setIsCapacitorAvailable(false);
      }
    };

    checkCapacitor();
  }, []);

  // Inicializar notificações
  const initializeNotifications = async () => {
    if (!isCapacitorAvailable) return;

    try {
      // @ts-ignore
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      
      // Verificar permissão para notificações locais
      const localPermission = await LocalNotifications.checkPermissions();
      setHasPermission(localPermission.display === 'granted');

      // Configurar listeners para notificações locais
      await LocalNotifications.addListener('localNotificationReceived', (notification) => {
        console.log('Notificação local recebida:', notification);
      });

      await LocalNotifications.addListener('localNotificationActionPerformed', (notificationAction) => {
        console.log('Ação da notificação local:', notificationAction);
        handleNotificationAction(notificationAction);
      });

      // Configurar push notifications se disponível
      try {
        // @ts-ignore
        const pushModule = await import('@capacitor/push-notifications');
        const { PushNotifications } = pushModule;

        // Verificar permissão para push notifications
        const pushPermission = await PushNotifications.checkPermissions();
        
        if (pushPermission.receive === 'granted') {
          await setupPushNotifications();
        }

      } catch (error) {
        console.log('Push notifications não disponível');
      }

    } catch (error) {
      console.error('Erro ao inicializar notificações:', error);
    }
  };

  // Configurar push notifications
  const setupPushNotifications = async () => {
    try {
      // @ts-ignore
      const { PushNotifications } = await import('@capacitor/push-notifications');

      // Registrar para push notifications
      await PushNotifications.register();

      // Listeners para push notifications
      await PushNotifications.addListener('registration', (token: PushNotificationToken) => {
        console.log('Push registration success, token: ' + token.value);
        setPushToken(token.value);
        savePushToken(token.value);
      });

      await PushNotifications.addListener('registrationError', (error: any) => {
        console.error('Error on registration: ' + JSON.stringify(error));
      });

      await PushNotifications.addListener('pushNotificationReceived', (notification: any) => {
        console.log('Push notification received: ', notification);
        handlePushNotificationReceived(notification);
      });

      await PushNotifications.addListener('pushNotificationActionPerformed', (notification: any) => {
        console.log('Push notification action performed', notification);
        handleNotificationAction(notification);
      });

    } catch (error) {
      console.error('Erro ao configurar push notifications:', error);
    }
  };

  // Solicitar permissões
  const requestPermissions = async (): Promise<boolean> => {
    if (!isCapacitorAvailable) {
      toast({
        title: "Não disponível",
        description: "Notificações móveis só funcionam no app nativo",
        variant: "destructive"
      });
      return false;
    }

    setIsLoading(true);
    try {
      // @ts-ignore
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      
      const permission = await LocalNotifications.requestPermissions();
      const granted = permission.display === 'granted';
      setHasPermission(granted);

      if (granted) {
        // Também solicitar permissão para push notifications
        try {
          // @ts-ignore
          const { PushNotifications } = await import('@capacitor/push-notifications');
          await PushNotifications.requestPermissions();
          await setupPushNotifications();
        } catch (error) {
          console.log('Push notifications não disponível');
        }

        toast({
          title: "Permissões concedidas",
          description: "Notificações móveis habilitadas"
        });
        return true;
      } else {
        toast({
          title: "Permissão negada",
          description: "Habilite nas configurações do dispositivo",
          variant: "destructive"
        });
        return false;
      }

    } catch (error) {
      console.error('Erro ao solicitar permissões:', error);
      toast({
        title: "Erro",
        description: "Erro ao solicitar permissões",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Enviar notificação local
  const scheduleLocalNotification = async (config: LocalNotificationConfig) => {
    if (!isCapacitorAvailable || !hasPermission) {
      console.log('Notificações não disponíveis ou sem permissão');
      return;
    }

    try {
      // @ts-ignore
      const { LocalNotifications } = await import('@capacitor/local-notifications');

      await LocalNotifications.schedule({
        notifications: [config]
      });

      console.log('Notificação local agendada:', config);

    } catch (error) {
      console.error('Erro ao agendar notificação local:', error);
    }
  };

  // Cancelar notificação
  const cancelNotification = async (id: number) => {
    if (!isCapacitorAvailable) return;

    try {
      // @ts-ignore
      const { LocalNotifications } = await import('@capacitor/local-notifications');

      await LocalNotifications.cancel({
        notifications: [{ id }]
      });

    } catch (error) {
      console.error('Erro ao cancelar notificação:', error);
    }
  };

  // Listar notificações pendentes
  const getPendingNotifications = async () => {
    if (!isCapacitorAvailable) return [];

    try {
      // @ts-ignore
      const { LocalNotifications } = await import('@capacitor/local-notifications');

      const pending = await LocalNotifications.getPending();
      return pending.notifications;

    } catch (error) {
      console.error('Erro ao buscar notificações pendentes:', error);
      return [];
    }
  };

  // Salvar token push no backend
  const savePushToken = async (token: string) => {
    if (!user) return;

    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Usar query direta para as novas tabelas
      const { error } = await supabase
        .from('notification_subscriptions' as any)
        .upsert({
          user_id: user.id,
          platform: 'mobile',
          subscription_data: { token },
          is_active: true
        }, {
          onConflict: 'user_id,platform'
        });

      if (error) throw error;

    } catch (error) {
      console.error('Erro ao salvar token push:', error);
    }
  };

  // Manipular notificação recebida
  const handlePushNotificationReceived = (notification: any) => {
    // Lógica para quando uma push notification é recebida
    console.log('Push notification recebida:', notification);
    
    // Mostrar notificação local se o app estiver em foreground
    if (notification.title && notification.body) {
      scheduleLocalNotification({
        title: notification.title,
        body: notification.body,
        id: Date.now(),
        extra: notification.data
      });
    }
  };

  // Manipular ação da notificação
  const handleNotificationAction = (notificationAction: any) => {
    const { notification, actionId } = notificationAction;
    
    console.log('Ação da notificação:', actionId, notification);

    // Navegar baseado no tipo de notificação
    if (notification.extra) {
      const data = notification.extra;
      
      // Implementar navegação baseada no tipo
      switch (data.type) {
        case 'message':
          // Navegar para conversa
          window.location.href = `/communication?conversation=${data.conversationId || ''}`;
          break;
        case 'appointment':
          // Navegar para agenda
          window.location.href = `/athlete-dashboard?section=schedule`;
          break;
        case 'training':
          // Navegar para treinos
          window.location.href = `/athlete-dashboard?section=training`;
          break;
        default:
          // Navegar para dashboard
          window.location.href = '/athlete-dashboard';
      }
    }
  };

  // Notificação de teste
  const sendTestNotification = async () => {
    await scheduleLocalNotification({
      title: 'Pro Health App - Teste',
      body: 'Esta é uma notificação de teste no mobile!',
      id: Date.now(),
      extra: { type: 'test' }
    });

    toast({
      title: "Notificação enviada",
      description: "Verifique se recebeu a notificação móvel"
    });
  };

  return {
    // Estado
    isCapacitorAvailable,
    hasPermission,
    pushToken,
    isLoading,

    // Funções
    requestPermissions,
    scheduleLocalNotification,
    cancelNotification,
    getPendingNotifications,
    sendTestNotification,

    // Refresh
    initializeNotifications
  };
};