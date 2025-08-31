import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, EyeOff, X, VideoIcon, Bell, Send, Mail, MapPin, Phone, Users, Map, DollarSign, Settings, Megaphone, Image, FileText, Star, Clock, UserCheck, TrendingUp, Play } from 'lucide-react';
import { serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { notificationService } from '../services/notificationService';
import {
  subscribeToDestinations,
  createDestination,
  updateDestination,
  deleteDestination,
  type Destination,
  type CreateDestinationData,
  type UpdateDestinationData,
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
import { uploadDestinationImage, uploadDestinationImageToCloudinary, deleteDestinationImageFromCloudinary } from '../api/storage';
import {
  subscribeToContactInquiries,
  subscribeToContactDetails,
  updateContactInquiry,
  updateContactDetails,
  type ContactInquiry,
  type ContactDetails
} from '../api/contact';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'destinations' | 'videos' | 'featured' | 'users' | 'revenue' | 'paymentGateways' | 'notifications' | 'contact' | 'vrTours'>('dashboard');
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
  const [isSaving, setIsSaving] = useState(false);
  // Add new state for contact inquiries and details
  const [contactInquiries, setContactInquiries] = useState<ContactInquiry[]>([]);
  const [contactDetails, setContactDetails] = useState<ContactDetails | null>(null);
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
    setIsLoading(true);
    const unsubscribe = subscribeToDestinations(
      (newDestinations) => {
        setDestinations(newDestinations);
        setIsLoading(false);
      },
      (error) => {
        console.error('Error fetching destinations:', error);
        alert('Failed to load destinations: ' + error.message || 'Unknown error');
        setIsLoading(false);
      }
    );
    return () => {
      unsubscribe();
      setIsLoading(false);
    };
  }, [isOpen]);

  // Subscribe to videos
  useEffect(() => {
    if (!isOpen) return;
    setIsLoading(true);
    const unsubscribe = subscribeToAllVideos(
      (newVideos) => {
        setVideos(newVideos);
        setIsLoading(false);
      },
      (error) => {
        console.error('Error fetching videos:', error);
        alert('Failed to load videos: ' + error.message || 'Unknown error');
        setIsLoading(false);
      }
    );
    return () => {
      unsubscribe();
      setIsLoading(false);
    };
  }, [isOpen]);

  // Subscribe to users
  useEffect(() => {
    if (!isOpen || activeTab !== 'users') return;
    setIsLoading(true);
    const unsubscribe = subscribeToUsers(
      (newUsers) => {
        setUsers(newUsers);
        setIsLoading(false);
      },
      (error) => {
        console.error('Error fetching users:', error);
        alert('Failed to load users: ' + error.message || 'Unknown error');
        setIsLoading(false);
      }
    );
    return () => {
      unsubscribe();
      setIsLoading(false);
    };
  }, [isOpen, activeTab]);

  // Fetch transactions for revenue tab
  useEffect(() => {
    if (activeTab === 'revenue') {
      setIsLoading(true);
      getAllTransactions()
        .then((transactions) => {
          setRevenue(transactions);
          setIsLoading(false);
        })
        .catch((error) => {
          console.error('Error fetching transactions:', error);
          alert('Failed to load revenue data: ' + error.message || 'Unknown error');
          setIsLoading(false);
        });
    }
  }, [activeTab]);

  // Subscribe to featured video configuration
  useEffect(() => {
    if (!isOpen || activeTab !== 'featured') return;
    setIsLoading(true);
    const unsubscribe = subscribeToFeaturedVideoConfig(
      (config) => {
        setFeaturedVideoState(config);
        setIsLoading(false);
      },
      (error) => {
        console.error('Error fetching featured video config:', error);
        alert('Failed to load featured video configuration: ' + error.message || 'Unknown error');
        setIsLoading(false);
      }
    );
    return () => {
      unsubscribe();
      setIsLoading(false);
    };
  }, [isOpen, activeTab]);

  // Subscribe to payment gateway configuration
  useEffect(() => {
    if (!isOpen || activeTab !== 'paymentGateways') return;
    setIsLoading(true);
    const unsubscribe = subscribeToPaymentGatewayConfig(
      (config) => {
        setPaymentGatewayConfigState(config);
        setIsLoading(false);
      },
      (error) => {
        console.error('Error fetching payment gateway config:', error);
        alert('Failed to load payment gateway configuration: ' + error.message || 'Unknown error');
        setIsLoading(false);
      }
    );
    return () => {
      unsubscribe();
      setIsLoading(false);
    };
  }, [isOpen, activeTab]);

  // Subscribe to contact inquiries
  useEffect(() => {
    if (!isOpen || activeTab !== 'contact') return;
    setIsLoading(true);
    const unsubscribe = subscribeToContactInquiries(
      (newInquiries) => {
        setContactInquiries(newInquiries);
        setIsLoading(false);
      },
      (error) => {
        console.error('Error fetching contact inquiries:', error);
        alert('Failed to load contact inquiries: ' + error.message || 'Unknown error');
        setIsLoading(false);
      }
    );
    return () => {
      unsubscribe();
      setIsLoading(false);
    };
  }, [isOpen, activeTab]);

  // Subscribe to contact details
  useEffect(() => {
    if (!isOpen || activeTab !== 'contact') return;
    setIsLoading(true);
    const unsubscribe = subscribeToContactDetails(
      (details) => {
        setContactDetails(details);
        setIsLoading(false);
      },
      (error) => {
        console.error('Error fetching contact details:', error);
        alert('Failed to load contact details: ' + error.message || 'Unknown error');
        setIsLoading(false);
      }
    );
    return () => {
      unsubscribe();
      setIsLoading(false);
    };
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
      alert('Featured video configuration saved successfully!');
    } catch (error) {
      console.error('Error saving featured video config:', error);
      alert('Failed to save featured video configuration: ' + (error as Error).message || 'Unknown error');
    }
  };

  // Handle payment gateway configuration form submission
  const handlePaymentGatewaySubmit = async (formData: FormData) => {
    if (!currentUser) {
      alert('You must be logged in to save payment gateway configuration.');
      return;
    }

    try {
      const config: Omit<PaymentGatewayConfig, 'updatedAt'> = {
        razorpay: {
          keyId: formData.get('razorpayKeyId') as string,
          keySecret: formData.get('razorpayKeySecret') as string,
          isActive: formData.get('razorpayEnabled') === 'on',
          enabled: formData.get('razorpayEnabled') === 'on' // For backward compatibility
        },
        cashfree: {
          clientId: formData.get('cashfreeClientId') as string,
          clientSecret: formData.get('cashfreeClientSecret') as string,
          isActive: formData.get('cashfreeEnabled') === 'on',
          enabled: formData.get('cashfreeEnabled') === 'on' // For backward compatibility
        },
        paytm: {
          merchantId: formData.get('paytmMerchantId') as string,
          merchantKey: formData.get('paytmMerchantKey') as string,
          isActive: formData.get('paytmEnabled') === 'on',
          enabled: formData.get('paytmEnabled') === 'on' // For backward compatibility
        },
        stripe: {
          publishableKey: formData.get('stripePublishableKey') as string,
          secretKey: formData.get('stripeSecretKey') as string,
          webhookSecret: formData.get('stripeWebhookSecret') as string,
          isActive: formData.get('stripeEnabled') === 'on',
          enabled: formData.get('stripeEnabled') === 'on' // For backward compatibility
        }
      };

      await setPaymentGatewayConfig(config, currentUser.uid);
      alert('Payment gateway configuration saved successfully!');
    } catch (error) {
      console.error('Error saving payment gateway config:', error);
      alert('Failed to save payment gateway configuration: ' + (error as Error).message || 'Unknown error');
    }
  };

  if (!isOpen) return null;

  // Add/Update Destination
  const handleSaveDestination = async (data: Partial<Destination>, imageFile?: File) => {
    if (!currentUser) {
      alert('You must be logged in to save a destination.');
      return;
    }
    try {
      if (editingDestination) {
        // Update existing destination
        const updateData: UpdateDestinationData = {
          name: data.name as string,
          location: data.location as string,
          image: imageFile ? (await uploadDestinationImageToCloudinary(imageFile, editingDestination.id)).url : (data.image || editingDestination.image || '/placeholder-destination.jpg'),
          description: data.description as string,
          rating: data.rating as number,
          duration: data.duration as string,
          visitors: data.visitors as string,
          highlights: data.highlights as string[],
          vrAvailable: data.vrAvailable as boolean,
          updatedBy: currentUser.uid,
        };
        await updateDestination(editingDestination.id, updateData);
        setEditingDestination(null);
      } else {
        // Create new destination
        const createData: CreateDestinationData = {
          name: data.name as string,
          location: data.location as string,
          image: imageFile ? (await uploadDestinationImageToCloudinary(imageFile, `destination-${Date.now()}`)).url : (data.image || '/placeholder-destination.jpg'),
          description: data.description as string,
          rating: data.rating as number,
          duration: data.duration as string,
          visitors: data.visitors as string,
          highlights: data.highlights as string[],
          vrAvailable: data.vrAvailable as boolean,
          createdBy: currentUser.uid,
        };
        await createDestination(createData);
        setShowAddDestination(false);
        // Trigger notification for new destination
        try {
          const newDestination = {
            id: `destination-${Date.now()}`,
            name: data.name,
            location: data.location,
            image: imageFile ? (await uploadDestinationImageToCloudinary(imageFile, `destination-${Date.now()}`)).url : (data.image || '/placeholder-destination.jpg')
          };
          // await notificationService.triggerDestinationNotification(newDestination, currentUser.uid);
          console.log('Destination notification sent successfully');
        } catch (notifError) {
          console.error('Error sending destination notification:', notifError);
          // Don't fail the entire operation if notification fails
        }
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
        const videoId = await createVideo({
          ...data,
          createdBy: currentUser.uid,
        } as any);
        // Trigger notification for new VR tour
        try {
          const destination = destinations.find(d => d.id === data.destinationId);
          const destinationName = destination?.name || 'Unknown Destination';
          const newVideo = {
            id: videoId,
            title: data.title,
            thumbnailUrl: data.thumbnailUrl || `https://img.youtube.com/vi/${data.youtubeId}/maxresdefault.jpg`
          };
          // await notificationService.triggerVRTourNotification(newVideo, destinationName, currentUser.uid);
          console.log('VR Tour notification sent successfully');
        } catch (notifError) {
          console.error('Error sending VR tour notification:', notifError);
          // Don't fail the entire operation if notification fails
        }
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

  // Update contact inquiry status
  const handleUpdateContactInquiryStatus = async (id: string, status: ContactInquiry['status']) => {
    if (!currentUser) return;
    try {
      await updateContactInquiry(id, {
        status,
        updatedAt: serverTimestamp() as any
      });
    } catch (error) {
      console.error('Error updating contact inquiry status:', error);
      alert('Failed to update contact inquiry status.');
    }
  };

  // Update contact details
  const handleUpdateContactDetails = async (data: Partial<ContactDetails>) => {
    if (!currentUser) {
      alert('You must be logged in to update contact details.');
      return;
    }
    try {
      await updateContactDetails({
        ...data,
        updatedBy: currentUser.uid
      } as any);
    } catch (error) {
      console.error('Error updating contact details:', error);
      alert('Failed to update contact details.');
    }
  };

  // Calculate dashboard statistics
  const totalDestinations = destinations.length;
  const totalVideos = videos.length;
  const totalUsers = users.length;
  const totalRevenue = revenue.reduce((sum, transaction) => sum + (transaction.amount || 0), 0);
  const activeVideos = videos.filter(video => video.isActive).length;
  const vrTours = videos.filter(video => video.youtubeId).length;
  const pendingInquiries = contactInquiries.filter(inquiry => inquiry.status === 'new').length;

  // Helper function to get status color
  const getStatusColor = (status: ContactInquiry['status']) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'in-progress': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-7xl w-full max-h-[95vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
          <div className="flex items-center space-x-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <Settings className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold">Admin Panel</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar Navigation */}
          <div className="w-64 bg-gray-50 border-r flex flex-col">
            <div className="p-4 border-b">
              <h3 className="font-semibold text-gray-700">Management</h3>
            </div>
            <nav className="flex-1 overflow-y-auto py-2">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`w-full flex items-center space-x-3 px-4 py-3 text-left transition-colors ${
                  activeTab === 'dashboard'
                    ? 'text-orange-600 border-r-2 border-orange-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <TrendingUp className="w-5 h-5" />
                <span>Dashboard</span>
              </button>
              <button
                onClick={() => setActiveTab('destinations')}
                className={`w-full flex items-center space-x-3 px-4 py-3 text-left transition-colors ${
                  activeTab === 'destinations'
                    ? 'text-orange-600 border-r-2 border-orange-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Map className="w-5 h-5" />
                <span>Destinations ({destinations.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('videos')}
                className={`w-full flex items-center space-x-3 px-4 py-3 text-left transition-colors ${
                  activeTab === 'videos'
                    ? 'text-orange-600 border-r-2 border-orange-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <VideoIcon className="w-5 h-5" />
                <span>Videos ({videos.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('featured')}
                className={`w-full flex items-center space-x-3 px-4 py-3 text-left transition-colors ${
                  activeTab === 'featured'
                    ? 'text-orange-600 border-r-2 border-orange-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Star className="w-5 h-5" />
                <span>Featured Video</span>
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`w-full flex items-center space-x-3 px-4 py-3 text-left transition-colors ${
                  activeTab === 'users'
                    ? 'text-orange-600 border-r-2 border-orange-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Users className="w-5 h-5" />
                <span>Users ({users.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('revenue')}
                className={`w-full flex items-center space-x-3 px-4 py-3 text-left transition-colors ${
                  activeTab === 'revenue'
                    ? 'text-orange-600 border-r-2 border-orange-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <DollarSign className="w-5 h-5" />
                <span>Revenue</span>
              </button>
              <button
                onClick={() => setActiveTab('paymentGateways')}
                className={`w-full flex items-center space-x-3 px-4 py-3 text-left transition-colors ${
                  activeTab === 'paymentGateways'
                    ? 'text-orange-600 border-r-2 border-orange-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Settings className="w-5 h-5" />
                <span>Payment Gateways</span>
              </button>
              <button
                onClick={() => setActiveTab('notifications')}
                className={`w-full flex items-center space-x-3 px-4 py-3 text-left transition-colors ${
                  activeTab === 'notifications'
                    ? 'text-orange-600 border-r-2 border-orange-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Bell className="w-5 h-5" />
                <span>Notifications</span>
              </button>
              <button
                onClick={() => setActiveTab('contact')}
                className={`w-full flex items-center space-x-3 px-4 py-3 text-left transition-colors ${
                  activeTab === 'contact'
                    ? 'text-orange-600 border-r-2 border-orange-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Mail className="w-5 h-5" />
                <span>Contact</span>
                {pendingInquiries > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                    {pendingInquiries}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('vrTours')}
                className={`w-full flex items-center space-x-3 px-4 py-3 text-left transition-colors ${
                  activeTab === 'vrTours'
                    ? 'text-orange-600 border-r-2 border-orange-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <VideoIcon className="w-5 h-5" />
                <span>VR Tours</span>
                <span className="ml-auto bg-gray-200 text-gray-700 text-xs font-medium px-2 py-0.5 rounded-full">
                  {vrTours}
                </span>
              </button>
            </nav>
          </div>
          {/* Main Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <div>
                  {activeTab === 'dashboard' && (
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-6">Dashboard Overview</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-600">Total Destinations</p>
                              <p className="text-2xl font-bold text-gray-900 mt-1">{totalDestinations}</p>
                            </div>
                            <div className="p-3 bg-blue-100 rounded-lg">
                              <Map className="w-6 h-6 text-blue-600" />
                            </div>
                          </div>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-600">Total Videos</p>
                              <p className="text-2xl font-bold text-gray-900 mt-1">{totalVideos}</p>
                            </div>
                            <div className="p-3 bg-green-100 rounded-lg">
                              <VideoIcon className="w-6 h-6 text-green-600" />
                            </div>
                          </div>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-600">Active Users</p>
                              <p className="text-2xl font-bold text-gray-900 mt-1">{totalUsers}</p>
                            </div>
                            <div className="p-3 bg-purple-100 rounded-lg">
                              <Users className="w-6 h-6 text-purple-600" />
                            </div>
                          </div>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                              <p className="text-2xl font-bold text-gray-900 mt-1">₹{totalRevenue.toLocaleString()}</p>
                            </div>
                            <div className="p-3 bg-yellow-100 rounded-lg">
                              <DollarSign className="w-6 h-6 text-yellow-600" />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                          <div className="flex items-center">
                            <div className="p-2 bg-green-100 rounded-lg">
                              <Play className="w-5 h-5 text-green-600" />
                            </div>
                            <div className="ml-4">
                              <p className="text-sm font-medium text-gray-600">Active Videos</p>
                              <p className="text-xl font-bold text-gray-900">{activeVideos}</p>
                            </div>
                          </div>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                          <div className="flex items-center">
                            <div className="p-2 bg-indigo-100 rounded-lg">
                              <VideoIcon className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div className="ml-4">
                              <p className="text-sm font-medium text-gray-600">VR Tours</p>
                              <p className="text-xl font-bold text-gray-900">{vrTours}</p>
                            </div>
                          </div>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                          <div className="flex items-center">
                            <div className="p-2 bg-red-100 rounded-lg">
                              <Mail className="w-5 h-5 text-red-600" />
                            </div>
                            <div className="ml-4">
                              <p className="text-sm font-medium text-gray-600">Pending Inquiries</p>
                              <p className="text-xl font-bold text-gray-900">{pendingInquiries}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {activeTab === 'destinations' && (
                    <div>
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900">Destinations</h3>
                          <p className="text-gray-600 mt-1">Manage your travel destinations and their details</p>
                        </div>
                        <button
                          onClick={() => setShowAddDestination(true)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors shadow-sm"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Add Destination</span>
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {destinations.map((destination) => (
                          <div key={destination.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                            <div className="relative">
                              <img
                                src={destination.image}
                                alt={destination.name}
                                className="w-full h-48 object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = '/placeholder-destination.jpg';
                                }}
                              />
                              <div className="absolute top-3 right-3 flex space-x-2">
                                <button
                                  onClick={() => setEditingDestination(destination)}
                                  className="p-2 bg-white/80 hover:bg-white rounded-full shadow-sm transition-colors"
                                >
                                  <Edit className="w-4 h-4 text-gray-600" />
                                </button>
                                <button
                                  onClick={() => handleDeleteDestination(destination.id)}
                                  className="p-2 bg-white/80 hover:bg-white rounded-full shadow-sm transition-colors"
                                >
                                  <Trash2 className="w-4 h-4 text-red-600" />
                                </button>
                              </div>
                            </div>
                            <div className="p-5">
                              <div className="flex justify-between items-start">
                                <h4 className="font-bold text-gray-900 text-lg">{destination.name}</h4>
                                <span className="flex items-center text-sm text-gray-500">
                                  <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                                  {destination.rating}
                                </span>
                              </div>
                              <p className="text-gray-600 text-sm mt-1">{destination.location}</p>
                              <p className="text-gray-500 text-sm mt-3 line-clamp-2">{destination.description}</p>
                              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                                <div className="flex items-center text-sm text-gray-500">
                                  <Clock className="w-4 h-4 mr-1" />
                                  {destination.duration}
                                </div>
                                <div className="flex items-center text-sm text-gray-500">
                                  <UserCheck className="w-4 h-4 mr-1" />
                                  {destination.visitors}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {activeTab === 'videos' && (
                    <div>
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900">Videos</h3>
                          <p className="text-gray-600 mt-1">Manage your video content and VR tours</p>
                        </div>
                        <button
                          onClick={() => setShowAddVideo(true)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors shadow-sm"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Add Video</span>
                        </button>
                      </div>
                      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Video</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Destination</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {videos.map((video) => {
                                const destination = destinations.find(d => d.id === video.destinationId);
                                return (
                                  <tr key={video.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="flex items-center">
                                        <div className="flex-shrink-0 h-10 w-16 rounded-md overflow-hidden">
                                          <img
                                            src={`https://i.ytimg.com/vi/${video.youtubeId}/mqdefault.jpg`}
                                            alt={video.title}
                                            className="h-full w-full object-cover"
                                          />
                                        </div>
                                        <div className="ml-4">
                                          <div className="text-sm font-medium text-gray-900">{video.title}</div>
                                          <div className="text-sm text-gray-500 truncate max-w-xs">{video.youtubeId}</div>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="text-sm text-gray-900">{destination?.name || 'Unknown'}</div>
                                      <div className="text-sm text-gray-500">{destination?.location || 'N/A'}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                      {video.duration}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                        video.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                      }`}>
                                        {video.isActive ? 'Active' : 'Inactive'}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                      <div className="flex space-x-2">
                                        <button
                                          onClick={() => handleToggleVideoStatus(video)}
                                          className={`p-1.5 rounded-md ${
                                            video.isActive 
                                              ? 'text-green-600 hover:bg-green-100' 
                                              : 'text-gray-600 hover:bg-gray-100'
                                          }`}
                                          title={video.isActive ? 'Deactivate video' : 'Activate video'}
                                        >
                                          {video.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                        </button>
                                        <button
                                          onClick={() => setEditingVideo(video)}
                                          className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-md"
                                        >
                                          <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteVideo(video.id)}
                                          className="p-1.5 text-red-600 hover:bg-red-100 rounded-md"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                  {activeTab === 'featured' && (
                    <div className="max-w-4xl">
                      <div className="mb-6">
                        <h3 className="text-2xl font-bold text-gray-900">Featured Video</h3>
                        <p className="text-gray-600 mt-1">Set the featured video that appears on your homepage</p>
                      </div>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                          <form onSubmit={async (e) => {
                            e.preventDefault();
                            setIsSaving(true);
                            const formData = new FormData(e.target as HTMLFormElement);
                            const youtubeUrl = formData.get('youtubeUrl') as string;
                            const title = formData.get('title') as string;
                            const description = formData.get('description') as string;
                            const isEnabled = (e.target as HTMLFormElement).isEnabled?.checked || false;
                            
                            try {
                              await saveFeaturedVideo({
                                isEnabled,
                                youtubeUrl: youtubeUrl || '',
                                title: title || '',
                                description: description || '',
                              });
                            } finally {
                              setIsSaving(false);
                            }
                          }} className="space-y-6">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">YouTube Video URL</label>
                              <input
                                type="text"
                                name="youtubeUrl"
                                defaultValue={featuredVideo?.youtubeUrl || ''}
                                placeholder="e.g., https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Video Title (Optional)</label>
                              <input
                                type="text"
                                name="title"
                                defaultValue={featuredVideo?.title || ''}
                                placeholder="Enter a custom title for your video"
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
                              <textarea
                                name="description"
                                defaultValue={featuredVideo?.description || ''}
                                placeholder="Add a description for your featured video"
                                rows={3}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                            <div className="flex items-center space-x-3">
                              <input
                                type="checkbox"
                                id="isEnabled"
                                name="isEnabled"
                                defaultChecked={featuredVideo?.isEnabled || false}
                                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                              />
                              <label htmlFor="isEnabled" className="text-sm font-medium text-gray-700">Show video on website</label>
                            </div>
                            <button
                              type="submit"
                              disabled={isSaving}
                              className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2 shadow-sm ${isSaving ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                            >
                              {isSaving ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                  <span>Saving...</span>
                                </>
                              ) : (
                                <span>Update Featured Video</span>
                              )}
                            </button>
                          </form>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                          <h4 className="text-lg font-medium text-gray-900 mb-4">Preview</h4>
                          <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                            {featuredVideo?.isEnabled && featuredVideo.youtubeUrl ? (
                              <iframe
                                src={`https://www.youtube.com/embed/${extractYouTubeId(featuredVideo.youtubeUrl)}`}
                                title="Featured Video"
                                className="w-full h-full rounded-lg"
                                allowFullScreen
                              ></iframe>
                            ) : (
                              <div className="text-center text-gray-500">
                                <VideoIcon className="w-12 h-12 mx-auto mb-2" />
                                <p>Video will appear here when enabled</p>
                              </div>
                            )}
                          </div>
                          {featuredVideo?.title && (
                            <h5 className="font-medium text-gray-900 mt-4">{featuredVideo.title}</h5>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  {activeTab === 'users' && (
                    <div>
                      <div className="mb-6">
                        <h3 className="text-2xl font-bold text-gray-900">User Management</h3>
                        <p className="text-gray-600 mt-1">View and manage your platform users</p>
                      </div>
                      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Country</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subscription</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Join Date</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {users.map((user) => (
                                <tr key={user.uid} className="hover:bg-gray-50">
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                      <div className="flex-shrink-0 h-10 w-10">
                                        <img className="h-10 w-10 rounded-full object-cover" src={user.avatarUrl || '/placeholder-user.jpg'} alt="" />
                                      </div>
                                      <div className="ml-4">
                                        <div className="text-sm font-medium text-gray-900">{user.firstName} {user.lastName}</div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.country}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm capitalize">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                      user.subscription === 'premium' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                                    }`}>
                                      {user.subscription || 'free'}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {user.joinDate?.seconds ? new Date(user.joinDate.seconds * 1000).toLocaleDateString() : 'N/A'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
                  {activeTab === 'revenue' && (
                    <div>
                      <div className="mb-6">
                        <h3 className="text-2xl font-bold text-gray-900">Revenue Overview</h3>
                        <p className="text-gray-600 mt-1">Track your platform's financial performance</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                          <div className="flex items-center">
                            <div className="p-3 bg-green-100 rounded-lg">
                              <DollarSign className="w-6 h-6 text-green-600" />
                            </div>
                            <div className="ml-4">
                              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                              <p className="text-2xl font-bold text-gray-900">
                                ₹{totalRevenue.toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                          <div className="flex items-center">
                            <div className="p-3 bg-blue-100 rounded-lg">
                              <FileText className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="ml-4">
                              <p className="text-sm font-medium text-gray-600">Total Transactions</p>
                              <p className="text-2xl font-bold text-gray-900">{revenue.length}</p>
                            </div>
                          </div>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                          <div className="flex items-center">
                            <div className="p-3 bg-purple-100 rounded-lg">
                              <TrendingUp className="w-6 h-6 text-purple-600" />
                            </div>
                            <div className="ml-4">
                              <p className="text-sm font-medium text-gray-600">Avg. Transaction</p>
                              <p className="text-2xl font-bold text-gray-900">
                                ₹{revenue.length > 0 ? (totalRevenue / revenue.length).toFixed(2) : '0.00'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User Email</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Content</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {revenue.map((transaction) => (
                                <tr key={transaction.id} className="hover:bg-gray-50">
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {transaction.createdAt?.seconds ? new Date(transaction.createdAt.seconds * 1000).toLocaleString() : 'N/A'}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.userEmail}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{transaction.contentTitle}</td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{transaction.amount?.toLocaleString() || '0'}</td>
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
                    </div>
                  )}
                  {activeTab === 'paymentGateways' && (
                    <div>
                      <div className="mb-6">
                        <h3 className="text-2xl font-bold text-gray-900">Payment Gateways</h3>
                        <p className="text-gray-600 mt-1">Configure payment gateway settings for your platform</p>
                      </div>
                      <form onSubmit={async (e) => {
                        e.preventDefault();
                        setIsSaving(true);
                        const formData = new FormData(e.target as HTMLFormElement);
                        
                        const config: PaymentGatewayConfig = {
                          razorpay: {
                            keyId: formData.get('razorpayKeyId') as string,
                            keySecret: formData.get('razorpayKeySecret') as string,
                            isActive: formData.get('razorpayEnabled') === 'on',
                          },
                          cashfree: {
                            clientId: formData.get('cashfreeClientId') as string,
                            clientSecret: formData.get('cashfreeClientSecret') as string,
                            isActive: formData.get('cashfreeEnabled') === 'on',
                          },
                          paytm: {
                            merchantId: formData.get('paytmMerchantId') as string,
                            merchantKey: formData.get('paytmMerchantKey') as string,
                            isActive: formData.get('paytmEnabled') === 'on',
                          },
                          stripe: {
                            publishableKey: formData.get('stripePublishableKey') as string,
                            secretKey: formData.get('stripeSecretKey') as string,
                            webhookSecret: formData.get('stripeWebhookSecret') as string,
                            isActive: formData.get('stripeEnabled') === 'on',
                          }
                        };
                        
                        if (currentUser) {
                          try {
                            await setPaymentGatewayConfig(config, currentUser.uid);
                            alert('Payment gateway configuration saved successfully');
                          } catch (error) {
                            console.error('Error saving payment gateway config:', error);
                            alert('Failed to save payment gateway configuration: ' + (error as Error).message || 'Unknown error');
                          } finally {
                            setIsSaving(false);
                          }
                        }
                      }} className="space-y-8">
                        {/* Razorpay Configuration */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                          <div className="flex items-center justify-between mb-6">
                            <div>
                              <h4 className="text-lg font-medium text-gray-900">Razorpay</h4>
                              <p className="text-sm text-gray-500 mt-1">Indian payment gateway for domestic transactions</p>
                            </div>
                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="checkbox"
                                name="razorpayEnabled"
                                defaultChecked={paymentGatewayConfig?.razorpay?.isActive || false}
                                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                              />
                              <span className="text-sm font-medium text-gray-700">Enable</span>
                            </label>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Key ID</label>
                              <input
                                type="text"
                                name="razorpayKeyId"
                                defaultValue={paymentGatewayConfig?.razorpay?.keyId || ''}
                                placeholder="rzp_..."
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Key Secret</label>
                              <input
                                type="password"
                                name="razorpayKeySecret"
                                defaultValue={paymentGatewayConfig?.razorpay?.keySecret || ''}
                                placeholder="••••••••"
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Cashfree Configuration */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                          <div className="flex items-center justify-between mb-6">
                            <div>
                              <h4 className="text-lg font-medium text-gray-900">Cashfree</h4>
                              <p className="text-sm text-gray-500 mt-1">Indian payment gateway with global support</p>
                            </div>
                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="checkbox"
                                name="cashfreeEnabled"
                                defaultChecked={paymentGatewayConfig?.cashfree?.isActive || false}
                                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                              />
                              <span className="text-sm font-medium text-gray-700">Enable</span>
                            </label>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Client ID</label>
                              <input
                                type="text"
                                name="cashfreeClientId"
                                defaultValue={paymentGatewayConfig?.cashfree?.clientId || ''}
                                placeholder="CF..."
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Client Secret</label>
                              <input
                                type="password"
                                name="cashfreeClientSecret"
                                defaultValue={paymentGatewayConfig?.cashfree?.clientSecret || ''}
                                placeholder="••••••••"
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                          </div>
                        </div>
                        {/* Paytm Configuration */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                          <div className="flex items-center justify-between mb-6">
                            <div>
                              <h4 className="text-lg font-medium text-gray-900">Paytm</h4>
                              <p className="text-sm text-gray-500 mt-1">Popular Indian digital payment platform</p>
                            </div>
                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="checkbox"
                                name="paytmEnabled"
                                defaultChecked={paymentGatewayConfig?.paytm?.isActive || false}
                                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                              />
                              <span className="text-sm font-medium text-gray-700">Enable</span>
                            </label>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Merchant ID</label>
                              <input
                                type="text"
                                name="paytmMerchantId"
                                defaultValue={paymentGatewayConfig?.paytm?.merchantId || ''}
                                placeholder="MID..."
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Merchant Key</label>
                              <input
                                type="password"
                                name="paytmMerchantKey"
                                defaultValue={paymentGatewayConfig?.paytm?.merchantKey || ''}
                                placeholder="•••••••"
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                          </div>
                        </div>
                        {/* Stripe Configuration - Only keeping one instance */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                          <div className="flex items-center justify-between mb-6">
                            <div>
                              <h4 className="text-lg font-medium text-gray-900">Stripe</h4>
                              <p className="text-sm text-gray-500 mt-1">Global payment processor for international transactions</p>
                            </div>
                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input
                                type="checkbox"
                                name="stripeEnabled"
                                defaultChecked={paymentGatewayConfig?.stripe?.isActive || false}
                                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                              />
                              <span className="text-sm font-medium text-gray-700">Enable</span>
                            </label>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Publishable Key</label>
                              <input
                                type="text"
                                name="stripePublishableKey"
                                defaultValue={paymentGatewayConfig?.stripe?.publishableKey || ''}
                                placeholder="pk_live_..."
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Secret Key</label>
                              <input
                                type="password"
                                name="stripeSecretKey"
                                defaultValue={paymentGatewayConfig?.stripe?.secretKey || ''}
                                placeholder="•••••"
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-2">Webhook Secret</label>
                              <input
                                type="password"
                                name="stripeWebhookSecret"
                                defaultValue={paymentGatewayConfig?.stripe?.webhookSecret || ''}
                                placeholder="•••••"
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                          </div>
                        </div>
                        <button
                          type="submit"
                          disabled={isSaving}
                          className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2 shadow-sm ${isSaving ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                        >
                          {isSaving ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              <span>Saving...</span>
                            </>
                          ) : (
                            <span>Save Configuration</span>
                          )}
                        </button>
                      </form>
                    </div>
                  )}
                  {activeTab === 'notifications' && (
                    <div className="space-y-6">
                      <div className="mb-6">
                        <h3 className="text-2xl font-bold text-gray-900">Notifications</h3>
                        <p className="text-gray-600 mt-1">Send announcements and manage notification settings</p>
                      </div>
                      {/* Send Custom Notification Form */}
                      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h4 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                          <Send className="w-5 h-5 text-blue-500" />
                          <span>Send Custom Announcement</span>
                        </h4>
                        <form onSubmit={async (e) => {
                          e.preventDefault();
                          const formData = new FormData(e.target as HTMLFormElement);
                          const title = formData.get('title') as string;
                          const message = formData.get('message') as string;
                          const category = formData.get('category') as string;
                          const priority = formData.get('priority') as string;
                          const targetAudience = formData.get('targetAudience') as string;
                          const expiresIn = parseInt(formData.get('expiresIn') as string);
                          
                          if (!title || !message) {
                            alert('Please fill in all required fields');
                            return;
                          }
                          
                          // Call notification service to send custom announcement
                          try {
                            if (!currentUser) {
                              alert('You must be logged in to send notifications');
                              return;
                            }
                            
                            const announcement = {
                              title,
                              message,
                              category,
                              priority,
                              targetAudience,
                              expiresIn: expiresIn ? new Date(Date.now() + expiresIn * 24 * 60 * 60 * 1000) : undefined,
                              metadata: {}
                            };
                            
                            await notificationService.triggerCustomAnnouncement(announcement, currentUser.uid);
                            alert('Notification sent successfully!');
                            (e.target as HTMLFormElement).reset();
                          } catch (error) {
                            console.error('Error sending notification:', error);
                            alert('Failed to send notification: ' + (error as Error).message || 'Unknown error');
                          }
                        }} className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                              <input
                                type="text"
                                name="title"
                                placeholder="Announcement title..."
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                              <select
                                name="category"
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              >
                                <option value="new_content">New Content</option>
                                <option value="update">Update</option>
                                <option value="promotion">Promotion</option>
                                <option value="maintenance">Maintenance</option>
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                            <textarea
                              name="message"
                              placeholder="Your announcement message..."
                              rows={4}
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              required
                            />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                              <select
                                name="priority"
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="urgent">Urgent</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Target Audience</label>
                              <select
                                name="targetAudience"
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              >
                                <option value="all">All Users</option>
                                <option value="premium">Premium Users Only</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Expires In (days)</label>
                              <select
                                name="expiresIn"
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              >
                                <option value="1">1 Day</option>
                                <option value="3">3 Days</option>
                                <option value="7">7 Days</option>
                                <option value="14">14 Days</option>
                                <option value="30">30 Days</option>
                              </select>
                            </div>
                          </div>
                          <button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2 shadow-sm"
                          >
                            <Send className="w-4 h-4" />
                            <span>Send Announcement</span>
                          </button>
                        </form>
                      </div>
                      {/* Notification Statistics */}
                      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h4 className="text-lg font-semibold mb-4">Notification Statistics</h4>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                          <div className="text-center p-5 bg-blue-50 rounded-lg">
                            <div className="text-2xl font-bold text-blue-600">--</div>
                            <div className="text-sm text-blue-600 mt-1">Total Sent</div>
                          </div>
                          <div className="text-center p-5 bg-green-50 rounded-lg">
                            <div className="text-2xl font-bold text-green-600">--</div>
                            <div className="text-sm text-green-600 mt-1">Delivered</div>
                          </div>
                          <div className="text-center p-5 bg-yellow-50 rounded-lg">
                            <div className="text-2xl font-bold text-yellow-600">--</div>
                            <div className="text-sm text-yellow-600 mt-1">Read</div>
                          </div>
                          <div className="text-center p-5 bg-purple-50 rounded-lg">
                            <div className="text-2xl font-bold text-purple-600">--</div>
                            <div className="text-sm text-purple-600 mt-1">Clicked</div>
                          </div>
                        </div>
                        <div className="mt-4 text-sm text-gray-600">
                          <p>• Automatic notifications are sent when you add new destinations or VR tours</p>
                          <p>• Users receive real-time notifications and push messages</p>
                          <p>• Notification analytics are updated in real-time</p>
                        </div>
                      </div>
                    </div>
                  )}
                  {activeTab === 'contact' && (
                    <div className="space-y-6">
                      <div className="mb-6">
                        <h3 className="text-2xl font-bold text-gray-900">Contact Management</h3>
                        <p className="text-gray-600 mt-1">Manage contact information and customer inquiries</p>
                      </div>
                      {/* Contact Details Section */}
                      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center justify-between mb-6">
                          <h4 className="text-lg font-medium text-gray-900">Contact Information</h4>
                          <button
                            onClick={() => {
                              // Handle edit contact details
                              console.log('Edit contact details');
                            }}
                            className="text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1"
                          >
                            <Edit className="w-4 h-4" />
                            <span>Edit</span>
                          </button>
                        </div>
                        <div className="space-y-4">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <Mail className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-500">Email</p>
                              <p className="text-gray-900">{contactDetails?.email || 'Not set'}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                              <Phone className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-500">Phone</p>
                              <p className="text-gray-900">{contactDetails?.phone || 'Not set'}</p>
                            </div>
                          </div>
                          <div className="flex items-start space-x-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                              <MapPin className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-500">Address</p>
                              <p className="text-gray-900 whitespace-pre-line">{contactDetails?.address || 'Not set'}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* Contact Inquiries Section */}
                      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center justify-between mb-6">
                          <h4 className="text-lg font-medium text-gray-900">Contact Inquiries ({contactInquiries.length})</h4>
                          <div className="text-sm text-gray-500">
                            {contactInquiries.filter(i => i.status === 'new').length} pending
                          </div>
                        </div>
                        {contactInquiries.length === 0 ? (
                          <div className="text-center py-12 text-gray-500">
                            <Mail className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                            <p>No contact inquiries yet</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {contactInquiries.map((inquiry) => (
                              <div key={inquiry.id} className="border border-gray-200 rounded-lg p-5 hover:bg-gray-50">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                  <div>
                                    <h5 className="font-medium text-gray-900">{inquiry.subject}</h5>
                                    <p className="text-sm text-gray-600">From: {inquiry.name} ({inquiry.email})</p>
                                  </div>
                                  <div className="flex items-center space-x-3">
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(inquiry.status)}`}>
                                      {inquiry.status}
                                    </span>
                                    <select
                                      value={inquiry.status}
                                      onChange={(e) => handleUpdateContactInquiryStatus(inquiry.id, e.target.value as ContactInquiry['status'])}
                                      className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                      <option value="new">New</option>
                                      <option value="in-progress">In Progress</option>
                                      <option value="resolved">Resolved</option>
                                      <option value="archived">Archived</option>
                                    </select>
                                  </div>
                                </div>
                                <p className="text-gray-700 mb-4">{inquiry.message}</p>
                                <div className="text-xs text-gray-500">
                                  Received: {inquiry.createdAt?.toDate?.().toLocaleString() || 'Unknown date'}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {activeTab === 'vrTours' && (
                    <div>
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900">VR Tours</h3>
                          <p className="text-gray-600 mt-1">Manage your virtual reality tour content</p>
                        </div>
                        <div className="text-sm text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
                          Total VR Tours: {vrTours}
                        </div>
                      </div>
                      {vrTours === 0 ? (
                        <div className="text-center py-12 text-gray-500 bg-white rounded-xl shadow-sm border border-gray-100">
                          <VideoIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                          <p className="font-medium">No VR tours available</p>
                          <p className="text-sm mt-1">Add videos to destinations to create VR tours</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {videos.filter(video => video.youtubeId).map((video) => {
                            const destination = destinations.find(d => d.id === video.destinationId);
                            return (
                              <div key={video.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                                <div className="relative">
                                  <img
                                    src={video.thumbnailUrl || `https://i.ytimg.com/vi/${video.youtubeId}/mqdefault.jpg`}
                                    alt={video.title}
                                    className="w-full h-48 object-cover"
                                  />
                                  <div className="absolute top-3 right-3 flex space-x-2">
                                    <button
                                      onClick={() => handleToggleVideoStatus(video)}
                                      className={`p-2 rounded-full shadow-sm transition-colors ${
                                        video.isActive 
                                          ? 'bg-green-500 text-white hover:bg-green-600' 
                                          : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                      }`}
                                      title={video.isActive ? 'Deactivate VR tour' : 'Activate VR tour'}
                                    >
                                      {video.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                    </button>
                                    <button
                                      onClick={() => setEditingVideo(video)}
                                      className="p-2 bg-white/80 hover:bg-white rounded-full shadow-sm transition-colors"
                                    >
                                      <Edit className="w-4 h-4 text-gray-600" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteVideo(video.id)}
                                      className="p-2 bg-white/80 hover:bg-white rounded-full shadow-sm transition-colors"
                                    >
                                      <Trash2 className="w-4 h-4 text-red-600" />
                                    </button>
                                  </div>
                                  {video.isFeatured && (
                                    <div className="absolute top-3 left-3 bg-purple-500 text-white text-xs font-medium px-2 py-1 rounded-full">
                                      Featured
                                    </div>
                                  )}
                                </div>
                                <div className="p-5">
                                  <h4 className="font-bold text-gray-900 text-lg">{video.title}</h4>
                                  <p className="text-gray-600 text-sm mt-1">{destination?.name || 'Unknown Destination'}</p>
                                  <p className="text-gray-500 text-sm mt-3">{video.duration}</p>
                                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                                    <div className="flex items-center text-sm text-gray-500">
                                      <Eye className="w-4 h-4 mr-1" />
                                      {video.viewCount || 0} views
                                    </div>
                                    <div className="flex items-center text-sm">
                                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        video.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                      }`}>
                                        {video.isActive ? 'Active' : 'Inactive'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Add/Edit Modals */}
      {(showAddDestination || editingDestination) && (
        <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
            <div className="p-6 border-b bg-gray-50 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">
                {editingDestination ? 'Edit' : 'Add'} Destination
              </h3>
              <button 
                onClick={() => {
                  setShowAddDestination(false);
                  setEditingDestination(null);
                }}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <form 
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                const name = formData.get('name') as string;
                const location = formData.get('location') as string;
                const description = formData.get('description') as string;
                const rating = parseFloat(formData.get('rating') as string);
                const duration = formData.get('duration') as string;
                const visitors = formData.get('visitors') as string;
                const highlights = formData.get('highlights') as string;
                const vrAvailable = formData.get('vrAvailable') === 'on';
                
                if (!name || !location) {
                  alert('Please fill in all required fields');
                  return;
                }
                
                const data: Partial<Destination> = {
                  name,
                  location,
                  description,
                  rating: isNaN(rating) ? 0 : rating,
                  duration,
                  visitors,
                  highlights: highlights ? highlights.split(',').map(h => h.trim()) : [],
                  vrAvailable
                };
                
                const imageFile = (e.target as HTMLFormElement).image?.files?.[0];
                
                await handleSaveDestination(data, imageFile);
              }} 
              className="p-6 space-y-6 max-h-[calc(90vh-80px)] overflow-y-auto"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                  <input 
                    type="text" 
                    name="name"
                    defaultValue={editingDestination?.name || ''}
                    placeholder="Destination name" 
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <input 
                    type="text" 
                    name="location"
                    defaultValue={editingDestination?.location || ''}
                    placeholder="City, Country" 
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea 
                  name="description"
                  defaultValue={editingDestination?.description || ''}
                  placeholder="Describe the destination..." 
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rating (0-5)</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    min="0" 
                    max="5" 
                    name="rating"
                    defaultValue={editingDestination?.rating || ''}
                    placeholder="4.5" 
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
                  <input 
                    type="text" 
                    name="duration"
                    defaultValue={editingDestination?.duration || ''}
                    placeholder="e.g., 2-3 days" 
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Visitors</label>
                  <input 
                    type="text" 
                    name="visitors"
                    defaultValue={editingDestination?.visitors || ''}
                    placeholder="e.g., 100k annually" 
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Highlights</label>
                  <input 
                    type="text" 
                    name="highlights"
                    defaultValue={editingDestination?.highlights?.join(', ') || ''}
                    placeholder="Comma-separated" 
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                  />
                </div>
              </div>
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    name="vrAvailable"
                    defaultChecked={editingDestination?.vrAvailable || false}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">VR Available</span>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Image</label>
                <input 
                  type="file" 
                  name="image"
                  accept="image/*"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  {editingDestination ? 'Update' : 'Add'} Destination
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {(showAddVideo || editingVideo) && (
        <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
            <div className="p-6 border-b bg-gray-50 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">
                {editingVideo ? 'Edit' : 'Add'} Video
              </h3>
              <button 
                onClick={() => {
                  setShowAddVideo(false);
                  setEditingVideo(null);
                }}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <form 
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                const title = formData.get('title') as string;
                const description = formData.get('description') as string;
                const duration = formData.get('duration') as string;
                const youtubeId = formData.get('youtubeId') as string;
                const destinationId = formData.get('destinationId') as string;
                const isActive = formData.get('isActive') === 'on';
                const isFeatured = formData.get('isFeatured') === 'on';
                
                if (!title || !description || !duration || !youtubeId || !destinationId) {
                  alert('Please fill in all required fields');
                  return;
                }
                
                const data: Partial<Video> = {
                  title,
                  description,
                  duration,
                  youtubeId,
                  destinationId,
                  isActive,
                  isFeatured
                };
                
                await handleSaveVideo(data);
              }} 
              className="p-6 space-y-6 max-h-[calc(90vh-80px)] overflow-y-auto"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                  <input 
                    type="text" 
                    name="title"
                    defaultValue={editingVideo?.title || ''}
                    placeholder="Video title" 
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
                  <input 
                    type="text" 
                    name="duration"
                    defaultValue={editingVideo?.duration || ''}
                    placeholder="e.g., 1 hour 30 mins" 
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea 
                  name="description"
                  defaultValue={editingVideo?.description || ''}
                  placeholder="Describe the video..." 
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">YouTube ID</label>
                  <input 
                    type="text" 
                    name="youtubeId"
                    defaultValue={editingVideo?.youtubeId || ''}
                    placeholder="YouTube video ID" 
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Destination</label>
                  <select
                    name="destinationId"
                    defaultValue={editingVideo?.destinationId || ''}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    {destinations.map((destination) => (
                      <option key={destination.id} value={destination.id}>
                        {destination.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    name="isActive"
                    defaultChecked={editingVideo?.isActive || false}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Active</span>
                </label>
              </div>
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    name="isFeatured"
                    defaultChecked={editingVideo?.isFeatured || false}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Featured</span>
                </label>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  {editingVideo ? 'Update' : 'Add'} Video
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;