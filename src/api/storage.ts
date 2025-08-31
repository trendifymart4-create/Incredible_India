// Storage API functions
import {
  ref,
  uploadBytes,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  listAll,
  getMetadata
} from 'firebase/storage';
import { storage } from '../firebase';

// Configure Cloudinary with credentials from environment variables

export interface UploadProgress {
  bytesTransferred: number;
  totalBytes: number;
  progress: number;
}

export interface UploadResult {
  url: string;
  path: string;
  name: string;
  size: number;
  contentType: string;
}

// Upload image file
export const uploadImage = async (
  file: File,
  path: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> => {
  try {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image');
    }
    
    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error('File size must be less than 5MB');
    }
    
    // Create unique filename
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.name}`;
    const fullPath = `${path}/${fileName}`;
    
    const storageRef = ref(storage, fullPath);
    
    if (onProgress) {
      // Upload with progress tracking
      const uploadTask = uploadBytesResumable(storageRef, file);
      
      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = {
              bytesTransferred: snapshot.bytesTransferred,
              totalBytes: snapshot.totalBytes,
              progress: (snapshot.bytesTransferred / snapshot.totalBytes) * 100
            };
            onProgress(progress);
          },
          (error) => {
            reject(new Error(error.message || 'Upload failed'));
          },
          async () => {
            try {
              const url = await getDownloadURL(uploadTask.snapshot.ref);
              const metadata = await getMetadata(uploadTask.snapshot.ref);
              
              resolve({
                url,
                path: fullPath,
                name: fileName,
                size: metadata.size,
                contentType: metadata.contentType || file.type
              });
            } catch (error: any) {
              reject(new Error(error.message || 'Failed to get download URL'));
            }
          }
        );
      });
    } else {
      // Simple upload without progress
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);
      const metadata = await getMetadata(snapshot.ref);
      
      return {
        url,
        path: fullPath,
        name: fileName,
        size: metadata.size,
        contentType: metadata.contentType || file.type
      };
    }
  } catch (error: any) {
    throw new Error(error.message || 'Failed to upload image');
  }
};

// Upload destination image
export const uploadDestinationImage = async (
  file: File,
  destinationId: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> => {
  return uploadImage(file, `destinations/${destinationId}`, onProgress);
};

// Upload user avatar
export const uploadUserAvatar = async (
  file: File,
  userId: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> => {
  return uploadImage(file, `avatars/${userId}`, onProgress);
};

// Upload general image
export const uploadGeneralImage = async (
  file: File,
  category: string = 'general',
  onProgress?: (progress: UploadProgress) => void
): Promise<UploadResult> => {
  return uploadImage(file, `images/${category}`, onProgress);
};

// Delete file
export const deleteFile = async (path: string): Promise<void> => {
  try {
    const fileRef = ref(storage, path);
    await deleteObject(fileRef);
  } catch (error: any) {
    throw new Error(error.message || 'Failed to delete file');
  }
};

// Get file URL
export const getFileURL = async (path: string): Promise<string> => {
  try {
    const fileRef = ref(storage, path);
    return await getDownloadURL(fileRef);
  } catch (error: any) {
    throw new Error(error.message || 'Failed to get file URL');
  }
};

// List files in directory
export const listFiles = async (path: string): Promise<string[]> => {
  try {
    const listRef = ref(storage, path);
    const result = await listAll(listRef);
    
    const urls = await Promise.all(
      result.items.map(async (itemRef) => {
        return await getDownloadURL(itemRef);
      })
    );
    
    return urls;
  } catch (error: any) {
    throw new Error(error.message || 'Failed to list files');
  }
};

// Convert file to base64 (for preview)
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

// Validate image file
export const validateImageFile = (file: File): { isValid: boolean; error?: string } => {
  // Check file type
  if (!file.type.startsWith('image/')) {
    return { isValid: false, error: 'File must be an image' };
  }
  
  // Check file size (5MB limit)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    return { isValid: false, error: 'File size must be less than 5MB' };
  }
  
  // Check supported formats
  const supportedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!supportedFormats.includes(file.type)) {
    return { isValid: false, error: 'Supported formats: JPEG, PNG, GIF, WebP' };
  }
  
  return { isValid: true };
};

// Resize image (client-side)
export const resizeImage = (
  file: File,
  maxWidth: number = 1920,
  maxHeight: number = 1080,
  quality: number = 0.8
): Promise<File> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }
      
      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;
      
      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const resizedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            });
            resolve(resizedFile);
          } else {
            reject(new Error('Failed to resize image'));
          }
        },
        file.type,
        quality
      );
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

// Upload destination image to Cloudinary using direct API call
export const uploadDestinationImageToCloudinary = async (
  file: File,
  destinationId: string
): Promise<{ url: string; publicId: string; format: string; width: number; height: number }> => {
  try {
    // Get credentials from environment variables
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET; // You'll need to create an unsigned upload preset in Cloudinary
    
    if (!cloudName || !uploadPreset) {
      throw new Error('Cloudinary configuration missing. Please check your environment variables.');
    }
    
    // Create FormData for the upload
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    formData.append('folder', `destinations/${destinationId}`);
    
    // Upload to Cloudinary using direct API call
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`Cloudinary upload failed with status ${response.status}`);
    }
    
    const result = await response.json();
    
    return {
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      width: result.width,
      height: result.height
    };
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    throw new Error(`Failed to upload image to Cloudinary: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Delete destination image from Cloudinary using direct API call
export const deleteDestinationImageFromCloudinary = async (publicId: string): Promise<void> => {
  try {
    // Get credentials from environment variables
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const apiKey = import.meta.env.VITE_CLOUDINARY_API_KEY;
    const apiSecret = import.meta.env.CLOUDINARY_API_SECRET;
    
    if (!cloudName || !apiKey || !apiSecret) {
      throw new Error('Cloudinary configuration missing. Please check your environment variables.');
    }
    
    // For browser security, deletion should be handled server-side
    // This is a placeholder that shows the concept
    console.warn('Direct deletion from browser is not recommended for security reasons.');
    console.warn('In a production environment, this should be handled by your backend service.');
    
    // In a real implementation, you would call your backend service:
    // await fetch('/api/delete-image', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ publicId })
    // });
    
    // For now, we'll just log that deletion was requested
    console.log(`Deletion requested for image with public ID: ${publicId}`);
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    throw new Error(`Failed to delete image from Cloudinary: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Convert file to base64 (for Cloudinary upload)
// Using the exported fileToBase64 function above
