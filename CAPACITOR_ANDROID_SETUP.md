# Capacitor Android Setup for Native Authentication

This document outlines the steps to configure Capacitor.js with native Android Firebase authentication for Google and Facebook sign-in.

## Prerequisites

1. Ensure you have the following installed:
   - Node.js 18+
   - Android Studio
   - Android SDK
   - Java Development Kit (JDK) 11+

2. Firebase project with Android app configured

## Setup Steps

### 1. Install Capacitor Android Platform

```bash
npm install @capacitor/android @capacitor/app @capacitor/push-notifications
npx cap add android
```

### 2. Configure Capacitor

Update `capacitor.config.ts`:

```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.incredibleindia.app',
  appName: 'Incredible India',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https'
  },
  android: {
    path: 'android'
  }
};

export default config;
```

### 3. Configure Android Build Files

Update `android/build.gradle`:

```gradle
buildscript {
    dependencies {
        classpath 'com.android.tools.build:gradle:8.7.2'
        classpath 'com.google.gms:google-services:4.4.3'  // Add this line
    }
}
```

Update `android/app/build.gradle`:

```gradle
apply plugin: 'com.android.application'
apply plugin: 'com.google.gms.google-services'  // Add this line

dependencies {
    // Import the Firebase BoM
    implementation platform('com.google.firebase:firebase-bom:34.2.0')
    
    // Firebase Authentication
    implementation 'com.google.firebase:firebase-auth'
    
    // Google Sign-In
    implementation 'com.google.android.gms:play-services-auth:21.2.0'
    
    // Facebook Login
    implementation 'com.facebook.android:facebook-login:17.0.0'
    
    // Add other Firebase dependencies as needed
    implementation 'com.google.firebase:firebase-analytics'
    implementation 'com.google.firebase:firebase-firestore'
    implementation 'com.google.firebase:firebase-storage'
}
```

### 4. Add Firebase Configuration

1. Download `google-services.json` from your Firebase project
2. Place it in `android/app/` directory

### 5. Implement Native Authentication Plugin

The native authentication plugin is implemented in `android/app/src/main/java/com/incredibleindia/app/NativeAuthPlugin.java`.

Important: Replace `"YOUR_WEB_CLIENT_ID"` with your actual Web Client ID from Firebase in the NativeAuthPlugin.java file.

### 6. Update Mobile Authentication Service

The mobile authentication service in `src/services/mobileAuth.ts` has been updated to use the native Capacitor plugin when available.

### 7. Register Plugin in MainActivity

Update `android/app/src/main/java/com/incredibleindia/app/MainActivity.java`:

```java
package com.incredibleindia.app;

import com.getcapacitor.BridgeActivity;
import android.os.Bundle;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Register custom plugins
        registerPlugin(NativeAuthPlugin.class);
    }
}
```

## Building and Running

### Sync Project

```bash
npx cap sync
```

### Open in Android Studio

```bash
npx cap open android
```

### Build and Run

In Android Studio:
1. Build the project
2. Run on emulator or physical device

## Firebase Configuration

### Web Client ID

To get your Web Client ID:
1. Go to Firebase Console
2. Select your project
3. Go to Project Settings
4. In the General tab, under "Your apps", find your web app
5. Copy the "Web client ID" value

### Android SHA-1 Certificate

To add your Android app's SHA-1 certificate:
1. In Android Studio, open Gradle tab
2. Run `signingReport` task under `android/app`
3. Copy the SHA-1 value
4. In Firebase Console, add this SHA-1 to your Android app configuration

## Testing Native Authentication

The implementation will:
1. Use native Google/Facebook apps when available
2. Fall back to web redirect flow if native authentication fails
3. Provide appropriate UI feedback during authentication process

## Troubleshooting

### Common Issues

1. **Missing google-services.json**: Ensure the file is in the correct location
2. **Web Client ID not configured**: Update the placeholder in NativeAuthPlugin.java
3. **SHA-1 certificate mismatch**: Ensure your app's SHA-1 is registered in Firebase
4. **Gradle sync issues**: Clean and rebuild the project

### Debugging

Enable verbose logging in Android Studio to see authentication flow details.