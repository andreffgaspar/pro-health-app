import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationPayload {
  userId: string;
  title: string;
  body: string;
  type: 'message' | 'appointment' | 'training' | 'nutrition' | 'system';
  data?: any;
  targetPlatforms?: ('web' | 'mobile' | 'email')[];
}

interface WebPushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');
    const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: NotificationPayload = await req.json();
    console.log('Enviando notificação:', payload);

    // Buscar configurações do usuário
    const { data: settings, error: settingsError } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('user_id', payload.userId)
      .single();

    if (settingsError && settingsError.code !== 'PGRST116') {
      throw settingsError;
    }

    // Verificar se o tipo de notificação está habilitado
    const typeEnabled = checkNotificationTypeEnabled(settings, payload.type);
    if (!typeEnabled) {
      console.log(`Notificação do tipo ${payload.type} desabilitada para usuário ${payload.userId}`);
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Notification type disabled' 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const results: any[] = [];

    // Determinar plataformas alvo
    const targetPlatforms = payload.targetPlatforms || ['web', 'mobile', 'email'];

    // 1. Salvar notificação no banco
    const { data: notificationRecord, error: dbError } = await supabase
      .from('notifications')
      .insert({
        user_id: payload.userId,
        title: payload.title,
        message: payload.body,
        type: payload.type,
        data: payload.data || {},
        read: false
      })
      .select()
      .single();

    if (dbError) {
      throw dbError;
    }

    results.push({ platform: 'database', success: true, id: notificationRecord.id });

    // 2. Web Push Notifications
    if (targetPlatforms.includes('web') && settings?.web_push && vapidPrivateKey && vapidPublicKey) {
      try {
        const webResult = await sendWebPushNotification(
          supabase,
          payload,
          vapidPrivateKey,
          vapidPublicKey
        );
        results.push({ platform: 'web', success: webResult.success, details: webResult });
      } catch (error) {
        console.error('Erro ao enviar web push:', error);
        results.push({ platform: 'web', success: false, error: error.message });
      }
    }

    // 3. Mobile Push Notifications
    if (targetPlatforms.includes('mobile') && settings?.mobile) {
      try {
        const mobileResult = await sendMobilePushNotification(supabase, payload);
        results.push({ platform: 'mobile', success: mobileResult.success, details: mobileResult });
      } catch (error) {
        console.error('Erro ao enviar mobile push:', error);
        results.push({ platform: 'mobile', success: false, error: error.message });
      }
    }

    // 4. Email Notifications
    if (targetPlatforms.includes('email') && settings?.email) {
      try {
        const emailResult = await sendEmailNotification(supabase, payload);
        results.push({ platform: 'email', success: emailResult.success, details: emailResult });
      } catch (error) {
        console.error('Erro ao enviar email:', error);
        results.push({ platform: 'email', success: false, error: error.message });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      notificationId: notificationRecord.id,
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erro na função de notificação:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Verificar se tipo de notificação está habilitado
function checkNotificationTypeEnabled(settings: any, type: string): boolean {
  if (!settings) return true; // Se não há configurações, permitir por padrão

  switch (type) {
    case 'message':
      return settings.messages !== false;
    case 'appointment':
      return settings.appointments !== false;
    case 'training':
      return settings.training !== false;
    case 'nutrition':
      return settings.nutrition !== false;
    default:
      return true;
  }
}

// Enviar Web Push Notification
async function sendWebPushNotification(
  supabase: any, 
  payload: NotificationPayload, 
  vapidPrivateKey: string,
  vapidPublicKey: string
) {
  // Buscar subscriptions ativas do usuário para web
  const { data: subscriptions, error } = await supabase
    .from('notification_subscriptions')
    .select('subscription_data')
    .eq('user_id', payload.userId)
    .eq('platform', 'web')
    .eq('is_active', true);

  if (error) throw error;

  if (!subscriptions || subscriptions.length === 0) {
    return { success: false, message: 'No web push subscriptions found' };
  }

  const pushPayload = {
    title: payload.title,
    body: payload.body,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    data: {
      type: payload.type,
      ...payload.data
    },
    requireInteraction: payload.type === 'appointment',
    tag: `${payload.type}-${Date.now()}`
  };

  const results = [];

  // Enviar para cada subscription
  for (const sub of subscriptions) {
    try {
      const subscription = sub.subscription_data as WebPushSubscription;
      
      // Aqui você implementaria o envio real do web push
      // Para simplificar, vamos simular o sucesso
      console.log('Enviando web push para:', subscription.endpoint);
      
      // Em um cenário real, você usaria uma biblioteca como web-push
      // const webpush = require('web-push');
      // await webpush.sendNotification(subscription, JSON.stringify(pushPayload));
      
      results.push({ endpoint: subscription.endpoint, success: true });
      
    } catch (error) {
      console.error('Erro ao enviar para subscription:', error);
      results.push({ endpoint: subscription.endpoint, success: false, error: error.message });
    }
  }

  return { 
    success: results.some(r => r.success), 
    results,
    payload: pushPayload 
  };
}

// Enviar Mobile Push Notification
async function sendMobilePushNotification(supabase: any, payload: NotificationPayload) {
  // Buscar subscriptions ativas do usuário para mobile
  const { data: subscriptions, error } = await supabase
    .from('notification_subscriptions')
    .select('subscription_data')
    .eq('user_id', payload.userId)
    .eq('platform', 'mobile')
    .eq('is_active', true);

  if (error) throw error;

  if (!subscriptions || subscriptions.length === 0) {
    return { success: false, message: 'No mobile push subscriptions found' };
  }

  const results = [];

  // Enviar para cada token
  for (const sub of subscriptions) {
    try {
      const { token } = sub.subscription_data;
      
      // Aqui você implementaria o envio via FCM (Firebase Cloud Messaging)
      console.log('Enviando mobile push para token:', token);
      
      // Em um cenário real, você usaria o Firebase Admin SDK
      // const message = {
      //   notification: {
      //     title: payload.title,
      //     body: payload.body
      //   },
      //   data: {
      //     type: payload.type,
      //     ...payload.data
      //   },
      //   token: token
      // };
      // await admin.messaging().send(message);
      
      results.push({ token, success: true });
      
    } catch (error) {
      console.error('Erro ao enviar mobile push:', error);
      results.push({ token: 'hidden', success: false, error: error.message });
    }
  }

  return { 
    success: results.some(r => r.success), 
    results 
  };
}

// Enviar Email Notification
async function sendEmailNotification(supabase: any, payload: NotificationPayload) {
  // Buscar email do usuário
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('email')
    .eq('user_id', payload.userId)
    .single();

  if (error) throw error;

  if (!profile?.email) {
    return { success: false, message: 'No email found for user' };
  }

  try {
    // Aqui você implementaria o envio de email
    // Pode usar Supabase Edge Functions com Resend, SendGrid, etc.
    console.log('Enviando email para:', profile.email);
    
    // Em um cenário real:
    // await sendEmailWithProvider({
    //   to: profile.email,
    //   subject: payload.title,
    //   html: createEmailTemplate(payload)
    // });
    
    return { 
      success: true, 
      email: profile.email,
      subject: payload.title 
    };
    
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    return { success: false, error: error.message };
  }
}