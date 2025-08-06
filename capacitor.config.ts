import type { CapacitorConfig } from '@capacitor/cli';

const isCI = process.env.CI === 'true'; // Detecta se está rodando no GitHub Actions
const isProduction = process.env.NODE_ENV === 'production' || isCI;

const config: CapacitorConfig = {
  appId: isCI ? 'com.prosoccerapp.prohealthapp' : 'app.lovable.7bde27a9721845aaa0217e78cef04596',
  appName: 'pro-health-app',
  webDir: 'www',
  // Only use server config in development mode
  ...(isProduction ? {} : {
    server: {
      url: 'https://7bde27a9-7218-45aa-a021-7e78cef04596.lovableproject.com?forceHideBadge=true',
      cleartext: true
    }
  }),
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#1a1a1a',
      showSpinner: true,
      spinnerColor: '#ffffff'
    },
    CordovaPluginHealth: {
      permissions: {
        read: [
          'steps',
          'distance',
          'calories.active',
          'calories.basal',
          'heart_rate',
          'heart_rate_variability',
          'sleep',
          'weight',
          'height',
          'body_fat_percentage',
          'blood_pressure_systolic',
          'blood_pressure_diastolic',
          'respiratory_rate',
          'oxygen_saturation',
          'blood_glucose',
          'water',
          'workout'
        ],
        write: [
          'steps',
          'calories.active',
          'heart_rate',
          'water',
          'workout'
        ]
      }
    }
  },
  cordova: {
    preferences: {
      ScrollEnabled: 'false',
      'android-minSdkVersion': '19',
      BackupWebStorage: 'none',
      SplashMaintainAspectRatio: 'true',
      FadeSplashScreenDuration: '300',
      SplashShowOnlyFirstTime: 'false',
      SplashScreen: 'screen',
      SplashScreenDelay: '3000'
    }
  }
};

export default config;