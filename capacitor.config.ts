import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.7bde27a9721845aaa0217e78cef04596',
  appName: 'pro-health-app',
  webDir: 'dist',
  server: {
    url: 'https://7bde27a9-7218-45aa-a021-7e78cef04596.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#1a1a1a',
      showSpinner: true,
      spinnerColor: '#ffffff'
    }
  }
};

export default config;