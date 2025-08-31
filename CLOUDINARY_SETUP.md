# Cloudinary Setup Guide

This project uses Cloudinary for image management. Follow these steps to set up Cloudinary for your project:

## 1. Create a Cloudinary Account

1. Go to [Cloudinary](https://cloudinary.com/) and sign up for a free account
2. After signing up, you'll be taken to your Cloudinary dashboard

## 2. Get Your Cloudinary Credentials

From your Cloudinary dashboard, find the following information:
- Cloud Name
- API Key
- API Secret

These can be found in your dashboard under "Account Details".

## 3. Create an Unsigned Upload Preset

For browser-based uploads, you need to create an unsigned upload preset:

1. In your Cloudinary dashboard, go to "Settings" (gear icon)
2. Click on the "Upload" tab
3. Scroll down to "Upload presets" and click "Add upload preset"
4. Set the following options:
   - Name: Choose a name for your preset (e.g., "destination-uploads")
   - Signing Mode: Unsigned
   - Folder: Set to "destinations" (or leave empty to use the folder specified in code)
5. Click "Save"

## 4. Configure Environment Variables

Update your `.env` file with the following variables:

```env
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name_here
VITE_CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
VITE_CLOUDINARY_UPLOAD_PRESET=your_upload_preset_here
```

Replace the placeholder values with your actual Cloudinary credentials and upload preset name.

## 5. Security Notes

- Never expose your API Secret in client-side code
- The current implementation uses unsigned uploads for simplicity
- For production applications, consider implementing signed uploads through your backend for better security
- The delete function is currently a placeholder and should be implemented server-side for security reasons

## 6. Testing the Setup

After configuring your environment variables, you can test the Cloudinary integration by:

1. Running the development server: `npm run dev`
2. Navigating to the admin panel
3. Trying to upload a destination image

If everything is set up correctly, the image should be uploaded to your Cloudinary account in the specified folder.