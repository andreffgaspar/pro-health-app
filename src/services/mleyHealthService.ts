import { Capacitor } from '@capacitor/core';
import { healthKitLogger } from './healthKitLogger';
import type { HealthPlugin, HealthPermission } from 'capacitor-health';

type DataType = 'steps' | 'active-calories';

// Declare Health plugin variable
let Health: HealthPlugin;

export interface HealthDataPoint {
  type: string;
  value: number;
  unit: string;
  startDate: Date;
  endDate: Date;
  sourceName?: string;
}

export const MleySampleNames = {
  STEPS: 'steps',
  CALORIES: 'active-calories', 
  DISTANCE: 'distance',
  HEART_RATE: 'heart_rate',
  WORKOUTS: 'workouts'
} as const;

export const HealthPermissions = {
  READ_STEPS: 'READ_STEPS' as const,
  READ_CALORIES: 'READ_CALORIES' as const,
  READ_DISTANCE: 'READ_DISTANCE' as const,
  READ_HEART_RATE: 'READ_HEART_RATE' as const,
  READ_WORKOUTS: 'READ_WORKOUTS' as const,
  READ_ROUTE: 'READ_ROUTE' as const
} as const;

class MleyHealthService {
  private isNative: boolean;
  private initialized = false;

  constructor() {
    this.isNative = Capacitor.isNativePlatform();
  }

  async initialize(): Promise<boolean> {
    if (!this.isNative) {
      await healthKitLogger.warning('MleyHealthService', 'initialize', 'Not on native platform, skipping initialization');
      return false;
    }
    
    try {
      // Try to import the plugin dynamically for native platforms
      const { Health: HealthPlugin } = await import('capacitor-health');
      Health = HealthPlugin;
      
      await healthKitLogger.info('MleyHealthService', 'initialize', 'Plugin imported, checking availability');
      const result = await Health.isHealthAvailable();
      await healthKitLogger.info('MleyHealthService', 'initialize', 'Health availability checked', { available: result.available });
      
      this.initialized = true;
      return result.available;
    } catch (err) {
      await healthKitLogger.error('MleyHealthService', 'initialize', 'Failed to initialize', (err as Error).message);
      this.initialized = false;
      return false;
    }
  }

  async requestPermissions(permissions: string[]): Promise<boolean> {
    if (!this.isNative || !this.initialized) {
      await healthKitLogger.error('MleyHealthService', 'requestPermissions', 'Service not initialized or not native');
      return false;
    }
    
    try {
      // Filter and map permissions to valid HealthPermission values
      const validPermissions = permissions.filter(p => 
        ['READ_STEPS', 'READ_CALORIES', 'READ_DISTANCE', 'READ_HEART_RATE', 'READ_WORKOUTS', 'READ_ROUTE'].includes(p)
      ) as HealthPermission[];
      
      await healthKitLogger.info('MleyHealthService', 'requestPermissions', 'About to request permissions', { validPermissions });
      
      const response = await Health.requestHealthPermissions({ 
        permissions: validPermissions
      });
      
      await healthKitLogger.info('MleyHealthService', 'requestPermissions', 'Permissions requested successfully', { permissions: validPermissions, response });
      return true;
    } catch (err) {
      await healthKitLogger.error('MleyHealthService', 'requestPermissions', 'Failed to request permissions', (err as Error).message);
      return false;
    }
  }

  async queryAggregatedData(dataType: DataType, startDate: Date, endDate: Date, bucket: string = 'day'): Promise<HealthDataPoint[]> {
    if (!this.isNative || !this.initialized) {
      await healthKitLogger.warning('MleyHealthService', 'queryAggregatedData', 'Service not initialized or not native');
      return [];
    }
    
    try {
      const result = await Health.queryAggregated({
        dataType,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        bucket
      });

      if (!result?.aggregatedData || !Array.isArray(result.aggregatedData)) {
        await healthKitLogger.warning('MleyHealthService', 'queryAggregatedData', 'No aggregated data returned', { dataType, result });
        return [];
      }

      await healthKitLogger.info('MleyHealthService', 'queryAggregatedData', 'Data retrieved successfully', { 
        dataType, 
        count: result.aggregatedData.length 
      });

      return result.aggregatedData.map((item: any) => ({
        type: dataType,
        value: item.value,
        unit: this.getUnitForDataType(dataType),
        startDate: new Date(item.startDate),
        endDate: new Date(item.endDate),
        sourceName: 'HealthKit'
      }));
    } catch (err) {
      await healthKitLogger.error('MleyHealthService', 'queryAggregatedData', 'Query failed', (err as Error).message);
      return [];
    }
  }

  private getUnitForDataType(dataType: string): string {
    switch (dataType) {
      case 'steps': return 'count';
      case 'active-calories': return 'kcal';
      case 'distance': return 'm';
      case 'heart_rate': return 'bpm';
      default: return '';
    }
  }

  getIsNative(): boolean {
    return this.isNative;
  }
}

export const mleyHealthService = new MleyHealthService();