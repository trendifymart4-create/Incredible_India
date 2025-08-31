# Firebase Setup Guide

This project uses Firebase for backend services including authentication, Firestore database, storage, and Cloud Messaging. Follow these steps to set up Firebase for your project:

## 1. Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter a project name (e.g., "Incredible India VR")
4. Accept the terms and conditions
5. Choose whether to enable Google Analytics (optional)
6. Click "Create project"

## 2. Register Your Web App

1. In the Firebase Console, click the web icon (</>) to register a new web app
2. Enter an app nickname (e.g., "Incredible India Web")
3. Check "Also set up Firebase Hosting" (optional)
4. Click "Register app"
5. Copy the Firebase configuration object (firebaseConfig)

## 3. Configure Environment Variables

Update your `.env` file with the Firebase configuration values:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id

# ReCAPTCHA Site Key (for App Check)
VITE_RECAPTCHA_SITE_KEY=your_recaptcha_site_key_here
```

## 4. Set Up Firestore Database

1. In the Firebase Console, go to "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" (for development) or "Start in locked mode" (for production)
4. Choose a location for your database
5. Click "Enable"

## 5. Configure Firestore Security Rules

In the Firebase Console, go to "Firestore Database" > "Rules" and update the rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Destinations collection
    match /destinations/{destinationId} {
      allow read: if true;  // Public read access
      allow create, update, delete: if request.auth != null && request.auth.token.admin == true;
    }
    
    // Users collection
    match /users/{userId} {
      allow read, update, delete: if request.auth != null && request.auth.uid == userId;
      allow create: if request.auth != null;
    }
    
    // Other collections can be added here as needed
  }
}
```

## 6. Set Up Firebase Authentication

1. In the Firebase Console, go to "Authentication"
2. Click "Get started"
3. Enable the sign-in methods you want to support:
   - Email/Password
   - Google
   - Facebook
   - Anonymous (optional)

## 7. Configure Cloud Storage (Optional)

1. In the Firebase Console, go to "Storage"
2. Click "Get started"
3. Follow the setup wizard to create a storage bucket
4. Configure storage security rules as needed

## 8. Set Up Firebase Cloud Messaging (Optional)

1. In the Firebase Console, go to "Project settings"
2. Scroll down to "Cloud Messaging"
3. Copy the "Server key" for use with your notification service

## 9. Set Up ReCAPTCHA for App Check

1. Go to the [ReCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
2. Register a new site
3. Choose reCAPTCHA v3
4. Add your domain(s)
5. Accept the terms of service
6. Submit and copy the site key
7. Add the site key to your `.env` file as `VITE_RECAPTCHA_SITE_KEY`

## 10. Testing the Setup

After configuring your environment variables:

1. Run the development server: `npm run dev`
2. Open the browser console to check for any Firebase errors
3. Navigate to the destinations page to verify that data is loaded from Firestore

If everything is set up correctly, you should see real data from your Firestore database instead of the fallback mock data.

## Troubleshooting

### Common Issues

1. **Permission Denied Errors**: Check your Firestore security rules
2. **AppCheck/ReCAPTCHA Errors**: Verify your ReCAPTCHA site key and domain configuration
3. **Connection Issues**: Ensure your Firebase configuration values are correct

### Using Firebase Emulators (Development)

For local development, you can use Firebase emulators:

1. Install the Firebase CLI: `npm install -g firebase-tools`
2. Login to Firebase: `firebase login`
3. Start the emulators: `firebase emulators:start`
4. Set `VITE_USE_FIREBASE_EMULATOR=true` in your `.env` file

## Security Notes

- Never commit your `.env` file to version control
- Use Firebase security rules to protect your data
- For production applications, use more restrictive security rules than the test mode rules
- Keep your Firebase Admin SDK credentials secure and never expose them in client-side code