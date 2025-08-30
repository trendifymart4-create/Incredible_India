import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Plus, Edit, Trash2, Eye, EyeOff, X, Video as VideoIcon } from 'lucide-react';

// Lazy load components that might not be immediately needed
const SkeletonCard = lazy(() => import('./SkeletonLoader').then(module => ({ default: module.SkeletonCard })));
const SkeletonText = lazy(() => import('./SkeletonLoader').then(module => ({ default: module.SkeletonText })));
import { useAuth } from '../context/AuthContext';
import {
  subscribeToDestinations,
  createDestination,
  updateDestination,
  deleteDestination,
  type Destination,
} from '../api/destinations';
import {
  subscribeToAllVideos,
  createVideo,
  updateVideo,
  deleteVideo,
  toggleVideoStatus,
  subscribeToFeaturedVideoConfig,
  setFeaturedVideo,
  extractYouTubeId,
  type Video,
  type FeaturedVideoConfig,
} from '../api/videos';
import { subscribeToUsers } from '../api/users';
import type { UserProfile } from '../api/auth';
import { getAllTransactions, type Transaction, subscribeToPaymentGatewayConfig, setPaymentGatewayConfig, type PaymentGatewayConfig } from '../api/payments';
import { uploadDestinationImage } from '../api/storage';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'destinations' | 'videos' | 'featured' | 'users' | 'revenue' | 'paymentGateways'>('destinations');
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [featuredVideo, setFeaturedVideoState] = useState<FeaturedVideoConfig | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [revenue, setRevenue] = useState<Transaction[]>([]);
  const [paymentGatewayConfig, setPaymentGatewayConfigState] = useState<PaymentGatewayConfig | null>(null);
  const [editingDestination, setEditingDestination] = useState<Destination | null>(null);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
 const [showAddDestination, setShowAddDestination] = useState(false);
  const [showAddVideo, setShowAddVideo] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!isOpen) return;
    setIsLoading(true);
    const timeoutId = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timeoutId);
  }, [isOpen, activeTab]);

  // Subscribe to destinations
  useEffect(() => {
    if (!isOpen) return;

    const unsubscribe = subscribeToDestinations(
      (newDestinations) => {
        setDestinations(newDestinations);
      },
      (error) => {
        console.error('Error fetching destinations:', error);
        alert('Failed to load destinations.');
      }
    );

    return () => unsubscribe();
  }, [isOpen]);

  // Subscribe to videos
  useEffect(() => {
    if (!isOpen) return;

    const unsubscribe = subscribeToAllVideos(
      (newVideos) => {
        setVideos(newVideos);
      },
      (error) => {
        console.error('Error fetching videos:', error);
        alert('Failed to load videos.');
      }
    );

    return () => unsubscribe();
  }, [isOpen]);

  // Subscribe to users
  useEffect(() => {
    if (!isOpen || activeTab !== 'users') return;

    const unsubscribe = subscribeToUsers(
      (newUsers) => {
        setUsers(newUsers);
      },
      (error) => {
        console.error('Error fetching users:', error);
        alert('Failed to load users.');
      }
    );

    return () => unsubscribe();
  }, [isOpen, activeTab]);

  // Fetch transactions for revenue tab
  useEffect(() => {
    if (activeTab === 'revenue') {
      getAllTransactions()
        .then((transactions) => {
          setRevenue(transactions);
        })
        .catch((error) => {
          console.error('Error fetching transactions:', error);
          alert('Failed to load revenue data.');
        });
    }
  }, [activeTab]);

  // Subscribe to featured video configuration
  useEffect(() => {
    if (!isOpen || activeTab !== 'featured') return;

    const unsubscribe = subscribeToFeaturedVideoConfig(
      (config) => {
        setFeaturedVideoState(config);
      },
      (error) => {
        console.error('Error fetching featured video config:', error);
        alert('Failed to load featured video configuration.');
      }
    );

    return () => unsubscribe();
  }, [isOpen, activeTab]);

  // Subscribe to payment gateway configuration
  useEffect(() => {
    if (!isOpen || activeTab !== 'paymentGateways') return;

    const unsubscribe = subscribeToPaymentGatewayConfig(
      (config) => {
        setPaymentGatewayConfigState(config);
      },
      (error) => {
        console.error('Error fetching payment gateway config:', error);
        alert('Failed to load payment gateway configuration.');
      }
    );

    return () => unsubscribe();
  }, [isOpen, activeTab]);

  // Save featured video configuration
  const saveFeaturedVideo = async (config: Omit<FeaturedVideoConfig, 'updatedAt' | 'updatedBy'>) => {
    if (!currentUser) {
      alert('You must be logged in to save featured video configuration.');
      return;
    }

    try {
      await setFeaturedVideo({
        ...config,
        updatedBy: currentUser.uid,
      });
    } catch (error) {
      console.error('Error saving featured video config:', error);
      alert('Failed to save featured video configuration.');
    }
  };

  // Add/Update Destination
  const handleSaveDestination = async (
    data: Partial<Destination>,
    imageFile?: File
  ) => {
    if (!currentUser) {
      alert('You must be logged in to save a destination.');
      return;
    }

    try {
      if (editingDestination) {
        // Update existing destination
        let imageUrl = editingDestination.image;
        if (imageFile) {
          const result = await uploadDestinationImage(imageFile, editingDestination.id);
          imageUrl = result.url;
        }
        await updateDestination(editingDestination.id, {
          ...data,
          image: imageUrl,
          updatedBy: currentUser.uid,
        });
        setEditingDestination(null);
      } else {
        // Create new destination
        const destinationId = await createDestination({
          ...data,
          createdBy: currentUser.uid,
        } as any);

        if (imageFile) {
          const result = await uploadDestinationImage(imageFile, destinationId);
          await updateDestination(destinationId, { image: result.url, updatedBy: currentUser.uid });
        }
        setShowAddDestination(false);
      }
    } catch (error) {
      console.error('Error saving destination:', error);
      alert('Failed to save destination.');
    }
  };

  // Add/Update Video
  const handleSaveVideo = async (data: Partial<Video>) => {
    if (!currentUser) {
      alert('You must be logged in to save a video.');
      return;
    }

    // Validate required fields
    if (!data.title || !data.title.trim()) {
      alert('Please enter a title for the video.');
      return;
    }
    
    if (!data.youtubeId || !data.youtubeId.trim()) {
      alert('Please enter a valid YouTube URL.');
      return;
    }
    
    if (!data.destinationId || !data.destinationId.trim()) {
      alert('Please select a destination for this video.');
      return;
    }
    
    if (!data.duration || !data.duration.trim()) {
      alert('Please enter the video duration.');
      return;
    }

    try {
      if (editingVideo) {
        await updateVideo(editingVideo.id, {
          ...data,
          updatedBy: currentUser.uid,
        });
        setEditingVideo(null);
      } else {
        await createVideo({
          ...data,
          createdBy: currentUser.uid,
        } as any);
        setShowAddVideo(false);
      }
    } catch (error) {
      console.error('Error saving video:', error);
      alert('Failed to save video: ' + ((error as Error).message || 'Unknown error'));
    }
  };

  // Delete video
  const handleDeleteVideo = async (id: string) => {
    if (confirm('Are you sure you want to delete this video?')) {
      try {
        await deleteVideo(id);
      } catch (error) {
        console.error('Error deleting video:', error);
        alert('Failed to delete video.');
      }
    }
  };

  // Delete destination
  const handleDeleteDestination = async (id: string) => {
    if (confirm('Are you sure you want to delete this destination? This will also delete all associated videos.')) {
      try {
        await deleteDestination(id);
      } catch (error) {
        console.error('Error deleting destination:', error);
        alert('Failed to delete destination.');
      }
    }
  };

  // Toggle video active status
  const handleToggleVideoStatus = async (video: Video) => {
    if (!currentUser) return;
    try {
      await toggleVideoStatus(video.id, !video.isActive, currentUser.uid);
    } catch (error) {
      console.error('Error toggling video status:', error);
      alert('Failed to toggle video status.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gray-50">
          <h2 className="text-2xl font-bold text-gray-900">Admin Panel</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('destinations')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'destinations'
                ? 'text-orange-600 border-b-2 border-orange-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Destinations ({destinations.length})
          </button>
          <button
            onClick={() => setActiveTab('videos')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'videos'
                ? 'text-orange-600 border-b-2 border-orange-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Videos ({videos.length})
          </button>
          <button
            onClick={() => setActiveTab('featured')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'featured'
                ? 'text-orange-600 border-b-2 border-orange-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Featured Video
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'users'
                ? 'text-orange-600 border-b-2 border-orange-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Users ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('revenue')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'revenue'
                ? 'text-orange-600 border-b-2 border-orange-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Revenue
          </button>
          <button
            onClick={() => setActiveTab('paymentGateways')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'paymentGateways'
                ? 'text-orange-600 border-b-2 border-orange-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Payment Gateways
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-grow">
          {isLoading ? (
            <Suspense fallback={<div>Loading...</div>}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <SkeletonCard key={index} />
                ))}
              </div>
            </Suspense>
          ) : (
            <Suspense fallback={<div>Loading tab...</div>}>
              {activeTab === 'destinations' && (
                <DestinationsTab
                  destinations={destinations}
                  onAdd={() => setShowAddDestination(true)}
                  onEdit={setEditingDestination}
                  onDelete={handleDeleteDestination}
                />
              )}

              {activeTab === 'videos' && (
                <VideosTab
                  videos={videos}
                  destinations={destinations}
                  onAdd={() => setShowAddVideo(true)}
                  onEdit={setEditingVideo}
                  onDelete={handleDeleteVideo}
                  onToggleStatus={handleToggleVideoStatus}
                />
              )}

              {activeTab === 'featured' && (
                <FeaturedVideoTab
                  featuredVideo={featuredVideo}
                  onSave={saveFeaturedVideo}
                />
              )}

              {activeTab === 'users' && (
                <UsersTab users={users} />
              )}

              {activeTab === 'revenue' && (
                <RevenueTab revenue={revenue} />
              )}

              {activeTab === 'paymentGateways' && (
                <PaymentGatewaysTab
                  paymentGatewayConfig={paymentGatewayConfig}
                  onSave={async (config) => {
                    if (!currentUser) {
                      alert('You must be logged in to save payment gateway configuration.');
                      return;
                    }
                    try {
                      await setPaymentGatewayConfig(config, currentUser.uid);
                    } catch (error) {
                      console.error('Error saving payment gateway config:', error);
                      alert('Failed to save payment gateway configuration.');
                    }
                  }}
                />
              )}
            </Suspense>
          )}
        </div>
      </div>

      {/* Add/Edit Modals */}
      {(showAddDestination || editingDestination) && (
        <DestinationModal
          destination={editingDestination}
          onSave={handleSaveDestination}
          onClose={() => {
            setShowAddDestination(false);
            setEditingDestination(null);
          }}
        />
      )}

      {(showAddVideo || editingVideo) && (
        <VideoModal
          video={editingVideo}
          destinations={destinations}
          onSave={handleSaveVideo}
          onClose={() => {
            setShowAddVideo(false);
            setEditingVideo(null);
          }}
        />
      )}
    </div>
  );
};

// Destinations Tab Component
const DestinationsTab: React.FC<{
  destinations: Destination[];
 onAdd: () => void;
  onEdit: (destination: Destination) => void;
  onDelete: (id: string) => void;
}> = ({ destinations, onAdd, onEdit, onDelete }) => (
  <div>
    <div className="flex items-center justify-between mb-6">
      <h3 className="text-xl font-semibold">Manage Destinations</h3>
      <button
        onClick={onAdd}
        className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
      >
        <Plus className="w-4 h-4" />
        <span>Add Destination</span>
      </button>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {destinations.map((destination) => (
        <div key={destination.id} className="bg-gray-50 rounded-lg p-4">
          <img
            src={destination.image}
            alt={destination.name}
            className="w-full h-32 object-cover rounded-lg mb-3"
          />
          <h4 className="font-semibold text-gray-900 mb-1">{destination.name}</h4>
          <p className="text-sm text-gray-600 mb-2">{destination.location}</p>
          <p className="text-xs text-gray-500 mb-3 line-clamp-2">{destination.description}</p>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">
              Rating: {destination.rating}/5
            </span>
            <div className="flex space-x-2">
              <button
                onClick={() => onEdit(destination)}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
              >
                <Edit className="w-4 h-4 text-gray-600" />
              </button>
              <button
                onClick={() => onDelete(destination.id)}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
              >
                <Trash2 className="w-4 h-4 text-red-600" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Videos Tab Component
const VideosTab: React.FC<{
  videos: Video[];
  destinations: Destination[];
  onAdd: () => void;
  onEdit: (video: Video) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (video: Video) => void;
}> = ({ videos, destinations, onAdd, onEdit, onDelete, onToggleStatus }) => (
  <div>
    <div className="flex items-center justify-between mb-6">
      <h3 className="text-xl font-semibold">Manage Videos</h3>
      <button
        onClick={onAdd}
        className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
      >
        <Plus className="w-4 h-4" />
        <span>Add Video</span>
      </button>
    </div>

    <div className="space-y-4">
      {videos.map((video) => {
        const destination = destinations.find(d => d.id === video.destinationId);
        return (
          <div key={video.id} className="bg-gray-50 rounded-lg p-4 flex items-center space-x-4">
            <div className="flex-shrink-0">
              <img
                src={`https://i.ytimg.com/vi/${video.youtubeId}/mqdefault.jpg`}
                alt={video.title}
                className="w-24 h-16 object-cover rounded"
              />
            </div>
            
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900">{video.title}</h4>
              <p className="text-sm text-gray-600">{destination?.name || 'Unknown Destination'}</p>
              <p className="text-xs text-gray-500">{video.duration} • {video.youtubeId}</p>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onToggleStatus(video)}
                className={`p-2 rounded transition-colors ${
                  video.isActive 
                    ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title={video.isActive ? 'Deactivate video' : 'Activate video'}
              >
                {video.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
              <button
                onClick={() => onEdit(video)}
                className="p-2 hover:bg-gray-200 rounded transition-colors"
              >
                <Edit className="w-4 h-4 text-gray-600" />
              </button>
              <button
                onClick={() => onDelete(video.id)}
                className="p-2 hover:bg-gray-200 rounded transition-colors"
              >
                <Trash2 className="w-4 h-4 text-red-600" />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  </div>
);

// Featured Video Tab Component
const FeaturedVideoTab: React.FC<{
    featuredVideo: FeaturedVideoConfig | null;
    onSave: (config: Omit<FeaturedVideoConfig, 'updatedAt' | 'updatedBy'>) => void;
}> = ({ featuredVideo, onSave }) => {
    const [formData, setFormData] = useState({
        videoUrl: '',
        title: featuredVideo?.title || '',
        description: featuredVideo?.description || '',
        isEnabled: featuredVideo?.isEnabled || false,
    });
    const [previewVideoId, setPreviewVideoId] = useState(featuredVideo?.videoId || '');
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (featuredVideo) {
            setFormData({
                videoUrl: featuredVideo.videoId ? `https://www.youtube.com/watch?v=${featuredVideo.videoId}` : '',
                title: featuredVideo.title || '',
                description: featuredVideo.description || '',
                isEnabled: featuredVideo.isEnabled || false,
            });
            setPreviewVideoId(featuredVideo.videoId || '');
        }
    }, [featuredVideo]);

    const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const url = e.target.value;
        setFormData({ ...formData, videoUrl: url });
        const videoId = extractYouTubeId(url);
        setPreviewVideoId(videoId || '');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!previewVideoId) {
            setMessage('Please enter a valid YouTube URL.');
            return;
        }
        setIsSaving(true);
        setMessage('');

        try {
            await onSave({
                videoId: previewVideoId,
                title: formData.title,
                description: formData.description,
                isEnabled: formData.isEnabled
            });
            setMessage('Featured video updated successfully!');
            setTimeout(() => setMessage(''), 3000);
        } catch (error) {
            setMessage('Error updating featured video.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div>
            <h3 className="text-xl font-semibold mb-6">Manage Featured Video</h3>
            {message && (
                <div className={`mb-6 p-4 rounded-lg ${message.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                    {message}
                </div>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">YouTube Video URL</label>
                        <input
                            type="text"
                            value={formData.videoUrl}
                            onChange={handleUrlChange}
                            placeholder="e.g., https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Video Title (Optional)</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            placeholder="Enter a custom title for your video"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Add a description for your featured video"
                            rows={3}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                        />
                    </div>
                    <div className="flex items-center space-x-3">
                        <input
                            type="checkbox"
                            id="isEnabled"
                            checked={formData.isEnabled}
                            onChange={(e) => setFormData({ ...formData, isEnabled: e.target.checked })}
                            className="w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500"
                        />
                        <label htmlFor="isEnabled" className="text-sm font-medium text-gray-700">Show video on website</label>
                    </div>
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white py-3 px-6 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
                    >
                        {isSaving ? 'Updating...' : 'Update Featured Video'}
                    </button>
                </form>
                <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Preview</h4>
                    <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                        {previewVideoId ? (
                            <iframe
                                key={previewVideoId}
                                src={`https://www.youtube.com/embed/${previewVideoId}`}
                                title="Video Preview"
                                className="w-full h-full rounded-lg"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        ) : (
                            <div className="text-center text-gray-500">
                                <VideoIcon className="w-12 h-12 mx-auto mb-2" />
                                <p>YouTube preview will appear here</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};


// Users Tab Component
const UsersTab: React.FC<{ users: UserProfile[] }> = ({ users }) => (
    <div>
      <h3 className="text-xl font-semibold mb-6">User Management</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Country</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subscription</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Join Date</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.uid}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.firstName} {user.lastName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.country}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{user.subscription}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(user.joinDate.seconds * 1000).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
  
  // Revenue Tab Component
  const RevenueTab: React.FC<{ revenue: Transaction[] }> = ({ revenue }) => (
    <div>
      <h3 className="text-xl font-semibold mb-6">Revenue Overview</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Content</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {revenue.map((transaction) => (
              <tr key={transaction.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(transaction.createdAt.seconds * 1000).toLocaleString()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.userEmail}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{transaction.contentTitle}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.amount} {transaction.currency}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm capitalize">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    transaction.paymentStatus === 'completed' ? 'bg-green-100 text-green-800' :
                    transaction.paymentStatus === 'failed' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {transaction.paymentStatus}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
  
  // Destination Modal Component
  const DestinationModal: React.FC<{
    destination: Destination | null;
    onSave: (data: Partial<Destination>, imageFile?: File) => void;
    onClose: () => void;
  }> = ({ destination, onSave, onClose }) => {
    const [formData, setFormData] = useState({
      name: destination?.name || '',
      location: destination?.location || '',
      description: destination?.description || '',
      rating: destination?.rating || 0,
      duration: destination?.duration || '',
      visitors: destination?.visitors || '',
      highlights: destination?.highlights.join(', ') || '',
      vrAvailable: destination?.vrAvailable || false,
    });
    const [imageFile, setImageFile] = useState<File | null>(null);
  
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSave({
        ...formData,
        rating: Number(formData.rating),
        highlights: formData.highlights.split(',').map(h => h.trim()),
      }, imageFile || undefined);
    };
  
    return (
      <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
        <div className="bg-white rounded-lg max-w-lg w-full">
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="text-lg font-semibold">{destination ? 'Edit' : 'Add'} Destination</h3>
            <button onClick={onClose}><X size={20} /></button>
          </div>
          <form onSubmit={handleSubmit} className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
            <input type="text" placeholder="Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-2 border rounded" required/>
            <input type="text" placeholder="Location" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full p-2 border rounded" required/>
            <textarea placeholder="Description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-2 border rounded" required/>
            <input type="number" step="0.1" min="0" max="5" placeholder="Rating" value={formData.rating} onChange={e => setFormData({...formData, rating: +e.target.value})} className="w-full p-2 border rounded" required/>
            <input type="text" placeholder="Duration" value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} className="w-full p-2 border rounded" required/>
            <input type="text" placeholder="Visitors" value={formData.visitors} onChange={e => setFormData({...formData, visitors: e.target.value})} className="w-full p-2 border rounded" required/>
            <input type="text" placeholder="Highlights (comma-separated)" value={formData.highlights} onChange={e => setFormData({...formData, highlights: e.target.value})} className="w-full p-2 border rounded" />
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={formData.vrAvailable} onChange={e => setFormData({...formData, vrAvailable: e.target.checked})} />
              VR Available
            </label>
            <input type="file" onChange={e => setImageFile(e.target.files?.[0] || null)} className="w-full p-2 border rounded" accept="image/*" />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-orange-500 text-white rounded">Save</button>
            </div>
          </form>
        </div>
      </div>
    );
  };
  
  // Video Modal Component
  const VideoModal: React.FC<{
    video: Video | null;
    destinations: Destination[];
    onSave: (data: Partial<Video>) => void;
    onClose: () => void;
  }> = ({ video, destinations, onSave, onClose }) => {
    const [formData, setFormData] = useState({
      title: video?.title || '',
      description: video?.description || '',
      youtubeUrl: video?.youtubeId ? `https://www.youtube.com/watch?v=${video.youtubeId}` : '',
      duration: video?.duration || '',
      destinationId: video?.destinationId || '',
    });
    const [previewVideoId, setPreviewVideoId] = useState(video?.youtubeId || '');
  
    const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const url = e.target.value;
      setFormData({...formData, youtubeUrl: url});
      const videoId = extractYouTubeId(url);
      setPreviewVideoId(videoId || '');
    }
  
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!previewVideoId) {
          alert("Please enter a valid YouTube URL.");
          return;
      }
      if (!formData.destinationId) {
          alert("Please select a destination for this video.");
          return;
      }
      onSave({
        ...formData,
        youtubeId: previewVideoId,
      });
    };
  
    return (
      <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
        <div className="bg-white rounded-lg max-w-2xl w-full">
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="text-lg font-semibold">{video ? 'Edit' : 'Add'} Video</h3>
            <button onClick={onClose}><X size={20} /></button>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input type="text" placeholder="Title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full p-2 border rounded" required />
                  <input type="text" placeholder="Duration (e.g., 5:23)" value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} className="w-full p-2 border rounded" required />
              </div>
              <textarea placeholder="Description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-2 border rounded" rows={3} required />
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Destination <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.destinationId}
                  onChange={e => setFormData({...formData, destinationId: e.target.value})}
                  className={`w-full p-2 border rounded ${!formData.destinationId ? 'border-red-300' : 'border-gray-300'}`}
                  required
                >
                    <option value="">Select a Destination</option>
                    {destinations.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.location})
                      </option>
                    ))}
                </select>
                {!formData.destinationId && (
                  <p className="text-red-500 text-sm">Please select a destination for this video</p>
                )}
              </div>
              <input type="text" placeholder="YouTube URL" value={formData.youtubeUrl} onChange={handleUrlChange} className="w-full p-2 border rounded" required />
              
              <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center mt-2">
                  {previewVideoId ? (
                  <iframe
                      key={previewVideoId}
                      src={`https://www.youtube.com/embed/${previewVideoId}`}
                      title="Video Preview"
                      className="w-full h-full rounded-lg"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                  />
                  ) : (
                  <div className="text-center text-gray-500">
                      <VideoIcon className="w-12 h-12 mx-auto mb-2" />
                      <p>YouTube preview will appear here</p>
                  </div>
                  )}
              </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-orange-500 text-white rounded">Save</button>
            </div>
          </form>
        </div>
      </div>
    );
  };

 // Payment Gateways Tab Component
  const PaymentGatewaysTab: React.FC<{
    paymentGatewayConfig: PaymentGatewayConfig | null;
    onSave: (config: Omit<PaymentGatewayConfig, 'updatedAt' | 'updatedBy'>) => void;
  }> = ({ paymentGatewayConfig, onSave }) => {
    const [formData, setFormData] = useState({
      razorpay: {
        keyId: paymentGatewayConfig?.razorpay?.keyId || '',
        keySecret: paymentGatewayConfig?.razorpay?.keySecret || '',
        isActive: paymentGatewayConfig?.razorpay?.isActive || false,
      },
      cashfree: {
        clientId: paymentGatewayConfig?.cashfree?.clientId || '',
        clientSecret: paymentGatewayConfig?.cashfree?.clientSecret || '',
        isActive: paymentGatewayConfig?.cashfree?.isActive || false,
      },
      paytm: {
        merchantId: paymentGatewayConfig?.paytm?.merchantId || '',
        merchantKey: paymentGatewayConfig?.paytm?.merchantKey || '',
        isActive: paymentGatewayConfig?.paytm?.isActive || false,
      },
      stripe: {
        publishableKey: paymentGatewayConfig?.stripe?.publishableKey || '',
        secretKey: paymentGatewayConfig?.stripe?.secretKey || '',
        webhookSecret: paymentGatewayConfig?.stripe?.webhookSecret || '',
        isActive: paymentGatewayConfig?.stripe?.isActive || false,
      },
    });
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSaving(true);
      setMessage('');

      try {
        await onSave(formData);
        setMessage('Payment gateway configuration updated successfully!');
        setTimeout(() => setMessage(''), 3000);
      } catch (error) {
        setMessage('Error updating payment gateway configuration.');
      } finally {
        setIsSaving(false);
      }
    };

    return (
      <div>
        <h3 className="text-xl font-semibold mb-6">Payment Gateway Configuration</h3>
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${message.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
            {message}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Razorpay Configuration */}
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-medium text-gray-900">Razorpay</h4>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.razorpay.isActive}
                  onChange={(e) => setFormData({
                    ...formData,
                    razorpay: {
                      ...formData.razorpay,
                      isActive: e.target.checked
                    }
                  })}
                  className="w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500"
                />
                <span className="text-sm font-medium text-gray-700">Enable</span>
              </label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Key ID</label>
                <input
                  type="text"
                  value={formData.razorpay.keyId}
                  onChange={(e) => setFormData({
                    ...formData,
                    razorpay: {
                      ...formData.razorpay,
                      keyId: e.target.value
                    }
                  })}
                  placeholder="rzp_live_..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Key Secret</label>
                <input
                  type="password"
                  value={formData.razorpay.keySecret}
                  onChange={(e) => setFormData({
                    ...formData,
                    razorpay: {
                      ...formData.razorpay,
                      keySecret: e.target.value
                    }
                  })}
                  placeholder="•••••••"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
          </div>

          {/* Cashfree Configuration */}
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-medium text-gray-900">Cashfree</h4>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.cashfree.isActive}
                  onChange={(e) => setFormData({
                    ...formData,
                    cashfree: {
                      ...formData.cashfree,
                      isActive: e.target.checked
                    }
                  })}
                  className="w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500"
                />
                <span className="text-sm font-medium text-gray-700">Enable</span>
              </label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Client ID</label>
                <input
                  type="text"
                  value={formData.cashfree.clientId}
                  onChange={(e) => setFormData({
                    ...formData,
                    cashfree: {
                      ...formData.cashfree,
                      clientId: e.target.value
                    }
                  })}
                  placeholder="CF..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Client Secret</label>
                <input
                  type="password"
                  value={formData.cashfree.clientSecret}
                  onChange={(e) => setFormData({
                    ...formData,
                    cashfree: {
                      ...formData.cashfree,
                      clientSecret: e.target.value
                    }
                  })}
                  placeholder="••••••••"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
          </div>

          {/* Paytm Configuration */}
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-medium text-gray-900">Paytm</h4>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.paytm.isActive}
                  onChange={(e) => setFormData({
                    ...formData,
                    paytm: {
                      ...formData.paytm,
                      isActive: e.target.checked
                    }
                  })}
                  className="w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500"
                />
                <span className="text-sm font-medium text-gray-700">Enable</span>
              </label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Merchant ID</label>
                <input
                  type="text"
                  value={formData.paytm.merchantId}
                  onChange={(e) => setFormData({
                    ...formData,
                    paytm: {
                      ...formData.paytm,
                      merchantId: e.target.value
                    }
                  })}
                  placeholder="MID..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Merchant Key</label>
                <input
                  type="password"
                  value={formData.paytm.merchantKey}
                  onChange={(e) => setFormData({
                    ...formData,
                    paytm: {
                      ...formData.paytm,
                      merchantKey: e.target.value
                    }
                  })}
                  placeholder="•••••••"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
          </div>

          {/* Stripe Configuration */}
          <div className="border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-medium text-gray-900">Stripe</h4>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.stripe.isActive}
                  onChange={(e) => setFormData({
                    ...formData,
                    stripe: {
                      ...formData.stripe,
                      isActive: e.target.checked
                    }
                  })}
                  className="w-4 h-4 text-orange-600 bg-gray-100 border-gray-300 rounded focus:ring-orange-500"
                />
                <span className="text-sm font-medium text-gray-700">Enable</span>
              </label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Publishable Key</label>
                <input
                  type="text"
                  value={formData.stripe.publishableKey}
                  onChange={(e) => setFormData({
                    ...formData,
                    stripe: {
                      ...formData.stripe,
                      publishableKey: e.target.value
                    }
                  })}
                  placeholder="pk_live_..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Secret Key</label>
                <input
                  type="password"
                  value={formData.stripe.secretKey}
                  onChange={(e) => setFormData({
                    ...formData,
                    stripe: {
                      ...formData.stripe,
                      secretKey: e.target.value
                    }
                  })}
                  placeholder="••••••"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Webhook Secret</label>
                <input
                  type="password"
                  value={formData.stripe.webhookSecret}
                  onChange={(e) => setFormData({
                    ...formData,
                    stripe: {
                      ...formData.stripe,
                      webhookSecret: e.target.value
                    }
                  })}
                  placeholder="••••••"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white py-3 px-6 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
          >
            {isSaving ? 'Saving...' : 'Save Configuration'}
          </button>
        </form>
      </div>
    );
  };

export default AdminPanel;