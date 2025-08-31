// Payments API functions
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDocs,
  getDoc,
  query,
  orderBy,
  where,
  serverTimestamp,
  Timestamp,
  setDoc,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../firebase';
import { addPurchasedContent, upgradeUserToPremium } from './users';

// Payment Gateway SDKs
import Razorpay from 'razorpay';
// @ts-ignore
import { load as loadCashfree } from '@cashfreepayments/cashfree-js';

// Browser-compatible Paytm checksum implementation
const PAYTM_IV = '@@@@&&&&####$$$$';

// Encrypt function using Web Crypto API
async function encrypt(input: string, key: string): Promise<string> {
  const enc = new TextEncoder();
  const keyBuffer = enc.encode(key.padEnd(16, '\0').substring(0, 16));
  const ivBuffer = enc.encode(PAYTM_IV);
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'AES-CBC' },
    false,
    ['encrypt']
  );
  
  const inputData = enc.encode(input);
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-CBC', iv: ivBuffer },
    cryptoKey,
    inputData
  );
  
  // Convert to base64
  const base64String = btoa(String.fromCharCode(...new Uint8Array(encrypted)));
  return base64String;
}

// Generate random string using Web Crypto API
async function generateRandomString(length: number): Promise<string> {
  const array = new Uint8Array((length * 3) / 4);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array));
}

// Calculate hash using Web Crypto API
async function calculateHash(params: string, salt: string): Promise<string> {
  const enc = new TextEncoder();
  const finalString = params + "|" + salt;
  const data = enc.encode(finalString);
  
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex + salt;
}

// Calculate checksum
async function calculateChecksum(params: string, key: string, salt: string): Promise<string> {
  const hashString = await calculateHash(params, salt);
  return await encrypt(hashString, key);
}

// Generate signature
async function generatePaytmSignature(params: any, key: string): Promise<string> {
  const paramString = typeof params === "string" ? params : Object.values(params).join('|');
  const salt = await generateRandomString(4);
  return await calculateChecksum(paramString, key, salt);
}

export interface Transaction {
  id: string;
  userId: string;
  userEmail: string;
  amount: number;
  currency: string;
  contentId: string;
  contentType: 'destination' | 'premium' | 'video';
  contentTitle: string;
  paymentMethod: string;
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  metadata?: Record<string, any>;
}

export interface CreateTransactionData {
  userId: string;
  userEmail: string;
  amount: number;
  currency: string;
  contentId: string;
  contentType: 'destination' | 'premium' | 'video';
  contentTitle: string;
  paymentMethod: string;
  paymentId?: string;
  metadata?: Record<string, any>;
}

export interface PaymentStats {
  totalRevenue: number;
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  revenueThisMonth: number;
  transactionsThisMonth: number;
  averageTransactionValue: number;
  topSellingContent: Array<{
    contentId: string;
    contentTitle: string;
    sales: number;
    revenue: number;
  }>;
}

// Create new transaction
export const createTransaction = async (data: CreateTransactionData): Promise<string> => {
  try {
    const transactionData: Omit<Transaction, 'id'> = {
      ...data,
      paymentStatus: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, 'transactions'), transactionData);
    return docRef.id;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to create transaction');
  }
};

// Update transaction status
export const updateTransactionStatus = async (
  transactionId: string,
  status: 'completed' | 'failed' | 'refunded',
  paymentId?: string
): Promise<void> => {
  try {
    const updateData: any = {
      paymentStatus: status,
      updatedAt: serverTimestamp()
    };
    
    if (paymentId) {
      updateData.paymentId = paymentId;
    }
    
    await updateDoc(doc(db, 'transactions', transactionId), updateData);
    
    // If payment completed, grant access to content
    if (status === 'completed') {
      const transactionDoc = await getDoc(doc(db, 'transactions', transactionId));
      if (transactionDoc.exists()) {
        const transaction = transactionDoc.data() as Transaction;
        await grantContentAccess(transaction);
      }
    }
  } catch (error: any) {
    throw new Error(error.message || 'Failed to update transaction status');
  }
};

// Grant content access after successful payment
export const grantContentAccess = async (transaction: Transaction): Promise<void> => {
  try {
    const { userId, contentId, contentType } = transaction;
    
    // Add purchased content to user profile
    await addPurchasedContent(userId, contentId);
    
    // If premium subscription, upgrade user
    if (contentType === 'premium') {
      await upgradeUserToPremium(userId);
    }
  } catch (error: any) {
    throw new Error(error.message || 'Failed to grant content access');
  }
};

// Process payment with selected gateway
export const processPayment = async (
  transactionId: string,
  paymentMethod: 'razorpay' | 'cashfree' | 'paytm' | 'stripe',
  amount: number,
  currency: string
): Promise<{ success: boolean; paymentId?: string; error?: string }> => {
  try {
    // Get payment gateway configuration
    const config = await getPaymentGatewayConfig();
    
    if (!config) {
      return { success: false, error: 'Payment gateway configuration not found' };
    }
    
    // Process payment based on selected method
    let result;
    switch (paymentMethod) {
      case 'razorpay':
        result = await processRazorpayPayment(amount, currency, transactionId, config);
        break;
      case 'cashfree':
        result = await processCashfreePayment(amount, currency, transactionId, config);
        break;
      case 'paytm':
        result = await processPaytmPayment(amount, currency, transactionId, config);
        break;
      case 'stripe':
        result = await processStripePayment(amount, currency, transactionId, config);
        break;
      default:
        return { success: false, error: 'Invalid payment method' };
    }
    
    // Update transaction status based on result
    if (result.success) {
      await updateTransactionStatus(transactionId, 'completed', result.paymentId);
    } else {
      await updateTransactionStatus(transactionId, 'failed');
    }
    
    return result;
  } catch (error: any) {
    await updateTransactionStatus(transactionId, 'failed');
    return { success: false, error: error.message || 'Payment processing failed' };
  }
};

// Get user transactions
export const getUserTransactions = async (userId: string): Promise<Transaction[]> => {
  try {
    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const transactions: Transaction[] = [];
    
    querySnapshot.forEach((doc) => {
      transactions.push({
        id: doc.id,
        ...doc.data()
      } as Transaction);
    });
    
    return transactions;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch user transactions');
  }
};

// Get all transactions (admin only)
export const getAllTransactions = async (): Promise<Transaction[]> => {
  try {
    const q = query(collection(db, 'transactions'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    const transactions: Transaction[] = [];
    
    querySnapshot.forEach((doc) => {
      transactions.push({
        id: doc.id,
        ...doc.data()
      } as Transaction);
    });
    
    return transactions;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch transactions');
  }
};

// Get payment statistics (admin only)
export const getPaymentStats = async (): Promise<PaymentStats> => {
  try {
    const transactions = await getAllTransactions();
    
    const totalTransactions = transactions.length;
    const successfulTransactions = transactions.filter(t => t.paymentStatus === 'completed').length;
    const failedTransactions = transactions.filter(t => t.paymentStatus === 'failed').length;
    
    const completedTransactions = transactions.filter(t => t.paymentStatus === 'completed');
    const totalRevenue = completedTransactions.reduce((sum, t) => sum + t.amount, 0);
    
    // Calculate this month's stats
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);
    
    const thisMonthTransactions = completedTransactions.filter(t => {
      if (t.createdAt && t.createdAt.toDate) {
        const transactionDate = t.createdAt.toDate();
        return transactionDate >= currentMonth;
      }
      return false;
    });
    
    const revenueThisMonth = thisMonthTransactions.reduce((sum, t) => sum + t.amount, 0);
    const transactionsThisMonth = thisMonthTransactions.length;
    
    const averageTransactionValue = totalRevenue > 0 ? totalRevenue / successfulTransactions : 0;
    
    // Calculate top selling content
    const contentSales: Record<string, { title: string; sales: number; revenue: number }> = {};
    
    completedTransactions.forEach(t => {
      if (!contentSales[t.contentId]) {
        contentSales[t.contentId] = {
          title: t.contentTitle,
          sales: 0,
          revenue: 0
        };
      }
      contentSales[t.contentId].sales++;
      contentSales[t.contentId].revenue += t.amount;
    });
    
    const topSellingContent = Object.entries(contentSales)
      .map(([contentId, data]) => ({
        contentId,
        contentTitle: data.title,
        sales: data.sales,
        revenue: data.revenue
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
    
    return {
      totalRevenue,
      totalTransactions,
      successfulTransactions,
      failedTransactions,
      revenueThisMonth,
      transactionsThisMonth,
      averageTransactionValue,
      topSellingContent
    };
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch payment statistics');
  }
};

// Refund transaction (admin only)
export const refundTransaction = async (transactionId: string): Promise<void> => {
  try {
    // Update transaction status
    await updateTransactionStatus(transactionId, 'refunded');
    
    // Remove content access (implementation depends on business logic)
    const transactionDoc = await getDoc(doc(db, 'transactions', transactionId));
    if (transactionDoc.exists()) {
      const transaction = transactionDoc.data() as Transaction;
      // Note: Implement content access removal logic here if needed
      console.log('Refund processed for transaction:', transaction.id);
    }
  } catch (error: any) {
    throw new Error(error.message || 'Failed to process refund');
  }
};

// Payment Gateway Configuration Interfaces
export interface PaymentGatewayConfig {
  razorpay?: {
    keyId: string;
    keySecret: string;
    isActive: boolean;
    enabled?: boolean;  // Add this property for backward compatibility
  };
  cashfree?: {
    clientId: string;
    clientSecret: string;
    isActive: boolean;
    enabled?: boolean;  // Add this property for backward compatibility
  };
  paytm?: {
    merchantId: string;
    merchantKey: string;
    isActive: boolean;
    enabled?: boolean;  // Add this property for backward compatibility
  };
  stripe?: {
    publishableKey: string;
    secretKey: string;
    webhookSecret: string;
    isActive: boolean;
    enabled?: boolean;  // Add this property for backward compatibility
  };
}

// Get payment gateway configuration
export const getPaymentGatewayConfig = async (): Promise<PaymentGatewayConfig | null> => {
  try {
    const docSnap = await getDoc(doc(db, 'config', 'paymentGateways'));
    
    if (docSnap.exists()) {
      return docSnap.data() as PaymentGatewayConfig;
    }
    
    return null;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch payment gateway config');
  }
};

// Set payment gateway configuration
export const setPaymentGatewayConfig = async (
  config: Omit<PaymentGatewayConfig, 'updatedAt'>,
  updatedBy: string
): Promise<void> => {
  try {
    const configData = {
      ...config,
      updatedAt: serverTimestamp(),
      updatedBy
    };
    
    await setDoc(doc(db, 'config', 'paymentGateways'), configData, { merge: true });
  } catch (error: any) {
    throw new Error(error.message || 'Failed to set payment gateway config');
  }
};

// Real-time listener for payment gateway config
export const subscribeToPaymentGatewayConfig = (
  callback: (config: PaymentGatewayConfig | null) => void,
  onError?: (error: Error) => void
) => {
  return onSnapshot(
    doc(db, 'config', 'paymentGateways'),
    (doc) => {
      if (doc.exists()) {
        callback(doc.data() as PaymentGatewayConfig);
      } else {
        callback(null);
      }
    },
    (error) => {
      console.error('Error in payment gateway config subscription:', error);
      if (onError) {
        onError(new Error(error.message || 'Failed to subscribe to payment gateway config'));
      }
    }
  );
};

// Process payment with Razorpay
export const processRazorpayPayment = async (
  amount: number,
  currency: string,
  transactionId: string,
  config: PaymentGatewayConfig
): Promise<{ success: boolean; paymentId?: string; error?: string }> => {
  try {
    if (!config.razorpay || !config.razorpay.isActive) {
      return { success: false, error: 'Razorpay is not configured or enabled' };
    }

    // Create order on backend (this would typically be done on the server)
    // For now, we'll simulate this with a direct API call
    const orderOptions = {
      amount: amount * 100, // Razorpay expects amount in paise
      currency,
      receipt: transactionId,
      payment_capture: 1
    };

    // In a real implementation, this would be a server-side API call
    // For now, we'll simulate the order creation
    const order = {
      id: `order_${Date.now()}`,
      ...orderOptions
    };

    // Load Razorpay checkout script
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        // Initialize Razorpay checkout
        const options = {
          key: config.razorpay.keyId,
          amount: orderOptions.amount,
          currency: orderOptions.currency,
          name: 'Incredible India VR',
          description: 'VR Experience Access',
          order_id: order.id,
          handler: function (response: any) {
            // Payment successful
            resolve({ success: true, paymentId: response.razorpay_payment_id });
          },
          prefill: {
            // Prefill customer information if available
          },
          theme: {
            color: '#F37254'
          }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', function (response: any) {
          // Payment failed
          resolve({
            success: false,
            error: response.error.description || 'Payment failed'
          });
        });

        // Open Razorpay checkout
        rzp.open();
      };
      script.onerror = () => {
        resolve({ success: false, error: 'Failed to load Razorpay checkout' });
      };
      document.head.appendChild(script);
    });
  } catch (error: any) {
    console.error('Razorpay payment error:', error);
    return { success: false, error: error.message || 'Razorpay payment failed' };
  }
};

// Process payment with Cashfree
export const processCashfreePayment = async (
  amount: number,
  currency: string,
  transactionId: string,
  config: PaymentGatewayConfig
): Promise<{ success: boolean; paymentId?: string; error?: string }> => {
  try {
    if (!config.cashfree || !config.cashfree.isActive) {
      return { success: false, error: 'Cashfree is not configured or enabled' };
    }

    // Initialize Cashfree using the load function
    const cf = await loadCashfree({
      mode: config.cashfree.clientId === "test" ? "sandbox" : "production" // Determine mode based on clientId or add a separate config field
    });

    // Create payment session
    const paymentSession = {
      payment_session_id: `session_${Date.now()}`,
      order_id: transactionId,
      order_amount: amount,
      order_currency: currency,
      customer_details: {
        customer_id: `customer_${Date.now()}`,
        customer_email: "customer@example.com",
        customer_phone: "99999"
      }
    };

    // In a real implementation, you would get the payment session from the Cashfree API
    // For now, we'll simulate this and directly redirect to Cashfree
    
    // Redirect to Cashfree payment page
    const mode = config.cashfree.clientId === "test" ? "sandbox" : "production";
    const baseUrl = mode === "sandbox"
      ? "https://sandbox.cashfree.com/pg"
      : "https://api.cashfree.com/pg";
      
    // Create a form to redirect to Cashfree
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = `${baseUrl}/orders/sessions`;
    
    // Add hidden input fields for payment details
    const paymentSessionIdInput = document.createElement('input');
    paymentSessionIdInput.type = 'hidden';
    paymentSessionIdInput.name = 'payment_session_id';
    paymentSessionIdInput.value = paymentSession.payment_session_id;
    form.appendChild(paymentSessionIdInput);
    
    document.body.appendChild(form);
    form.submit();
    
    // For demo purposes, we'll resolve with a success response
    // In a real implementation, you would handle the redirect and callback
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true, paymentId: paymentSession.payment_session_id });
      }, 1000);
    });
  } catch (error: any) {
    console.error('Cashfree payment error:', error);
    return { success: false, error: error.message || 'Cashfree payment failed' };
  }
};

// Process payment with Paytm
export const processPaytmPayment = async (
  amount: number,
  currency: string,
  transactionId: string,
  config: PaymentGatewayConfig
): Promise<{ success: boolean; paymentId?: string; error?: string }> => {
  try {
    if (!config.paytm || !config.paytm.isActive) {
      return { success: false, error: 'Paytm is not configured or enabled' };
    }

    // Prepare Paytm payment request
    const paytmParams: any = {};
    paytmParams.body = {
      requestType: "Payment",
      mid: config.paytm.merchantId,
      websiteName: "DEFAULT",
      orderId: transactionId,
      callbackUrl: `${window.location.origin}/paytm/callback`,
      txnAmount: {
        value: amount.toString(),
        currency: currency
      },
      userInfo: {
        custId: `customer_${Date.now()}`,
      }
    };

    // Generate checksum using our browser-compatible implementation
    const checksumString = await generatePaytmSignature(
      paytmParams.body,
      config.paytm.merchantKey
    );

    // Create form to redirect to Paytm
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = 'https://securegw.paytm.in/order/process'; // Production URL
    
    // For sandbox testing, use: https://securegw-stage.paytm.in/order/process
    if (config.paytm.merchantId === 'test') {
      form.action = 'https://securegw-stage.paytm.in/order/process';
    }
    
    // Add hidden input fields for payment details
    const dataInput = document.createElement('input');
    dataInput.type = 'hidden';
    dataInput.name = 'data';
    dataInput.value = JSON.stringify(paytmParams.body);
    form.appendChild(dataInput);
    
    const checksumInput = document.createElement('input');
    checksumInput.type = 'hidden';
    checksumInput.name = 'checksum';
    checksumInput.value = checksumString;
    form.appendChild(checksumInput);
    
    document.body.appendChild(form);
    form.submit();
    
    // For demo purposes, we'll resolve with a success response
    // In a real implementation, you would handle the redirect and callback
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true, paymentId: transactionId });
      }, 1000);
    });
  } catch (error: any) {
    console.error('Paytm payment error:', error);
    return { success: false, error: error.message || 'Paytm payment failed' };
  }
};

// Process payment with Stripe
export const processStripePayment = async (
  amount: number,
  currency: string,
  transactionId: string,
  config: PaymentGatewayConfig
): Promise<{ success: boolean; paymentId?: string; error?: string }> => {
  try {
    if (!config.stripe || !config.stripe.isActive) {
      return { success: false, error: 'Stripe is not configured or enabled' };
    }

    // Check if required Stripe configuration is present
    if (!config.stripe.publishableKey || !config.stripe.secretKey) {
      return { success: false, error: 'Stripe configuration is incomplete' };
    }

    // Import Firebase functions
    const { httpsCallable } = await import('firebase/functions');
    const { functions } = await import('../firebase');
    
    // Call the Firebase Cloud Function to create a Payment Intent
    const createPaymentIntent = httpsCallable(functions, 'createStripePaymentIntent');
    
    const result = await createPaymentIntent({
      amount,
      currency,
      transactionId
    });
    
    const data = result.data as any;
    
    if (!data.success) {
      return { success: false, error: 'Failed to create payment intent' };
    }
    
    // Load Stripe.js
    const { loadStripe } = await import('@stripe/stripe-js');
    const stripe = await loadStripe(config.stripe.publishableKey);
    
    if (!stripe) {
      return { success: false, error: 'Failed to load Stripe.js' };
    }
    
    // Confirm the payment using the client secret
    // Note: In a real implementation, you would collect payment method details from the user
    // For this example, we'll simulate a card payment
    const { error } = await stripe.confirmCardPayment(data.clientSecret);
    
    if (error) {
      console.error('Stripe payment error:', error);
      return { success: false, error: error.message || 'Stripe payment failed' };
    }
    
    // Payment successful
    return {
      success: true,
      paymentId: data.paymentIntentId
    };
  } catch (error: any) {
    console.error('Stripe payment error:', error);
    // Handle specific Firebase errors
    if (error.code === 'functions/failed-precondition') {
      return { success: false, error: error.message };
    }
    if (error.code === 'functions/invalid-argument') {
      return { success: false, error: error.message };
    }
    return { success: false, error: error.message || 'Stripe payment failed' };
  }
};

// Get transaction by ID
export const getTransaction = async (transactionId: string): Promise<Transaction | null> => {
  try {
    const docSnap = await getDoc(doc(db, 'transactions', transactionId));
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      } as Transaction;
    }
    
    return null;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to fetch transaction');
  }
};