import {
  ActivityData,
  CapacitorHealthkit,
  OtherData,
  QueryOutput,
  SleepData,
} from '@perfood/capacitor-healthkit';
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

// @perfood/capacitor-healthkit sample names (using plugin's permission strings)
export const HealthKitSampleNames = {
  STEP_COUNT: 'stepCount', //OK
  DISTANCE_WALKING_RUNNING: 'distanceWalkingRunning', //OK
  ACTIVE_ENERGY_BURNED: 'activeEnergyBurned', //Analisar Diferença enrte active e basal
  BASAL_ENERGY_BURNED: 'basalEnergyBurned', //Analisar Diferença enrte active e basal
  HEART_RATE: 'heartRate',
  BODY_MASS: 'weight', //OK
  HEIGHT: 'height',
  SLEEP_ANALYSIS: 'sleepAnalysis', //Analisar veio tudo com zero
  WORKOUT_TYPE: 'workoutType',
  DIETARY_WATER: 'dietaryWater',
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

      await healthKitLogger.info('PerfoodHealthService', 'queryHealthData', 'Attempting query with options', { queryOptions });
      const result: QueryResult = await CapacitorHealthkit.queryHKitSampleType(queryOptions);
      
      await healthKitLogger.info('PerfoodHealthService', 'queryHealthData', 'Raw query result', { 
        result,
        hasResultData: !!result?.resultData,
        resultDataType: typeof result?.resultData,
        resultDataLength: Array.isArray(result?.resultData) ? result.resultData.length : 'not array'
      });

      // Validate the result structure
      if (!result) {
        await healthKitLogger.error('PerfoodHealthService', 'queryHealthData', 'Null result from query', '', { dataType });
        return [];
      }

      if (!result.resultData || !Array.isArray(result.resultData)) {
        await healthKitLogger.error('PerfoodHealthService', 'queryHealthData', 'Invalid result data structure', '', { 
          dataType,
          resultData: result.resultData,
          resultDataType: typeof result.resultData
        });
        return [];
      }

      await healthKitLogger.info('PerfoodHealthService', 'queryHealthData', 'Query completed successfully', { 
        count: result.countReturn, 
        dataPoints: result.resultData.length 
      });

      // Convert result to HealthDataPoint format with null checks
      const healthDataPoints: HealthDataPoint[] = [];
      
      for (const item of result.resultData) {
        if (!item) {
          continue;
        }
        
        try {
          healthDataPoints.push({
            type: dataType,
            value: item.value || item.quantity || 0,
            unit: item.unit || this.getUnitForDataType(dataType),
            startDate: new Date(item.startDate || item.startTime || Date.now()),
            endDate: new Date(item.endDate || item.endTime || Date.now()),
            sourceName: item.sourceName || 'HealthKit',
            sourceVersion: item.sourceVersion || '1.0'
          });
        } catch (mapError) {
          await healthKitLogger.error('PerfoodHealthService', 'queryHealthData', 'Error mapping data point', mapError.message, { item });
        }
      }
      
      return healthDataPoints;
    } catch (error) {
      await healthKitLogger.error('PerfoodHealthService', 'queryHealthData', 'Error during query', error.message, { 
        dataType, 
        error: {
          message: error.message,
          name: error.name,
          stack: error.stack
        }
      });
      // Return empty array on error instead of mock data
      return [];
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
    // Mock data generation is disabled - return empty array
    return [];
  }

  private getUnitForDataType(dataType: string): string {
    switch (dataType) {
      case HealthKitSampleNames.STEP_COUNT: // 'steps'
        return 'steps';
      case HealthKitSampleNames.DISTANCE_WALKING_RUNNING: // 'distance'
        return 'm';
      case HealthKitSampleNames.ACTIVE_ENERGY_BURNED: // 'calories'
        return 'kcal';
      case HealthKitSampleNames.BASAL_ENERGY_BURNED: // 'calories'
        return 'kcal';
      case HealthKitSampleNames.DIETARY_WATER: // mL
        return 'ml';
      case HealthKitSampleNames.HEART_RATE: // bpm
        return 'bpm';
      case HealthKitSampleNames.BODY_MASS: // 'weight'
        return 'kg';
      case HealthKitSampleNames.HEIGHT: // cm
        return 'cm';
      case HealthKitSampleNames.SLEEP_ANALYSIS: // 'duration'
        return 'min';
      case HealthKitSampleNames.WORKOUT_TYPE: // 'activity'
        return 'workout';
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