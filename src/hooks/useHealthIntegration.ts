import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export type HealthDataType = 
  | 'sleep'
  | 'heart_rate'
  | 'calories'
  | 'water'
  | 'weight'
  | 'blood_pressure'
  | 'steps';

export interface HealthPermission {
  type: HealthDataType;
  granted: boolean;
}

export interface HealthDataPoint {
  type: HealthDataType;
  value: number;
  unit: string;
  timestamp: Date;
  source?: string;
}

export interface HealthIntegrationState {
  isAvailable: boolean;
  isInitialized: boolean;
  permissions: HealthPermission[];
  isConnected: boolean;
  lastSyncTime?: Date;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
}

export const useHealthIntegration = () => {
  const { user } = useAuth();
  const [state, setState] = useState<HealthIntegrationState>({
    isAvailable: false,
    isInitialized: false,
    permissions: [],
    isConnected: false,
    syncStatus: 'idle'
  });

  const platform = Capacitor.getPlatform();
  const isNative = platform === 'ios' || platform === 'android';

  useEffect(() => {
    initializeHealthIntegration();
  }, []);

  const initializeHealthIntegration = async () => {
    try {
      if (isNative) {
        // For now, we'll simulate health kit availability
        // In production, this would check actual health kit availability
        setState(prev => ({ 
          ...prev, 
          isAvailable: true,
          isInitialized: true 
        }));
      } else {
        setState(prev => ({ 
          ...prev, 
          isAvailable: false,
          isInitialized: true 
        }));
      }
    } catch (error) {
      console.error('Failed to initialize health integration:', error);
      setState(prev => ({ 
        ...prev, 
        isInitialized: true, 
        isAvailable: false 
      }));
    }
  };

  const requestPermissions = async (dataTypes: HealthDataType[] = ['sleep', 'heart_rate', 'calories', 'water', 'steps']) => {
    if (!state.isAvailable || !user) return false;

    try {
      setState(prev => ({ ...prev, syncStatus: 'syncing' }));

      // For now, we'll simulate permission request
      // In production, this would actually request health permissions
      const mockPermissions: HealthPermission[] = dataTypes.map(type => ({
        type,
        granted: true // Simulate granted permissions
      }));

      setState(prev => ({
        ...prev,
        permissions: mockPermissions,
        isConnected: true,
        syncStatus: 'success'
      }));

      toast.success('Health data permissions granted (simulation mode)');
      
      // Perform initial sync
      await syncHealthData();
      return true;
    } catch (error) {
      console.error('Failed to request permissions:', error);
      setState(prev => ({ ...prev, syncStatus: 'error' }));
      toast.error('Failed to request health permissions');
      return false;
    }
  };

  const syncHealthData = async () => {
    if (!state.isConnected || !user) return;

    try {
      setState(prev => ({ ...prev, syncStatus: 'syncing' }));
      
      // For now, we'll generate some mock health data
      // In production, this would fetch actual health data from the platform
      const mockData: HealthDataPoint[] = generateMockHealthData();

      // Save to database
      if (mockData.length > 0) {
        await saveHealthDataToDatabase(mockData);
      }

      setState(prev => ({
        ...prev,
        syncStatus: 'success',
        lastSyncTime: new Date()
      }));

      toast.success(`Synced ${mockData.length} health data points (simulation)`);
    } catch (error) {
      console.error('Failed to sync health data:', error);
      setState(prev => ({ ...prev, syncStatus: 'error' }));
      toast.error('Failed to sync health data');
    }
  };

  const generateMockHealthData = (): HealthDataPoint[] => {
    const now = new Date();
    const mockData: HealthDataPoint[] = [];

    // Generate mock data for the last 7 days
    for (let i = 0; i < 7; i++) {
      const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
      
      mockData.push(
        {
          type: 'sleep',
          value: 7 + Math.random() * 2, // 7-9 hours
          unit: 'hours',
          timestamp: date,
          source: 'health_app_simulation'
        },
        {
          type: 'heart_rate',
          value: 60 + Math.random() * 40, // 60-100 bpm
          unit: 'bpm',
          timestamp: date,
          source: 'health_app_simulation'
        },
        {
          type: 'steps',
          value: 5000 + Math.random() * 10000, // 5000-15000 steps
          unit: 'count',
          timestamp: date,
          source: 'health_app_simulation'
        },
        {
          type: 'calories',
          value: 1800 + Math.random() * 800, // 1800-2600 calories
          unit: 'kcal',
          timestamp: date,
          source: 'health_app_simulation'
        },
        {
          type: 'water',
          value: 1500 + Math.random() * 1000, // 1500-2500 ml
          unit: 'ml',
          timestamp: date,
          source: 'health_app_simulation'
        }
      );
    }

    return mockData;
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
      permissions: [],
      lastSyncTime: undefined
    }));
    toast.success('Disconnected from health data');
  };

  const enableBackgroundSync = async () => {
    if (!state.isConnected) return false;

    try {
      // For now, just simulate enabling background sync
      toast.success('Background sync enabled (simulation mode)');
      return true;
    } catch (error) {
      console.error('Failed to enable background sync:', error);
      toast.error('Failed to enable background sync');
      return false;
    }
  };

  return {
    ...state,
    requestPermissions,
    syncHealthData,
    disconnect,
    enableBackgroundSync,
    isNative
  };
};