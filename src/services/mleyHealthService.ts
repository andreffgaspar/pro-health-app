import { Capacitor } from '@capacitor/core';
import { healthKitLogger } from './healthKitLogger';

type DataType = 'steps' | 'active-calories';

// Simplified Health interface for web compatibility
interface HealthPlugin {
  isHealthAvailable(): Promise<{ available: boolean }>;
  requestHealthPermissions(options: { permissions: string[] }): Promise<any>;
  queryAggregated(options: {
    dataType: string;
    startDate: string;
    endDate: string;
    bucket: string;
  }): Promise<{ aggregatedData?: Array<{ value: number; startDate: string; endDate: string }> }>;
}

// Health plugin variable
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
  READ_CALORIES: 'READ_CALORIES' as const
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
      const healthModule = await import('capacitor-health');
      Health = healthModule.Health;
      
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
      // Filter to only supported permissions for web compatibility
      const validPermissions = permissions.filter(p => 
        ['READ_STEPS', 'READ_CALORIES'].includes(p)
      );
      
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
      // Normalize dates to start at midnight and end at 23:59:59 in local timezone
      const normalizedStartDate = this.normalizeToStartOfDay(startDate);
      const normalizedEndDate = this.normalizeToEndOfDay(endDate);
      
      await healthKitLogger.info('MleyHealthService', 'queryAggregatedData', 'Normalized dates', {
        original: { start: startDate.toISOString(), end: endDate.toISOString() },
        normalized: { start: normalizedStartDate.toISOString(), end: normalizedEndDate.toISOString() }
      });
      
      const result = await Health.queryAggregated({
        dataType,
        startDate: normalizedStartDate.toISOString(),
        endDate: normalizedEndDate.toISOString(),
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
        type: this.mapToDbDataType(dataType), // Map to database-compatible type
        value: item.value,
        unit: this.getUnitForDataType(dataType),
        startDate: this.normalizeTimestampForDay(new Date(item.startDate)),
        endDate: this.normalizeTimestampForDay(new Date(item.endDate)),
        sourceName: 'HealthKit'
      }));
    } catch (err) {
      await healthKitLogger.error('MleyHealthService', 'queryAggregatedData', 'Query failed', (err as Error).message);
      return [];
    }
  }

  private mapToDbDataType(pluginDataType: string): string {
    // Map plugin data types to database-compatible types
    switch (pluginDataType) {
      case 'active-calories': return 'calories';
      case 'steps': return 'steps';
      default: return pluginDataType;
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

  private normalizeToStartOfDay(date: Date): Date {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  }

  private normalizeToEndOfDay(date: Date): Date {
    const normalized = new Date(date);
    normalized.setHours(23, 59, 59, 999);
    return normalized;
  }

  private normalizeTimestampForDay(date: Date): Date {
    // Set timestamp to noon of the day to represent the entire day
    const normalized = new Date(date);
    normalized.setHours(12, 0, 0, 0);
    return normalized;
  }

  getIsNative(): boolean {
    return this.isNative;
  }
}

export const mleyHealthService = new MleyHealthService();