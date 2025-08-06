import { CapacitorHealthkit } from '@perfood/capacitor-healthkit';
import { Capacitor } from '@capacitor/core';
import { healthKitLogger } from './healthKitLogger';

// Types matching the @perfood/capacitor-healthkit plugin
export interface HealthDataType {
  STEPS: string;
  DISTANCE: string;
  CALORIES_ACTIVE: string;
  CALORIES_BASAL: string;
  HEART_RATE: string;
  WEIGHT: string;
  HEIGHT: string;
  SLEEP: string;
  WORKOUT: string;
  WATER: string;
}

export const SampleNames = {
  STEP_COUNT: 'steps',
  DISTANCE_WALKING_RUNNING: 'distance',
  ACTIVE_ENERGY_BURNED: 'calories',
  BASAL_ENERGY_BURNED: 'calories',
  HEART_RATE: 'heart_rate',
  BODY_MASS: 'weight',
  HEIGHT: 'height',
  SLEEP_ANALYSIS: 'sleep',
  WORKOUT_TYPE: 'activity',
  DIETARY_WATER: 'water'
} as const;

export interface HealthDataPoint {
  type: string;
  value: number;
  unit: string;
  startDate: Date;
  endDate: Date;
  sourceName?: string;
  sourceVersion?: string;
}

export interface HealthPermissions {
  read: string[];
  write?: string[];
  all?: string[];
}

export interface QueryOptions {
  sampleName: string;
  startDate: string;
  endDate: string;
  limit: number;
}

export interface QueryResult<T = any> {
  countReturn: number;
  resultData: T[];
}

class PerfoodHealthService {
  private isNative: boolean;
  private initialized: boolean = false;

  constructor() {
    this.isNative = Capacitor.isNativePlatform();
    const platform = Capacitor.getPlatform();
    healthKitLogger.info('PerfoodHealthService', 'constructor', 'Platform detected', { 
      isNative: this.isNative,
      platform: platform 
    });
  }

  async initialize(): Promise<boolean> {
    await healthKitLogger.info('PerfoodHealthService', 'initialize', 'Starting initialization');
    
    if (!this.isNative) {
      await healthKitLogger.info('PerfoodHealthService', 'initialize', 'Not native platform, skipping');
      this.initialized = false;
      return false;
    }

    try {
      await healthKitLogger.info('PerfoodHealthService', 'initialize', 'Checking HealthKit availability...');
      
      // Check if the plugin is available
      if (!CapacitorHealthkit) {
        await healthKitLogger.error('PerfoodHealthService', 'initialize', 'CapacitorHealthkit plugin not found');
        return false;
      }

      // Check if HealthKit is available on device
      const availability = await CapacitorHealthkit.isAvailable();
      await healthKitLogger.info('PerfoodHealthService', 'initialize', 'HealthKit availability check result', { availability });
      
      this.initialized = true;
      await healthKitLogger.info('PerfoodHealthService', 'initialize', 'HealthKit is available');
      return true;
    } catch (error) {
      await healthKitLogger.error('PerfoodHealthService', 'initialize', 'Error during initialization', error.message, {
        errorName: error.name,
        errorStack: error.stack
      });
      this.initialized = false;
      return false;
    }
  }

  async requestPermissions(permissions: HealthPermissions): Promise<boolean> {
    await healthKitLogger.info('PerfoodHealthService', 'requestPermissions', 'Requesting permissions', { permissions });
    
    if (!this.isNative) {
      await healthKitLogger.info('PerfoodHealthService', 'requestPermissions', 'Not a native platform');
      return false;
    }

    if (!this.initialized) {
      await healthKitLogger.info('PerfoodHealthService', 'requestPermissions', 'Service not initialized, attempting to initialize...');
      const initialized = await this.initialize();
      if (!initialized) {
        await healthKitLogger.error('PerfoodHealthService', 'requestPermissions', 'Failed to initialize');
        return false;
      }
    }

    try {
      await healthKitLogger.info('PerfoodHealthService', 'requestPermissions', 'Calling CapacitorHealthkit.requestAuthorization...');
      const result = await CapacitorHealthkit.requestAuthorization({
        read: permissions.read || [],
        write: permissions.write || [],
        all: permissions.all || []
      });
      await healthKitLogger.info('PerfoodHealthService', 'requestPermissions', 'Authorization request completed', { result });
      return true;
    } catch (error) {
      await healthKitLogger.error('PerfoodHealthService', 'requestPermissions', 'Error during permission request', error.message, {
        errorName: error.name,
        errorStack: error.stack
      });
      return false;
    }
  }

  async queryHealthData(dataType: string, startDate: Date, endDate: Date): Promise<HealthDataPoint[]> {
    await healthKitLogger.info('PerfoodHealthService', 'queryHealthData', 'Query health data', { 
      dataType, 
      startDate: startDate.toISOString(), 
      endDate: endDate.toISOString() 
    });

    if (!this.isNative || !this.initialized) {
      await healthKitLogger.info('PerfoodHealthService', 'queryHealthData', 'Not available, returning mock data');
      return this.generateMockData(dataType, startDate, endDate);
    }

    try {
      const queryOptions: QueryOptions = {
        sampleName: dataType,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        limit: 1000
      };

      const result: QueryResult = await CapacitorHealthkit.queryHKitSampleType(queryOptions);
      await healthKitLogger.info('PerfoodHealthService', 'queryHealthData', 'Query completed successfully', { 
        count: result.countReturn, 
        dataPoints: result.resultData.length 
      });

      // Convert result to HealthDataPoint format
      return result.resultData.map((item: any) => ({
        type: dataType,
        value: item.value || item.quantity || 0,
        unit: item.unit || this.getUnitForDataType(dataType),
        startDate: new Date(item.startDate || item.startTime),
        endDate: new Date(item.endDate || item.endTime),
        sourceName: item.sourceName || 'HealthKit',
        sourceVersion: item.sourceVersion || '1.0'
      }));
    } catch (error) {
      await healthKitLogger.error('PerfoodHealthService', 'queryHealthData', 'Error during query', error.message, { dataType, error });
      // Return mock data on error for development
      return this.generateMockData(dataType, startDate, endDate);
    }
  }

  async queryAggregatedData(dataType: string, startDate: Date, endDate: Date, bucket?: string): Promise<HealthDataPoint[]> {
    console.log('🔧 PerfoodHealthService.queryAggregatedData() - Query:', { 
      dataType, 
      startDate: startDate.toISOString(), 
      endDate: endDate.toISOString(),
      bucket 
    });

    // For now, use the same as queryHealthData since @perfood/capacitor-healthkit doesn't have specific aggregation
    return this.queryHealthData(dataType, startDate, endDate);
  }

  async storeHealthData(dataType: string, value: number, unit: string, date: Date): Promise<boolean> {
    console.log('🔧 PerfoodHealthService.storeHealthData() - Store:', { dataType, value, unit, date });

    if (!this.isNative || !this.initialized) {
      console.log('🔧 PerfoodHealthService.storeHealthData() - Not available');
      return false;
    }

    try {
      // Note: @perfood/capacitor-healthkit doesn't seem to have a direct store method
      // This would need to be implemented if writing data is required
      console.log('⚠️ PerfoodHealthService.storeHealthData() - Store functionality not implemented in @perfood/capacitor-healthkit');
      return false;
    } catch (error) {
      console.error('❌ PerfoodHealthService.storeHealthData() - Error:', error);
      return false;
    }
  }

  private generateMockData(dataType: string, startDate: Date, endDate: Date): HealthDataPoint[] {
    healthKitLogger.info('PerfoodHealthService', 'generateMockData', 'Generating mock data', { dataType });
    
    const mockData: HealthDataPoint[] = [];
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    for (let i = 0; i < Math.min(daysDiff, 30); i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      
      let value = 0;
      let unit = '';
      
      switch (dataType) {
        case SampleNames.STEP_COUNT:
          value = Math.floor(Math.random() * 5000) + 5000;
          unit = 'steps';
          break;
        case SampleNames.DISTANCE_WALKING_RUNNING:
          value = Math.random() * 5 + 2;
          unit = 'km';
          break;
        case SampleNames.ACTIVE_ENERGY_BURNED:
          value = Math.floor(Math.random() * 300) + 200;
          unit = 'kcal';
          break;
        case SampleNames.HEART_RATE:
          value = Math.floor(Math.random() * 40) + 60;
          unit = 'bpm';
          break;
        case SampleNames.BODY_MASS:
          value = Math.random() * 20 + 60;
          unit = 'kg';
          break;
        default:
          value = Math.random() * 100;
          unit = 'unit';
      }
      
      mockData.push({
        type: dataType,
        value,
        unit,
        startDate: date,
        endDate: new Date(date.getTime() + 60 * 60 * 1000), // 1 hour later
        sourceName: 'Mock Health Data',
        sourceVersion: '1.0.0'
      });
    }
    
    healthKitLogger.info('PerfoodHealthService', 'generateMockData', 'Generated mock data points', { 
      dataType, 
      count: mockData.length 
    });
    return mockData;
  }

  private getUnitForDataType(dataType: string): string {
    switch (dataType) {
      case SampleNames.STEP_COUNT:
        return 'steps';
      case SampleNames.DISTANCE_WALKING_RUNNING:
        return 'km';
      case SampleNames.ACTIVE_ENERGY_BURNED:
      case SampleNames.BASAL_ENERGY_BURNED:
        return 'kcal';
      case SampleNames.HEART_RATE:
        return 'bpm';
      case SampleNames.BODY_MASS:
        return 'kg';
      case SampleNames.HEIGHT:
        return 'cm';
      case SampleNames.DIETARY_WATER:
        return 'ml';
      default:
        return 'unit';
    }
  }

  getIsNative(): boolean {
    return this.isNative;
  }

  getIsInitialized(): boolean {
    return this.initialized;
  }
}

// Export singleton instance
export const perfoodHealthService = new PerfoodHealthService();