import { Capacitor } from '@capacitor/core';
import { healthKitLogger } from './healthKitLogger';

// Define types based on mley/capacitor-health documentation
type HealthPermission = 'READ_STEPS' | 'READ_WORKOUTS' | 'READ_CALORIES' | 'READ_DISTANCE' | 'READ_HEART_RATE' | 'READ_ROUTE';

type DataType = 'steps' | 'calories';

interface HealthPlugin {
  isHealthAvailable(): Promise<{ available: boolean }>;
  requestHealthPermissions(options: { permissions: HealthPermission[] }): Promise<any>;
  queryAggregated(options: { 
    dataType: DataType; 
    startDate: string; 
    endDate: string; 
    bucket: string; 
  }): Promise<{ aggregatedData: Array<{ startDate: string; endDate: string; value: number }> }>;
}

// Use type assertion to work with capacitor-health plugin
const Health = (globalThis as any).Health as HealthPlugin;

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
  CALORIES: 'calories', 
  DISTANCE: 'distance',
  HEART_RATE: 'heart_rate',
  WORKOUTS: 'workouts'
} as const;

export const HealthPermissions = {
  READ_STEPS: 'READ_STEPS' as HealthPermission,
  READ_CALORIES: 'READ_CALORIES' as HealthPermission,
  READ_DISTANCE: 'READ_DISTANCE' as HealthPermission,
  READ_HEART_RATE: 'READ_HEART_RATE' as HealthPermission,
  READ_WORKOUTS: 'READ_WORKOUTS' as HealthPermission,
  READ_ROUTE: 'READ_ROUTE' as HealthPermission
} as const;

class MleyHealthService {
  private isNative: boolean;
  private initialized = false;

  constructor() {
    this.isNative = Capacitor.isNativePlatform();
  }

  async initialize(): Promise<boolean> {
    if (!this.isNative) {
      return false;
    }
    try {
      // Try to import the plugin dynamically for native platforms
      if (this.isNative) {
        const { Health: HealthPlugin } = await import('capacitor-health');
        (globalThis as any).Health = HealthPlugin;
      }
      
      await Health.isHealthAvailable();
      this.initialized = true;
      return true;
    } catch (err) {
      await healthKitLogger.error('MleyHealthService', 'initialize', 'Failed to initialize', (err as Error).message);
      this.initialized = false;
      return false;
    }
  }

  async requestPermissions(permissions: string[]): Promise<boolean> {
    if (!this.isNative) {
      return false;
    }
    try {
      // Filter and map permissions to valid HealthPermission values
      const validPermissions = permissions.filter(p => 
        ['READ_STEPS', 'READ_CALORIES', 'READ_DISTANCE', 'READ_HEART_RATE', 'READ_WORKOUTS', 'READ_ROUTE'].includes(p)
      ) as HealthPermission[];
      
      const response = await Health.requestHealthPermissions({ 
        permissions: validPermissions
      });
      await healthKitLogger.info('MleyHealthService', 'requestPermissions', 'Permissions requested', { permissions: validPermissions, response });
      return true;
    } catch (err) {
      await healthKitLogger.error('MleyHealthService', 'requestPermissions', 'Failed to request permissions', (err as Error).message);
      return false;
    }
  }

  async queryAggregatedData(dataType: DataType, startDate: Date, endDate: Date, bucket: string = 'day'): Promise<HealthDataPoint[]> {
    if (!this.isNative) {
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
      case 'calories': return 'kcal';
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