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

  // Subscribe to contact inquiries
  useEffect(() => {
    if (!isOpen || activeTab !== 'contact') return;
    const unsubscribe = subscribeToContactInquiries(
      (newInquiries) => {
        setContactInquiries(newInquiries);
      },
      (error) => {
        console.error('Error fetching contact inquiries:', error);
        alert('Failed to load contact inquiries.');
      }
    );
    return () => unsubscribe();
  }, [isOpen, activeTab]);

  // Subscribe to contact details
  useEffect(() => {
    if (!isOpen || activeTab !== 'contact') return;
    const unsubscribe = subscribeToContactDetails(
      (details) => {
        setContactDetails(details);
      },
      (error) => {
        console.error('Error fetching contact details:', error);
        alert('Failed to load contact details.');
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

  // Save payment gateway configuration
  const savePaymentGatewayConfig = async (config: PaymentGatewayConfig) => {
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
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-7xl w-full max-h-[95vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Admin Dashboard</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
            <nav className="flex-1 p-4 space-y-2">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeTab === 'dashboard' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'hover:bg-gray-100'
                }`}
              >
                <TrendingUp className="w-5 h-5" />
                <span>Dashboard</span>
              </button>
              
              <button
                onClick={() => setActiveTab('destinations')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeTab === 'destinations' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'hover:bg-gray-100'
                }`}
              >
                <Map className="w-5 h-5" />
                <span>Destinations</span>
              </button>
              
              <button
                onClick={() => setActiveTab('videos')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeTab === 'videos' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'hover:bg-gray-100'
                }`}
              >
                <VideoIcon className="w-5 h-5" />
                <span>Videos</span>
              </button>
              
              <button
                onClick={() => setActiveTab('featured')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeTab === 'featured' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'hover:bg-gray-100'
                }`}
              >
                <Star className="w-5 h-5" />
                <span>Featured Video</span>
              </button>
              
              <button
                onClick={() => setActiveTab('users')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeTab === 'users' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'hover:bg-gray-100'
                }`}
              >
                <Users className="w-5 h-5" />
                <span>Users</span>
              </button>
              
              <button
                onClick={() => setActiveTab('revenue')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeTab === 'revenue' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'hover:bg-gray-100'
                }`}
              >
                <DollarSign className="w-5 h-5" />
                <span>Revenue</span>
              </button>
              
              <button
                onClick={() => setActiveTab('paymentGateways')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeTab === 'paymentGateways' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'hover:bg-gray-100'
                }`}
              >
                <Settings className="w-5 h-5" />
                <span>Payment Gateways</span>
              </button>
              
              <button
                onClick={() => setActiveTab('notifications')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeTab === 'notifications' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'hover:bg-gray-100'
                }`}
              >
                <Bell className="w-5 h-5" />
                <span>Notifications</span>
              </button>
              
              <button
                onClick={() => setActiveTab('contact')}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeTab === 'contact' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'hover:bg-gray-100'
                }`}
              >
                <Mail className="w-5 h-5" />
                <span>Contact</span>
              </button>
            </nav>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              {activeTab === 'dashboard' && (
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-6">Dashboard Overview</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                      <div className="flex items-center">
                        <div className="p-3 bg-blue-100 rounded-lg">
                          <Map className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-500">Destinations</p>
                          <p className="text-2xl font-bold text-gray-900">{destinations.length}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                      <div className="flex items-center">
                        <div className="p-3 bg-green-100 rounded-lg">
                          <VideoIcon className="w-6 h-6 text-green-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-500">Videos</p>
                          <p className="text-2xl font-bold text-gray-900">{videos.length}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                      <div className="flex items-center">
                        <div className="p-3 bg-purple-100 rounded-lg">
                          <Users className="w-6 h-6 text-purple-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-500">Users</p>
                          <p className="text-2xl font-bold text-gray-900">{users.length}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                      <div className="flex items-center">
                        <div className="p-3 bg-yellow-100 rounded-lg">
                          <DollarSign className="w-6 h-6 text-yellow-600" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-500">Revenue</p>
                          <p className="text-2xl font-bold text-gray-900">
                            ₹{revenue.reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {activeTab === 'paymentGateways' && (
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-6">Payment Gateway Configuration</h3>
                  <form onSubmit={(e) => {
                    e.preventDefault();
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
                      savePaymentGatewayConfig(config)
                        .then(() => {
                          alert('Payment gateway configuration saved successfully');
                        })
                        .catch(error => {
                          console.error('Error saving payment gateway config:', error);
                          alert('Failed to save payment gateway configuration');
                        });
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
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Key ID</label>
                          <input
                            type="text"
                            name="razorpayKeyId"
                            defaultValue={paymentGatewayConfig?.razorpay?.keyId || ''}
                            placeholder="rzp_live_..."
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Key Secret</label>
                          <input
                            type="password"
                            name="razorpayKeySecret"
                            defaultValue={paymentGatewayConfig?.razorpay?.keySecret || ''}
                            placeholder="•••••••"
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
                    
                    {/* Stripe Configuration */}
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
                            placeholder="••••••••"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                      >
                        Save Configuration
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;