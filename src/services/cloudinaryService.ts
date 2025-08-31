// Cloudinary service for handling image uploads

/**
 * Upload a destination image to Cloudinary using direct API call
 * @param file - The image file to upload
 * @param destinationId - The ID of the destination for folder organization
 * @returns Object containing the image URL and metadata
 */
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

/**
 * Delete a destination image from Cloudinary using direct API call
 * @param publicId - The public ID of the image to delete
 */
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

/**
 * Convert a File object to base64 string
 * @param file - The file to convert
 * @returns Base64 string representation of the file
 */
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert file to base64'));
      }
    };
    reader.onerror = (error) => reject(error);
  });
};