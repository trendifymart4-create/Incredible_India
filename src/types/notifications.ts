// Notification system type definitions
import { Timestamp } from 'firebase/firestore';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'destination' | 'vr_tour' | 'announcement' | 'system';
  category: 'new_content' | 'update' | 'promotion' | 'maintenance';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  targetAudience: 'all' | 'premium' | 'specific';
  targetUserIds?: string[];
  relatedContentId?: string;
  relatedContentType?: 'destination' | 'video' | 'tour';
  createdAt: Timestamp;
  expiresAt?: Timestamp;
  adminId: string;
  metadata: NotificationMetadata;
}

export interface NotificationMetadata {
  actionUrl?: string;
  imageUrl?: string;
  customData?: Record<string, any>;
}

export interface UserNotification {
  id: string;
  userId: string;
  notificationId: string;
  isRead: boolean;
  readAt?: Timestamp;
  receivedAt: Timestamp;
  clickedAt?: Timestamp;
  dismissed: boolean;
  dismissedAt?: Timestamp;
}

export interface AnnouncementTemplate {
  id: string;
  type: 'destination' | 'vr_tour';
  titleTemplate: string;
  messageTemplate: string;
  isActive: boolean;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export interface DeviceToken {
  id: string;
  userId: string;
  token: string;
  platform: 'web' | 'android' | 'ios';
  isActive: boolean;
  lastUsed: Timestamp;
  createdAt: Timestamp;
}

export interface VRAnalytics {
  id: string;
  userId: string;
  destinationId: string;
  videoId?: string;
  sessionId: string;
  metrics: VRMetrics;
  interactions: VRInteraction[];
  createdAt: Timestamp;
}

export interface VRMetrics {
  viewDuration: number; // in seconds
  completionPercentage: number;
  qualityLevel: 'auto' | '720p' | '1080p' | '1440p' | '4k';
  deviceType: 'mobile' | 'tablet' | 'desktop';
  networkSpeed?: string;
  batteryLevel?: number;
  orientation: 'portrait' | 'landscape';
}

export interface VRInteraction {
  type: 'play' | 'pause' | 'seek' | 'fullscreen' | 'quality_change' | 'gesture' | 'touch';
  timestamp: number;
  data?: Record<string, any>;
}

// Input types for creating notifications
export interface CreateNotificationData {
  title: string;
  message: string;
  type: 'destination' | 'vr_tour' | 'announcement' | 'system';
  category: 'new_content' | 'update' | 'promotion' | 'maintenance';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  targetAudience: 'all' | 'premium' | 'specific';
  targetUserIds?: string[];
  relatedContentId?: string;
  relatedContentType?: 'destination' | 'video' | 'tour';
  expiresAt?: Date;
  metadata?: NotificationMetadata;
}

export interface CustomAnnouncement {
  title: string;
  message: string;
  category: 'new_content' | 'update' | 'promotion' | 'maintenance';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  targetAudience: 'all' | 'premium' | 'specific';
  targetUserIds?: string[];
  expiresAt?: Date;
  metadata?: NotificationMetadata;
}

export interface ScheduledAnnouncement extends CustomAnnouncement {
  scheduleTime: Date;
}

// Notification filters and query types
export interface NotificationFilters {
  type?: 'destination' | 'vr_tour' | 'announcement' | 'system';
  category?: 'new_content' | 'update' | 'promotion' | 'maintenance';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  isRead?: boolean;
  limit?: number;
  startAfter?: Timestamp;
}

// Analytics and reporting types
export interface NotificationMetrics {
  totalSent: number;
  totalDelivered: number;
  totalRead: number;
  totalClicked: number;
  deliveryRate: number;
  readRate: number;
  clickRate: number;
  topPerformingNotifications: Notification[];
}

export interface UserEngagementStats {
  activeUsers: number;
  averageReadTime: number;
  topCategories: { category: string; count: number }[];
  engagementByHour: { hour: number; engagement: number }[];
}

export interface DeliveryReport {
  notificationId: string;
  totalTargeted: number;
  delivered: number;
  failed: number;
  pending: number;
  deliveryRate: number;
  createdAt: Timestamp;
}

// Mobile VR enhancement types
export interface MobileVRState {
  destination: any; // Will use Destination type from existing codebase
  videos: any[]; // Will use Video type from existing codebase
  currentVideoIndex: number;
  isFullscreen: boolean;
  isLandscape: boolean;
  isPlaying: boolean;
  volume: number;
  quality: 'auto' | '720p' | '1080p' | '1440p' | '4k';
  isLoading: boolean;
  error: string | null;
}

export interface TouchGestureHandler {
  onTap: () => void;
  onDoubleTap: () => void;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onSwipeUp: () => void;
  onSwipeDown: () => void;
  onPinch: (scale: number) => void;
  onRotate: (angle: number) => void;
}

export interface HapticFeedbackController {
  light: () => void;
  medium: () => void;
  heavy: () => void;
  selection: () => void;
  impact: (intensity: 'light' | 'medium' | 'heavy') => void;
  notification: (type: 'success' | 'warning' | 'error') => void;
}

export interface DeviceOptimizations {
  adaptVideoQuality: (networkSpeed: string, deviceCapabilities: any) => string;
  preloadContent: (priority: string[]) => Promise<void>;
  optimizeBatteryUsage: (vrSession: any) => void;
  enableHapticFeedback: (interaction: VRInteraction) => void;
  adaptUIForOrientation: (orientation: string) => void;
  optimizeForScreenSize: (screenDimensions: { width: number; height: number }) => void;
}

export interface OrientationLockController {
  lockLandscape: () => Promise<void>;
  lockPortrait: () => Promise<void>;
  unlock: () => Promise<void>;
  getCurrentOrientation: () => string;
  onOrientationChange: (callback: (orientation: string) => void) => () => void;
}

// PWA notification types
export interface PWANotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  renotify?: boolean;
  requireInteraction?: boolean;
  silent?: boolean;
  vibrate?: number[];
  timestamp?: number;
  actions?: NotificationAction[];
  data?: any;
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

// Event types for notification system
export type NotificationEvent = 
  | { type: 'NOTIFICATION_RECEIVED'; payload: Notification }
  | { type: 'NOTIFICATION_READ'; payload: { notificationId: string; userId: string } }
  | { type: 'NOTIFICATION_CLICKED'; payload: { notificationId: string; userId: string } }
  | { type: 'NOTIFICATION_DISMISSED'; payload: { notificationId: string; userId: string } }
  | { type: 'PUSH_SUBSCRIPTION_UPDATED'; payload: { userId: string; subscription: PushSubscription } };

// Mobile VR event types
export type VREvent =
  | { type: 'VR_SESSION_STARTED'; payload: { destinationId: string; videoId: string; sessionId: string } }
  | { type: 'VR_SESSION_ENDED'; payload: { sessionId: string; duration: number } }
  | { type: 'VR_INTERACTION'; payload: { sessionId: string; interaction: VRInteraction } }
  | { type: 'VR_QUALITY_CHANGED'; payload: { sessionId: string; quality: string } }
  | { type: 'VR_ERROR'; payload: { sessionId: string; error: string } };