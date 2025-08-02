# Health Integration Setup Guide

This guide explains how to set up Apple Health and Google Fit integration using the `cordova-plugin-health` plugin.

## Overview

The app now uses `cordova-plugin-health` for unified health data access across iOS (Apple Health) and Android (Google Fit/Health Connect). This provides a single API for both platforms.

## What's Implemented

### ✅ Completed Features
- **Unified Health Service**: `CordovaHealthService` that works across platforms
- **Updated Health Integration Hook**: `useHealthIntegration` now uses the new plugin
- **Background Sync Service**: Updated to use Cordova Health API
- **Permission Management**: Unified permission requests for both platforms
- **Data Types Supported**:
  - Steps
  - Heart Rate
  - Calories
  - Sleep
  - Water Intake
  - Weight
  - Distance
  - Blood Pressure

### 🔧 Configuration Files Created
- **Capacitor Config**: Updated with Health plugin configuration
- **iOS Info.plist**: Health data usage descriptions
- **Android Permissions**: Manifest permissions for Google Fit and Health Connect
- **Native Configuration**: Platform-specific setup files

## Setup Instructions

### 1. Install the Cordova Plugin

The plugin is already added to package.json. After syncing your project:

```bash
npm install
npx cap sync
```

### 2. iOS Setup

1. **Add to Info.plist**: Copy the contents from `ios/App/App/Info.plist.xml` to your iOS app's Info.plist
2. **Enable HealthKit**: In Xcode, add HealthKit capability to your app
3. **Configure Permissions**: The app will request permissions for:
   - Reading: Steps, Heart Rate, Sleep, Calories, Distance
   - Writing: Steps, Heart Rate, Calories, Distance

### 3. Android Setup

1. **Add Permissions**: Copy permissions from `android/app/src/main/AndroidManifest.xml.partial` to your AndroidManifest.xml
2. **Google Fit Setup**: 
   - Enable Google Fit API in Google Cloud Console
   - Configure OAuth2 credentials
   - Add SHA-1 fingerprint for your app
3. **Health Connect**: For Android 14+, the app supports Health Connect automatically

### 4. Testing

The implementation includes comprehensive fallback behavior:
- **Web/Simulator**: Uses mock data for testing
- **Native Device**: Attempts to use real health data, falls back to mock if unavailable
- **Background Sync**: Periodically syncs health data when app is active

## How to Use

### Basic Health Integration

```typescript
import { useHealthIntegration } from '@/hooks/useHealthIntegration';

function MyComponent() {
  const {
    isAvailable,
    isConnected,
    requestPermissions,
    syncHealthData,
    enableBackgroundSync
  } = useHealthIntegration();

  const handleConnect = async () => {
    const success = await requestPermissions(['steps', 'heart_rate', 'calories']);
    if (success) {
      await enableBackgroundSync();
    }
  };

  return (
    <div>
      {isAvailable ? (
        <button onClick={handleConnect}>
          Connect Health Data
        </button>
      ) : (
        <p>Health integration not available on this device</p>
      )}
    </div>
  );
}
```

### Manual Sync

```typescript
const handleManualSync = async () => {
  await syncHealthData();
};
```

## Data Flow

1. **Permission Request**: App requests permissions for specific health data types
2. **Data Fetching**: Plugin fetches data from Apple Health or Google Fit
3. **Data Processing**: Raw data is converted to standardized format
4. **Database Storage**: Processed data is stored in Supabase `athlete_data` table
5. **Background Sync**: Periodic syncing keeps data up to date

## Troubleshooting

### Common Issues

1. **Permissions Denied**: 
   - Check Info.plist usage descriptions
   - Verify permissions in device settings
   - Ensure proper OAuth setup for Google Fit

2. **No Data Retrieved**:
   - Verify health data exists in source app (Health/Google Fit)
   - Check date ranges in queries
   - Review console logs for API errors

3. **Android Health Connect**:
   - Only available on Android 14+
   - User must install Health Connect app
   - Different permission model than Google Fit

### Debug Mode

Enable debug logging by setting:
```typescript
window.cordova_health_debug = true;
```

## Migration from Previous Plugins

The app previously used:
- `@perfood/capacitor-healthkit` (iOS)
- `capacitor-health-connect` (Android)

These have been replaced with `cordova-plugin-health` for better compatibility and unified API.

### Breaking Changes

- Health service initialization is now async
- Permission model is unified across platforms
- Background sync requires explicit setup

## Production Deployment

### iOS App Store
- Ensure HealthKit capability is enabled
- Include health data usage descriptions
- Test on physical device with health data

### Google Play Store
- Configure Google Fit API credentials
- Include required permissions in manifest
- Test with Google Fit app installed

## Support

For issues with health integration:
1. Check console logs for detailed error messages
2. Verify platform-specific setup requirements
3. Test with mock data first, then real health data
4. Consult plugin documentation: [cordova-plugin-health](https://github.com/dariosalvi78/cordova-plugin-health)
