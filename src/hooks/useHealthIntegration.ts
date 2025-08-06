import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { perfoodHealthService, SampleNames } from '@/services/perfoodHealthService';
import { toast } from 'sonner';

// Health data types enum matching perfood plugin
export enum HealthDataType {
  STEPS = 'steps',
  DISTANCE = 'distance',
  CALORIES = 'calories',
  HEART_RATE = 'heart_rate',
  WEIGHT = 'weight',
  HEIGHT = 'height',
  SLEEP = 'sleep',
  WATER = 'water',
  WORKOUT = 'activity'
}

export interface HealthPermission {
  dataType: HealthDataType;
  granted: boolean;
}

export interface HealthDataPoint {
  type: string;
  value: number;
  unit: string;
  timestamp: Date;
  source?: string;
  syncedAt?: Date;
  syncType?: 'manual' | 'auto';
  daysCovered?: number;
}

export interface HealthIntegrationState {
  isAvailable: boolean;
  isInitialized: boolean;
  isConnected: boolean;
  grantedPermissions: HealthDataType[];
  lastSyncTime?: Date;
  status: 'initializing' | 'connected' | 'disconnected' | 'syncing' | 'error';
  isNative: boolean;
}

export const useHealthIntegration = () => {
  const { user } = useAuth();
  const [state, setState] = useState<HealthIntegrationState>({
    isAvailable: false,
    isInitialized: false,
    isConnected: false,
    grantedPermissions: [],
    status: 'disconnected',
    isNative: perfoodHealthService.getIsNative()
  });

  const initializeHealthIntegration = useCallback(async () => {
    console.log('🔧 useHealthIntegration.initializeHealthIntegration() - Starting initialization');
    
    try {
      setState(prev => ({ ...prev, status: 'initializing' }));
      
      const available = await perfoodHealthService.initialize();
      console.log('🔧 useHealthIntegration.initializeHealthIntegration() - Service initialized:', available);
      
      if (available) {
        setState(prev => ({
          ...prev,
          isAvailable: true,
          isInitialized: true,
          isNative: perfoodHealthService.getIsNative(),
          status: 'disconnected'
        }));
        console.log('✅ useHealthIntegration.initializeHealthIntegration() - Successfully initialized');
      } else {
        setState(prev => ({
          ...prev,
          isAvailable: false,
          isInitialized: false,
          isNative: perfoodHealthService.getIsNative(),
          status: 'error'
        }));
        console.log('❌ useHealthIntegration.initializeHealthIntegration() - Service not available');
      }
    } catch (error) {
      console.error('❌ useHealthIntegration.initializeHealthIntegration() - Error:', error);
      setState(prev => ({
        ...prev,
        isAvailable: false,
        isInitialized: true,
        status: 'error'
      }));
    }
  }, []);

  useEffect(() => {
    if (user) {
      console.log('🔧 useHealthIntegration - User detected, userId:', user.id);
    }
  }, [user]);

  useEffect(() => {
    if (!state.isInitialized) {
      initializeHealthIntegration();
    }
  }, [state.isInitialized, initializeHealthIntegration]);

  const requestPermissions = useCallback(async (dataTypes: HealthDataType[]): Promise<boolean> => {
    console.log('🔧 useHealthIntegration.requestPermissions() - Requesting permissions for:', dataTypes);
    
    if (!state.isAvailable || !state.isInitialized) {
      console.log('❌ useHealthIntegration.requestPermissions() - Health integration not available');
      return false;
    }

    try {
      setState(prev => ({ ...prev, status: 'initializing' }));

      const readDataTypes = dataTypes.map(type => {
        switch (type) {
          case HealthDataType.STEPS:
            return SampleNames.STEP_COUNT;
          case HealthDataType.DISTANCE:
            return SampleNames.DISTANCE_WALKING_RUNNING;
          case HealthDataType.CALORIES:
            return SampleNames.ACTIVE_ENERGY_BURNED;
          case HealthDataType.HEART_RATE:
            return SampleNames.HEART_RATE;
          case HealthDataType.WEIGHT:
            return SampleNames.BODY_MASS;
          case HealthDataType.HEIGHT:
            return SampleNames.HEIGHT;
          case HealthDataType.SLEEP:
            return SampleNames.SLEEP_ANALYSIS;
          case HealthDataType.WATER:
            return SampleNames.DIETARY_WATER;
          case HealthDataType.WORKOUT:
            return SampleNames.WORKOUT_TYPE;
          default:
            return SampleNames.STEP_COUNT;
        }
      });

      const permissions = {
        read: readDataTypes,
        write: [SampleNames.STEP_COUNT, SampleNames.ACTIVE_ENERGY_BURNED], // Allow writing some data types
        all: []
      };

      const success = await perfoodHealthService.requestPermissions(permissions);
      
      if (success) {
        setState(prev => ({
          ...prev,
          isConnected: true,
          grantedPermissions: dataTypes,
          status: 'connected',
          lastSyncTime: new Date()
        }));
        
        console.log('✅ useHealthIntegration.requestPermissions() - Permissions granted successfully');
        toast.success('Permissões do HealthKit concedidas com sucesso!');
        return true;
      } else {
        setState(prev => ({ ...prev, status: 'error' }));
        console.log('❌ useHealthIntegration.requestPermissions() - Failed to get permissions');
        toast.error('Falha ao obter permissões do HealthKit');
        return false;
      }
    } catch (error) {
      console.error('❌ useHealthIntegration.requestPermissions() - Error:', error);
      setState(prev => ({ ...prev, status: 'error' }));
      toast.error('Erro ao solicitar permissões do HealthKit');
      return false;
    }
  }, [state.isAvailable, state.isInitialized]);

  const syncHealthData = useCallback(async (options?: { days?: number; showProgress?: boolean }): Promise<void> => {
    console.log('🔧 useHealthIntegration.syncHealthData() - Starting sync', options);
    
    if (!state.isConnected || !user) {
      console.log('❌ useHealthIntegration.syncHealthData() - Not connected or no user');
      return;
    }

    try {
      setState(prev => ({ ...prev, status: 'syncing' }));

      const endDate = new Date();
      const days = options?.days || 7;
      const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));
      
      console.log(`🔧 useHealthIntegration.syncHealthData() - Fetching data from ${startDate.toISOString()} to ${endDate.toISOString()}`);

      const allHealthData: HealthDataPoint[] = [];

      // Fetch data for each granted permission
      for (const permission of state.grantedPermissions) {
        const dataType = getDataTypeForPermission(permission);
        if (!dataType) continue;

        console.log(`🔧 useHealthIntegration.syncHealthData() - Fetching data for: ${dataType}`);
        
        const data = await perfoodHealthService.queryHealthData(dataType, startDate, endDate);
        console.log(`✅ useHealthIntegration.syncHealthData() - Fetched ${data.length} data points for ${dataType}`);
        
        // Convert to our HealthDataPoint format
        const convertedData = data.map(point => ({
          type: permission,
          value: point.value,
          unit: point.unit,
          timestamp: point.startDate,
          source: point.sourceName || 'health_app',
          syncedAt: new Date(),
          syncType: 'manual' as const,
          daysCovered: days
        }));
        
        allHealthData.push(...convertedData);
      }

      if (allHealthData.length > 0) {
        await saveHealthDataToDatabase(allHealthData);
        
        setState(prev => ({
          ...prev,
          lastSyncTime: new Date(),
          status: 'connected'
        }));
        
        console.log(`✅ useHealthIntegration.syncHealthData() - Sync completed: ${allHealthData.length} data points from ${days} days`);
        
        // Store sync info in localStorage for dashboard display
        localStorage.setItem('lastHealthSync', JSON.stringify({
          timestamp: new Date().toISOString(),
          dataPointsCount: allHealthData.length,
          daysCovered: days
        }));

        const mode = state.isNative ? '' : ' (simulação)';
        toast.success(`${allHealthData.length} dados do HealthKit sincronizados${mode}`);
      } else {
        setState(prev => ({ ...prev, status: 'connected' }));
        console.log('⚠️ useHealthIntegration.syncHealthData() - No health data found to sync');
        toast.info('Nenhum dado encontrado para sincronizar');
      }
    } catch (error) {
      console.error('❌ useHealthIntegration.syncHealthData() - Error:', error);
      setState(prev => ({ ...prev, status: 'error' }));
      toast.error('Falha na sincronização do HealthKit');
      throw error;
    }
  }, [state.isConnected, state.grantedPermissions, state.isNative, user]);

  const saveHealthDataToDatabase = async (data: HealthDataPoint[]): Promise<void> => {
    if (!user) return;

    const records = data.map(point => ({
      athlete_id: user.id,
      data_type: point.type,
      data: {
        value: point.value,
        unit: point.unit,
        source: point.source || 'health_app',
        auto_synced: true
      },
      recorded_at: point.timestamp.toISOString()
    }));

    const { error } = await supabase
      .from('athlete_data')
      .upsert(records, { 
        onConflict: 'athlete_id,data_type,recorded_at',
        ignoreDuplicates: true 
      });

    if (error) {
      console.error('❌ saveHealthDataToDatabase - Error:', error);
      throw error;
    }
  };

  const getDataTypeForPermission = (permission: HealthDataType): string | null => {
    switch (permission) {
      case HealthDataType.STEPS:
        return SampleNames.STEP_COUNT;
      case HealthDataType.DISTANCE:
        return SampleNames.DISTANCE_WALKING_RUNNING;
      case HealthDataType.CALORIES:
        return SampleNames.ACTIVE_ENERGY_BURNED;
      case HealthDataType.HEART_RATE:
        return SampleNames.HEART_RATE;
      case HealthDataType.WEIGHT:
        return SampleNames.BODY_MASS;
      case HealthDataType.HEIGHT:
        return SampleNames.HEIGHT;
      case HealthDataType.SLEEP:
        return SampleNames.SLEEP_ANALYSIS;
      case HealthDataType.WATER:
        return SampleNames.DIETARY_WATER;
      case HealthDataType.WORKOUT:
        return SampleNames.WORKOUT_TYPE;
      default:
        return null;
    }
  };

  const disconnect = useCallback(async (): Promise<void> => {
    setState(prev => ({
      ...prev,
      isConnected: false,
      grantedPermissions: [],
      lastSyncTime: undefined,
      status: 'disconnected'
    }));
    localStorage.removeItem('lastHealthSync');
    toast.success('Desconectado do HealthKit');
  }, []);

  const enableBackgroundSync = useCallback(async (enabled: boolean, config?: { 
    interval?: number; 
    dataTypes?: HealthDataType[]; 
  }): Promise<boolean> => {
    try {
      if (enabled && config) {
        const syncConfig = {
          enabledDataTypes: config.dataTypes?.map(dt => dt.toString()) || 
                           state.grantedPermissions.map(p => p.toString()),
          syncInterval: config.interval || 60, // minutes
          enableBackgroundSync: true,
          lastSyncTime: state.lastSyncTime
        };

        // Import and start the background sync service
        const { healthSyncService } = await import('@/services/healthSyncService');
        await healthSyncService.startBackgroundSync(syncConfig);
        
        const mode = state.isNative ? '' : ' (simulação)';
        toast.success(`Sincronização em background ativada${mode}`);
        console.log('✅ Background sync enabled with config:', syncConfig);
      } else {
        // Stop background sync
        const { healthSyncService } = await import('@/services/healthSyncService');
        healthSyncService.stopBackgroundSync();
        
        toast.info('Sincronização em background desativada');
        console.log('✅ Background sync disabled');
      }
      return true;
    } catch (error) {
      console.error('❌ enableBackgroundSync - Error:', error);
      toast.error('Falha ao configurar sincronização em background');
      return false;
    }
  }, [state.grantedPermissions, state.lastSyncTime, state.isNative]);

  const getLastSyncInfo = useCallback(() => {
    try {
      const stored = localStorage.getItem('lastHealthSync');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('❌ getLastSyncInfo - Error:', error);
      return null;
    }
  }, []);

  return {
    ...state,
    requestPermissions,
    syncHealthData,
    disconnect,
    enableBackgroundSync,
    getLastSyncInfo
  };
};