import type { VideoPlayerTheme } from '../types/videoPlayer';

// Default Enhanced Video Player Theme
export const defaultVideoPlayerTheme: VideoPlayerTheme = {
  colors: {
    primary: '#FF6B35',
    secondary: '#2C5F6C', 
    accent: '#F7931E',
    background: 'rgba(0, 0, 0, 0.8)',
    overlay: 'rgba(255, 255, 255, 0.1)',
    text: '#FFFFFF',
    textSecondary: '#E5E7EB',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
  },
  spacing: {
    controls: '16px',
    margins: '24px',
    padding: '12px',
    controlHeight: '48px',
  },
  animations: {
    duration: '300ms',
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    fadeIn: 'fadeIn 300ms ease-out',
    slideUp: 'slideUp 300ms ease-out',
  },
  glassMorphism: {
    backdropFilter: 'blur(20px)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '12px',
  },
  shadows: {
    small: '0 2px 4px rgba(0, 0, 0, 0.1)',
    medium: '0 4px 12px rgba(0, 0, 0, 0.15)',
    large: '0 8px 24px rgba(0, 0, 0, 0.2)',
  },
};

// CSS Variables for Dynamic Theming
export const generateCSSVariables = (theme: VideoPlayerTheme): string => {
  return `
    --vp-color-primary: ${theme.colors.primary};
    --vp-color-secondary: ${theme.colors.secondary};
    --vp-color-accent: ${theme.colors.accent};
    --vp-color-background: ${theme.colors.background};
    --vp-color-overlay: ${theme.colors.overlay};
    --vp-color-text: ${theme.colors.text};
    --vp-color-text-secondary: ${theme.colors.textSecondary};
    --vp-color-success: ${theme.colors.success};
    --vp-color-warning: ${theme.colors.warning};
    --vp-color-error: ${theme.colors.error};
    
    --vp-spacing-controls: ${theme.spacing.controls};
    --vp-spacing-margins: ${theme.spacing.margins};
    --vp-spacing-padding: ${theme.spacing.padding};
    --vp-spacing-control-height: ${theme.spacing.controlHeight};
    
    --vp-animation-duration: ${theme.animations.duration};
    --vp-animation-easing: ${theme.animations.easing};
    
    --vp-glass-backdrop-filter: ${theme.glassMorphism.backdropFilter};
    --vp-glass-background: ${theme.glassMorphism.backgroundColor};
    --vp-glass-border: ${theme.glassMorphism.border};
    --vp-glass-border-radius: ${theme.glassMorphism.borderRadius};
    
    --vp-shadow-small: ${theme.shadows.small};
    --vp-shadow-medium: ${theme.shadows.medium};
    --vp-shadow-large: ${theme.shadows.large};
  `;
};

// Framer Motion Variants
export const videoPlayerAnimations = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.3 },
  },
  slideUp: {
    initial: { y: 20, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: 20, opacity: 0 },
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
  },
  slideDown: {
    initial: { y: -20, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: -20, opacity: 0 },
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
  },
  scaleIn: {
    initial: { scale: 0.8, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.8, opacity: 0 },
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
  },
  slideLeft: {
    initial: { x: -20, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: -20, opacity: 0 },
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
  },
  slideRight: {
    initial: { x: 20, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: 20, opacity: 0 },
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
  },
  progressBar: {
    initial: { scaleX: 0 },
    animate: { scaleX: 1 },
    transition: { duration: 0.2, ease: 'easeOut' },
  },
  button: {
    whileHover: { scale: 1.05 },
    whileTap: { scale: 0.95 },
    transition: { duration: 0.2 },
  },
  controlPanel: {
    initial: { y: '100%', opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: '100%', opacity: 0 },
    transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
  },
  overlay: {
    initial: { opacity: 0, backdropFilter: 'blur(0px)' },
    animate: { opacity: 1, backdropFilter: 'blur(20px)' },
    exit: { opacity: 0, backdropFilter: 'blur(0px)' },
    transition: { duration: 0.3 },
  },
};

// CSS Utility Classes
export const videoPlayerClasses = {
  // Base container
  container: 'relative w-full h-full bg-black rounded-lg overflow-hidden',
  
  // Glass morphism
  glass: 'backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl',
  
  // Control elements
  controlButton: `
    inline-flex items-center justify-center
    w-10 h-10 rounded-lg
    bg-white/10 backdrop-blur-sm
    border border-white/20
    text-white hover:bg-white/20
    transition-all duration-200 ease-out
    focus:outline-none focus:ring-2 focus:ring-orange-500/50
    disabled:opacity-50 disabled:cursor-not-allowed
  `,
  
  controlButtonLarge: `
    inline-flex items-center justify-center
    w-12 h-12 rounded-xl
    bg-white/10 backdrop-blur-sm
    border border-white/20
    text-white hover:bg-white/20
    transition-all duration-200 ease-out
    focus:outline-none focus:ring-2 focus:ring-orange-500/50
    disabled:opacity-50 disabled:cursor-not-allowed
  `,
  
  primaryButton: `
    inline-flex items-center justify-center
    px-4 py-2 rounded-lg
    bg-gradient-to-r from-orange-500 to-orange-600
    hover:from-orange-600 hover:to-orange-700
    text-white font-medium
    transition-all duration-200 ease-out
    focus:outline-none focus:ring-2 focus:ring-orange-500/50
    disabled:opacity-50 disabled:cursor-not-allowed
  `,
  
  // Progress bar
  progressContainer: 'relative w-full h-2 bg-white/20 rounded-full overflow-hidden',
  progressBar: 'absolute left-0 top-0 h-full bg-gradient-to-r from-orange-500 to-orange-600 rounded-full transition-all duration-200',
  progressThumb: 'absolute top-1/2 transform -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg cursor-pointer',
  
  // Text styles
  title: 'text-lg font-semibold text-white truncate',
  subtitle: 'text-sm text-gray-300 truncate',
  caption: 'text-xs text-gray-400',
  
  // Loading states
  spinner: 'w-8 h-8 border-3 border-white/30 border-t-white rounded-full animate-spin',
  skeleton: 'animate-pulse bg-gray-300 rounded',
  
  // Error states
  errorContainer: 'flex flex-col items-center justify-center p-6 text-center',
  errorIcon: 'w-12 h-12 text-red-400 mb-3',
  errorTitle: 'text-lg font-semibold text-white mb-2',
  errorMessage: 'text-sm text-gray-300 mb-4',
  
  // Overlay
  overlay: 'absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40',
  centerOverlay: 'absolute inset-0 flex items-center justify-center',
  
  // Mobile specific
  mobileControls: 'fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent',
  touchTarget: 'min-w-[44px] min-h-[44px]', // Accessibility-compliant touch targets
};

// Responsive breakpoints for video player
export const videoPlayerBreakpoints = {
  mobile: '(max-width: 767px)',
  tablet: '(min-width: 768px) and (max-width: 1023px)',
  desktop: '(min-width: 1024px)',
  largeDesktop: '(min-width: 1440px)',
};

// Device detection utilities
export const getDeviceType = (): 'mobile' | 'tablet' | 'desktop' => {
  if (typeof window === 'undefined') return 'desktop';
  
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
};

export const isTouchDevice = (): boolean => {
  return typeof window !== 'undefined' && 
    ('ontouchstart' in window || navigator.maxTouchPoints > 0);
};

export const supportsHover = (): boolean => {
  return typeof window !== 'undefined' && 
    window.matchMedia('(hover: hover)').matches;
};