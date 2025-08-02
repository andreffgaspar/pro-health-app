import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';

// Types
interface NotificationPermission {
  granted: boolean;
  denied: boolean;
  default: boolean;
}

interface NotificationSettings {
  webPush: boolean;
  mobile: boolean;
  email: boolean;
  messages: boolean;
  appointments: boolean;
  training: boolean;
  nutrition: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

interface WebPushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export const useNotifications = () => {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>({
    granted: false,
    denied: false,
    default: true
  });
  const [settings, setSettings] = useState<NotificationSettings>({
    webPush: false,
    mobile: false,
    email: true,
    messages: true,
    appointments: true,
    training: true,
    nutrition: true,
    soundEnabled: true,
    vibrationEnabled: true
  });
  const [isLoading, setIsLoading] = useState(false);
  const [subscription, setSubscription] = useState<WebPushSubscription | null>(null);

  // Verificar permissão inicial
  useEffect(() => {
    checkNotificationPermission();
    loadSettings();
  }, [user]);

  // Verificar suporte a notificações
  const isNotificationSupported = () => {
    return 'Notification' in window && 'serviceWorker' in navigator;
  };

  // Verificar permissão atual
  const checkNotificationPermission = () => {
    if (!isNotificationSupported()) return;

    const currentPermission = Notification.permission;
    setPermission({
      granted: currentPermission === 'granted',
      denied: currentPermission === 'denied',
      default: currentPermission === 'default'
    });
  };

  // Solicitar permissão
  const requestPermission = async (): Promise<boolean> => {
    if (!isNotificationSupported()) {
      toast({
        title: "Não suportado",
        description: "Seu navegador não suporta notificações",
        variant: "destructive"
      });
      return false;
    }

    try {
      const result = await Notification.requestPermission();
      checkNotificationPermission();
      
      if (result === 'granted') {
        toast({
          title: "Permissão concedida",
          description: "Notificações habilitadas com sucesso"
        });
        await setupWebPush();
        return true;
      } else {
        toast({
          title: "Permissão negada",
          description: "Você pode habilitar nas configurações do navegador",
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      console.error('Erro ao solicitar permissão:', error);
      toast({
        title: "Erro",
        description: "Erro ao solicitar permissão para notificações",
        variant: "destructive"
      });
      return false;
    }
  };

  // Configurar Web Push
  const setupWebPush = async () => {
    if (!permission.granted || !user) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      
      // VAPID public key (você deve gerar uma chave real)
      const vapidPublicKey = 'BEl62iUYgUivxIkv69yViEuiBIa40HI80y4CXzyhmmLOk9vwjQQ1uKP2lq_QhQQKT9UlKSA5Vs0Z6NyQQtJ_xZ8';
      
      const pushSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      });

      const subscriptionData = {
        endpoint: pushSubscription.endpoint,
        keys: {
          p256dh: arrayBufferToBase64(pushSubscription.getKey('p256dh')!),
          auth: arrayBufferToBase64(pushSubscription.getKey('auth')!)
        }
      };

      setSubscription(subscriptionData);
      
      // Salvar subscription no backend
      await saveSubscription(subscriptionData);
      
    } catch (error) {
      console.error('Erro ao configurar Web Push:', error);
      toast({
        title: "Erro",
        description: "Erro ao configurar notificações push",
        variant: "destructive"
      });
    }
  };

  // Salvar subscription no backend
  const saveSubscription = async (subscriptionData: WebPushSubscription) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notification_subscriptions')
        .upsert({
          user_id: user.id,
          platform: 'web',
          subscription_data: subscriptionData,
          is_active: true
        }, {
          onConflict: 'user_id,platform'
        });

      if (error) throw error;

    } catch (error) {
      console.error('Erro ao salvar subscription:', error);
    }
  };

  // Carregar configurações
  const loadSettings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setSettings({
          webPush: data.web_push || false,
          mobile: data.mobile || false,
          email: data.email || true,
          messages: data.messages || true,
          appointments: data.appointments || true,
          training: data.training || true,
          nutrition: data.nutrition || true,
          soundEnabled: data.sound_enabled || true,
          vibrationEnabled: data.vibration_enabled || true
        });
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  };

  // Salvar configurações
  const saveSettings = async (newSettings: Partial<NotificationSettings>) => {
    if (!user) return;

    setIsLoading(true);
    try {
      const updatedSettings = { ...settings, ...newSettings };
      setSettings(updatedSettings);

      const { error } = await supabase
        .from('notification_settings')
        .upsert({
          user_id: user.id,
          web_push: updatedSettings.webPush,
          mobile: updatedSettings.mobile,
          email: updatedSettings.email,
          messages: updatedSettings.messages,
          appointments: updatedSettings.appointments,
          training: updatedSettings.training,
          nutrition: updatedSettings.nutrition,
          sound_enabled: updatedSettings.soundEnabled,
          vibration_enabled: updatedSettings.vibrationEnabled
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      toast({
        title: "Configurações salvas",
        description: "Suas preferências foram atualizadas"
      });

    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar configurações",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Enviar notificação de teste
  const sendTestNotification = useCallback(async () => {
    if (!permission.granted) {
      toast({
        title: "Permissão necessária",
        description: "Primeiro habilite as notificações",
        variant: "destructive"
      });
      return;
    }

    try {
      // Notificação local para teste
      new Notification('Pro Health App - Teste', {
        body: 'Esta é uma notificação de teste!',
        icon: '/favicon.ico',
        tag: 'test-notification'
      });

      toast({
        title: "Notificação enviada",
        description: "Verifique se recebeu a notificação de teste"
      });

    } catch (error) {
      console.error('Erro ao enviar notificação de teste:', error);
      toast({
        title: "Erro",
        description: "Erro ao enviar notificação de teste",
        variant: "destructive"
      });
    }
  }, [permission.granted]);

  // Funções auxiliares
  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };

  return {
    // Estado
    permission,
    settings,
    isLoading,
    subscription,
    
    // Funções
    isNotificationSupported,
    requestPermission,
    saveSettings,
    sendTestNotification,
    
    // Refresh
    checkNotificationPermission,
    loadSettings
  };
};