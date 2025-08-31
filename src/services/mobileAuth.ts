// Mobile-specific authentication service for native Google and Facebook sign-in
import { 
  GoogleAuthProvider, 
  FacebookAuthProvider, 
  signInWithRedirect, 
  getRedirectResult,
  Auth
} from 'firebase/auth';
import { auth } from '../firebase';
import { UserProfile, handleSocialAuthUser } from '../api/auth';
import { isMobileDevice, isIOS, isAndroid } from '../utils/deviceDetection';
import { mobileAuthUI, MobileAuthState } from './mobileAuthUI';

// Capacitor plugin access for v7+
// In Capacitor v7+, we access plugins through the global registry
let NativeAuth: any = null;

// Try to access the NativeAuth plugin if we're in a native environment
const initializeNativeAuth = async () => {
  try {
    // Check if we're in a Capacitor environment
    const isCapacitor = (window as any).Capacitor && (window as any).Capacitor.isNativePlatform && (window as any).Capacitor.isNativePlatform();
    
    if (isCapacitor) {
      // In Capacitor v7+, plugins are accessed through the Plugins registry
      const plugins = (window as any).Capacitor.Plugins;
      if (plugins && plugins.NativeAuth) {
        NativeAuth = plugins.NativeAuth;
        return;
      }
    }
  } catch (error) {
    console.log('Error initializing NativeAuth plugin', error);
  }
};

// Initialize the plugin when the module loads
initializeNativeAuth().catch(err => {
  console.log('Error during NativeAuth initialization', err);
});

// Enhanced Google authentication for mobile
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

    // Mobile-specific configuration
    if (isMobileDevice()) {
      // Set custom parameters for better mobile experience
      this.provider.setCustomParameters({
        // Prompt for account selection on mobile
        prompt: 'select_account',
        // Use mobile-optimized flow
        display: 'popup'
      });

      // iOS specific optimizations
      if (isIOS()) {
        this.provider.setCustomParameters({
          ...this.provider.getCustomParameters(),
          // Enable native iOS Google Sign-In if available
          include_granted_scopes: 'true'
        });
      }

      // Android specific optimizations
      if (isAndroid()) {
        this.provider.setCustomParameters({
          ...this.provider.getCustomParameters(),
          // Android specific settings for better UX
          access_type: 'online'
        });
      }
    }
  }

  async signIn(): Promise<UserProfile> {
    try {
      if (isMobileDevice()) {
        // Use native authentication for Capacitor apps
        if (typeof NativeAuth !== 'undefined') {
          try {
            // Set UI state to authenticating
            mobileAuthUI.setState(MobileAuthState.AUTHENTICATING);
            
            // Use native authentication
            const result = await NativeAuth.signInWithGoogle();
            
            // Convert native result to Firebase user object
            const firebaseUser = {
              uid: result.uid,
              email: result.email,
              displayName: result.displayName,
              photoURL: result.photoURL
            };
            
            mobileAuthUI.setState(MobileAuthState.SUCCESS);
            const profile = await handleSocialAuthUser(firebaseUser as any);
            return profile;
          } catch (nativeError) {
            console.log('Native authentication failed, falling back to web redirect');
          }
        }
        
        // Fallback to web redirect method
        // Set UI state to redirecting
        mobileAuthUI.setState(MobileAuthState.REDIRECTING);
        
        // Use redirect method for mobile devices to trigger native authentication
        await signInWithRedirect(auth, this.provider);
        
        // Set UI state to authenticating
        mobileAuthUI.setState(MobileAuthState.AUTHENTICATING);
        
        // Return a promise that resolves when the redirect completes
        return new Promise((resolve, reject) => {
          const checkResult = async () => {
            try {
              const result = await getRedirectResult(auth);
              if (result && result.user) {
                mobileAuthUI.setState(MobileAuthState.SUCCESS);
                const profile = await handleSocialAuthUser(result.user);
                resolve(profile);
              } else {
                // Check again after a short delay
                setTimeout(checkResult, 1000);
              }
            } catch (error) {
              mobileAuthUI.setState(MobileAuthState.ERROR);
              reject(error);
            }
          };
          
          // Start checking for result
          setTimeout(checkResult, 500);
          
          // Timeout after 30 seconds
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

// Enhanced Facebook authentication for mobile
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

    // Mobile-specific configuration
    if (isMobileDevice()) {
      this.provider.setCustomParameters({
        // Use mobile-optimized display
        display: 'touch',
        // Force re-authentication to ensure fresh consent
        auth_type: 'rerequest'
      });

      // iOS specific settings
      if (isIOS()) {
        this.provider.setCustomParameters({
          ...this.provider.getCustomParameters(),
          // iOS Safari optimizations
          redirect_uri: window.location.origin
        });
      }
    }
  }

  async signIn(): Promise<UserProfile> {
    try {
      if (isMobileDevice()) {
        // Use native authentication for Capacitor apps
        if (typeof NativeAuth !== 'undefined') {
          try {
            // Set UI state to authenticating
            mobileAuthUI.setState(MobileAuthState.AUTHENTICATING);
            
            // Use native authentication
            const result = await NativeAuth.signInWithFacebook();
            
            // Convert native result to Firebase user object
            const firebaseUser = {
              uid: result.uid,
              email: result.email,
              displayName: result.displayName,
              photoURL: result.photoURL
            };
            
            mobileAuthUI.setState(MobileAuthState.SUCCESS);
            const profile = await handleSocialAuthUser(firebaseUser as any);
            return profile;
          } catch (nativeError) {
            console.log('Native authentication failed, falling back to web redirect');
          }
        }
        
        // Fallback to web redirect method
        // Set UI state to redirecting
        mobileAuthUI.setState(MobileAuthState.REDIRECTING);
        
        // Use redirect method for mobile devices to trigger native authentication
        await signInWithRedirect(auth, this.provider);
        
        // Set UI state to authenticating
        mobileAuthUI.setState(MobileAuthState.AUTHENTICATING);
        
        // Return a promise that resolves when the redirect completes
        return new Promise((resolve, reject) => {
          const checkResult = async () => {
            try {
              const result = await getRedirectResult(auth);
              if (result && result.user) {
                mobileAuthUI.setState(MobileAuthState.SUCCESS);
                const profile = await handleSocialAuthUser(result.user);
                resolve(profile);
              } else {
                // Check again after a short delay
                setTimeout(checkResult, 1000);
              }
            } catch (error) {
              mobileAuthUI.setState(MobileAuthState.ERROR);
              reject(error);
            }
          };
          
          // Start checking for result
          setTimeout(checkResult, 500);
          
          // Timeout after 30 seconds
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
    return isMobileDevice() && (isIOS() || isAndroid());
  }
}

// Export singleton instance
export const mobileAuthManager = new MobileAuthManager();