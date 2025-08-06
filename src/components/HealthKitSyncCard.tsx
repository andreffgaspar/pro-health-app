import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useHealthIntegration } from '@/hooks/useHealthIntegration';
import { 
  Smartphone, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Activity,
  Calendar,
  Clock
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface HealthKitSyncCardProps {
  className?: string;
}

export const HealthKitSyncCard: React.FC<HealthKitSyncCardProps> = ({ className }) => {
  const {
    isAvailable,
    isInitialized,
    isConnected,
    grantedPermissions,
    lastSyncTime,
    status,
    syncHealthData,
    getLastSyncInfo,
    isNative
  } = useHealthIntegration();

  const [syncInProgress, setSyncInProgress] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);

  const lastSyncInfo = getLastSyncInfo();

  const handleManualSync = async () => {
    if (!isConnected) return;

    try {
      setSyncInProgress(true);
      setSyncProgress(0);

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setSyncProgress(prev => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return 95;
          }
          return prev + 15;
        });
      }, 200);

      await syncHealthData({ days: 7, showProgress: true });
      
      setSyncProgress(100);
      setTimeout(() => {
        setSyncInProgress(false);
        setSyncProgress(0);
      }, 1000);

    } catch (error) {
      console.error('Manual sync failed:', error);
      toast.error('Falha na sincronização manual');
      setSyncInProgress(false);
      setSyncProgress(0);
    }
  };

  const getStatusColor = () => {
    if (status === 'syncing' || syncInProgress) return 'text-blue-600';
    if (status === 'connected') return 'text-green-600';
    if (status === 'error') return 'text-red-600';
    return 'text-gray-600';
  };

  const getStatusIcon = () => {
    if (status === 'syncing' || syncInProgress) return <Loader2 className="h-4 w-4 animate-spin" />;
    if (status === 'connected') return <CheckCircle className="h-4 w-4" />;
    if (status === 'error') return <XCircle className="h-4 w-4" />;
    return <Clock className="h-4 w-4" />;
  };

  const getStatusText = () => {
    if (syncInProgress) return 'Sincronizando...';
    if (status === 'syncing') return 'Sincronizando...';
    if (status === 'connected') return 'Conectado';
    if (status === 'error') return 'Erro';
    if (status === 'initializing') return 'Inicializando...';
    return 'Desconectado';
  };

  // Don't show card if not on mobile or health not available
  if (!isNative || !isAvailable || !isInitialized) {
    return null;
  }

  return (
    <Card className={`${className} hover:shadow-card-sport transition-shadow`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Activity className="w-5 h-5 text-primary" />
          HealthKit Sync
        </CardTitle>
        <CardDescription className="text-sm">
          Sincronização automática de dados de saúde
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${getStatusColor().replace('text-', 'bg-')}`} />
            <span className="text-sm font-medium">Status:</span>
            <span className={`text-sm ${getStatusColor()}`}>
              {getStatusText()}
            </span>
          </div>
          <div className={getStatusColor()}>
            {getStatusIcon()}
          </div>
        </div>

        {/* Sync Progress */}
        {syncInProgress && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Sincronizando dados...</span>
              <span>{syncProgress}%</span>
            </div>
            <Progress value={syncProgress} className="h-1.5" />
          </div>
        )}

        {/* Last Sync Info */}
        {lastSyncInfo && (
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Calendar className="w-3 h-3" />
              <span>Último sync:</span>
            </div>
            <span className="text-foreground font-medium">
              {formatDistanceToNow(new Date(lastSyncInfo.timestamp), { 
                addSuffix: true
              })}
            </span>
          </div>
        )}

        {/* Data Count */}
        {lastSyncInfo && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Dados sincronizados:</span>
            <Badge variant="outline" className="text-xs">
              {lastSyncInfo.dataPointsCount} pontos
            </Badge>
          </div>
        )}

        {/* Permissions Summary */}
        {isConnected && grantedPermissions.length > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Permissões ativas:</span>
            <Badge variant="secondary" className="text-xs">
              {grantedPermissions.length} tipos de dados
            </Badge>
          </div>
        )}

        {/* Manual Sync Button */}
        {isConnected && (
          <Button
            onClick={handleManualSync}
            disabled={syncInProgress || status === 'syncing'}
            className="w-full"
            size="sm"
            variant="outline"
          >
            {syncInProgress || status === 'syncing' ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sincronizando...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Sincronizar Agora
              </>
            )}
          </Button>
        )}

        {/* Connection Status for Disconnected State */}
        {!isConnected && (
          <div className="text-center py-4 space-y-2">
            <Smartphone className="w-8 h-8 mx-auto text-muted-foreground opacity-50" />
            <p className="text-sm text-muted-foreground">
              HealthKit não conectado
            </p>
            <p className="text-xs text-muted-foreground">
              Configure nas Configurações do Perfil
            </p>
          </div>
        )}

        {/* Apple HealthKit Notice */}
        {isConnected && (
          <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded border-l-2 border-primary/30">
            <strong>Nota:</strong> Os dados são sincronizados automaticamente em background quando o app está em uso. 
            Para sync em background completo, certifique-se de que as permissões do HealthKit estão ativadas nas configurações do iOS.
          </div>
        )}
      </CardContent>
    </Card>
  );
};