import { Capacitor } from '@capacitor/core';

declare global {
  interface Window {
    plugins: {
      health: {
        isAvailable: (successCallback: (available: boolean) => void, errorCallback: (error: any) => void) => void;
        requestAuthorization: (
          datatypes: { read: string[], write?: string[] },
          successCallback: () => void,
          errorCallback: (error: any) => void
        ) => void;
        queryAggregated: (
          opts: {
            dataType: string;
            startDate: Date;
            endDate: Date;
            bucket?: string;
          },
          successCallback: (data: any) => void,
          errorCallback: (error: any) => void
        ) => void;
        query: (
          opts: {
            dataType: string;
            startDate: Date;
            endDate: Date;
          },
          successCallback: (data: any[]) => void,
          errorCallback: (error: any) => void
        ) => void;
        store: (
          opts: {
            dataType: string;
            value: number;
            unit: string;
            date: Date;
          },
          successCallback: () => void,
          errorCallback: (error: any) => void
        ) => void;
      };
    };
  }
}

export interface HealthDataType {
  steps: 'steps';
  distance: 'distance';
  calories: 'calories';
  heart_rate: 'heart_rate';
  activity: 'activity';
  sleep: 'sleep';
  weight: 'weight';
  height: 'height';
  blood_pressure: 'blood_pressure';
  water: 'water';
}

export interface HealthDataPoint {
  dataType: string;
  value: number;
  unit: string;
  startDate: Date;
  endDate: Date;
  source?: string;
}

export interface HealthPermissions {
  read: string[];
  write?: string[];
}

export class CordovaHealthService {
  private isInitialized = false;
  private isNative = false;

  constructor() {
    this.isNative = Capacitor.getPlatform() === 'ios' || Capacitor.getPlatform() === 'android';
  }

  async initialize(): Promise<boolean> {
    if (!this.isNative) {
      this.isInitialized = true;
      return false; // Not available on web
    }

    return new Promise((resolve) => {
      if (!window.plugins?.health) {
        console.warn('Cordova Health plugin not available');
        this.isInitialized = true;
        resolve(false);
        return;
      }

      window.plugins.health.isAvailable(
        (available: boolean) => {
          this.isInitialized = true;
          resolve(available);
        },
        (error: any) => {
          console.error('Health plugin availability check failed:', error);
          this.isInitialized = true;
          resolve(false);
        }
      );
    });
  }

  async requestPermissions(permissions: HealthPermissions): Promise<boolean> {
    if (!this.isNative || !window.plugins?.health) {
      return false;
    }

    return new Promise((resolve) => {
      window.plugins.health.requestAuthorization(
        permissions,
        () => {
          console.log('Health permissions granted');
          resolve(true);
        },
        (error: any) => {
          console.error('Health permissions denied:', error);
          resolve(false);
        }
      );
    });
  }

  async queryHealthData(dataType: string, startDate: Date, endDate: Date): Promise<HealthDataPoint[]> {
    if (!this.isNative || !window.plugins?.health) {
      return this.generateMockData(dataType, startDate, endDate);
    }

    return new Promise((resolve) => {
      window.plugins.health.query(
        {
          dataType,
          startDate,
          endDate
        },
        (data: any[]) => {
          const healthData: HealthDataPoint[] = data.map(item => ({
            dataType,
            value: item.value || 0,
            unit: item.unit || '',
            startDate: new Date(item.startDate),
            endDate: new Date(item.endDate),
            source: item.sourceName || 'health_app'
          }));
          resolve(healthData);
        },
        (error: any) => {
          console.error(`Failed to query ${dataType}:`, error);
          // Fallback to mock data on error
          resolve(this.generateMockData(dataType, startDate, endDate));
        }
      );
    });
  }

  async queryAggregatedData(dataType: string, startDate: Date, endDate: Date, bucket = 'day'): Promise<HealthDataPoint[]> {
    if (!this.isNative || !window.plugins?.health) {
      return this.generateMockData(dataType, startDate, endDate);
    }

    return new Promise((resolve) => {
      window.plugins.health.queryAggregated(
        {
          dataType,
          startDate,
          endDate,
          bucket
        },
        (data: any) => {
          const healthData: HealthDataPoint[] = data.map((item: any) => ({
            dataType,
            value: item.value || 0,
            unit: item.unit || '',
            startDate: new Date(item.startDate),
            endDate: new Date(item.endDate),
            source: item.sourceName || 'health_app'
          }));
          resolve(healthData);
        },
        (error: any) => {
          console.error(`Failed to query aggregated ${dataType}:`, error);
          // Fallback to mock data on error
          resolve(this.generateMockData(dataType, startDate, endDate));
        }
      );
    });
  }

  async storeHealthData(dataType: string, value: number, unit: string, date: Date): Promise<boolean> {
    if (!this.isNative || !window.plugins?.health) {
      console.log('Mock: Would store health data:', { dataType, value, unit, date });
      return true;
    }

    return new Promise((resolve) => {
      window.plugins.health.store(
        {
          dataType,
          value,
          unit,
          date
        },
        () => {
          console.log('Health data stored successfully');
          resolve(true);
        },
        (error: any) => {
          console.error('Failed to store health data:', error);
          resolve(false);
        }
      );
    });
  }

  private generateMockData(dataType: string, startDate: Date, endDate: Date): HealthDataPoint[] {
    const mockData: HealthDataPoint[] = [];
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    for (let i = 0; i <= daysDiff; i++) {
      const date = new Date(startDate.getTime() + (i * 24 * 60 * 60 * 1000));
      
      let value = 0;
      let unit = '';

      switch (dataType) {
        case 'steps':
          value = 5000 + Math.random() * 10000;
          unit = 'count';
          break;
        case 'calories':
          value = 1800 + Math.random() * 800;
          unit = 'kcal';
          break;
        case 'heart_rate':
          value = 60 + Math.random() * 40;
          unit = 'bpm';
          break;
        case 'sleep':
          value = 7 + Math.random() * 2;
          unit = 'hours';
          break;
        case 'water':
          value = 1500 + Math.random() * 1000;
          unit = 'ml';
          break;
        case 'weight':
          value = 70 + Math.random() * 20;
          unit = 'kg';
          break;
        case 'distance':
          value = 3 + Math.random() * 7;
          unit = 'km';
          break;
        default:
          value = Math.random() * 100;
          unit = 'unit';
      }

      mockData.push({
        dataType,
        value: Math.round(value * 100) / 100,
        unit,
        startDate: date,
        endDate: date,
        source: 'mock_health_app'
      });
    }

    return mockData;
  }

  getIsNative(): boolean {
    return this.isNative;
  }

  getIsInitialized(): boolean {
    return this.isInitialized;
  }
}

export const cordovaHealthService = new CordovaHealthService();