import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.incredibleindia.app',
  appName: 'Incredible India',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https',
    // Use the Vercel-hosted URL instead of localhost to eliminate lag
    url: 'https://your-vercel-app-url.vercel.app',
    // Only use cleartext HTTP for development
    cleartext: false
  },
  android: {
    path: 'android'
  }
};

export default config;