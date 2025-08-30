#!/bin/bash

# Firestore Security Rules Deployment Script
# This script deploys the security rules to fix permission errors

echo "=== Firebase Security Rules Deployment ==="
echo ""

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI is not installed."
    echo "Please install it by running: npm install -g firebase-tools"
    exit 1
fi

echo "✅ Firebase CLI found"

# Check if user is logged in
if ! firebase projects:list &> /dev/null; then
    echo "⚠️  You need to login to Firebase first"
    echo "Running: firebase login"
    firebase login
fi

echo "✅ Firebase authentication verified"

# Initialize Firebase project if needed
if [ ! -f ".firebaserc" ]; then
    echo "⚠️  Project not initialized. Initializing..."
    firebase init
else
    echo "✅ Firebase project already initialized"
fi

# Deploy Firestore rules
echo ""
echo "🚀 Deploying Firestore security rules..."
firebase deploy --only firestore:rules

if [ $? -eq 0 ]; then
    echo "✅ Firestore rules deployed successfully!"
else
    echo "❌ Failed to deploy Firestore rules"
    exit 1
fi

# Deploy Storage rules
echo ""
echo "🚀 Deploying Storage security rules..."
firebase deploy --only storage

if [ $? -eq 0 ]; then
    echo "✅ Storage rules deployed successfully!"
else
    echo "❌ Failed to deploy Storage rules"
    exit 1
fi

echo ""
echo "🎉 All security rules deployed successfully!"
echo ""
echo "Next steps:"
echo "1. Restart your development server"
echo "2. Clear browser cache and refresh"
echo "3. Test the VR Experience component"
echo ""