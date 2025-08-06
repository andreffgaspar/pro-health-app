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
    console.log('🔧 useHealthIntegration.initializeHealthIntegration() - Starting initialization');
    
    // Skip initialization on web platform
    if (!isNative) {
      console.log('⚠️ useHealthIntegration.initializeHealthIntegration() - Web platform detected, skipping initialization');
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
      console.log('🔧 useHealthIntegration.initializeHealthIntegration() - Calling perfoodHealthService.initialize()...');
      
      const available = await perfoodHealthService.initialize();
      console.log('🔧 useHealthIntegration.initializeHealthIntegration() - Service initialized:', available);
      
      if (available) {
        setState(prev => ({
          ...prev,
          isAvailable: true,
          isInitialized: true,
          status: 'disconnected'
        }));
        console.log('✅ useHealthIntegration.initializeHealthIntegration() - Successfully initialized');
      } else {
        console.log('❌ useHealthIntegration.initializeHealthIntegration() - Service not available, but marking as initialized');
        setState(prev => ({
          ...prev,
          isAvailable: false,
          isInitialized: true,
          status: 'error'
        }));
      }
    } catch (error) {
      console.error('❌ useHealthIntegration.initializeHealthIntegration() - Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack,
        error: error
      });
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
      console.log('🔧 useHealthIntegration - User detected, userId:', user.id);
    }
  }, [user]);

  useEffect(() => {
    if (!state.isInitialized && isNative) {
      initializeHealthIntegration();
    }
  }, [state.isInitialized, initializeHealthIntegration, isNative]);

  const requestPermissions = useCallback(async (dataTypes: HealthDataType[]): Promise<boolean> => {
    console.log('🔧 useHealthIntegration.requestPermissions() - Requesting permissions for:', dataTypes);
    
    if (!state.isNative) {
      console.log('❌ useHealthIntegration.requestPermissions() - Not a native platform');
      return false;
    }

    if (!state.isInitialized) {
      console.log('❌ useHealthIntegration.requestPermissions() - Health integration not initialized');
      return false;
    }

    // Try to request permissions even if isAvailable is false, as the plugin might still work
    if (!state.isAvailable) {
      console.log('⚠️ useHealthIntegration.requestPermissions() - Health integration marked as unavailable, but attempting anyway...');
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

      console.log('🔧 useHealthIntegration.requestPermissions() - About to call perfoodHealthService.requestPermissions with:', permissions);
      const success = await perfoodHealthService.requestPermissions(permissions);
      console.log('🔧 useHealthIntegration.requestPermissions() - perfoodHealthService.requestPermissions returned:', success);
      
      if (success) {
        setState(prev => ({
          ...prev,
          isConnected: true,
          isAvailable: true, // Mark as available if permissions work
          grantedPermissions: dataTypes,
          status: 'connected',
          lastSyncTime: new Date()
        }));
        
        console.log('✅ useHealthIntegration.requestPermissions() - Permissions granted successfully, state updated');
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
  }, [state.isNative, state.isInitialized]);

  const syncHealthData = useCallback(async (options?: { days?: number; showProgress?: boolean }): Promise<void> => {
    console.log('🔧 useHealthIntegration.syncHealthData() - Starting sync', options);
    
    if (!state.isConnected || !user) {
      console.log('❌ useHealthIntegration.syncHealthData() - Not connected or no user', { 
        isConnected: state.isConnected,
        hasUser: !!user,
        status: state.status 
      });
      return;
    }

    try {
      setState(prev => ({ ...prev, status: 'syncing' }));
      console.log('🔧 useHealthIntegration.syncHealthData() - Set status to syncing');

      const endDate = new Date();
      const days = options?.days || 7;
      const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));
      
      console.log(`🔧 useHealthIntegration.syncHealthData() - Fetching data from ${startDate.toISOString()} to ${endDate.toISOString()}`);
      console.log(`🔧 useHealthIntegration.syncHealthData() - Granted permissions:`, state.grantedPermissions);

      const allHealthData: HealthDataPoint[] = [];

      // Fetch data for each granted permission
      for (const permission of state.grantedPermissions) {
        console.log(`🔧 useHealthIntegration.syncHealthData() - Processing permission: ${permission}`);
        const dataType = getDataTypeForPermission(permission);
        console.log(`🔧 useHealthIntegration.syncHealthData() - Mapped to dataType: ${dataType}`);
        
        if (!dataType) {
          console.log(`⚠️ useHealthIntegration.syncHealthData() - No dataType mapping for permission: ${permission}`);
          continue;
        }

        console.log(`🔧 useHealthIntegration.syncHealthData() - About to fetch data for: ${dataType}`);
        
        try {
          const data = await perfoodHealthService.queryHealthData(dataType, startDate, endDate);
          console.log(`✅ useHealthIntegration.syncHealthData() - Fetched ${data.length} data points for ${dataType}`, data);
          
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
          
          console.log(`🔧 useHealthIntegration.syncHealthData() - Converted ${convertedData.length} data points for ${permission}`);
          allHealthData.push(...convertedData);
        } catch (dataError) {
          console.error(`❌ useHealthIntegration.syncHealthData() - Error fetching data for ${dataType}:`, dataError);
        }
      }

      console.log(`🔧 useHealthIntegration.syncHealthData() - Total health data points collected: ${allHealthData.length}`);
      
      if (allHealthData.length > 0) {
        console.log('🔧 useHealthIntegration.syncHealthData() - About to save to database...');
        await saveHealthDataToDatabase(allHealthData);
        console.log('✅ useHealthIntegration.syncHealthData() - Successfully saved to database');
        
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
    console.log('🔧 saveHealthDataToDatabase - Starting database save...');
    if (!user) {
      console.log('❌ saveHealthDataToDatabase - No user found');
      return;
    }

    console.log(`🔧 saveHealthDataToDatabase - User ID: ${user.id}, Data points: ${data.length}`);

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

    console.log('🔧 saveHealthDataToDatabase - Records prepared:', records.slice(0, 2)); // Log first 2 records for debugging

    const { error } = await supabase
      .from('athlete_data')
      .upsert(records, { 
        onConflict: 'athlete_id,data_type,recorded_at',
        ignoreDuplicates: true 
      });

    if (error) {
      console.error('❌ saveHealthDataToDatabase - Database error:', error);
      throw error;
    }
    
    console.log('✅ saveHealthDataToDatabase - Successfully saved to database');
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