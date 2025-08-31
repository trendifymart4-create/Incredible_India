import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Bell, 
  Settings, 
  User, 
  LogOut, 
  Check, 
  Trash2, 
  ExternalLink,
  Calendar,
  MapPin,
  Play,
  Info,
  AlertCircle,
  Gift,
  Wrench
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { notificationService } from '../../services/notificationService';
import { Notification } from '../../types/notifications';
import { format } from 'date-fns';

interface MobileNotificationsProps {
  isOpen: boolean;
  onClose: () => void;
}

const MobileNotifications: React.FC<MobileNotificationsProps> = ({
  isOpen,
  onClose,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const { currentUser } = useAuth();

  // Subscribe to real-time notifications
  useEffect(() => {
    if (!currentUser || !isOpen) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const unsubscribe = notificationService.subscribeToUserNotifications(
      currentUser.uid,
      (newNotifications) => {
        setNotifications(newNotifications);
        setIsLoading(false);
      }
    );

    // Handle errors
    const errorHandler = (error: Error) => {
      setError(error.message);
      setIsLoading(false);
    };

    return () => {
      unsubscribe();
    };
  }, [currentUser, isOpen]);

  // Mark notification as read
  const handleMarkAsRead = async (notificationId: string) => {
    if (!currentUser) return;
    
    try {
      await notificationService.markAsRead(notificationId, currentUser.uid);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    if (!currentUser) return;
    
    try {
      await notificationService.markAllAsRead(currentUser.uid);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Dismiss notification
  const handleDismissNotification = async (notificationId: string) => {
    if (!currentUser) return;
    
    try {
      await notificationService.dismissNotification(notificationId, currentUser.uid);
    } catch (error) {
      console.error('Error dismissing notification:', error);
    }
  };

  // Handle notification click
  const handleNotificationClick = async (notification: Notification) => {
    if (!currentUser) return;

    // Mark as read if not already
    if (!notification.isRead) {
      await handleMarkAsRead(notification.id);
    }

    // Navigate if there's an action URL
    if (notification.metadata?.actionUrl) {
      window.location.href = notification.metadata.actionUrl;
    }
  };

  // Get notification icon
  const getNotificationIcon = (notification: Notification) => {
    switch (notification.type) {
      case 'destination':
        return <MapPin className="w-5 h-5 text-blue-500" />;
      case 'vr_tour':
        return <Play className="w-5 h-5 text-purple-500" />;
      case 'announcement':
        return notification.category === 'promotion' 
          ? <Gift className="w-5 h-5 text-green-500" />
          : <Info className="w-5 h-5 text-blue-500" />;
      case 'system':
        return notification.category === 'maintenance'
          ? <Wrench className="w-5 h-5 text-orange-500" />
          : <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'border-l-red-500 bg-red-50';
      case 'high':
        return 'border-l-orange-500 bg-orange-50';
      case 'medium':
        return 'border-l-blue-500 bg-blue-50';
      case 'low':
        return 'border-l-gray-500 bg-gray-50';
      default:
        return 'border-l-gray-300 bg-white';
    }
  };

  // Format timestamp
  const formatNotificationTime = (timestamp: any) => {
    try {
      if (timestamp?.seconds) {
        return format(new Date(timestamp.seconds * 1000), 'MMM d, h:mm a');
      }
      if (timestamp?.toDate) {
        return format(timestamp.toDate(), 'MMM d, h:mm a');
      }
      return 'Just now';
    } catch (error) {
      return 'Recently';
    }
  };

  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') {
      return !notification.isRead;
    }
    return true;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="absolute right-0 top-0 h-full w-full max-w-sm bg-white shadow-2xl overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Bell className="w-5 h-5" />
                <h2 className="text-lg font-semibold">Notifications</h2>
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Filter Tabs */}
            <div className="flex space-x-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                  filter === 'all'
                    ? 'bg-white/20 text-white'
                    : 'text-orange-100 hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                  filter === 'unread'
                    ? 'bg-white/20 text-white'
                    : 'text-orange-100 hover:text-white'
                }`}
              >
                Unread ({unreadCount})
              </button>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="px-3 py-1 text-sm text-orange-100 hover:text-white transition-colors"
                >
                  Mark all read
                </button>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                <span className="ml-3 text-gray-600">Loading notifications...</span>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-8 px-4">
                <div className="text-center text-gray-600">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-500" />
                  <p className="text-sm">{error}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="mt-2 text-orange-500 text-sm hover:underline"
                  >
                    Try again
                  </button>
                </div>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Bell className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-xl font-medium text-gray-700 mb-2">
                  {filter === 'unread' ? 'No unread notifications' : 'No notifications'}
                </h3>
                <p className="text-gray-500 text-center max-w-xs px-4">
                  {filter === 'unread' 
                    ? 'You\'re all caught up! Check back later for new notifications.' 
                    : 'You\'ll be notified when something important happens.'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredNotifications.map((notification, index) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`relative border-l-4 ${getPriorityColor(notification.priority)} ${
                      !notification.isRead ? 'bg-blue-50/50' : ''
                    }`}
                  >
                    <div className="p-4">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className={`text-sm font-medium ${
                                !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                              }`}>
                                {notification.title}
                              </h3>
                              <p className={`mt-1 text-sm ${
                                !notification.isRead ? 'text-gray-700' : 'text-gray-500'
                              }`}>
                                {notification.message}
                              </p>
                              <p className="mt-2 text-xs text-gray-400">
                                {formatNotificationTime(notification.createdAt)}
                              </p>
                            </div>
                            
                            {/* Action Buttons */}
                            <div className="flex items-center space-x-1 ml-2">
                              {!notification.isRead && (
                                <button
                                  onClick={() => handleMarkAsRead(notification.id)}
                                  className="p-1 text-gray-400 hover:text-green-500 transition-colors"
                                  title="Mark as read"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                              )}
                              
                              {notification.metadata?.actionUrl && (
                                <button
                                  onClick={() => handleNotificationClick(notification)}
                                  className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                                  title="Open"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </button>
                              )}
                              
                              <button
                                onClick={() => handleDismissNotification(notification.id)}
                                className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                title="Dismiss"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          
                          {/* Action Button for clickable notifications */}
                          {notification.metadata?.actionUrl && (
                            <button
                              onClick={() => handleNotificationClick(notification)}
                              className="mt-2 text-xs text-orange-500 hover:text-orange-600 font-medium"
                            >
                              {notification.type === 'destination' && 'View Destination'}
                              {notification.type === 'vr_tour' && 'Start VR Tour'}
                              {notification.type === 'announcement' && 'Learn More'}
                              {!notification.type.match(/(destination|vr_tour|announcement)/) && 'Open'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {!isLoading && !error && filteredNotifications.length > 0 && (
            <div className="bg-gray-50 border-t border-gray-200 p-3">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>{filteredNotifications.length} notifications</span>
                {currentUser && (
                  <span>Logged in as {currentUser.email}</span>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MobileNotifications;