import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye, EyeOff, LogIn, UserPlus } from 'lucide-react';
import { signInUser, signUpUser } from '../../api/auth';
import { mobileAuthManager } from '../../services/mobileAuth';
import { isMobileDevice } from '../../utils/deviceDetection';

interface MobileAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: () => void;
}

const MobileAuthModal: React.FC<MobileAuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
}) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    country: 'IN'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [isLoadingFacebook, setIsLoadingFacebook] = useState(false);
  const [error, setError] = useState('');

  // Handle redirect result when component mounts
  useEffect(() => {
    const handleRedirect = async () => {
      if (isMobileDevice()) {
        try {
          const result = await mobileAuthManager.checkRedirectResult();
          if (result) {
            onAuthSuccess();
          }
        } catch (error: any) {
          setError(error.message);
        }
      }
    };

    handleRedirect();
  }, [onAuthSuccess]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (isLogin) {
        await signInUser(formData.email, formData.password);
      } else {
        await signUpUser(formData.email, formData.password, {
          firstName: formData.firstName,
          lastName: formData.lastName,
          country: formData.country
        });
      }
      onAuthSuccess();
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoadingGoogle(true);
    setError('');
    
    try {
      await mobileAuthManager.signInWithGoogle();
      // For mobile redirect, success will be handled by useEffect
      if (!isMobileDevice()) {
        onAuthSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed');
    } finally {
      setIsLoadingGoogle(false);
    }
  };

  const handleFacebookSignIn = async () => {
    setIsLoadingFacebook(true);
    setError('');
    
    try {
      await mobileAuthManager.signInWithFacebook();
      // For mobile redirect, success will be handled by useEffect
      if (!isMobileDevice()) {
        onAuthSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Facebook sign-in failed');
    } finally {
      setIsLoadingFacebook(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setFormData({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      country: 'IN'
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-white rounded-t-3xl w-full max-h-[90vh] overflow-y-auto"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">
                {isLogin ? 'Welcome Back' : 'Create Account'}
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <div className="p-6">
              {error && (
                <motion.div
                  className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <p className="text-red-800 text-sm">{error}</p>
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {!isLogin && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <input
                        type="text"
                        name="firstName"
                        placeholder="First Name"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        name="lastName"
                        placeholder="Last Name"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors"
                  />
                </div>

                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                <motion.button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white font-medium py-3 rounded-lg flex items-center justify-center space-x-2 transition-colors"
                  whileHover={!isLoading ? { scale: 1.02 } : {}}
                  whileTap={!isLoading ? { scale: 0.98 } : {}}
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      {isLogin ? <LogIn size={18} /> : <UserPlus size={18} />}
                      <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                    </>
                  )}
                </motion.button>
              </form>

              {/* Social Authentication */}
              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Or continue with</span>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  {/* Google Sign In Button */}
                  <motion.button
                    onClick={handleGoogleSignIn}
                    disabled={isLoadingGoogle || isLoadingFacebook || isLoading}
                    className="w-full inline-flex justify-center py-3 px-4 border border-gray-300 rounded-lg bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                    whileHover={!isLoadingGoogle ? { scale: 1.02 } : {}}
                    whileTap={!isLoadingGoogle ? { scale: 0.98 } : {}}
                  >
                    {isLoadingGoogle ? (
                      <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                          <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          />
                          <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          />
                        </svg>
                        <span className="ml-2">Google</span>
                      </>
                    )}
                  </motion.button>

                  {/* Facebook Sign In Button */}
                  <motion.button
                    onClick={handleFacebookSignIn}
                    disabled={isLoadingFacebook || isLoadingGoogle || isLoading}
                    className="w-full inline-flex justify-center py-3 px-4 border border-gray-300 rounded-lg bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
                    whileHover={!isLoadingFacebook ? { scale: 1.02 } : {}}
                    whileTap={!isLoadingFacebook ? { scale: 0.98 } : {}}
                  >
                    {isLoadingFacebook ? (
                      <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                        </svg>
                        <span className="ml-2">Facebook</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </div>

              {/* Toggle Mode */}
              <div className="mt-6 text-center">
                <p className="text-gray-600 mb-2">
                  {isLogin ? "Don't have an account?" : 'Already have an account?'}
                </p>
                <button
                  onClick={toggleMode}
                  className="text-orange-500 font-medium hover:underline"
                >
                  {isLogin ? 'Create Account' : 'Sign In'}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MobileAuthModal;