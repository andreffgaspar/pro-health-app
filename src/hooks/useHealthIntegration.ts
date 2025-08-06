import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { cordovaHealthService, HealthDataPoint as CordovaHealthDataPoint, HealthPermissions } from '@/services/cordovaHealthService';

export enum HealthDataType {
  STEPS = 'steps',
  DISTANCE = 'distance', 
  CALORIES_ACTIVE = 'calories.active',
  CALORIES_BASAL = 'calories.basal',
  HEART_RATE = 'heart_rate',
  HEART_RATE_VARIABILITY = 'heart_rate_variability',
  SLEEP = 'sleep',
  WEIGHT = 'weight',
  HEIGHT = 'height',
  BODY_FAT_PERCENTAGE = 'body_fat_percentage',
  BLOOD_PRESSURE_SYSTOLIC = 'blood_pressure_systolic',
  BLOOD_PRESSURE_DIASTOLIC = 'blood_pressure_diastolic',
  RESPIRATORY_RATE = 'respiratory_rate',
  OXYGEN_SATURATION = 'oxygen_saturation',
  BLOOD_GLUCOSE = 'blood_glucose',
  WATER = 'water',
  WORKOUT = 'workout'
}

export interface HealthPermission {
  dataType: string;
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
  grantedPermissions: HealthPermission[];
  isConnected: boolean;
  lastSyncTime?: Date;
  status: 'idle' | 'initializing' | 'ready' | 'syncing' | 'connected' | 'error' | 'unavailable';
}

export const useHealthIntegration = () => {
  const { user } = useAuth();
  const [state, setState] = useState<HealthIntegrationState>({
    isAvailable: false,
    isInitialized: false,
    grantedPermissions: [],
    isConnected: false,
    status: 'idle'
  });

  const setStatus = (status: HealthIntegrationState['status']) => {
    setState(prev => ({ ...prev, status }));
  };

  const isNative = cordovaHealthService.getIsNative();

  useEffect(() => {
    if (!state.isInitialized) {
      initializeHealthIntegration();
    }
  }, [state.isInitialized]);

  // Check for existing permissions when service becomes available
  useEffect(() => {
    const checkExistingPermissions = async () => {
      if (state.isInitialized && state.isAvailable && !state.isConnected && user) {
        console.log('Checking existing health permissions...');
        
        // Instead of auto-requesting, just check if we already have permissions
        // This allows user to manually control when to request permissions
        const lastSync = getLastSyncInfo();
        if (lastSync) {
          console.log('Found previous sync data, user likely has permissions');
          // You could optionally check specific permissions here
        }
      }
    };

    checkExistingPermissions();
  }, [state.isInitialized, state.isAvailable, state.isConnected, user]);

  const initializeHealthIntegration = async () => {
    try {
      setStatus('initializing');
      console.log('Initializing health integration...');
      
      const available = await cordovaHealthService.initialize();
      
      setState(prev => ({
        ...prev,
        isAvailable: available,
        isInitialized: true,
        status: available ? 'ready' : 'unavailable'
      }));
    } catch (error) {
      console.error('Failed to initialize health integration:', error);
      setState(prev => ({
        ...prev,
        isAvailable: false,
        isInitialized: true,
        status: 'error'
      }));
    }
  };

  const requestPermissions = async (dataTypes: HealthDataType[]) => {
    if (!state.isAvailable || !user) return false;

    try {
      setStatus('syncing');
      console.log('Requesting permissions for:', dataTypes);

      const permissions: HealthPermissions = {
        read: dataTypes.map(dt => dt.toString()),
        write: ['steps', 'calories.active', 'heart_rate', 'water'] // Basic write permissions
      };

      const granted = await cordovaHealthService.requestPermissions(permissions);
      
      if (granted) {
        const healthPermissions: HealthPermission[] = dataTypes.map(type => ({
          dataType: type.toString(),
          granted: true
        }));

        setState(prev => ({
          ...prev,
          grantedPermissions: healthPermissions,
          isConnected: true,
          status: 'connected'
        }));

        const mode = isNative ? '' : ' (simulação)';
        toast.success(`Permissões do HealthKit concedidas${mode}`);
        
        // Perform initial sync
        await syncHealthData();
        return true;
      } else {
        setStatus('error');
        toast.error('Permissões do HealthKit foram negadas');
        return false;
      }
    } catch (error) {
      console.error('Failed to request permissions:', error);
      setStatus('error');
      toast.error('Falha ao solicitar permissões do HealthKit');
      return false;
    }
  };

  const syncHealthData = async (options?: { days?: number; showProgress?: boolean }) => {
    if (!state.isConnected || !user) {
      console.warn('Cannot sync: not connected or no user');
      return;
    }

    try {
      setStatus('syncing');
      console.log('Starting health data sync...');

      const endDate = new Date();
      const days = options?.days || 7;
      const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));
      
      const allHealthData: HealthDataPoint[] = [];

      // Fetch data for each granted permission with progress tracking
      for (let i = 0; i < state.grantedPermissions.length; i++) {
        const permission = state.grantedPermissions[i];
        
        if (options?.showProgress) {
          const progress = Math.round(((i + 1) / state.grantedPermissions.length) * 100);
          console.log(`Syncing ${permission.dataType}... (${progress}%)`);
        }

        try {
          const data = await cordovaHealthService.queryHealthData(permission.dataType, startDate, endDate);
          
          // Add metadata to each data point
          const enrichedData = data.map(point => ({
            type: permission.dataType,
            value: point.value,
            unit: point.unit,
            timestamp: point.startDate,
            source: point.source || 'health_app',
            syncedAt: new Date(),
            syncType: 'manual' as const,
            daysCovered: days
          }));
          
          allHealthData.push(...enrichedData);
        } catch (error) {
          console.error(`Failed to fetch ${permission.dataType} data:`, error);
        }
      }

      if (allHealthData.length > 0) {
        await saveHealthDataToDatabase(allHealthData);
        setState(prev => ({
          ...prev,
          lastSyncTime: new Date(),
          status: 'connected'
        }));
        console.log(`Health sync completed: ${allHealthData.length} data points from ${days} days`);
        
        // Store sync info in localStorage for dashboard display
        localStorage.setItem('lastHealthSync', JSON.stringify({
          timestamp: new Date().toISOString(),
          dataPointsCount: allHealthData.length,
          daysCovered: days
        }));

        const mode = isNative ? '' : ' (simulação)';
        toast.success(`${allHealthData.length} dados do HealthKit sincronizados${mode}`);
      } else {
        setStatus('connected');
        console.log('No health data found to sync');
        toast.info('Nenhum dado encontrado para sincronizar');
      }
    } catch (error) {
      console.error('Health sync failed:', error);
      setStatus('error');
      toast.error('Falha na sincronização do HealthKit');
      throw error; // Re-throw for caller to handle
    }
  };


  const saveHealthDataToDatabase = async (data: HealthDataPoint[]) => {
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
      console.error('Failed to save health data:', error);
      throw error;
    }
  };

  const disconnect = async () => {
    setState(prev => ({
      ...prev,
      isConnected: false,
      grantedPermissions: [],
      lastSyncTime: undefined,
      status: 'ready'
    }));
    localStorage.removeItem('lastHealthSync');
    toast.success('Desconectado do HealthKit');
  };

  const enableBackgroundSync = async (enabled: boolean, config?: { 
    interval?: number; 
    dataTypes?: HealthDataType[]; 
  }) => {
    try {
      if (enabled && config) {
        const syncConfig = {
          enabledDataTypes: config.dataTypes?.map(dt => dt.toString()) || 
                           state.grantedPermissions.map(p => p.dataType),
          syncInterval: config.interval || 60, // minutes
          enableBackgroundSync: true,
          lastSyncTime: state.lastSyncTime
        };

        // Import and start the background sync service
        const { healthSyncService } = await import('@/services/healthSyncService');
        await healthSyncService.startBackgroundSync(syncConfig);
        
        const mode = isNative ? '' : ' (simulação)';
        toast.success(`Sincronização em background ativada${mode}`);
        console.log('Background sync enabled with config:', syncConfig);
      } else {
        // Stop background sync
        const { healthSyncService } = await import('@/services/healthSyncService');
        healthSyncService.stopBackgroundSync();
        
        toast.info('Sincronização em background desativada');
        console.log('Background sync disabled');
      }
      return true;
    } catch (error) {
      console.error('Failed to configure background sync:', error);
      toast.error('Falha ao configurar sincronização em background');
      return false;
    }
  };

  const getLastSyncInfo = () => {
    try {
      const stored = localStorage.getItem('lastHealthSync');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Failed to get last sync info:', error);
      return null;
    }
  };

  return {
    ...state,
    requestPermissions,
    syncHealthData,
    disconnect,
    enableBackgroundSync,
    getLastSyncInfo,
    isNative
  };
};