// Enhanced Service Worker for Mobile PWA Experience
const CACHE_NAME = 'incredible-india-v1.2.0';
const STATIC_CACHE = 'static-v1.2.0';
const DYNAMIC_CACHE = 'dynamic-v1.2.0';
const IMAGE_CACHE = 'images-v1.2.0';

// Resources to cache immediately
const STATIC_ASSETS = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/offline.html',
  // Add other static assets
];

// Resources to cache dynamically
const CACHE_STRATEGIES = {
  // Cache first for static assets
  static: [
    /\.(js|css|html)$/,
    /\/static\//
  ],
  
  // Network first for API calls
  networkFirst: [
    /\/api\//,
    /\/destinations/,
    /firebase/
  ],
  
  // Cache first for images
  cacheFirst: [
    /\.(png|jpg|jpeg|gif|webp|svg)$/,
    /unsplash\.com/,
    /images\./
  ]
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('📦 Service Worker: Installing...');
  
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('📦 Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      // Skip waiting to activate immediately
      self.skipWaiting()
    ])
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker: Activating...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== IMAGE_CACHE &&
                cacheName !== CACHE_NAME) {
              console.log('🗑️ Service Worker: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Claim all clients
      self.clients.claim()
    ])
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome extension and other non-http requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  event.respondWith(handleRequest(request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  
  try {
    // Determine strategy based on request
    const strategy = getStrategy(request);
    
    switch (strategy) {
      case 'cacheFirst':
        return await cacheFirst(request);
      case 'networkFirst':
        return await networkFirst(request);
      case 'staleWhileRevalidate':
        return await staleWhileRevalidate(request);
      default:
        return await networkFirst(request);
    }
  } catch (error) {
    console.error('🚨 Service Worker: Fetch error:', error);
    return await handleOffline(request);
  }
}

function getStrategy(request) {
  const url = request.url;
  
  // Check for static assets
  for (const pattern of CACHE_STRATEGIES.static) {
    if (pattern.test(url)) {
      return 'cacheFirst';
    }
  }
  
  // Check for images
  for (const pattern of CACHE_STRATEGIES.cacheFirst) {
    if (pattern.test(url)) {
      return 'cacheFirst';
    }
  }
  
  // Check for network first resources
  for (const pattern of CACHE_STRATEGIES.networkFirst) {
    if (pattern.test(url)) {
      return 'networkFirst';
    }
  }
  
  // Default to network first
  return 'networkFirst';
}

// Cache First Strategy - for static assets and images
async function cacheFirst(request) {
  const cacheName = request.url.match(/\.(png|jpg|jpeg|gif|webp|svg)$/i) 
    ? IMAGE_CACHE 
    : STATIC_CACHE;
    
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    // Return cached version and update in background
    updateInBackground(request, cache);
    return cachedResponse;
  }
  
  // Fetch from network and cache
  const networkResponse = await fetch(request);
  
  if (networkResponse.ok) {
    cache.put(request, networkResponse.clone());
  }
  
  return networkResponse;
}

// Network First Strategy - for API calls and dynamic content
async function networkFirst(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Fall back to cache
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

// Stale While Revalidate Strategy
async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cachedResponse = await cache.match(request);
  
  // Always try to fetch from network
  const networkResponsePromise = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  });
  
  // Return cached version immediately if available, otherwise wait for network
  return cachedResponse || networkResponsePromise;
}

// Update cache in background
async function updateInBackground(request, cache) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response);
    }
  } catch (error) {
    // Silently fail for background updates
  }
}

// Handle offline scenarios
async function handleOffline(request) {
  const url = new URL(request.url);
  
  // For navigation requests, return offline page
  if (request.mode === 'navigate') {
    const cache = await caches.open(STATIC_CACHE);
    return cache.match('/offline.html') || new Response('Offline', { status: 503 });
  }
  
  // For images, return placeholder
  if (request.destination === 'image') {
    return new Response(
      '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#f0f0f0"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#999">Image Unavailable</text></svg>',
      { headers: { 'Content-Type': 'image/svg+xml' } }
    );
  }
  
  // For other requests, return error response
  return new Response('Offline', { 
    status: 503,
    statusText: 'Service Unavailable'
  });
}

// Background Sync for failed requests
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(handleBackgroundSync());
  }
});

async function handleBackgroundSync() {
  // Handle any queued requests that failed while offline
  console.log('🔄 Service Worker: Handling background sync');
  // Implementation would depend on your app's needs
}

// Push notifications
self.addEventListener('push', (event) => {
  console.log('🔔 Service Worker: Push event received:', event);
  
  let notificationData = {
    title: 'Incredible India',
    body: 'New notification from Incredible India',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    tag: 'default',
    requireInteraction: false,
    silent: false,
    data: {}
  };

  // Parse push data if available
  if (event.data) {
    try {
      const data = event.data.json();
      console.log('📨 Service Worker: Push data:', data);
      
      // Handle Firebase Cloud Messaging format
      if (data.notification) {
        notificationData.title = data.notification.title || notificationData.title;
        notificationData.body = data.notification.body || notificationData.body;
        notificationData.icon = data.notification.icon || notificationData.icon;
        notificationData.tag = data.notification.tag || data.data?.notificationId || 'default';
      }
      
      // Handle custom data
      if (data.data) {
        notificationData.data = data.data;
        
        // Set priority-based options
        if (data.data.priority === 'urgent' || data.data.priority === 'high') {
          notificationData.requireInteraction = true;
          notificationData.tag = 'urgent-' + (data.data.notificationId || Date.now());
        }
        
        if (data.data.priority === 'low') {
          notificationData.silent = true;
        }
        
        // Set notification type-specific icon
        if (data.data.type === 'destination') {
          notificationData.icon = '/icon-destination.png';
        } else if (data.data.type === 'vr_tour') {
          notificationData.icon = '/icon-vr.png';
        }
      }
    } catch (error) {
      console.error('❌ Service Worker: Error parsing push data:', error);
      notificationData.body = event.data.text() || notificationData.body;
    }
  }

  // Enhanced notification options
  const options = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    tag: notificationData.tag,
    requireInteraction: notificationData.requireInteraction,
    silent: notificationData.silent,
    vibrate: notificationData.silent ? [] : [100, 50, 100],
    timestamp: Date.now(),
    data: {
      dateOfArrival: Date.now(),
      primaryKey: notificationData.tag,
      ...notificationData.data
    },
    actions: getNotificationActions(notificationData.data)
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
      .then(() => {
        console.log('✅ Service Worker: Notification displayed successfully');
        
        // Store notification for offline handling
        return caches.open('notifications-v1').then(cache => {
          return cache.put(`/notification-${notificationData.tag}`, 
            new Response(JSON.stringify({
              ...notificationData,
              timestamp: Date.now()
            }))
          );
        });
      })
      .catch(error => {
        console.error('❌ Service Worker: Error showing notification:', error);
      })
  );
});

// Get notification actions based on type and data
function getNotificationActions(data) {
  const actions = [];
  
  if (data && data.actionUrl) {
    let actionTitle = 'Open';
    
    switch (data.type) {
      case 'destination':
        actionTitle = 'View Destination';
        break;
      case 'vr_tour':
        actionTitle = 'Start VR Tour';
        break;
      case 'announcement':
        actionTitle = 'Learn More';
        break;
    }
    
    actions.push({
      action: 'open',
      title: actionTitle,
      icon: '/icon-action.png'
    });
  }
  
  actions.push({
    action: 'dismiss',
    title: 'Dismiss',
    icon: '/icon-close.png'
  });
  
  return actions;
}

// Enhanced notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('🖱️ Service Worker: Notification clicked:', event);
  
  event.notification.close();
  
  const notificationData = event.notification.data;
  const action = event.action;
  
  console.log('📊 Service Worker: Notification action:', action, notificationData);

  let targetUrl = '/';
  
  if (action === 'open' || !action) {
    // Determine target URL based on notification data
    if (notificationData.actionUrl) {
      targetUrl = notificationData.actionUrl;
    } else if (notificationData.type === 'destination' && notificationData.relatedContentId) {
      targetUrl = `/destinations/${notificationData.relatedContentId}`;
    } else if (notificationData.type === 'vr_tour' && notificationData.relatedContentId) {
      targetUrl = `/vr-tours/${notificationData.relatedContentId}`;
    }
  } else if (action === 'dismiss') {
    // Handle dismiss action - could send analytics
    console.log('📊 Service Worker: Notification dismissed');
    return;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        console.log('👥 Service Worker: Found clients:', clientList.length);
        
        // Try to focus existing window with the target URL
        for (const client of clientList) {
          if (client.url.includes(targetUrl.split('?')[0]) && 'focus' in client) {
            console.log('🎯 Service Worker: Focusing existing client');
            return client.focus();
          }
        }
        
        // Try to focus any existing window and navigate
        if (clientList.length > 0 && 'navigate' in clientList[0]) {
          console.log('🧭 Service Worker: Navigating existing client');
          return clientList[0].focus().then(() => clientList[0].navigate(targetUrl));
        }
        
        // Open new window
        console.log('🆕 Service Worker: Opening new window');
        return clients.openWindow(targetUrl);
      })
      .catch(error => {
        console.error('❌ Service Worker: Error handling notification click:', error);
      })
  );

  // Track notification interaction
  trackNotificationInteraction({
    notificationId: notificationData.notificationId || 'unknown',
    action: action || 'click',
    timestamp: Date.now()
  });
});

// Track notification interactions for analytics
function trackNotificationInteraction(data) {
  try {
    // Store interaction data for later sync
    caches.open('analytics-v1').then(cache => {
      cache.put(`/notification-interaction-${Date.now()}`, 
        new Response(JSON.stringify(data))
      );
    });
    
    console.log('📊 Service Worker: Tracked notification interaction:', data);
  } catch (error) {
    console.error('❌ Service Worker: Error tracking interaction:', error);
  }
}

// Message handling for communication with main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_CACHE_SIZE') {
    getCacheSize().then((size) => {
      event.ports[0].postMessage({ type: 'CACHE_SIZE', size });
    });
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    clearAllCaches().then(() => {
      event.ports[0].postMessage({ type: 'CACHE_CLEARED' });
    });
  }
});

// Utility functions
async function getCacheSize() {
  const cacheNames = await caches.keys();
  let totalSize = 0;
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const requests = await cache.keys();
    
    for (const request of requests) {
      const response = await cache.match(request);
      if (response) {
        const blob = await response.blob();
        totalSize += blob.size;
      }
    }
  }
  
  return totalSize;
}

async function clearAllCaches() {
  const cacheNames = await caches.keys();
  return Promise.all(
    cacheNames.map(cacheName => caches.delete(cacheName))
  );
}

console.log('🔧 Service Worker: Loaded and ready');