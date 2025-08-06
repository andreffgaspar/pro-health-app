import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useHealthIntegration } from '@/hooks/useHealthIntegration';
import { Smartphone, RefreshCw, Shield, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { debugLogger } from '@/services/debugLogger';

interface HealthIntegrationSettingsProps {
  onClose?: () => void;
}

export const HealthIntegrationSettings: React.FC<HealthIntegrationSettingsProps> = ({ onClose }) => {
  const {
    isAvailable,
    isInitialized,
    isConnected,
    grantedPermissions,
    lastSyncTime,
    status,
    requestPermissions,
    syncHealthData,
    disconnect,
    enableBackgroundSync,
    isNative
  } = useHealthIntegration();

  const handleConnect = async () => {
    await debugLogger.log('HealthIntegrationSettings', 'handleConnect button clicked', {
      isAvailable,
      isInitialized,
      isConnected,
      status,
      isNative
    });
    
    try {
      const { HealthDataType } = await import('@/hooks/useHealthIntegration');
      await debugLogger.log('HealthIntegrationSettings', 'HealthDataType imported successfully');
      
      // Define all comprehensive health data types
      const allTypes = [
        HealthDataType.STEPS,
        HealthDataType.DISTANCE,
        HealthDataType.CALORIES,
        HealthDataType.HEART_RATE,
        HealthDataType.SLEEP,
        HealthDataType.WEIGHT,
        HealthDataType.HEIGHT,
        HealthDataType.WATER,
        HealthDataType.WORKOUT
      ];
      
      await debugLogger.log('HealthIntegrationSettings', 'About to request permissions', {
        dataTypesCount: allTypes.length,
        dataTypes: allTypes
      });
      const result = await requestPermissions(allTypes);
      await debugLogger.log('HealthIntegrationSettings', 'Permission request completed', { result });
    } catch (error) {
      await debugLogger.error('HealthIntegrationSettings', 'Error in handleConnect', { error: error.message });
    }
  };

  const handleSync = async () => {
    await syncHealthData({ days: 7, showProgress: true });
  };

  const handleEnableBackgroundSync = async (enabled: boolean) => {
    const { HealthDataType } = await import('@/hooks/useHealthIntegration');
    await enableBackgroundSync(enabled, {
      interval: 60,
      dataTypes: Object.values(HealthDataType)
    });
  };

  const getStatusColor = () => {
    if (status === 'syncing') return 'bg-blue-500';
    if (status === 'connected') return 'bg-green-500';
    if (status === 'error') return 'bg-red-500';
    return 'bg-gray-500';
  };

  const getStatusIcon = () => {
    if (status === 'syncing') return <Loader2 className="h-4 w-4 animate-spin" />;
    if (status === 'connected') return <CheckCircle className="h-4 w-4" />;
    if (status === 'error') return <XCircle className="h-4 w-4" />;
    return null;
  };

  if (!isInitialized) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Initializing health integration...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Integração de Dados de Saúde
          </CardTitle>
          <CardDescription>
            {isNative 
              ? "Conecte-se ao app Saúde do seu dispositivo para sincronizar dados automaticamente"
              : "A integração de dados de saúde está disponível apenas em dispositivos móveis"
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isNative ? (
            <div className="text-center py-8 text-muted-foreground">
              <Smartphone className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>A integração de saúde requer um dispositivo móvel</p>
              <p className="text-sm">Abra este aplicativo no seu celular ou tablet</p>
            </div>
          ) : !isAvailable ? (
            <div className="text-center py-8 space-y-4">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
              <div>
                <p className="text-muted-foreground">Configure o HealthKit</p>
                <p className="text-sm text-muted-foreground">Conecte-se ao app Saúde para sincronizar seus dados automaticamente</p>
              </div>
              <Button 
                onClick={handleConnect}
                className="mt-4"
                disabled={status === 'syncing'}
              >
                {status === 'syncing' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Solicitando Permissões...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4 mr-2" />
                    Configurar HealthKit
                  </>
                )}
              </Button>
            </div>
          ) : (
            <>
              {/* Connection Status */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Status da Conexão</span>
                    <Badge 
                      variant={isConnected ? "default" : "secondary"}
                      className={`${getStatusColor()} text-white`}
                    >
                      {getStatusIcon()}
                      {isConnected ? 'Conectado' : 'Desconectado'}
                    </Badge>
                  </div>
                  {lastSyncTime && (
                    <p className="text-sm text-muted-foreground">
                      Última sincronização: {formatDistanceToNow(lastSyncTime, { addSuffix: true })}
                    </p>
                  )}
                </div>
                {!isConnected ? (
                  <Button 
                    onClick={handleConnect} 
                    disabled={status === 'syncing'}
                    className="min-w-[120px]"
                  >
                    {status === 'syncing' ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Conectando...
                      </>
                    ) : (
                      'Conectar ao HealthKit'
                    )}
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleSync}
                      disabled={status === 'syncing'}
                    >
                      {status === 'syncing' ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={disconnect}
                    >
                      Desconectar
                    </Button>
                  </div>
                )}
              </div>

              {/* Permissions */}
              {isConnected && grantedPermissions.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium">Permissões de Dados</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {grantedPermissions.map((permission) => (
                      <div 
                        key={permission}
                        className="flex items-center justify-between p-2 rounded-lg border bg-muted/50"
                      >
                        <span className="text-sm capitalize">
                          {permission.replace('_', ' ')}
                        </span>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Background Sync */}
              {isConnected && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span className="font-medium">Sincronização Automática</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Sincronizar dados de saúde automaticamente em segundo plano
                      </p>
                    </div>
                    <Switch 
                      checked={true} // For simulation, always show as enabled
                      onCheckedChange={handleEnableBackgroundSync}
                    />
                  </div>
                </div>
              )}

              {/* Information */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">Como funciona</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Sincroniza dados do app Saúde do seu dispositivo</li>
                  <li>• Atualiza suas métricas automaticamente</li>
                  <li>• Você ainda pode inserir dados manualmente</li>
                  <li>• Seus dados de saúde permanecem privados e seguros</li>
                </ul>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};