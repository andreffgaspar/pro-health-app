import { supabase } from '@/integrations/supabase/client';

interface LoginLogData {
  step: string;
  status: 'started' | 'success' | 'error' | 'timeout';
  message?: string;
  data?: any;
  errorDetails?: string;
  userId?: string;
  sessionId?: string;
}

export const useLoginLogger = () => {
  const generateSessionId = () => {
    return `login_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const logLoginStep = async (logData: LoginLogData) => {
    try {
      const userAgent = navigator.userAgent;
      const platform = /iPhone|iPad|iPod/.test(userAgent) ? 'ios' : 
                      /Android/.test(userAgent) ? 'android' : 'web';

      await supabase
        .from('login_logs')
        .insert({
          user_id: logData.userId || null,
          session_id: logData.sessionId,
          step: logData.step,
          status: logData.status,
          message: logData.message,
          data: logData.data || {},
          error_details: logData.errorDetails,
          user_agent: userAgent,
          platform: platform
        });

      console.log(`📝 Login Log [${logData.step}]:`, logData.status, logData.message);
    } catch (error) {
      console.error('❌ Failed to save login log:', error);
    }
  };

  const logError = async (step: string, error: any, sessionId?: string, userId?: string) => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    await logLoginStep({
      step,
      status: 'error',
      message: errorMessage,
      errorDetails: errorStack,
      sessionId,
      userId,
      data: { errorType: typeof error, timestamp: new Date().toISOString() }
    });
  };

  const logTimeout = async (step: string, timeoutMs: number, sessionId?: string, userId?: string) => {
    await logLoginStep({
      step,
      status: 'timeout',
      message: `Operation timed out after ${timeoutMs}ms`,
      sessionId,
      userId,
      data: { timeoutMs, timestamp: new Date().toISOString() }
    });
  };

  const logSuccess = async (step: string, message?: string, data?: any, sessionId?: string, userId?: string) => {
    await logLoginStep({
      step,
      status: 'success',
      message: message || `${step} completed successfully`,
      sessionId,
      userId,
      data: { ...data, timestamp: new Date().toISOString() }
    });
  };

  const logStart = async (step: string, message?: string, data?: any, sessionId?: string, userId?: string) => {
    await logLoginStep({
      step,
      status: 'started',
      message: message || `Starting ${step}`,
      sessionId,
      userId,
      data: { ...data, timestamp: new Date().toISOString() }
    });
  };

  return {
    generateSessionId,
    logLoginStep,
    logError,
    logTimeout,
    logSuccess,
    logStart
  };
};