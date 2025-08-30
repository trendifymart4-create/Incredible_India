// Firebase Notification Service
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  writeBatch,
  startAfter
} from 'firebase/firestore';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { db } from '../firebase';
import {
  Notification,
  UserNotification,
  CreateNotificationData,
  NotificationFilters,
  DeviceToken,
  AnnouncementTemplate,
  CustomAnnouncement,
  VRAnalytics,
  VRMetrics,
  VRInteraction,
  NotificationEvent
} from '../types/notifications';

export class NotificationService {
  private static instance: NotificationService;
  private messaging: any = null;
  private eventListeners: ((event: NotificationEvent) => void)[] = [];

  private constructor() {
    this.initializeMessaging();
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  private async initializeMessaging() {
    try {
      if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
        this.messaging = getMessaging();
      }
    } catch (error) {
      console.error('Failed to initialize Firebase Messaging:', error);
    }
  }

  // Event system for notification handling
  addEventListener(listener: (event: NotificationEvent) => void): () => void {
    this.eventListeners.push(listener);
    return () => {
      const index = this.eventListeners.indexOf(listener);
      if (index > -1) {
        this.eventListeners.splice(index, 1);
      }
    };
  }

  private emitEvent(event: NotificationEvent): void {
    this.eventListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in notification event listener:', error);
      }
    });
  }

  // Core notification management
  async createNotification(
    notificationData: CreateNotificationData,
    adminId: string
  ): Promise<string> {
    try {
      const notification: Omit<Notification, 'id'> = {
        ...notificationData,
        adminId,
        createdAt: serverTimestamp() as Timestamp,
        expiresAt: notificationData.expiresAt 
          ? Timestamp.fromDate(notificationData.expiresAt)
          : undefined,
        metadata: notificationData.metadata || {}
      };

      const docRef = await addDoc(collection(db, 'notifications'), notification);
      
      // Create user notifications for targeted users
      await this.createUserNotifications(docRef.id, notificationData.targetAudience, notificationData.targetUserIds);

      // Emit event
      this.emitEvent({
        type: 'NOTIFICATION_RECEIVED',
        payload: { ...notification, id: docRef.id } as Notification
      });

      return docRef.id;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw new Error('Failed to create notification');
    }
  }

  private async createUserNotifications(
    notificationId: string,
    targetAudience: 'all' | 'premium' | 'specific',
    targetUserIds?: string[]
  ): Promise<void> {
    const batch = writeBatch(db);
    let userIds: string[] = [];

    if (targetAudience === 'all') {
      // Get all active users
      const usersQuery = query(collection(db, 'users'));
      const usersSnapshot = await getDocs(usersQuery);
      userIds = usersSnapshot.docs.map(doc => doc.id);
    } else if (targetAudience === 'premium') {
      // Get premium users only
      const usersQuery = query(
        collection(db, 'users'),
        where('subscription', '==', 'premium')
      );
      const usersSnapshot = await getDocs(usersQuery);
      userIds = usersSnapshot.docs.map(doc => doc.id);
    } else if (targetAudience === 'specific' && targetUserIds) {
      userIds = targetUserIds;
    }

    // Create user notification documents
    userIds.forEach(userId => {
      const userNotificationRef = doc(collection(db, 'userNotifications'));
      const userNotification: Omit<UserNotification, 'id'> = {
        userId,
        notificationId,
        isRead: false,
        receivedAt: serverTimestamp() as Timestamp,
        dismissed: false
      };
      batch.set(userNotificationRef, userNotification);
    });

    await batch.commit();
  }

  // Get notifications for a specific user
  async getUserNotifications(
    userId: string, 
    filters?: NotificationFilters
  ): Promise<Notification[]> {
    try {
      // Get user notifications first
      let userNotifQuery = query(
        collection(db, 'userNotifications'),
        where('userId', '==', userId),
        where('dismissed', '==', false),
        orderBy('receivedAt', 'desc')
      );

      if (filters?.limit) {
        userNotifQuery = query(userNotifQuery, limit(filters.limit));
      }

      const userNotifSnapshot = await getDocs(userNotifQuery);
      const userNotifications = userNotifSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as UserNotification[];

      // Get full notification details
      const notifications: Notification[] = [];
      
      for (const userNotif of userNotifications) {
        const notifDoc = await getDoc(doc(db, 'notifications', userNotif.notificationId));
        if (notifDoc.exists()) {
          const notificationData = notifDoc.data() as Omit<Notification, 'id'>;
          
          // Apply filters
          if (filters?.type && notificationData.type !== filters.type) continue;
          if (filters?.category && notificationData.category !== filters.category) continue;
          if (filters?.priority && notificationData.priority !== filters.priority) continue;
          if (filters?.isRead !== undefined && userNotif.isRead !== filters.isRead) continue;

          notifications.push({
            ...notificationData,
            id: notifDoc.id,
            isRead: userNotif.isRead
          } as Notification & { isRead: boolean });
        }
      }

      return notifications;
    } catch (error) {
      console.error('Error getting user notifications:', error);
      throw new Error('Failed to get user notifications');
    }
  }

  // Mark notification as read
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    try {
      const userNotifQuery = query(
        collection(db, 'userNotifications'),
        where('notificationId', '==', notificationId),
        where('userId', '==', userId)
      );

      const userNotifSnapshot = await getDocs(userNotifQuery);
      
      if (!userNotifSnapshot.empty) {
        const userNotifDoc = userNotifSnapshot.docs[0];
        await updateDoc(userNotifDoc.ref, {
          isRead: true,
          readAt: serverTimestamp()
        });

        // Emit event
        this.emitEvent({
          type: 'NOTIFICATION_READ',
          payload: { notificationId, userId }
        });
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw new Error('Failed to mark notification as read');
    }
  }

  // Mark all notifications as read for a user
  async markAllAsRead(userId: string): Promise<void> {
    try {
      const userNotifQuery = query(
        collection(db, 'userNotifications'),
        where('userId', '==', userId),
        where('isRead', '==', false)
      );

      const userNotifSnapshot = await getDocs(userNotifQuery);
      const batch = writeBatch(db);

      userNotifSnapshot.docs.forEach(doc => {
        batch.update(doc.ref, {
          isRead: true,
          readAt: serverTimestamp()
        });
      });

      await batch.commit();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw new Error('Failed to mark all notifications as read');
    }
  }

  // Dismiss notification
  async dismissNotification(notificationId: string, userId: string): Promise<void> {
    try {
      const userNotifQuery = query(
        collection(db, 'userNotifications'),
        where('notificationId', '==', notificationId),
        where('userId', '==', userId)
      );

      const userNotifSnapshot = await getDocs(userNotifQuery);
      
      if (!userNotifSnapshot.empty) {
        const userNotifDoc = userNotifSnapshot.docs[0];
        await updateDoc(userNotifDoc.ref, {
          dismissed: true,
          dismissedAt: serverTimestamp()
        });

        // Emit event
        this.emitEvent({
          type: 'NOTIFICATION_DISMISSED',
          payload: { notificationId, userId }
        });
      }
    } catch (error) {
      console.error('Error dismissing notification:', error);
      throw new Error('Failed to dismiss notification');
    }
  }

  // Real-time subscription to user notifications
  subscribeToUserNotifications(
    userId: string,
    callback: (notifications: Notification[]) => void
  ): () => void {
    const userNotifQuery = query(
      collection(db, 'userNotifications'),
      where('userId', '==', userId),
      where('dismissed', '==', false),
      orderBy('receivedAt', 'desc'),
      limit(50)
    );

    return onSnapshot(userNotifQuery, async (snapshot) => {
      try {
        const userNotifications = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as UserNotification[];

        // Get full notification details
        const notifications: Notification[] = [];
        
        for (const userNotif of userNotifications) {
          const notifDoc = await getDoc(doc(db, 'notifications', userNotif.notificationId));
          if (notifDoc.exists()) {
            notifications.push({
              ...notifDoc.data(),
              id: notifDoc.id,
              isRead: userNotif.isRead,
              receivedAt: userNotif.receivedAt
            } as Notification & { isRead: boolean; receivedAt: Timestamp });
          }
        }

        callback(notifications);
      } catch (error) {
        console.error('Error in notification subscription:', error);
      }
    });
  }

  // Device token management for push notifications
  async registerDeviceToken(userId: string, platform: 'web' | 'android' | 'ios'): Promise<string | null> {
    try {
      if (!this.messaging) {
        throw new Error('Firebase Messaging not initialized');
      }

      const token = await getToken(this.messaging, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
      });

      if (token) {
        // Save token to Firestore
        const deviceTokenData: Omit<DeviceToken, 'id'> = {
          userId,
          token,
          platform,
          isActive: true,
          lastUsed: serverTimestamp() as Timestamp,
          createdAt: serverTimestamp() as Timestamp
        };

        await addDoc(collection(db, 'deviceTokens'), deviceTokenData);
        
        return token;
      }

      return null;
    } catch (error) {
      console.error('Error registering device token:', error);
      throw new Error('Failed to register device token');
    }
  }

  // Listen for foreground messages
  onForegroundMessage(callback: (payload: any) => void): () => void {
    if (!this.messaging) {
      return () => {};
    }

    return onMessage(this.messaging, (payload) => {
      callback(payload);
    });
  }

  // VR Analytics methods
  async recordVRSession(analytics: Omit<VRAnalytics, 'id' | 'createdAt'>): Promise<void> {
    try {
      const vrAnalytics: Omit<VRAnalytics, 'id'> = {
        ...analytics,
        createdAt: serverTimestamp() as Timestamp
      };

      await addDoc(collection(db, 'vrAnalytics'), vrAnalytics);
    } catch (error) {
      console.error('Error recording VR session:', error);
      throw new Error('Failed to record VR session');
    }
  }

  // Automatic notification triggers for admin actions
  async triggerDestinationNotification(destination: any, adminId: string): Promise<void> {
    const notificationData: CreateNotificationData = {
      title: `New Destination: ${destination.name}`,
      message: `Discover the beauty of ${destination.name} in ${destination.location}. Start exploring now!`,
      type: 'destination',
      category: 'new_content',
      priority: 'medium',
      targetAudience: 'all',
      relatedContentId: destination.id,
      relatedContentType: 'destination',
      metadata: {
        actionUrl: `/destinations/${destination.id}`,
        imageUrl: destination.image
      }
    };

    await this.createNotification(notificationData, adminId);
  }

  async triggerVRTourNotification(video: any, destinationName: string, adminId: string): Promise<void> {
    const notificationData: CreateNotificationData = {
      title: `New VR Experience: ${video.title}`,
      message: `Immerse yourself in a 360° virtual tour of ${destinationName}. Experience it now!`,
      type: 'vr_tour',
      category: 'new_content',
      priority: 'high',
      targetAudience: 'all',
      relatedContentId: video.id,
      relatedContentType: 'video',
      metadata: {
        actionUrl: `/vr-tours/${video.id}`,
        imageUrl: video.thumbnailUrl
      }
    };

    await this.createNotification(notificationData, adminId);
  }

  async triggerCustomAnnouncement(announcement: CustomAnnouncement, adminId: string): Promise<void> {
    const notificationData: CreateNotificationData = {
      title: announcement.title,
      message: announcement.message,
      type: 'announcement',
      category: announcement.category,
      priority: announcement.priority,
      targetAudience: announcement.targetAudience,
      targetUserIds: announcement.targetUserIds,
      expiresAt: announcement.expiresAt,
      metadata: announcement.metadata
    };

    await this.createNotification(notificationData, adminId);
  }

  // Get unread notification count
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const userNotifQuery = query(
        collection(db, 'userNotifications'),
        where('userId', '==', userId),
        where('isRead', '==', false),
        where('dismissed', '==', false)
      );

      const snapshot = await getDocs(userNotifQuery);
      return snapshot.docs.length;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }
}

export const notificationService = NotificationService.getInstance();