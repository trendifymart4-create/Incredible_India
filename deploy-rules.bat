@echo off
echo === Firebase Security Rules Deployment ===
echo.

REM Check if Firebase CLI is installed
firebase --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Firebase CLI is not installed.
    echo Please install it by running: npm install -g firebase-tools
    pause
    exit /b 1
)

echo ✅ Firebase CLI found

REM Check if user is logged in
firebase projects:list >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️ You need to login to Firebase first
    echo Running: firebase login
    firebase login
)

echo ✅ Firebase authentication verified

REM Initialize Firebase project if needed
if not exist ".firebaserc" (
    echo ⚠️ Project not initialized. Initializing...
    firebase init
) else (
    echo ✅ Firebase project already initialized
)

REM Deploy Firestore rules
echo.
echo 🚀 Deploying Firestore security rules...
firebase deploy --only firestore:rules

if %errorlevel% neq 0 (
    echo ❌ Failed to deploy Firestore rules
    pause
    exit /b 1
)

echo ✅ Firestore rules deployed successfully!

REM Deploy Storage rules
echo.
echo 🚀 Deploying Storage security rules...
firebase deploy --only storage

if %errorlevel% neq 0 (
    echo ❌ Failed to deploy Storage rules
    pause
    exit /b 1
)

echo ✅ Storage rules deployed successfully!

echo.
echo 🎉 All security rules deployed successfully!
echo.
echo Next steps:
echo 1. Restart your development server
echo 2. Clear browser cache and refresh
echo 3. Test the VR Experience component
echo.
pause