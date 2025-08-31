// Test file for Cloudinary integration
import { uploadDestinationImageToCloudinary, deleteDestinationImageFromCloudinary } from '../services/cloudinaryService';

/**
 * Test Cloudinary upload functionality
 */
export const testCloudinaryUpload = async () => {
  try {
    // Create a simple test file (in a real scenario, this would come from user input)
    const testFile = new File(['Test content for Cloudinary upload'], 'test-image.txt', { type: 'text/plain' });
    
    console.log('Testing Cloudinary upload...');
    
    // Upload to Cloudinary
    const result = await uploadDestinationImageToCloudinary(testFile, 'test-destination');
    
    console.log('Upload successful:', result);
    
    // Test deletion
    console.log('Testing Cloudinary deletion...');
    await deleteDestinationImageFromCloudinary(result.publicId);
    
    console.log('Deletion successful');
    
    return { success: true, result };
  } catch (error) {
    console.error('Cloudinary test failed:', error);
    return { success: false, error };
  }
};

// Run the test if this file is executed directly
if (import.meta.url === new URL(import.meta.url).href) {
  testCloudinaryUpload().then(result => {
    console.log('Test result:', result);
  });
}