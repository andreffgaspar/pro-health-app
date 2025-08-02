-- Verificar se as tabelas já existem e criar apenas as que faltam
DO $$
BEGIN
    -- Criar tabela notification_settings se não existir
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'notification_settings') THEN
        CREATE TABLE public.notification_settings (
            id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            web_push BOOLEAN DEFAULT false,
            mobile BOOLEAN DEFAULT false,
            email BOOLEAN DEFAULT true,
            messages BOOLEAN DEFAULT true,
            appointments BOOLEAN DEFAULT true,
            training BOOLEAN DEFAULT true,
            nutrition BOOLEAN DEFAULT true,
            sound_enabled BOOLEAN DEFAULT true,
            vibration_enabled BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            UNIQUE(user_id)
        );
        
        ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can view their own notification settings" 
        ON public.notification_settings 
        FOR SELECT 
        USING (auth.uid() = user_id);

        CREATE POLICY "Users can create their own notification settings" 
        ON public.notification_settings 
        FOR INSERT 
        WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "Users can update their own notification settings" 
        ON public.notification_settings 
        FOR UPDATE 
        USING (auth.uid() = user_id);
    END IF;

    -- Criar tabela notification_subscriptions se não existir
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'notification_subscriptions') THEN
        CREATE TABLE public.notification_subscriptions (
            id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            platform TEXT NOT NULL CHECK (platform IN ('web', 'mobile')),
            subscription_data JSONB NOT NULL,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            UNIQUE(user_id, platform)
        );
        
        ALTER TABLE public.notification_subscriptions ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can view their own notification subscriptions" 
        ON public.notification_subscriptions 
        FOR SELECT 
        USING (auth.uid() = user_id);

        CREATE POLICY "Users can create their own notification subscriptions" 
        ON public.notification_subscriptions 
        FOR INSERT 
        WITH CHECK (auth.uid() = user_id);

        CREATE POLICY "Users can update their own notification subscriptions" 
        ON public.notification_subscriptions 
        FOR UPDATE 
        USING (auth.uid() = user_id);

        CREATE POLICY "Users can delete their own notification subscriptions" 
        ON public.notification_subscriptions 
        FOR DELETE 
        USING (auth.uid() = user_id);
    END IF;
END
$$;

-- Adicionar colunas que faltam na tabela notifications se necessário
DO $$
BEGIN
    -- Verificar se a coluna 'data' existe, se não, adicionar
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'data') THEN
        ALTER TABLE public.notifications ADD COLUMN data JSONB DEFAULT '{}';
    END IF;
    
    -- Verificar se a coluna 'read' existe, se não, adicionar
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'read') THEN
        ALTER TABLE public.notifications ADD COLUMN read BOOLEAN DEFAULT false;
    END IF;
END
$$;

-- Criar triggers apenas se não existirem
DO $$
BEGIN
    -- Trigger para notification_settings
    IF NOT EXISTS (SELECT FROM pg_trigger WHERE tgname = 'update_notification_settings_updated_at') THEN
        CREATE TRIGGER update_notification_settings_updated_at
            BEFORE UPDATE ON public.notification_settings
            FOR EACH ROW
            EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
    
    -- Trigger para notification_subscriptions
    IF NOT EXISTS (SELECT FROM pg_trigger WHERE tgname = 'update_notification_subscriptions_updated_at') THEN
        CREATE TRIGGER update_notification_subscriptions_updated_at
            BEFORE UPDATE ON public.notification_subscriptions
            FOR EACH ROW
            EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
    
    -- Trigger para marcar notificação como lida
    IF NOT EXISTS (SELECT FROM pg_trigger WHERE tgname = 'auto_mark_notification_read') THEN
        CREATE OR REPLACE FUNCTION public.mark_notification_read()
        RETURNS TRIGGER AS $inner$
        BEGIN
            IF NEW.read_at IS NOT NULL AND OLD.read_at IS NULL THEN
                NEW.read = true;
            END IF;
            RETURN NEW;
        END;
        $inner$ LANGUAGE plpgsql;
        
        CREATE TRIGGER auto_mark_notification_read
            BEFORE UPDATE ON public.notifications
            FOR EACH ROW
            EXECUTE FUNCTION public.mark_notification_read();
    END IF;
END
$$;

-- Criar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_created_at ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_read ON public.notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notification_subscriptions_user_platform ON public.notification_subscriptions(user_id, platform);

-- Habilitar realtime para a tabela notifications
ALTER TABLE public.notifications REPLICA IDENTITY FULL;