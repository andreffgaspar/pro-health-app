import { Capacitor } from '@capacitor/core';
import { CapacitorHealth } from 'capacitor-health';
import { healthKitLogger } from './healthKitLogger';

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
  DISTANCE: 'distance',
  CALORIES_ACTIVE: 'calories.active',
  CALORIES_BASAL: 'calories.basal',
  HEART_RATE: 'heart_rate',
  WEIGHT: 'weight',
  HEIGHT: 'height',
  SLEEP: 'sleep',
  WORKOUT: 'activity',
  WATER: 'water'
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
      await CapacitorHealth.initialize();
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
      await CapacitorHealth.requestPermissions({ read: permissions });
      return true;
    } catch (err) {
      await healthKitLogger.error('MleyHealthService', 'requestPermissions', 'Failed to request permissions', (err as Error).message);
      return false;
    }
  }

  async queryAggregatedData(dataType: string, startDate: Date, endDate: Date, bucket: 'day' | 'hour' = 'day'): Promise<HealthDataPoint[]> {
    if (!this.isNative) {
      return [];
    }
    try {
      const result: any = await CapacitorHealth.queryAggregatedData({
        dataType,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        bucket
      });

      if (!result || !Array.isArray(result.data)) {
        return [];
      }

      return result.data.map((item: any) => ({
        type: dataType,
        value: item.value,
        unit: item.unit,
        startDate: new Date(item.startTime || item.startDate),
        endDate: new Date(item.endTime || item.endDate),
        sourceName: item.source
      }));
    } catch (err) {
      await healthKitLogger.error('MleyHealthService', 'queryAggregatedData', 'Query failed', (err as Error).message);
      return [];
    }
  }

  getIsNative(): boolean {
    return this.isNative;
  }
}

export const mleyHealthService = new MleyHealthService();
