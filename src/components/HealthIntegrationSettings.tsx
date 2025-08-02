import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useHealthIntegration } from '@/hooks/useHealthIntegration';
import { Smartphone, RefreshCw, Shield, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface HealthIntegrationSettingsProps {
  onClose?: () => void;
}

export const HealthIntegrationSettings: React.FC<HealthIntegrationSettingsProps> = ({ onClose }) => {
  const {
    isAvailable,
    isInitialized,
    isConnected,
    permissions,
    lastSyncTime,
    syncStatus,
    requestPermissions,
    syncHealthData,
    disconnect,
    enableBackgroundSync,
    isNative
  } = useHealthIntegration();

  const handleConnect = async () => {
    await requestPermissions();
  };

  const handleSync = async () => {
    await syncHealthData();
  };

  const handleEnableBackgroundSync = async () => {
    await enableBackgroundSync();
  };

  const getStatusColor = () => {
    if (syncStatus === 'syncing') return 'bg-blue-500';
    if (syncStatus === 'success') return 'bg-green-500';
    if (syncStatus === 'error') return 'bg-red-500';
    return 'bg-gray-500';
  };

  const getStatusIcon = () => {
    if (syncStatus === 'syncing') return <Loader2 className="h-4 w-4 animate-spin" />;
    if (syncStatus === 'success') return <CheckCircle className="h-4 w-4" />;
    if (syncStatus === 'error') return <XCircle className="h-4 w-4" />;
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
            Health Data Integration
          </CardTitle>
          <CardDescription>
            {isNative 
              ? "Connect to your device's health app to automatically sync health data"
              : "Health data integration is only available on mobile devices"
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isNative ? (
            <div className="text-center py-8 text-muted-foreground">
              <Smartphone className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Health integration requires a mobile device</p>
              <p className="text-sm">Please open this app on your phone or tablet</p>
            </div>
          ) : !isAvailable ? (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Health data is not available on this device</p>
              <p className="text-sm">Make sure your device supports health data collection</p>
            </div>
          ) : (
            <>
              {/* Connection Status */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Connection Status</span>
                    <Badge 
                      variant={isConnected ? "default" : "secondary"}
                      className={`${getStatusColor()} text-white`}
                    >
                      {getStatusIcon()}
                      {isConnected ? 'Connected' : 'Disconnected'}
                    </Badge>
                  </div>
                  {lastSyncTime && (
                    <p className="text-sm text-muted-foreground">
                      Last sync: {formatDistanceToNow(lastSyncTime, { addSuffix: true })}
                    </p>
                  )}
                </div>
                {!isConnected ? (
                  <Button 
                    onClick={handleConnect} 
                    disabled={syncStatus === 'syncing'}
                    className="min-w-[120px]"
                  >
                    {syncStatus === 'syncing' ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      'Connect Health App'
                    )}
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleSync}
                      disabled={syncStatus === 'syncing'}
                    >
                      {syncStatus === 'syncing' ? (
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
                      Disconnect
                    </Button>
                  </div>
                )}
              </div>

              {/* Permissions */}
              {isConnected && permissions.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium">Data Permissions</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {permissions.map((permission) => (
                      <div 
                        key={permission.type}
                        className="flex items-center justify-between p-2 rounded-lg border bg-muted/50"
                      >
                        <span className="text-sm capitalize">
                          {permission.type.replace('_', ' ')}
                        </span>
                        {permission.granted ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
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
                        <span className="font-medium">Background Sync</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Automatically sync health data in the background
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
                <h4 className="font-medium text-blue-900 mb-2">How it works</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Syncs data from your device's health app</li>
                  <li>• Automatically updates your metrics daily</li>
                  <li>• You can still manually input additional data</li>
                  <li>• Your health data remains private and secure</li>
                </ul>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};