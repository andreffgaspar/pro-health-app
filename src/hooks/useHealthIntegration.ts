import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '@/integrations/supabase/client';
import { perfoodHealthService, SampleNames } from '@/services/perfoodHealthService';
import { healthKitLogger } from '@/services/healthKitLogger';
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
  const isNative = perfoodHealthService.getIsNative();
  
  const [state, setState] = useState<HealthIntegrationState>({
    isAvailable: false,
    isInitialized: !isNative, // Initialize immediately on web since it's not available
    isConnected: false,
    grantedPermissions: [],
    status: isNative ? 'disconnected' : 'error',
    isNative
  });

  const initializeHealthIntegration = useCallback(async () => {
    await healthKitLogger.info('useHealthIntegration', 'initializeHealthIntegration', 'Starting initialization', {}, perfoodHealthService.getIsNative() ? 'mobile' : 'web', isNative);
    
    // Skip initialization on web platform
    if (!isNative) {
      await healthKitLogger.warning('useHealthIntegration', 'initializeHealthIntegration', 'Web platform detected, skipping initialization', {}, 'web', false);
      setState(prev => ({
        ...prev,
        isAvailable: false,
        isInitialized: true,
        status: 'error'
      }));
      return;
    }
    
    try {
      setState(prev => ({ ...prev, status: 'initializing' }));
      await healthKitLogger.info('useHealthIntegration', 'initializeHealthIntegration', 'Calling perfoodHealthService.initialize...', {}, 'mobile', isNative);
      
      const available = await perfoodHealthService.initialize();
      await healthKitLogger.info('useHealthIntegration', 'initializeHealthIntegration', 'Service initialized', { available }, 'mobile', isNative);
      
      if (available) {
        setState(prev => ({
          ...prev,
          isAvailable: true,
          isInitialized: true,
          status: 'disconnected'
        }));
        await healthKitLogger.info('useHealthIntegration', 'initializeHealthIntegration', 'Successfully initialized', {}, 'mobile', isNative);
      } else {
        await healthKitLogger.warning('useHealthIntegration', 'initializeHealthIntegration', 'Service not available, but marking as initialized', {}, 'mobile', isNative);
        setState(prev => ({
          ...prev,
          isAvailable: false,
          isInitialized: true,
          status: 'error'
        }));
      }
    } catch (error) {
      await healthKitLogger.error('useHealthIntegration', 'initializeHealthIntegration', 'Error during initialization', error.message, {
        errorName: error.name,
        errorStack: error.stack
      }, 'mobile', isNative);
      setState(prev => ({
        ...prev,
        isAvailable: false,
        isInitialized: true,
        status: 'error'
      }));
    }
  }, [isNative]);

  useEffect(() => {
    if (user) {
      healthKitLogger.info('useHealthIntegration', 'userDetected', 'User detected', { userId: user.id }, 'mobile', isNative);
    }
  }, [user, isNative]);

  useEffect(() => {
    if (!state.isInitialized && isNative) {
      initializeHealthIntegration();
    }
  }, [state.isInitialized, initializeHealthIntegration, isNative]);

  const requestPermissions = useCallback(async (dataTypes: HealthDataType[]): Promise<boolean> => {
    await healthKitLogger.info('useHealthIntegration', 'requestPermissions', 'Requesting permissions', { dataTypes }, 'mobile', isNative);
    
    if (!state.isNative) {
      await healthKitLogger.error('useHealthIntegration', 'requestPermissions', 'Not a native platform', '', {}, 'web', false);
      return false;
    }

    if (!state.isInitialized) {
      await healthKitLogger.error('useHealthIntegration', 'requestPermissions', 'Health integration not initialized', '', { state }, 'mobile', isNative);
      return false;
    }

    // Try to request permissions even if isAvailable is false, as the plugin might still work
    if (!state.isAvailable) {
      await healthKitLogger.warning('useHealthIntegration', 'requestPermissions', 'Health integration marked as unavailable, but attempting anyway', {}, 'mobile', isNative);
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

      await healthKitLogger.info('useHealthIntegration', 'requestPermissions', 'About to call perfoodHealthService.requestPermissions', { permissions }, 'mobile', isNative);
      const success = await perfoodHealthService.requestPermissions(permissions);
      await healthKitLogger.info('useHealthIntegration', 'requestPermissions', 'perfoodHealthService.requestPermissions completed', { success }, 'mobile', isNative);
      
      if (success) {
        setState(prev => ({
          ...prev,
          isConnected: true,
          isAvailable: true, // Mark as available if permissions work
          grantedPermissions: dataTypes,
          status: 'connected',
          lastSyncTime: new Date()
        }));
        
        await healthKitLogger.info('useHealthIntegration', 'requestPermissions', 'Permissions granted successfully, state updated', { dataTypes }, 'mobile', isNative);
        toast.success('Permissões do HealthKit concedidas com sucesso!');
        return true;
      } else {
        setState(prev => ({ ...prev, status: 'error' }));
        await healthKitLogger.error('useHealthIntegration', 'requestPermissions', 'Failed to get permissions', '', {}, 'mobile', isNative);
        toast.error('Falha ao obter permissões do HealthKit');
        return false;
      }
    } catch (error) {
      await healthKitLogger.error('useHealthIntegration', 'requestPermissions', 'Error during permission request', error.message, { error }, 'mobile', isNative);
      setState(prev => ({ ...prev, status: 'error' }));
      toast.error('Erro ao solicitar permissões do HealthKit');
      return false;
    }
  }, [state.isNative, state.isInitialized]);

  const syncHealthData = useCallback(async (options?: { days?: number; showProgress?: boolean }): Promise<void> => {
    await healthKitLogger.info('useHealthIntegration', 'syncHealthData', 'Starting sync', { options }, 'mobile', isNative);
    
    if (!state.isConnected || !user) {
      await healthKitLogger.error('useHealthIntegration', 'syncHealthData', 'Not connected or no user', '', { 
        isConnected: state.isConnected,
        hasUser: !!user,
        status: state.status 
      }, 'mobile', isNative);
      return;
    }

    try {
      setState(prev => ({ ...prev, status: 'syncing' }));
      await healthKitLogger.info('useHealthIntegration', 'syncHealthData', 'Set status to syncing', {}, 'mobile', isNative);

      const endDate = new Date();
      const days = options?.days || 7;
      const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));
      
      await healthKitLogger.info('useHealthIntegration', 'syncHealthData', 'Date range configured', {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        days,
        grantedPermissions: state.grantedPermissions
      }, 'mobile', isNative);

      const allHealthData: HealthDataPoint[] = [];

      // Fetch data for each granted permission
      for (const permission of state.grantedPermissions) {
        await healthKitLogger.info('useHealthIntegration', 'syncHealthData', 'Processing permission', { permission }, 'mobile', isNative);
        const dataType = getDataTypeForPermission(permission);
        await healthKitLogger.info('useHealthIntegration', 'syncHealthData', 'Mapped to dataType', { permission, dataType }, 'mobile', isNative);
        
        if (!dataType) {
          await healthKitLogger.warning('useHealthIntegration', 'syncHealthData', 'No dataType mapping for permission', { permission });
          continue;
        }

        await healthKitLogger.info('useHealthIntegration', 'syncHealthData', 'About to fetch data', { dataType }, 'mobile', isNative);
        
        try {
          const data = await perfoodHealthService.queryHealthData(dataType, startDate, endDate);
          await healthKitLogger.info('useHealthIntegration', 'syncHealthData', 'Fetched data points', { 
            dataType, 
            count: data.length,
            sampleData: data.slice(0, 2) // Log first 2 items as sample
          }, 'mobile', isNative);
          
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
          
          await healthKitLogger.info('useHealthIntegration', 'syncHealthData', 'Converted data points', { 
            permission, 
            convertedCount: convertedData.length 
          }, 'mobile', isNative);
          allHealthData.push(...convertedData);
        } catch (dataError) {
          await healthKitLogger.error('useHealthIntegration', 'syncHealthData', `Error fetching data for ${dataType}`, dataError.message, { dataType, error: dataError }, 'mobile', isNative);
        }
      }

      await healthKitLogger.info('useHealthIntegration', 'syncHealthData', 'Total health data points collected', { 
        totalCount: allHealthData.length,
        breakdown: allHealthData.reduce((acc, point) => {
          acc[point.type] = (acc[point.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      }, 'mobile', isNative);
      
      if (allHealthData.length > 0) {
        await healthKitLogger.info('useHealthIntegration', 'syncHealthData', 'About to save to database', { count: allHealthData.length }, 'mobile', isNative);
        await saveHealthDataToDatabase(allHealthData);
        await healthKitLogger.info('useHealthIntegration', 'syncHealthData', 'Successfully saved to database', { count: allHealthData.length }, 'mobile', isNative);
        
        setState(prev => ({
          ...prev,
          lastSyncTime: new Date(),
          status: 'connected'
        }));
        
        // Store sync info in localStorage for dashboard display
        localStorage.setItem('lastHealthSync', JSON.stringify({
          timestamp: new Date().toISOString(),
          dataPointsCount: allHealthData.length,
          daysCovered: days
        }));

        const mode = state.isNative ? '' : ' (simulação)';
        toast.success(`${allHealthData.length} dados do HealthKit sincronizados${mode}`);
        await healthKitLogger.info('useHealthIntegration', 'syncHealthData', 'Sync completed successfully', { 
          dataPointsCount: allHealthData.length, 
          days 
        }, 'mobile', isNative);
      } else {
        setState(prev => ({ ...prev, status: 'connected' }));
        await healthKitLogger.warning('useHealthIntegration', 'syncHealthData', 'No health data found to sync');
        toast.info('Nenhum dado encontrado para sincronizar');
      }
    } catch (error) {
      await healthKitLogger.error('useHealthIntegration', 'syncHealthData', 'Error during sync', error.message, { error }, 'mobile', isNative);
      setState(prev => ({ ...prev, status: 'error' }));
      toast.error('Falha na sincronização do HealthKit');
      throw error;
    }
  }, [state.isConnected, state.grantedPermissions, state.isNative, user]);

  const saveHealthDataToDatabase = async (data: HealthDataPoint[]): Promise<void> => {
    await healthKitLogger.info('useHealthIntegration', 'saveHealthDataToDatabase', 'Starting database save', { count: data.length }, 'mobile', isNative);
    if (!user) {
      await healthKitLogger.error('useHealthIntegration', 'saveHealthDataToDatabase', 'No user found', '', {}, 'mobile', isNative);
      return;
    }

    await healthKitLogger.info('useHealthIntegration', 'saveHealthDataToDatabase', 'User and data validated', { 
      userId: user.id, 
      dataPointsCount: data.length 
    }, 'mobile', isNative);

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

    await healthKitLogger.info('useHealthIntegration', 'saveHealthDataToDatabase', 'Records prepared for database', { 
      recordCount: records.length,
      sampleRecords: records.slice(0, 2) // Log first 2 records for debugging
    }, 'mobile', isNative);

    const { error } = await supabase
      .from('athlete_data')
      .upsert(records, { 
        onConflict: 'athlete_id,data_type,recorded_at',
        ignoreDuplicates: true 
      });

    if (error) {
      await healthKitLogger.error('useHealthIntegration', 'saveHealthDataToDatabase', 'Database error during save', error.message, { error, recordCount: records.length }, 'mobile', isNative);
      throw error;
    }
    
    await healthKitLogger.info('useHealthIntegration', 'saveHealthDataToDatabase', 'Successfully saved to database', { recordCount: records.length }, 'mobile', isNative);
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