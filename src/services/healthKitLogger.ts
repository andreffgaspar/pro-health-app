import { supabase } from '@/integrations/supabase/client';

export type HealthKitLogLevel = 'info' | 'warning' | 'error' | 'debug';

export interface HealthKitLogData {
  level: HealthKitLogLevel;
  component: string;
  action: string;
  message: string;
  data?: Record<string, any>;
  errorDetails?: string;
  platform?: string;
  isNative?: boolean;
}

class HealthKitLogger {
  private async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }

  async log(logData: HealthKitLogData): Promise<void> {
    try {
      const user = await this.getCurrentUser();
      
      // Always log to console first
      const logMessage = `[${logData.level.toUpperCase()}] ${logData.component}.${logData.action}: ${logData.message}`;
      
      switch (logData.level) {
        case 'error':
          console.error(logMessage, logData.data, logData.errorDetails);
          break;
        case 'warning':
          console.warn(logMessage, logData.data);
          break;
        case 'debug':
          console.debug(logMessage, logData.data);
          break;
        default:
          console.log(logMessage, logData.data);
      }

      // Save to database if user is logged in
      if (user) {
        const { error } = await supabase
          .from('healthkit_logs')
          .insert({
            user_id: user.id,
            level: logData.level,
            component: logData.component,
            action: logData.action,
            message: logData.message,
            data: logData.data || {},
            error_details: logData.errorDetails,
            platform: logData.platform,
            is_native: logData.isNative || false
          });

        if (error) {
          console.error('Failed to save HealthKit log to database:', error);
        }
      }
    } catch (error) {
      console.error('Error in HealthKitLogger.log:', error);
    }
  }

  async info(component: string, action: string, message: string, data?: Record<string, any>, platform?: string, isNative?: boolean): Promise<void> {
    await this.log({
      level: 'info',
      component,
      action,
      message,
      data,
      platform,
      isNative
    });
  }

  async warning(component: string, action: string, message: string, data?: Record<string, any>, platform?: string, isNative?: boolean): Promise<void> {
    await this.log({
      level: 'warning',
      component,
      action,
      message,
      data,
      platform,
      isNative
    });
  }

  async error(component: string, action: string, message: string, errorDetails?: string, data?: Record<string, any>, platform?: string, isNative?: boolean): Promise<void> {
    await this.log({
      level: 'error',
      component,
      action,
      message,
      data,
      errorDetails,
      platform,
      isNative
    });
  }

  async debug(component: string, action: string, message: string, data?: Record<string, any>, platform?: string, isNative?: boolean): Promise<void> {
    await this.log({
      level: 'debug',
      component,
      action,
      message,
      data,
      platform,
      isNative
    });
  }

  async getLogs(limit: number = 100): Promise<any[]> {
    try {
      const user = await this.getCurrentUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('healthkit_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Failed to fetch HealthKit logs:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching HealthKit logs:', error);
      return [];
    }
  }
}

export const healthKitLogger = new HealthKitLogger();