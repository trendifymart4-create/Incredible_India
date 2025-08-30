import React, { useState, useEffect } from 'react';
import { X, CreditCard, Lock, Shield, Check } from 'lucide-react';
import type { Destination } from '../api/destinations';
import { createTransaction, processPayment, subscribeToPaymentGatewayConfig, type PaymentGatewayConfig } from '../api/payments';
import { useAuth } from '../context/AuthContext';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: () => void;
  destination: Destination;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onPaymentSuccess,
  destination,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [currency, setCurrency] = useState('USD');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'razorpay' | 'cashfree' | 'paytm' | 'stripe'>('razorpay');
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [paymentGatewayConfig, setPaymentGatewayConfig] = useState<PaymentGatewayConfig | null>(null);
  const { currentUser } = useAuth();

  // Subscribe to payment gateway configuration
  useEffect(() => {
    if (!isOpen) return;

    const unsubscribe = subscribeToPaymentGatewayConfig(
      (config) => {
        setPaymentGatewayConfig(config);
      },
      (error) => {
        console.error('Error fetching payment gateway config:', error);
      }
    );

    return () => unsubscribe();
  }, [isOpen]);

  const currencies = [
    { code: 'USD', symbol: '$', rate: 1, flag: '🇺🇸' },
    { code: 'EUR', symbol: '€', rate: 0.85, flag: '🇪🇺' },
    { code: 'GBP', symbol: '£', rate: 0.73, flag: '🇬🇧' },
    { code: 'JPY', symbol: '¥', rate: 110, flag: '🇯🇵' },
    { code: 'INR', symbol: '₹', rate: 74, flag: '🇮🇳' },
  ];

  const currentCurrency = currencies.find(c => c.code === currency) || currencies[0];
  const price = (4.99 * currentCurrency.rate).toFixed(2);
  const amount = parseFloat(price);

  // Define all possible payment methods
  const allPaymentMethods = [
    { id: 'razorpay', name: 'Razorpay', description: 'Popular payment gateway in India' },
    { id: 'cashfree', name: 'Cashfree', description: 'Easy payment solutions' },
    { id: 'paytm', name: 'Paytm', description: 'India\'s largest mobile payment platform' },
    { id: 'stripe', name: 'Stripe', description: 'Global payment processing' },
  ];

  // Filter payment methods based on enabled gateways
  const enabledPaymentMethods = allPaymentMethods.filter(method => {
    if (!paymentGatewayConfig) return true; // Show all if config not loaded yet
    
    switch (method.id) {
      case 'razorpay':
        return paymentGatewayConfig.razorpay?.isActive !== false;
      case 'cashfree':
        return paymentGatewayConfig.cashfree?.isActive !== false;
      case 'paytm':
        return paymentGatewayConfig.paytm?.isActive !== false;
      case 'stripe':
        return paymentGatewayConfig.stripe?.isActive !== false;
      default:
        return true;
    }
  });

  // Set default selected payment method to the first enabled one
  useEffect(() => {
    if (enabledPaymentMethods.length > 0 && !enabledPaymentMethods.find(m => m.id === selectedPaymentMethod)) {
      setSelectedPaymentMethod(enabledPaymentMethods[0].id as any);
    }
  }, [paymentGatewayConfig, enabledPaymentMethods, selectedPaymentMethod]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    try {
      if (!currentUser) {
        throw new Error('You must be logged in to make a payment.');
      }
      
      // Create transaction if not already created
      let transactionIdToUse = transactionId;
      if (!transactionIdToUse) {
        transactionIdToUse = await createTransaction({
          userId: currentUser.uid,
          userEmail: currentUser.email || '',
          amount: amount,
          currency: currency,
          contentId: 'premium_subscription',
          contentType: 'premium',
          contentTitle: `Premium Subscription - ${destination.name}`,
          paymentMethod: selectedPaymentMethod,
        });
        setTransactionId(transactionIdToUse);
      }
      
      // Process payment with selected gateway
      const result = await processPayment(
        transactionIdToUse,
        selectedPaymentMethod,
        amount,
        currency
      );
      
      if (result.success) {
        onPaymentSuccess();
      } else {
        alert(result.error || 'Payment failed. Please try again.');
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      alert(error.message || 'Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Secure Payment</h2>
            <p className="text-sm text-gray-600">Unlock Premium VR Experience</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Order Summary */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-gray-900 mb-2">Order Summary</h3>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Premium VR Access</span>
              <span className="font-medium">
                {currentCurrency.symbol}{price} {currency}
              </span>
            </div>
          </div>

          {/* Currency Selector */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Currency
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              {currencies.map((curr) => (
                <option key={curr.code} value={curr.code}>
                  {curr.flag} {curr.code} ({curr.symbol})
                </option>
              ))}
            </select>
          </div>

          {/* Payment Method Selection */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select Payment Method
              </label>
              <div className="space-y-3">
                {enabledPaymentMethods.map((method) => (
                  <label
                    key={method.id}
                    className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedPaymentMethod === method.id
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method.id}
                      checked={selectedPaymentMethod === method.id}
                      onChange={() => setSelectedPaymentMethod(method.id as 'razorpay' | 'cashfree' | 'paytm' | 'stripe')}
                      className="w-4 h-4 text-orange-600 focus:ring-orange-500"
                    />
                    <div className="ml-3">
                      <div className="font-medium text-gray-900">{method.name}</div>
                      <div className="text-sm text-gray-500">{method.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Security Features */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-blue-800 mb-2">
                <Shield className="w-5 h-5" />
                <span className="font-medium">Secure Payment</span>
              </div>
              <ul className="text-sm text-blue-700 space-y-1">
                <li className="flex items-center space-x-2">
                  <Check className="w-4 h-4" />
                  <span>256-bit SSL encryption</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="w-4 h-4" />
                  <span>PCI DSS compliant</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Check className="w-4 h-4" />
                  <span>30-day money-back guarantee</span>
                </li>
              </ul>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isProcessing}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 px-6 rounded-lg font-semibold transition-all flex items-center justify-center space-x-2"
            >
              {isProcessing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Processing Payment...</span>
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  <span>Pay {currentCurrency.symbol}{price} {currency} with {enabledPaymentMethods.find(m => m.id === selectedPaymentMethod)?.name}</span>
                </>
              )}
            </button>
          </form>

          <p className="text-xs text-gray-500 text-center mt-4">
            By completing this purchase, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;