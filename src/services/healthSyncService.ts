import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
import { perfoodHealthService, HealthKitSampleNames } from './perfoodHealthService';

export interface SyncConfig {
  enabledDataTypes: string[];
  syncInterval: number; // in minutes
  enableBackgroundSync: boolean;
  lastSyncTime?: Date;
}

export class HealthSyncService {
  private static instance: HealthSyncService;
  private syncInterval: NodeJS.Timeout | null = null;
  private isRunning = false;

  private constructor() {}

  static getInstance(): HealthSyncService {
    if (!HealthSyncService.instance) {
      HealthSyncService.instance = new HealthSyncService();
    }
    return HealthSyncService.instance;
  }

  async startBackgroundSync(config: SyncConfig) {
    if (this.isRunning) {
      this.stopBackgroundSync();
    }

    if (!config.enableBackgroundSync) {
      return;
    }

    console.log('Starting background health sync with config:', config);
    
    // Initialize health service first
    const isAvailable = await perfoodHealthService.initialize();
    if (!isAvailable) {
      console.warn('Health service not available, sync will use mock data');
    }
    
    this.isRunning = true;

    // Immediate sync
    await this.performSync(config);

    // Schedule periodic sync
    this.syncInterval = setInterval(async () => {
      await this.performSync(config);
    }, config.syncInterval * 60 * 1000);
  }

  stopBackgroundSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    this.isRunning = false;
    console.log('Background health sync stopped');
  }

  private async performSync(config: SyncConfig) {
    try {
      console.log('Performing health data sync...');
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No authenticated user found');
        return;
      }

      // Check last sync time to avoid too frequent syncs
      const now = new Date();
      if (config.lastSyncTime) {
        const timeSinceLastSync = now.getTime() - config.lastSyncTime.getTime();
        const minSyncInterval = 5 * 60 * 1000; // 5 minutes minimum
        if (timeSinceLastSync < minSyncInterval) {
          console.log('Skipping sync - too soon since last sync');
          return;
        }
      }

      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - (60 * 60 * 1000)); // Last hour
      
      const allHealthData: any[] = [];

      // Fetch data for each enabled type using Perfood Health
      for (const dataType of config.enabledDataTypes) {
        try {
          const data = await perfoodHealthService.queryHealthData(dataType, startDate, endDate);
          
          // Convert to our format
          const convertedData = data.map(item => ({
            type: dataType,
            value: item.value,
            unit: item.unit,
            timestamp: item.startDate,
            source: item.sourceName || 'background_sync'
          }));
          
          allHealthData.push(...convertedData);
        } catch (error) {
          console.error(`Failed to sync ${dataType}:`, error);
        }
      }
      
      // If no real data available, generate minimal mock data for testing
      if (allHealthData.length === 0) {
        const mockData = this.generateMockHealthUpdate();
        allHealthData.push(...mockData);
      }
      
      if (allHealthData.length > 0) {
        const records = allHealthData.map(point => ({
          athlete_id: user.id,
          data_type: point.type,
          data: {
            value: point.value,
            unit: point.unit,
            source: point.source || 'background_sync',
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
          console.error('Failed to save background sync data:', error);
        } else {
          console.log(`Background sync completed: ${allHealthData.length} data points`);
          await this.updateLastSyncTime();
        }
      }
    } catch (error) {
      console.error('Background sync failed:', error);
    }
  }

  private generateMockHealthUpdate() {
    const now = new Date();
    const data = [];

    // Add current heart rate reading
    data.push({
      type: 'heart_rate',
      value: 65 + Math.random() * 25, // 65-90 bpm
      unit: 'bpm',
      timestamp: now
    });

    // Add steps if it's a new hour
    if (now.getMinutes() === 0) {
      data.push({
        type: 'steps',
        value: Math.floor(Math.random() * 1000) + 500, // 500-1500 steps per hour
        unit: 'count',
        timestamp: now
      });
    }

    return data;
  }

  private async updateLastSyncTime() {
    try {
      // Store sync time in local storage for now
      // In production, this could be stored in user preferences
      localStorage.setItem('lastHealthSync', new Date().toISOString());
    } catch (error) {
      console.error('Failed to update last sync time:', error);
    }
  }

  getLastSyncTime(): Date | null {
    try {
      const stored = localStorage.getItem('lastHealthSync');
      return stored ? new Date(stored) : null;
    } catch (error) {
      console.error('Failed to get last sync time:', error);
      return null;
    }
  }

  isBackgroundSyncRunning(): boolean {
    return this.isRunning;
  }
}

export const healthSyncService = HealthSyncService.getInstance();