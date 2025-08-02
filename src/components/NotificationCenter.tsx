import React, { useState, useEffect } from 'react';
import { Bell, Settings, Check, X, MessageSquare, Calendar, Dumbbell, Apple } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNotifications } from '@/hooks/useNotifications';
import { useCapacitorNotifications } from '@/hooks/useCapacitorNotifications';
import { useRealtimeCommunication } from '@/hooks/useRealtimeCommunication';
import { RealtimeIndicator } from '@/components/ui/realtime-indicator';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'message' | 'appointment' | 'training' | 'nutrition' | 'system';
  timestamp: string;
  read: boolean;
  data?: any;
}

const NotificationCenter = () => {
  const {
    permission,
    settings,
    isLoading,
    requestPermission,
    saveSettings,
    sendTestNotification
  } = useNotifications();

  const {
    isCapacitorAvailable,
    hasPermission: mobilePermission,
    requestPermissions: requestMobilePermissions,
    sendTestNotification: sendMobileTestNotification
  } = useCapacitorNotifications();

  const {
    notifications,
    unreadCount,
    markNotificationAsRead
  } = useRealtimeCommunication();

  const [showSettings, setShowSettings] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>();

  // Atualizar indicador de tempo real
  useEffect(() => {
    if (notifications.length > 0) {
      setLastUpdate(new Date().toISOString());
    }
  }, [notifications]);

  // Mapear notificações do Supabase para formato local
  const notificationItems: NotificationItem[] = notifications.map(notif => ({
    id: notif.id,
    title: getNotificationTitle(notif.type, (notif as any).data || {}),
    message: notif.message,
    type: notif.type as any,
    timestamp: notif.created_at,
    read: (notif as any).read_at !== null,
    data: (notif as any).data || {}
  }));

  const getNotificationTitle = (type: string, data?: any) => {
    switch (type) {
      case 'message':
        return 'Nova Mensagem';
      case 'appointment':
        return 'Agendamento';
      case 'training':
        return 'Treinamento';
      case 'nutrition':
        return 'Nutrição';
      default:
        return 'Notificação';
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <MessageSquare className="w-4 h-4" />;
      case 'appointment':
        return <Calendar className="w-4 h-4" />;
      case 'training':
        return <Dumbbell className="w-4 h-4" />;
      case 'nutrition':
        return <Apple className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const handleNotificationClick = async (notification: NotificationItem) => {
    if (!notification.read) {
      await markNotificationAsRead(notification.id);
    }

    // Navegação baseada no tipo
    switch (notification.type) {
      case 'message':
        window.location.href = `/communication?conversation=${notification.data?.conversationId || ''}`;
        break;
      case 'appointment':
        window.location.href = `/athlete-dashboard?section=schedule`;
        break;
      case 'training':
        window.location.href = `/athlete-dashboard?section=training`;
        break;
      case 'nutrition':
        window.location.href = `/athlete-dashboard?section=nutrition`;
        break;
    }
  };

  const handleWebPushToggle = async (enabled: boolean) => {
    if (enabled && !permission.granted) {
      const granted = await requestPermission();
      if (!granted) return;
    }
    
    await saveSettings({ webPush: enabled });
  };

  const handleMobileToggle = async (enabled: boolean) => {
    if (enabled && !mobilePermission) {
      const granted = await requestMobilePermissions();
      if (!granted) return;
    }
    
    await saveSettings({ mobile: enabled });
  };

  return (
    <div className="flex items-center gap-2">
      {/* Indicador de tempo real */}
      <RealtimeIndicator 
        isConnected={true} 
        lastUpdate={lastUpdate}
        className="mr-2"
      />

      {/* Botão de notificações */}
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs flex items-center justify-center"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notificações
              {unreadCount > 0 && (
                <Badge variant="secondary">
                  {unreadCount} não lidas
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              Suas notificações e configurações
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="notifications" className="flex-1 overflow-hidden">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="notifications">Notificações</TabsTrigger>
              <TabsTrigger value="settings">
                <Settings className="w-4 h-4 mr-1" />
                Configurações
              </TabsTrigger>
            </TabsList>

            <TabsContent value="notifications" className="overflow-y-auto max-h-96 mt-4">
              {notificationItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma notificação</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {notificationItems.map((notification) => (
                    <Card 
                      key={notification.id}
                      className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                        !notification.read ? 'border-primary/50 bg-primary/5' : ''
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start gap-3">
                          <div className="mt-1">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="text-sm font-medium truncate">
                                {notification.title}
                              </h4>
                              {!notification.read && (
                                <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                              {notification.message}
                            </p>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(notification.timestamp), {
                                addSuffix: true,
                                locale: ptBR
                              })}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="settings" className="mt-4 space-y-4">
              {/* Configurações de Plataforma */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Plataformas</CardTitle>
                  <CardDescription>
                    Escolha onde receber notificações
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Web Push */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">
                        Notificações Web
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Receba notificações no navegador
                      </p>
                      {permission.denied && (
                        <p className="text-xs text-destructive">
                          Permissão negada - verifique as configurações
                        </p>
                      )}
                    </div>
                    <Switch
                      checked={settings.webPush && permission.granted}
                      onCheckedChange={handleWebPushToggle}
                      disabled={isLoading || permission.denied}
                    />
                  </div>

                  {/* Mobile */}
                  {isCapacitorAvailable && (
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-medium">
                          Notificações Móvel
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Receba notificações no app móvel
                        </p>
                      </div>
                      <Switch
                        checked={settings.mobile && mobilePermission}
                        onCheckedChange={handleMobileToggle}
                        disabled={isLoading}
                      />
                    </div>
                  )}

                  {/* Email */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Email</Label>
                      <p className="text-xs text-muted-foreground">
                        Receba notificações por email
                      </p>
                    </div>
                    <Switch
                      checked={settings.email}
                      onCheckedChange={(checked) => saveSettings({ email: checked })}
                      disabled={isLoading}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Tipos de Notificação */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Tipos de Notificação</CardTitle>
                  <CardDescription>
                    Escolha quais notificações receber
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Mensagens</Label>
                    <Switch
                      checked={settings.messages}
                      onCheckedChange={(checked) => saveSettings({ messages: checked })}
                      disabled={isLoading}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Agendamentos</Label>
                    <Switch
                      checked={settings.appointments}
                      onCheckedChange={(checked) => saveSettings({ appointments: checked })}
                      disabled={isLoading}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Treinamentos</Label>
                    <Switch
                      checked={settings.training}
                      onCheckedChange={(checked) => saveSettings({ training: checked })}
                      disabled={isLoading}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Nutrição</Label>
                    <Switch
                      checked={settings.nutrition}
                      onCheckedChange={(checked) => saveSettings({ nutrition: checked })}
                      disabled={isLoading}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Configurações de Som */}
              {isCapacitorAvailable && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Som e Vibração</CardTitle>
                    <CardDescription>
                      Configurações para dispositivos móveis
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Som</Label>
                      <Switch
                        checked={settings.soundEnabled}
                        onCheckedChange={(checked) => saveSettings({ soundEnabled: checked })}
                        disabled={isLoading}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Vibração</Label>
                      <Switch
                        checked={settings.vibrationEnabled}
                        onCheckedChange={(checked) => saveSettings({ vibrationEnabled: checked })}
                        disabled={isLoading}
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Testes */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Testar Notificações</CardTitle>
                  <CardDescription>
                    Envie notificações de teste
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={sendTestNotification}
                    disabled={!permission.granted}
                    className="w-full"
                  >
                    Teste Web
                  </Button>

                  {isCapacitorAvailable && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={sendMobileTestNotification}
                      disabled={!mobilePermission}
                      className="w-full"
                    >
                      Teste Móvel
                    </Button>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NotificationCenter;