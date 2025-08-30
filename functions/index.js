const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

// Create a Stripe Payment Intent
exports.createStripePaymentIntent = functions.https.onCall(async (data, context) => {
  console.log('createStripePaymentIntent called with data:', data);
  
  // Check if user is authenticated
  if (!context.auth) {
    console.log('User not authenticated');
    throw new functions.https.HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }

  const { amount, currency, transactionId } = data;
  console.log('Processing payment for transaction:', transactionId);

  // Validate input
  if (!amount || !currency || !transactionId) {
    console.log('Missing required parameters:', { amount, currency, transactionId });
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Missing required parameters: amount, currency, transactionId'
    );
  }

  try {
    // Get Stripe configuration from Firestore
    console.log('Fetching payment gateway configuration from Firestore');
    const configDoc = await admin.firestore().collection('config').doc('paymentGateways').get();
    if (!configDoc.exists) {
      console.log('Payment gateway configuration not found');
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Payment gateway configuration not found'
      );
    }

    const config = configDoc.data();
    console.log('Configuration data:', config);
    
    if (!config.stripe || !config.stripe.isActive) {
      console.log('Stripe is not configured or enabled');
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Stripe is not configured or enabled'
      );
    }

    // Validate required Stripe configuration
    if (!config.stripe.secretKey) {
      console.log('Stripe secret key is missing');
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Stripe secret key is missing. Please configure it in the Admin Panel.'
      );
    }

    // Initialize Stripe with the secret key from Firestore
    console.log('Initializing Stripe with secret key');
    const Stripe = require('stripe');
    let stripe;
    try {
      stripe = Stripe(config.stripe.secretKey);
      console.log('Stripe initialized successfully');
    } catch (initError) {
      console.error('Error initializing Stripe:', initError);
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Invalid Stripe secret key. Please check your configuration in the Admin Panel.'
      );
    }

    // Create a Payment Intent
    console.log('Creating payment intent with amount:', amount, 'currency:', currency);
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to smallest currency unit
      currency: currency.toLowerCase(),
      metadata: {
        transactionId: transactionId,
        userId: context.auth.uid
      },
      // Enable Indian payment methods
      payment_method_types: [
        'card',
        'ideal',
        'bancontact',
        'sofort',
        'giropay',
        'eps',
        'p24',
        'sepa_debit',
        'boleto',
        'oxxo',
        'klarna',
        'affirm',
        'afterpay_clearpay'
      ]
    });

    console.log('Payment intent created successfully:', paymentIntent.id);
    return {
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    };
  } catch (error) {
    console.error('Error creating payment intent:', error);
    // Handle specific Firestore errors
    if (error.code === 'failed-precondition' || error.code === 'invalid-argument') {
      throw error;
    }
    throw new functions.https.HttpsError(
      'internal',
      'Failed to create payment intent: ' + error.message
    );
  }
});

// Stripe Webhook Handler
exports.stripeWebhook = functions.https.onRequest(async (req, res) => {
  // Add CORS headers
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).send();
    return;
  }
  
  try {
    // Get Stripe configuration from Firestore
    const configDoc = await admin.firestore().collection('config').doc('paymentGateways').get();
    if (!configDoc.exists) {
      console.log('Payment gateway configuration not found');
      return res.status(500).send('Payment gateway configuration not found');
    }

    const config = configDoc.data();
    if (!config.stripe || !config.stripe.isActive || !config.stripe.secretKey || !config.stripe.webhookSecret) {
      console.log('Stripe is not properly configured');
      return res.status(500).send('Stripe is not properly configured');
    }

    // Initialize Stripe with the secret key from Firestore
    const Stripe = require('stripe');
    const stripe = Stripe(config.stripe.secretKey);
    
    const sig = req.headers['stripe-signature'];
    const endpointSecret = config.stripe.webhookSecret;

    let event;

    try {
      event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntentSucceeded = event.data.object;
        console.log('Payment succeeded:', paymentIntentSucceeded.id);
        
        // Update transaction status in Firestore
        const transactionId = paymentIntentSucceeded.metadata.transactionId;
        if (transactionId) {
          try {
            await admin.firestore().collection('transactions').doc(transactionId).update({
              paymentStatus: 'completed',
              paymentId: paymentIntentSucceeded.id,
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            
            // If this was a premium subscription, update user subscription status
            const transactionDoc = await admin.firestore().collection('transactions').doc(transactionId).get();
            if (transactionDoc.exists) {
              const transaction = transactionDoc.data();
              if (transaction.contentType === 'premium') {
                await admin.firestore().collection('users').doc(transaction.userId).update({
                  subscription: 'premium',
                  updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
              }
            }
          } catch (error) {
            console.error('Error updating transaction status:', error);
          }
        }
        break;
      case 'payment_intent.payment_failed':
        const paymentIntentFailed = event.data.object;
        console.log('Payment failed:', paymentIntentFailed.id);
        
        // Update transaction status in Firestore
        const failedTransactionId = paymentIntentFailed.metadata.transactionId;
        if (failedTransactionId) {
          try {
            await admin.firestore().collection('transactions').doc(failedTransactionId).update({
              paymentStatus: 'failed',
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
          } catch (error) {
            console.error('Error updating transaction status:', error);
          }
        }
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
   }

    res.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).send('Error processing webhook');
  }
});