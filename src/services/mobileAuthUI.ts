// Mobile Authentication UI Manager
import React from 'react';

// Mobile device detection utilities
export const isMobileDevice = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

export const isIOS = (): boolean => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
};

export const isAndroid = (): boolean => {
  return /Android/.test(navigator.userAgent);
};

export enum MobileAuthState {
  IDLE = 'idle',
  AUTHENTICATING = 'authenticating',
  REDIRECTING = 'redirecting',
  SUCCESS = 'success',
  ERROR = 'error'
}

export class MobileAuthUI {
  private static instance: MobileAuthUI;
  private currentState: MobileAuthState = MobileAuthState.IDLE;
  private stateChangeListeners: ((state: MobileAuthState) => void)[] = [];

  static getInstance(): MobileAuthUI {
    if (!MobileAuthUI.instance) {
      MobileAuthUI.instance = new MobileAuthUI();
    }
    return MobileAuthUI.instance;
  }

  getCurrentState(): MobileAuthState {
    return this.currentState;
  }

  setState(newState: MobileAuthState): void {
    this.currentState = newState;
    this.stateChangeListeners.forEach(listener => listener(newState));
  }

  onStateChange(listener: (state: MobileAuthState) => void): () => void {
    this.stateChangeListeners.push(listener);
    return () => {
      const index = this.stateChangeListeners.indexOf(listener);
      if (index > -1) {
        this.stateChangeListeners.splice(index, 1);
      }
    };
  }

  // Show authentication loading state
  showAuthenticating(provider: 'google' | 'facebook'): void {
    this.setState(MobileAuthState.AUTHENTICATING);
    this.hideMessages();
    
    const message = this.createMessage(`Signing in with ${provider}...`);
    document.body.appendChild(message);
    
    setTimeout(() => {
      if (message.parentNode) {
        message.parentNode.removeChild(message);
      }
    }, 3000);
  }

  // Show redirect state
  showRedirecting(provider: 'google' | 'facebook'): void {
    this.setState(MobileAuthState.REDIRECTING);
    this.hideMessages();
    
    const message = this.createMessage(this.getAuthInstructions(provider));
    document.body.appendChild(message);
  }

  // Show success state
  showSuccess(): void {
    this.setState(MobileAuthState.SUCCESS);
    this.hideMessages();
    
    const message = this.createMessage('Successfully signed in!', 'success');
    document.body.appendChild(message);
    
    setTimeout(() => {
      if (message.parentNode) {
        message.parentNode.removeChild(message);
      }
      this.setState(MobileAuthState.IDLE);
    }, 2000);
  }

  // Show error state
  showError(error: string): void {
    this.setState(MobileAuthState.ERROR);
    this.hideMessages();
    
    const message = this.createMessage(error, 'info');
    message.className = message.className.replace('bg-blue-500', 'bg-red-500');
    document.body.appendChild(message);
    
    setTimeout(() => {
      if (message.parentNode) {
        message.parentNode.removeChild(message);
      }
      this.setState(MobileAuthState.IDLE);
    }, 5000);
  }

  // Hide all messages
  private hideMessages(): void {
    const messages = document.querySelectorAll('.mobile-auth-message');
    messages.forEach(message => {
      if (message.parentNode) {
        message.parentNode.removeChild(message);
      }
    });
  }

  // Create message element
  private createMessage(text: string, type: 'info' | 'success' = 'info'): HTMLElement {
    const message = document.createElement('div');
    message.className = `mobile-auth-message fixed top-4 left-1/2 transform -translate-x-1/2 z-[9999] px-6 py-3 rounded-lg shadow-lg max-w-sm text-center text-sm font-medium`;
    
    if (type === 'success') {
      message.className += ' bg-green-500 text-white';
    } else {
      message.className += ' bg-blue-500 text-white';
    }
    
    message.textContent = text;
    return message;
  }

  // Detect if native authentication is supported
  isNativeAuthSupported(): boolean {
    return isMobileDevice() && (this.isGoogleNativeSupported() || this.isFacebookNativeSupported());
  }

  // Check if Google native authentication is supported
  private isGoogleNativeSupported(): boolean {
    if (isIOS()) {
      return true; // Firebase handles iOS native auth
    }
    
    if (isAndroid()) {
      return true; // Firebase handles Android native auth
    }
    
    return false;
  }

  // Check if Facebook native authentication is supported
  private isFacebookNativeSupported(): boolean {
    if (isIOS()) {
      return true; // Firebase handles iOS native auth
    }
    
    if (isAndroid()) {
      return true; // Firebase handles Android native auth
    }
    
    return false;
  }

  // Get platform-specific authentication instructions
  getAuthInstructions(provider: 'google' | 'facebook'): string {
    switch (provider) {
      case 'google':
        if (isIOS()) {
          return 'You will be redirected to the Google app or Safari for authentication.';
        } else if (isAndroid()) {
          return 'You will be redirected to the Google app for authentication.';
        }
        return 'You will be redirected to Google for authentication.';
        
      case 'facebook':
        if (isIOS()) {
          return 'You will be redirected to the Facebook app or Safari for authentication.';
        } else if (isAndroid()) {
          return 'You will be redirected to the Facebook app for authentication.';
        }
        return 'You will be redirected to Facebook for authentication.';
        
      default:
        return 'You will be redirected for authentication.';
    }
  }

  // Handle authentication timeout
  handleAuthTimeout(): void {
    this.setState(MobileAuthState.ERROR);
    const message = this.createMessage('Authentication timed out. Please try again.', 'info');
    message.className = message.className.replace('bg-blue-500', 'bg-red-500');
    document.body.appendChild(message);
    
    setTimeout(() => {
      if (message.parentNode) {
        message.parentNode.removeChild(message);
      }
    }, 4000);
  }
}

// Export singleton instance
export const mobileAuthUI = MobileAuthUI.getInstance();

// Utility functions
export const getMobileAuthMessage = (provider: 'google' | 'facebook'): string => {
  return mobileAuthUI.getAuthInstructions(provider);
};

export const isNativeAuthAvailable = (): boolean => {
  return mobileAuthUI.isNativeAuthSupported();
};

// React hook for mobile auth state
export const useMobileAuthState = () => {
  const [state, setState] = React.useState<MobileAuthState>(mobileAuthUI.getCurrentState());
  
  React.useEffect(() => {
    const unsubscribe = mobileAuthUI.onStateChange(setState);
    return unsubscribe;
  }, []);
  
  return {
    state,
    isAuthenticating: state === MobileAuthState.AUTHENTICATING || state === MobileAuthState.REDIRECTING,
    isSuccess: state === MobileAuthState.SUCCESS,
    isError: state === MobileAuthState.ERROR
  };
};