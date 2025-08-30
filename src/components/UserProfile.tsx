import React, { useState, useEffect } from 'react';
import {
  User,
  Settings,
  History,
  Heart,
  CreditCard,
  Bell,
  Star,
  Calendar,
  MapPin,
  Edit3,
  Save,
  X,
  Crown,
  ShoppingBag,
  Eye,
  Download
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getUserTransactions, type Transaction } from '../api/payments';
import { updateProfile } from 'firebase/auth';
import { updateUserProfile } from '../api/users';
import { useFavorites } from '../context/FavoritesContext';
import { auth } from '../firebase';
import PaymentModal from './PaymentModal';
import type { Destination } from '../api/destinations';

interface UserProfileProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'profile' | 'purchases' | 'favorites' | 'settings' | 'subscription';

const UserProfile: React.FC<UserProfileProps> = ({ isOpen, onClose }) => {
  const { currentUser } = useAuth();
  const { favorites, isLoading: favoritesLoading } = useFavorites();
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  
  // Editable user data
  const [editData, setEditData] = useState({
    firstName: currentUser?.firstName || '',
    lastName: currentUser?.lastName || '',
    country: currentUser?.country || '',
    displayName: currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : ''
  });

  // Mock destination for subscription purchase
  const subscriptionDestination: Destination = {
    id: 'premium-subscription',
    name: 'Premium Subscription',
    location: 'Global',
    description: 'Unlock unlimited access to all VR experiences',
    image: '',
    rating: 5,
    duration: 'Monthly',
    visitors: 'Unlimited',
    highlights: ['Unlimited VR Experiences', '4K Video Quality', 'Offline Downloads'],
    vrAvailable: true,
    isActive: true,
    createdBy: '',
    createdAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any,
    updatedAt: { seconds: Date.now() / 1000, nanoseconds: 0 } as any
  };

  useEffect(() => {
    if (currentUser && activeTab === 'purchases') {
      loadTransactions();
    }
  }, [currentUser, activeTab]);

  const loadTransactions = async () => {
    if (!currentUser) return;
    
    setIsLoading(true);
    try {
      const userTransactions = await getUserTransactions(currentUser.uid);
      setTransactions(userTransactions);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    if (!auth.currentUser) return;
    
    try {
      // Update display name
      await updateProfile(auth.currentUser, {
        displayName: `${editData.firstName} ${editData.lastName}`
      });
      
      // Update user document in Firestore
      const updateData: any = {
        firstName: editData.firstName,
        lastName: editData.lastName,
        country: editData.country
      };
      
      // Upload avatar if selected
      if (avatarFile) {
        try {
          // Import storage functions
          const { uploadUserAvatar } = await import('../api/storage');
          const result = await uploadUserAvatar(avatarFile, auth.currentUser.uid);
          updateData.avatarUrl = result.url;
        } catch (uploadError) {
          console.error('Error uploading avatar:', uploadError);
          alert('Profile updated but avatar upload failed.');
        }
      }
      
      await updateUserProfile(auth.currentUser.uid, updateData);
      
      setIsEditing(false);
      setAvatarFile(null);
      setAvatarPreview(null);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      completed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[status as keyof typeof statusStyles]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <User className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">
                  {currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'User Profile'}
                </h2>
                <p className="opacity-90">{currentUser?.email}</p>
                <div className="flex items-center space-x-2 mt-1">
                  {currentUser?.subscription === 'premium' && (
                    <div className="flex items-center space-x-1 text-yellow-300">
                      <Crown className="w-4 h-4" />
                      <span className="text-sm font-medium">Premium Member</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'profile', label: 'Profile', icon: User },
              { id: 'purchases', label: 'Purchases', icon: ShoppingBag },
              { id: 'favorites', label: 'Favorites', icon: Heart },
              { id: 'subscription', label: 'Subscription', icon: Crown },
              { id: 'settings', label: 'Settings', icon: Settings }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as TabType)}
                className={`py-4 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === id
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Personal Information</h3>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center space-x-2 text-orange-500 hover:text-orange-600"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                ) : (
                  <div className="flex space-x-2">
                    <button
                      onClick={handleSaveProfile}
                      className="flex items-center space-x-2 bg-green-500 text-white px-3 py-1 rounded-lg hover:bg-green-600"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setAvatarFile(null);
                        setAvatarPreview(null);
                      }}
                      className="flex items-center space-x-2 bg-gray-500 text-white px-3 py-1 rounded-lg hover:bg-gray-600"
                    >
                      <X className="w-4 h-4" />
                      <span>Cancel</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Avatar Section */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Profile Picture</label>
                  <div className="flex items-center space-x-6">
                    <div className="relative">
                      {isEditing ? (
                        <>
                          <img
                            src={avatarPreview || currentUser?.avatarUrl || `https://ui-avatars.com/api/?name=${currentUser?.firstName}+${currentUser?.lastName}&background=random`}
                            alt="Profile"
                            className="w-24 h-24 rounded-full object-cover border-4 border-white shadow"
                          />
                          <label className="absolute bottom-0 right-0 bg-orange-500 rounded-full p-2 cursor-pointer hover:bg-orange-600 transition-colors">
                            <Edit3 className="w-4 h-4 text-white" />
                            <input
                              type="file"
                              className="hidden"
                              accept="image/*"
                              onChange={handleAvatarChange}
                            />
                          </label>
                        </>
                      ) : (
                        <img
                          src={currentUser?.avatarUrl || `https://ui-avatars.com/api/?name=${currentUser?.firstName}+${currentUser?.lastName}&background=random`}
                          alt="Profile"
                          className="w-24 h-24 rounded-full object-cover border-4 border-white shadow"
                        />
                      )}
                    </div>
                    {isEditing && (
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Click the pencil to upload a new profile picture</p>
                        <p className="text-xs text-gray-500">JPG, PNG, or GIF. Max 5MB.</p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.firstName}
                      onChange={(e) => setEditData({...editData, firstName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900 p-2 bg-gray-50 rounded-lg">{currentUser?.firstName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.lastName}
                      onChange={(e) => setEditData({...editData, lastName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900 p-2 bg-gray-50 rounded-lg">{currentUser?.lastName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <p className="text-gray-900 p-2 bg-gray-50 rounded-lg">{currentUser?.email}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.country}
                      onChange={(e) => setEditData({...editData, country: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900 p-2 bg-gray-50 rounded-lg">{currentUser?.country}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Member Since</label>
                  <p className="text-gray-900 p-2 bg-gray-50 rounded-lg">
                    {formatDate(currentUser?.joinDate)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subscription</label>
                  <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
                    {currentUser?.subscription === 'premium' && <Crown className="w-4 h-4 text-yellow-500" />}
                    <p className="text-gray-900 capitalize">{currentUser?.subscription || 'Free'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Purchases Tab */}
          {activeTab === 'purchases' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Purchase History</h3>
              
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
                  <p className="text-gray-600 mt-2">Loading transactions...</p>
                </div>
              ) : transactions.length > 0 ? (
                <div className="space-y-3">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium text-gray-900">{transaction.contentTitle}</h4>
                          <p className="text-sm text-gray-600 capitalize">{transaction.contentType}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">
                            {transaction.currency} {transaction.amount}
                          </p>
                          {getStatusBadge(transaction.paymentStatus)}
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-sm text-gray-500">
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(transaction.createdAt)}</span>
                        </span>
                        {transaction.paymentId && (
                          <span className="font-mono">ID: {transaction.paymentId.slice(-8)}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <ShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No purchases yet</h4>
                  <p className="text-gray-600">Start exploring our amazing destinations!</p>
                </div>
              )}
            </div>
          )}

          {/* Favorites Tab */}
          {activeTab === 'favorites' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Favorite Destinations</h3>
              {favoritesLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
                  <p className="text-gray-600 mt-2">Loading favorites...</p>
                </div>
              ) : favorites.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {favorites.map((favorite) => (
                    <div key={favorite.id} className="bg-gray-50 rounded-lg p-4 flex items-center space-x-4">
                      {favorite.destination?.image ? (
                        <img
                          src={favorite.destination.image}
                          alt={favorite.destination.name}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                          <MapPin className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{favorite.destination?.name || 'Unknown Destination'}</h4>
                        <p className="text-sm text-gray-600">{favorite.destination?.location || ''}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Added {formatDate(favorite.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Heart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No favorites yet</h4>
                  <p className="text-gray-600">Start adding destinations to your favorites!</p>
                </div>
              )}
            </div>
          )}

          {/* Subscription Tab */}
          {activeTab === 'subscription' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Subscription Management</h3>
              
              <div className="bg-gradient-to-br from-orange-50 to-yellow-50 border border-orange-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Crown className="w-8 h-8 text-orange-500" />
                    <div>
                      <h4 className="text-xl font-bold text-gray-900">
                        {currentUser?.subscription === 'premium' ? 'Premium Plan' : 'Free Plan'}
                      </h4>
                      <p className="text-gray-600">
                        {currentUser?.subscription === 'premium' 
                          ? 'Unlimited access to all VR experiences'
                          : 'Limited access to basic features'
                        }
                      </p>
                    </div>
                  </div>
                  {currentUser?.subscription !== 'premium' && (
                    <button
                      className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-3 rounded-lg font-medium hover:from-orange-600 hover:to-red-600 transition-all"
                      onClick={() => setIsPaymentModalOpen(true)}
                    >
                      Upgrade to Premium
                    </button>
                  )}
                </div>

                {currentUser?.subscription === 'premium' ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div className="text-center p-4 bg-white bg-opacity-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">∞</div>
                      <div className="text-sm text-gray-600">VR Experiences</div>
                    </div>
                    <div className="text-center p-4 bg-white bg-opacity-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">4K</div>
                      <div className="text-sm text-gray-600">Video Quality</div>
                    </div>
                    <div className="text-center p-4 bg-white bg-opacity-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">✓</div>
                      <div className="text-sm text-gray-600">Priority Support</div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white bg-opacity-50 rounded-lg p-4 mt-4">
                    <h5 className="font-semibold mb-2">Premium Benefits:</h5>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>• Unlimited VR experiences</li>
                      <li>• 4K video quality</li>
                      <li>• Offline downloads</li>
                      <li>• Priority customer support</li>
                      <li>• Early access to new destinations</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Account Settings</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Bell className="w-5 h-5 text-gray-600" />
                    <div>
                      <h4 className="font-medium">Email Notifications</h4>
                      <p className="text-sm text-gray-600">Receive updates about new destinations and offers</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Download className="w-5 h-5 text-gray-600" />
                    <div>
                      <h4 className="font-medium">Auto Downloads</h4>
                      <p className="text-sm text-gray-600">Automatically download VR content for offline viewing</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                  </label>
                </div>

                <div className="border-t pt-4">
                  <h5 className="font-medium mb-4 text-red-600">Danger Zone</h5>
                  <div className="space-y-3">
                    <button className="w-full text-left p-4 border border-red-200 rounded-lg text-red-600 hover:bg-red-50">
                      <div className="font-medium">Delete Account</div>
                      <div className="text-sm opacity-75">Permanently delete your account and all data</div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Payment Modal for Subscription Upgrade */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onPaymentSuccess={() => {
          // Refresh user data to reflect premium status
          if (currentUser) {
            // In a real implementation, you would refresh the user data from the server
            // For now, we'll just close the modal
            setIsPaymentModalOpen(false);
            // You might want to show a success message here
            alert('Subscription upgraded successfully!');
          }
        }}
        destination={subscriptionDestination}
      />
    </div>
  );
};

export default UserProfile;
