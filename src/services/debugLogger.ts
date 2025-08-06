import { supabase } from '@/integrations/supabase/client';
import { Capacitor } from '@capacitor/core';

export interface DebugLogEntry {
  component: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  context?: Record<string, any>;
}

export class DebugLogger {
  private static instance: DebugLogger;
  private isEnabled = true;
  private userId: string | null = null;

  private constructor() {
    // Get current user on initialization
    this.getCurrentUser();
  }

  static getInstance(): DebugLogger {
    if (!DebugLogger.instance) {
      DebugLogger.instance = new DebugLogger();
    }
    return DebugLogger.instance;
  }

  private async getCurrentUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      this.userId = user?.id || null;
    } catch (error) {
      console.warn('Failed to get user for debug logging:', error);
    }
  }

  setUserId(userId: string | null) {
    this.userId = userId;
  }

  private async saveToDatabase(entry: DebugLogEntry) {
    if (!this.userId || !this.isEnabled) return;

    try {
      const platform = Capacitor.getPlatform();
      const userAgent = navigator.userAgent;

      await supabase.from('debug_logs').insert({
        user_id: this.userId,
        component: entry.component,
        level: entry.level,
        message: entry.message,
        context: entry.context || null,
        platform,
        user_agent: userAgent
      });
    } catch (error) {
      // Fallback to console.error if database insert fails
      console.error('Failed to save debug log to database:', error);
    }
  }

  async log(component: string, message: string, context?: Record<string, any>) {
    const entry: DebugLogEntry = {
      component,
      level: 'info',
      message,
      context
    };

    // Always log to console for immediate debugging
    console.log(`[${component}] ${message}`, context || '');
    
    // Save to database for persistent logging
    await this.saveToDatabase(entry);
  }

  async warn(component: string, message: string, context?: Record<string, any>) {
    const entry: DebugLogEntry = {
      component,
      level: 'warn',
      message,
      context
    };

    console.warn(`[${component}] ${message}`, context || '');
    await this.saveToDatabase(entry);
  }

  async error(component: string, message: string, context?: Record<string, any>) {
    const entry: DebugLogEntry = {
      component,
      level: 'error',
      message,
      context
    };

    console.error(`[${component}] ${message}`, context || '');
    await this.saveToDatabase(entry);
  }

  async debug(component: string, message: string, context?: Record<string, any>) {
    const entry: DebugLogEntry = {
      component,
      level: 'debug',
      message,
      context
    };

    console.debug(`[${component}] ${message}`, context || '');
    await this.saveToDatabase(entry);
  }

  enable() {
    this.isEnabled = true;
  }

  disable() {
    this.isEnabled = false;
  }
}

// Export singleton instance
export const debugLogger = DebugLogger.getInstance();