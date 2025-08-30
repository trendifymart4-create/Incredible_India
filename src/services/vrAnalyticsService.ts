// VR Analytics Service for tracking user engagement and performance metrics
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  Timestamp,
  doc,
  updateDoc,
  query,
  where,
  getDocs,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../firebase';
import { VRAnalytics, VRMetrics, VRInteraction } from '../types/notifications';

export interface VRSession {
  sessionId: string;
  userId: string;
  destinationId: string;
  videoId?: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  interactions: VRInteraction[];
  metrics: VRMetrics;
  deviceInfo: DeviceInfo;
  networkInfo: NetworkInfo;
  performanceMetrics: PerformanceMetrics;
}

export interface DeviceInfo {
  userAgent: string;
  platform: string;
  screenWidth: number;
  screenHeight: number;
  devicePixelRatio: number;
  touchSupport: boolean;
  orientation: string;
  batteryLevel?: number;
  connectionType?: string;
}

export interface NetworkInfo {
  downlink?: number;
  effectiveType?: string;
  rtt?: number;
  saveData?: boolean;
  type?: string;
}

export interface PerformanceMetrics {
  loadTime: number;
  frameDrops: number;
  averageFPS: number;
  memoryUsage?: number;
  bufferHealth: number;
  qualitySwitches: number;
}

export interface VREngagementMetrics {
  totalSessions: number;
  totalDuration: number;
  averageSessionDuration: number;
  completionRate: number;
  interactionRate: number;
  qualityPreference: string;
  mostUsedGestures: { [key: string]: number };
  deviceBreakdown: { [key: string]: number };
  popularDestinations: { destinationId: string; sessions: number; duration: number }[];
}

export class VRAnalyticsService {
  private static instance: VRAnalyticsService;
  private currentSessions: Map<string, VRSession> = new Map();
  private performanceObserver: PerformanceObserver | null = null;
  private frameCount: number = 0;
  private lastFrameTime: number = 0;

  static getInstance(): VRAnalyticsService {
    if (!VRAnalyticsService.instance) {
      VRAnalyticsService.instance = new VRAnalyticsService();
    }
    return VRAnalyticsService.instance;
  }

  constructor() {
    this.initializePerformanceMonitoring();
  }

  // Start VR session tracking
  startVRSession(
    userId: string,
    destinationId: string,
    videoId?: string
  ): string {
    const sessionId = `vr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const session: VRSession = {
      sessionId,
      userId,
      destinationId,
      videoId,
      startTime: Date.now(),
      interactions: [],
      metrics: this.initializeMetrics(),
      deviceInfo: this.gatherDeviceInfo(),
      networkInfo: this.gatherNetworkInfo(),
      performanceMetrics: this.initializePerformanceMetrics()
    };

    this.currentSessions.set(sessionId, session);
    console.log(`📊 VR Analytics: Started session ${sessionId}`);

    // Start performance monitoring for this session
    this.startPerformanceMonitoring(sessionId);

    return sessionId;
  }

  // End VR session and save to Firestore
  async endVRSession(sessionId: string): Promise<void> {
    const session = this.currentSessions.get(sessionId);
    if (!session) {
      console.warn(`⚠️ VR Analytics: Session ${sessionId} not found`);
      return;
    }

    session.endTime = Date.now();
    session.duration = session.endTime - session.startTime;

    // Calculate final metrics
    session.metrics = this.calculateFinalMetrics(session);

    try {
      // Save to Firestore
      const vrAnalytics: Omit<VRAnalytics, 'id'> = {
        userId: session.userId,
        destinationId: session.destinationId,
        videoId: session.videoId,
        sessionId: session.sessionId,
        metrics: session.metrics,
        interactions: session.interactions,
        createdAt: serverTimestamp() as Timestamp
      };

      await addDoc(collection(db, 'vrAnalytics'), vrAnalytics);

      console.log(`✅ VR Analytics: Session ${sessionId} saved to Firestore`);
      
      // Clean up session
      this.currentSessions.delete(sessionId);
      this.stopPerformanceMonitoring(sessionId);

    } catch (error) {
      console.error('❌ VR Analytics: Error saving session:', error);
      throw error;
    }
  }

  // Record VR interaction
  recordInteraction(sessionId: string, interaction: VRInteraction): void {
    const session = this.currentSessions.get(sessionId);
    if (!session) {
      console.warn(`⚠️ VR Analytics: Session ${sessionId} not found for interaction`);
      return;
    }

    session.interactions.push({
      ...interaction,
      timestamp: Date.now()
    });

    // Update real-time metrics
    this.updateRealtimeMetrics(session, interaction);

    console.log(`📝 VR Analytics: Recorded ${interaction.type} interaction for session ${sessionId}`);
  }

  // Update video progress
  updateVideoProgress(
    sessionId: string, 
    currentTime: number, 
    duration: number,
    quality: string
  ): void {
    const session = this.currentSessions.get(sessionId);
    if (!session) return;

    const completionPercentage = (currentTime / duration) * 100;
    session.metrics.completionPercentage = Math.max(
      session.metrics.completionPercentage, 
      completionPercentage
    );
    session.metrics.qualityLevel = quality as any;

    // Record seek interactions
    const timeDiff = Math.abs(currentTime - (session.metrics.viewDuration || 0));
    if (timeDiff > 5) { // Likely a seek operation
      this.recordInteraction(sessionId, {
        type: 'seek',
        timestamp: Date.now(),
        data: { 
          from: session.metrics.viewDuration || 0, 
          to: currentTime,
          duration: duration
        }
      });
    }

    session.metrics.viewDuration = Math.max(session.metrics.viewDuration, currentTime);
  }

  // Update quality level
  updateQualityLevel(sessionId: string, quality: string): void {
    const session = this.currentSessions.get(sessionId);
    if (!session) return;

    const previousQuality = session.metrics.qualityLevel;
    session.metrics.qualityLevel = quality as any;

    if (previousQuality !== quality) {
      session.performanceMetrics.qualitySwitches++;
      
      this.recordInteraction(sessionId, {
        type: 'quality_change',
        timestamp: Date.now(),
        data: { 
          from: previousQuality, 
          to: quality,
          automatic: false 
        }
      });
    }
  }

  // Get user VR engagement metrics
  async getUserEngagementMetrics(userId: string): Promise<VREngagementMetrics> {
    try {
      const q = query(
        collection(db, 'vrAnalytics'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(100)
      );

      const querySnapshot = await getDocs(q);
      const sessions = querySnapshot.docs.map(doc => doc.data() as VRAnalytics);

      return this.calculateEngagementMetrics(sessions);
    } catch (error) {
      console.error('❌ VR Analytics: Error getting user metrics:', error);
      throw error;
    }
  }

  // Get destination analytics
  async getDestinationAnalytics(destinationId: string): Promise<any> {
    try {
      const q = query(
        collection(db, 'vrAnalytics'),
        where('destinationId', '==', destinationId),
        orderBy('createdAt', 'desc'),
        limit(200)
      );

      const querySnapshot = await getDocs(q);
      const sessions = querySnapshot.docs.map(doc => doc.data() as VRAnalytics);

      return {
        totalSessions: sessions.length,
        uniqueUsers: new Set(sessions.map(s => s.userId)).size,
        averageDuration: sessions.reduce((sum, s) => sum + s.metrics.viewDuration, 0) / sessions.length,
        averageCompletion: sessions.reduce((sum, s) => sum + s.metrics.completionPercentage, 0) / sessions.length,
        qualityDistribution: this.calculateQualityDistribution(sessions),
        deviceDistribution: this.calculateDeviceDistribution(sessions),
        interactionHeatmap: this.calculateInteractionHeatmap(sessions),
        performanceMetrics: this.calculateAggregatePerformance(sessions)
      };
    } catch (error) {
      console.error('❌ VR Analytics: Error getting destination analytics:', error);
      throw error;
    }
  }

  // Private helper methods
  private initializeMetrics(): VRMetrics {
    return {
      viewDuration: 0,
      completionPercentage: 0,
      qualityLevel: 'auto',
      deviceType: this.getDeviceType(),
      orientation: window.innerHeight > window.innerWidth ? 'portrait' : 'landscape',
      networkSpeed: this.getNetworkSpeed()
    };
  }

  private gatherDeviceInfo(): DeviceInfo {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      screenWidth: screen.width,
      screenHeight: screen.height,
      devicePixelRatio: window.devicePixelRatio,
      touchSupport: 'ontouchstart' in window,
      orientation: screen.orientation?.type || 'unknown',
      batteryLevel: this.getBatteryLevel(),
      connectionType: this.getConnectionType()
    };
  }

  private gatherNetworkInfo(): NetworkInfo {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    
    if (!connection) {
      return {};
    }

    return {
      downlink: connection.downlink,
      effectiveType: connection.effectiveType,
      rtt: connection.rtt,
      saveData: connection.saveData,
      type: connection.type
    };
  }

  private initializePerformanceMetrics(): PerformanceMetrics {
    return {
      loadTime: 0,
      frameDrops: 0,
      averageFPS: 0,
      memoryUsage: this.getMemoryUsage(),
      bufferHealth: 100,
      qualitySwitches: 0
    };
  }

  private initializePerformanceMonitoring(): void {
    if ('PerformanceObserver' in window) {
      this.performanceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        for (const entry of entries) {
          if (entry.entryType === 'measure') {
            console.log(`📊 Performance: ${entry.name} took ${entry.duration}ms`);
          }
        }
      });

      try {
        this.performanceObserver.observe({ entryTypes: ['measure', 'navigation', 'resource'] });
      } catch (error) {
        console.warn('⚠️ Performance Observer not fully supported:', error);
      }
    }
  }

  private startPerformanceMonitoring(sessionId: string): void {
    // Monitor frame rate
    const monitorFrameRate = () => {
      const now = performance.now();
      if (this.lastFrameTime) {
        const delta = now - this.lastFrameTime;
        const fps = 1000 / delta;
        this.frameCount++;
        
        const session = this.currentSessions.get(sessionId);
        if (session) {
          session.performanceMetrics.averageFPS = 
            ((session.performanceMetrics.averageFPS * (this.frameCount - 1)) + fps) / this.frameCount;
        }
      }
      this.lastFrameTime = now;
      
      if (this.currentSessions.has(sessionId)) {
        requestAnimationFrame(monitorFrameRate);
      }
    };

    requestAnimationFrame(monitorFrameRate);
  }

  private stopPerformanceMonitoring(sessionId: string): void {
    // Cleanup is handled by the frame monitoring function checking session existence
    this.frameCount = 0;
    this.lastFrameTime = 0;
  }

  private calculateFinalMetrics(session: VRSession): VRMetrics {
    const duration = (session.endTime! - session.startTime) / 1000;
    
    return {
      ...session.metrics,
      viewDuration: duration,
      deviceType: this.getDeviceType(),
      networkSpeed: this.getNetworkSpeed(),
      batteryLevel: this.getBatteryLevel()
    };
  }

  private updateRealtimeMetrics(session: VRSession, interaction: VRInteraction): void {
    // Update metrics based on interaction type
    switch (interaction.type) {
      case 'quality_change':
        session.performanceMetrics.qualitySwitches++;
        break;
      case 'pause':
      case 'play':
        // Track engagement patterns
        break;
    }
  }

  private calculateEngagementMetrics(sessions: VRAnalytics[]): VREngagementMetrics {
    if (sessions.length === 0) {
      return {
        totalSessions: 0,
        totalDuration: 0,
        averageSessionDuration: 0,
        completionRate: 0,
        interactionRate: 0,
        qualityPreference: 'auto',
        mostUsedGestures: {},
        deviceBreakdown: {},
        popularDestinations: []
      };
    }

    const totalDuration = sessions.reduce((sum, s) => sum + s.metrics.viewDuration, 0);
    const completionRate = sessions.reduce((sum, s) => sum + s.metrics.completionPercentage, 0) / sessions.length;
    const totalInteractions = sessions.reduce((sum, s) => sum + s.interactions.length, 0);

    // Calculate gesture usage
    const gestureCount: { [key: string]: number } = {};
    sessions.forEach(session => {
      session.interactions.forEach(interaction => {
        if (interaction.type === 'gesture') {
          const gestureType = interaction.data?.action || interaction.type;
          gestureCount[gestureType] = (gestureCount[gestureType] || 0) + 1;
        }
      });
    });

    // Calculate device breakdown
    const deviceCount: { [key: string]: number } = {};
    sessions.forEach(session => {
      const deviceType = session.metrics.deviceType;
      deviceCount[deviceType] = (deviceCount[deviceType] || 0) + 1;
    });

    // Calculate popular destinations
    const destinationStats: { [key: string]: { sessions: number; duration: number } } = {};
    sessions.forEach(session => {
      const destId = session.destinationId;
      if (!destinationStats[destId]) {
        destinationStats[destId] = { sessions: 0, duration: 0 };
      }
      destinationStats[destId].sessions++;
      destinationStats[destId].duration += session.metrics.viewDuration;
    });

    const popularDestinations = Object.entries(destinationStats)
      .map(([destinationId, stats]) => ({
        destinationId,
        sessions: stats.sessions,
        duration: stats.duration
      }))
      .sort((a, b) => b.sessions - a.sessions)
      .slice(0, 10);

    return {
      totalSessions: sessions.length,
      totalDuration,
      averageSessionDuration: totalDuration / sessions.length,
      completionRate,
      interactionRate: totalInteractions / sessions.length,
      qualityPreference: this.getMostCommonQuality(sessions),
      mostUsedGestures: gestureCount,
      deviceBreakdown: deviceCount,
      popularDestinations
    };
  }

  private calculateQualityDistribution(sessions: VRAnalytics[]): { [key: string]: number } {
    const qualityCount: { [key: string]: number } = {};
    sessions.forEach(session => {
      const quality = session.metrics.qualityLevel;
      qualityCount[quality] = (qualityCount[quality] || 0) + 1;
    });
    return qualityCount;
  }

  private calculateDeviceDistribution(sessions: VRAnalytics[]): { [key: string]: number } {
    const deviceCount: { [key: string]: number } = {};
    sessions.forEach(session => {
      const device = session.metrics.deviceType;
      deviceCount[device] = (deviceCount[device] || 0) + 1;
    });
    return deviceCount;
  }

  private calculateInteractionHeatmap(sessions: VRAnalytics[]): { [key: string]: number } {
    const interactionCount: { [key: string]: number } = {};
    sessions.forEach(session => {
      session.interactions.forEach(interaction => {
        interactionCount[interaction.type] = (interactionCount[interaction.type] || 0) + 1;
      });
    });
    return interactionCount;
  }

  private calculateAggregatePerformance(sessions: VRAnalytics[]): any {
    if (sessions.length === 0) return {};

    const avgCompletion = sessions.reduce((sum, s) => sum + s.metrics.completionPercentage, 0) / sessions.length;
    const avgDuration = sessions.reduce((sum, s) => sum + s.metrics.viewDuration, 0) / sessions.length;

    return {
      averageCompletionRate: avgCompletion,
      averageSessionDuration: avgDuration,
      totalSessions: sessions.length,
      qualityPreference: this.getMostCommonQuality(sessions)
    };
  }

  private getMostCommonQuality(sessions: VRAnalytics[]): string {
    const qualityCount: { [key: string]: number } = {};
    sessions.forEach(session => {
      const quality = session.metrics.qualityLevel;
      qualityCount[quality] = (qualityCount[quality] || 0) + 1;
    });

    return Object.entries(qualityCount)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'auto';
  }

  // Utility methods
  private getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    const width = window.innerWidth;
    if (width <= 768) return 'mobile';
    if (width <= 1024) return 'tablet';
    return 'desktop';
  }

  private getNetworkSpeed(): string {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (connection && connection.downlink) {
      return `${connection.downlink} Mbps`;
    }
    return 'unknown';
  }

  private getBatteryLevel(): number | undefined {
    // Battery API is deprecated but might still be available
    return undefined;
  }

  private getConnectionType(): string {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    return connection?.type || 'unknown';
  }

  private getMemoryUsage(): number | undefined {
    const memory = (performance as any).memory;
    if (memory) {
      return memory.usedJSHeapSize / memory.totalJSHeapSize;
    }
    return undefined;
  }
}

export const vrAnalyticsService = VRAnalyticsService.getInstance();