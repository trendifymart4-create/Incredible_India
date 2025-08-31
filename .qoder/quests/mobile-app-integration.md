# Mobile App Integration with Capacitor.js and Native Firebase Authentication

## Overview

This document outlines the process of converting your React web application to a native mobile application using Capacitor.js, with a focus on implementing native Firebase authentication for Google and Facebook sign-in. The current implementation uses Firebase redirect-based authentication which opens external browsers for authentication. With Capacitor.js and native plugins, we can implement true native authentication that opens the Google and Facebook apps directly.

## Architecture

### Current Architecture
- Web-based React application with separate mobile components
- Firebase authentication using redirect flow (opens browser)
- Device detection to route between desktop and mobile views
- Mobile-specific authentication UI with loading states

### Target Architecture
- Capacitor.js hybrid mobile application
- Native Firebase authentication using Capacitor plugins
- True native Google/Facebook authentication (opens native apps)
- Shared codebase between web and mobile with platform-specific authentication

## Capacitor.js Integration

### 1. Project Setup

First, we need to initialize Capacitor in your project:

```bash
npm install @capacitor/core @capacitor/cli
npx cap init
```

During initialization, provide:
- App name: Incredible India Travel App
- App ID: com.incredibleindia.travel
- Web directory: dist (or your build output directory)

### 2. Platform Integration

Install platform-specific dependencies:

```bash
npm install @capacitor/android @capacitor/ios
npx cap add android
npx cap add ios
```

### 3. Update Project Structure

Add the following to your `package.json`:

```json
{
  "scripts": {
    "build": "vite build",
    "cap:android": "npx cap open android",
    "cap:ios": "npx cap open ios",
    "cap:sync": "npx cap sync"
  }
}
```

## Native Firebase Authentication Implementation

### 1. Capacitor Firebase Authentication Plugin

Install the Capacitor Firebase Authentication plugin:

```bash
npm install @capacitor-firebase/authentication
npx cap sync
```

### 2. Android Configuration

#### a. Update Android Manifest
In `android/app/src/main/AndroidManifest.xml`, add the necessary permissions:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

#### b. Firebase Configuration
Add your `google-services.json` file to `android/app/` directory.

#### c. Google Sign-In Configuration
In `android/app/src/main/res/values/strings.xml`:

```xml
<resources>
    <string name="facebook_app_id">YOUR_FACEBOOK_APP_ID</string>
    <string name="fb_login_protocol_scheme">fbYOUR_FACEBOOK_APP_ID</string>
</resources>
```

### 3. iOS Configuration

#### a. Update Info.plist
Add the following to `ios/App/App/Info.plist`:

```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLName</key>
    <string>com.incredibleindia.travel</string>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>com.googleusercontent.apps.YOUR_GOOGLE_CLIENT_ID</string>
    </array>
  </dict>
</array>
```

#### b. Firebase Configuration
Add your `GoogleService-Info.plist` file to the `ios/App/App/` directory.

## Native Authentication Service Implementation

### 1. Create Platform Detection Utility

Create a new file `src/utils/platformDetection.ts`:

```typescript
import { Capacitor } from '@capacitor/core';

export const isNativePlatform = (): boolean => {
  return Capacitor.isNativePlatform();
};

export const getPlatform = (): 'web' | 'android' | 'ios' => {
  return Capacitor.getPlatform() as 'web' | 'android' | 'ios';
};
```

### 2. Enhanced Authentication Service

Update `src/services/mobileAuth.ts` to support native authentication:

```typescript
// Mobile-specific authentication service with native support
import { 
  GoogleAuthProvider, 
  FacebookAuthProvider, 
  signInWithRedirect, 
  getRedirectResult,
  Auth
} from 'firebase/auth';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';
import { auth } from '../firebase';
import { UserProfile, handleSocialAuthUser } from '../api/auth';
import { isMobileDevice, isIOS, isAndroid } from '../utils/deviceDetection';
import { isNativePlatform, getPlatform } from '../utils/platformDetection';
import { mobileAuthUI, MobileAuthState } from './mobileAuthUI';

// Enhanced Google authentication with native support
export class MobileGoogleAuth {
  private provider: GoogleAuthProvider;

  constructor() {
    this.provider = new GoogleAuthProvider();
    this.setupProvider();
  }

  private setupProvider() {
    // Configure scopes
    this.provider.addScope('email');
    this.provider.addScope('profile');
  }

  async signIn(): Promise<UserProfile> {
    try {
      if (isNativePlatform()) {
        // Use native authentication for Capacitor apps
        mobileAuthUI.setState(MobileAuthState.AUTHENTICATING);
        
        // Sign in with Google using Capacitor Firebase plugin
        const result = await FirebaseAuthentication.signInWithGoogle();
        
        if (result.user) {
          mobileAuthUI.setState(MobileAuthState.SUCCESS);
          // Convert Capacitor user to Firebase user
          const firebaseUser = await auth.signInWithCredential(
            GoogleAuthProvider.credential(result.user.idToken)
          );
          return await handleSocialAuthUser(firebaseUser.user);
        } else {
          throw new Error('Google sign-in failed');
        }
      } else if (isMobileDevice()) {
        // Use existing redirect method for mobile web
        mobileAuthUI.setState(MobileAuthState.REDIRECTING);
        await signInWithRedirect(auth, this.provider);
        
        return new Promise((resolve, reject) => {
          const checkResult = async () => {
            try {
              const result = await getRedirectResult(auth);
              if (result && result.user) {
                mobileAuthUI.setState(MobileAuthState.SUCCESS);
                const profile = await handleSocialAuthUser(result.user);
                resolve(profile);
              } else {
                setTimeout(checkResult, 1000);
              }
            } catch (error) {
              mobileAuthUI.setState(MobileAuthState.ERROR);
              reject(error);
            }
          };
          
          setTimeout(checkResult, 500);
          
          setTimeout(() => {
            mobileAuthUI.handleAuthTimeout();
            reject(new Error('Authentication timeout'));
          }, 30000);
        });
      } else {
        // Use popup for desktop (fallback)
        const { signInWithGoogle } = await import('../api/auth');
        return await signInWithGoogle();
      }
    } catch (error: any) {
      mobileAuthUI.setState(MobileAuthState.ERROR);
      throw new Error(error.message || 'Google sign-in failed');
    }
  }
}

// Enhanced Facebook authentication with native support
export class MobileFacebookAuth {
  private provider: FacebookAuthProvider;

  constructor() {
    this.provider = new FacebookAuthProvider();
    this.setupProvider();
  }

  private setupProvider() {
    // Configure scopes
    this.provider.addScope('email');
    this.provider.addScope('public_profile');
  }

  async signIn(): Promise<UserProfile> {
    try {
      if (isNativePlatform()) {
        // Use native authentication for Capacitor apps
        mobileAuthUI.setState(MobileAuthState.AUTHENTICATING);
        
        // Sign in with Facebook using Capacitor Firebase plugin
        const result = await FirebaseAuthentication.signInWithFacebook();
        
        if (result.user) {
          mobileAuthUI.setState(MobileAuthState.SUCCESS);
          // Convert Capacitor user to Firebase user
          const firebaseUser = await auth.signInWithCredential(
            FacebookAuthProvider.credential(result.user.accessToken)
          );
          return await handleSocialAuthUser(firebaseUser.user);
        } else {
          throw new Error('Facebook sign-in failed');
        }
      } else if (isMobileDevice()) {
        // Use existing redirect method for mobile web
        mobileAuthUI.setState(MobileAuthState.REDIRECTING);
        await signInWithRedirect(auth, this.provider);
        
        return new Promise((resolve, reject) => {
          const checkResult = async () => {
            try {
              const result = await getRedirectResult(auth);
              if (result && result.user) {
                mobileAuthUI.setState(MobileAuthState.SUCCESS);
                const profile = await handleSocialAuthUser(result.user);
                resolve(profile);
              } else {
                setTimeout(checkResult, 1000);
              }
            } catch (error) {
              mobileAuthUI.setState(MobileAuthState.ERROR);
              reject(error);
            }
          };
          
          setTimeout(checkResult, 500);
          
          setTimeout(() => {
            mobileAuthUI.handleAuthTimeout();
            reject(new Error('Authentication timeout'));
          }, 30000);
        });
      } else {
        // Use popup for desktop (fallback)
        const { signInWithFacebook } = await import('../api/auth');
        return await signInWithFacebook();
      }
    } catch (error: any) {
      mobileAuthUI.setState(MobileAuthState.ERROR);
      throw new Error(error.message || 'Facebook sign-in failed');
    }
  }
}

// Unified mobile authentication manager
export class MobileAuthManager {
  private googleAuth: MobileGoogleAuth;
  private facebookAuth: MobileFacebookAuth;

  constructor() {
    this.googleAuth = new MobileGoogleAuth();
    this.facebookAuth = new MobileFacebookAuth();
  }

  async signInWithGoogle(): Promise<UserProfile> {
    return await this.googleAuth.signIn();
  }

  async signInWithFacebook(): Promise<UserProfile> {
    return await this.facebookAuth.signIn();
  }

  // Check for pending redirect results on app initialization
  async checkRedirectResult(): Promise<UserProfile | null> {
    try {
      const result = await getRedirectResult(auth);
      if (result && result.user) {
        return await handleSocialAuthUser(result.user);
      }
      return null;
    } catch (error) {
      console.error('Error checking redirect result:', error);
      return null;
    }
  }

  // Detect if device supports native authentication
  supportsNativeAuth(): boolean {
    return isNativePlatform() || (isMobileDevice() && (isIOS() || isAndroid()));
  }
}

// Export singleton instance
export const mobileAuthManager = new MobileAuthManager();
```

## Android Firebase Integration

### 1. Update Android Dependencies

In `android/build.gradle`, add the Google services classpath:

```gradle
buildscript {
    dependencies {
        classpath 'com.google.gms:google-services:4.3.15'
    }
}
```

In `android/app/build.gradle`, add at the bottom:

```gradle
apply plugin: 'com.google.gms.google-services'
```

### 2. Add Firebase SDK Dependencies

In `android/app/build.gradle` dependencies section:

```gradle
dependencies {
    implementation platform('com.google.firebase:firebase-bom:32.7.0')
    implementation 'com.google.firebase:firebase-auth'
    implementation 'com.google.android.gms:play-services-auth:20.7.0'
    implementation 'com.facebook.android:facebook-login:16.2.0'
}
```

### 3. Configure Facebook Login

In `android/app/src/main/res/values/strings.xml`:

```xml
<resources>
    <string name="facebook_app_id">YOUR_FACEBOOK_APP_ID</string>
    <string name="fb_login_protocol_scheme">fbYOUR_FACEBOOK_APP_ID</string>
    <string name="facebook_client_token">YOUR_FACEBOOK_CLIENT_TOKEN</string>
</resources>
```

In `android/app/src/main/AndroidManifest.xml`:

```xml
<application>
    <meta-data android:name="com.facebook.sdk.ApplicationId" android:value="@string/facebook_app_id"/>
    <meta-data android:name="com.facebook.sdk.ClientToken" android:value="@string/facebook_client_token"/>
    
    <activity android:name="com.facebook.FacebookActivity"
        android:configChanges=
                "keyboard|keyboardHidden|screenLayout|screenSize|orientation"
        android:label="@string/app_name" />
    <activity
        android:name="com.facebook.CustomTabActivity"
        android:exported="true">
        <intent-filter>
            <action android:name="android.intent.action.VIEW" />
            <category android:name="android.intent.category.DEFAULT" />
            <category android:name="android.intent.category.BROWSABLE" />
            <data android:scheme="@string/fb_login_protocol_scheme" />
        </intent-filter>
    </activity>
</application>
```

## iOS Firebase Integration

### 1. Update Podfile

In `ios/App/Podfile`, ensure Firebase pods are included:

```ruby
pod 'Firebase/Auth', '~> 10.18.0'
pod 'GoogleSignIn', '~> 7.0'
pod 'FBSDKLoginKit', '~> 16.2.0'
```

### 2. Configure Google Sign-In

In `ios/App/AppDelegate.swift`:

```swift
import UIKit
import Capacitor
import FirebaseCore
import GoogleSignIn

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        FirebaseApp.configure()
        return true
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        if GIDSignIn.sharedInstance.handle(url) {
            return true
        }
        
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }
}
```

### 3. Configure Facebook Login

In `ios/App/AppDelegate.swift`:

```swift
import FBSDKCoreKit

func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
    FirebaseApp.configure()
    ApplicationDelegateProxy.shared.application(
        application,
        didFinishLaunchingWithOptions: launchOptions
    )
    
    return true
}
```

Update `ios/App/Info.plist`:

```xml
<key>CFBundleURLTypes</key>
<array>
  <dict>
    <key>CFBundleURLName</key>
    <string>com.incredibleindia.travel</string>
    <key>CFBundleURLSchemes</key>
    <array>
      <string>com.googleusercontent.apps.YOUR_GOOGLE_CLIENT_ID</string>
      <string>fbYOUR_FACEBOOK_APP_ID</string>
    </array>
  </dict>
</array>
<key>FacebookAppID</key>
<string>YOUR_FACEBOOK_APP_ID</string>
<key>FacebookClientToken</key>
<string>YOUR_FACEBOOK_CLIENT_TOKEN</string>
<key>FacebookDisplayName</key>
<string>Incredible India Travel</string>
```

## Testing and Deployment

### 1. Testing Native Authentication

To test the native authentication:

1. Build your web app:
   ```bash
   npm run build
   ```

2. Sync with Capacitor:
   ```bash
   npx cap sync
   ```

3. Open platform project:
   ```bash
   npx cap open android
   # or
   npx cap open ios
   ```

4. Run on device or emulator

### 2. Debugging Authentication Flow

Add logging to monitor authentication states:

```typescript
// In mobileAuth.ts
FirebaseAuthentication.addListener('authStateChange', (change) => {
  console.log('Auth state changed', change);
});
```

### 3. Handling Authentication Errors

Implement proper error handling for different authentication scenarios:

```typescript
try {
  const user = await mobileAuthManager.signInWithGoogle();
  // Handle successful authentication
} catch (error) {
  if (error.code === 'auth/popup-blocked') {
    // Handle popup blocked error
  } else if (error.code === 'auth/cancelled-popup-request') {
    // Handle cancelled authentication
  } else {
    // Handle other errors
  }
}
```

## Performance Considerations

1. **Lazy Loading**: Load Capacitor plugins only when needed
2. **Bundle Size**: Capacitor plugins add to the app size, optimize accordingly
3. **Network Handling**: Implement proper offline handling for authentication
4. **Security**: Store sensitive tokens securely using Capacitor's secure storage

## Security Considerations

1. **Token Storage**: Use secure storage for authentication tokens
2. **Deep Linking**: Validate all authentication callbacks
3. **Certificate Pinning**: Implement for production apps
4. **App Signing**: Use proper signing keys for app distribution

## Maintenance and Updates

1. **Plugin Updates**: Regularly update Capacitor plugins
2. **Firebase SDK**: Keep Firebase SDKs up to date
3. **Platform Updates**: Monitor Android/iOS platform changes
4. **Backward Compatibility**: Test with older platform versions