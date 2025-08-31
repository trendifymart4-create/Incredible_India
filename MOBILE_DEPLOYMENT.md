# Mobile App Deployment Configuration

This document explains how to configure the mobile app to use the Vercel-hosted version instead of localhost to eliminate performance issues.

## Configuration Changes

The mobile app has been configured to use the Vercel-hosted URL instead of localhost. This eliminates the lag issues experienced when running the app on mobile devices.

### Capacitor Configuration

The `capacitor.config.ts` file has been updated with the following changes:

```typescript
server: {
  androidScheme: 'https',
  // Use the Vercel-hosted URL instead of localhost
  url: 'https://your-vercel-app-url.vercel.app',
  // Only use cleartext HTTP for development
  cleartext: false
}
```

### Native Authentication Enhancement

The mobile authentication has been enhanced to prioritize native app authentication flows over browser redirects:

1. Native Google and Facebook authentication is now prioritized
2. Better error handling and fallback mechanisms
3. Improved user experience with proper loading states

## Deployment Instructions

1. Replace `https://your-vercel-app-url.vercel.app` in `capacitor.config.ts` with your actual Vercel deployment URL
2. Run `npx cap sync` to update the native projects
3. Build and deploy the Android app

## Native Authentication Setup

To ensure native authentication works properly:

1. Make sure the Web Client ID in `NativeAuthPlugin.java` is correctly configured
2. Verify that the Firebase configuration is properly set up
3. Test the authentication flows on actual devices

## Troubleshooting

If you encounter issues with authentication:

1. Check that the NativeAuth plugin is properly registered in MainActivity.java
2. Verify that the Web Client ID in NativeAuthPlugin.java matches your Firebase configuration
3. Ensure that the required dependencies are included in build.gradle