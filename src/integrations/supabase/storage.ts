
import { supabase } from './client';

// Function to ensure the products bucket exists
export const ensureStorageBucketExists = async () => {
  try {
    // Check if the bucket already exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error checking storage buckets:', listError);
      return false;
    }
    
    const bucketExists = buckets?.some(bucket => bucket.name === 'products');
    
    // Only create the bucket if it doesn't exist
    if (!bucketExists) {
      console.log('Creating products bucket...');
      
      // Create the bucket using the service role client for admin privileges
      const { error } = await supabase.storage.createBucket('products', {
        public: true, // Make the bucket public so images can be viewed without authentication
        fileSizeLimit: 5242880 // 5MB limit for product images
      });
      
      if (error) {
        console.error('Error creating products storage bucket:', error);
        
        // Special handling for RLS errors
        if (error.message?.includes('row-level security')) {
          console.log('RLS error detected. Bucket may exist but not be visible to the current user.');
          return true; // Continue assuming bucket exists but is hidden due to RLS
        }
        return false;
      } else {
        console.log('Products storage bucket created successfully');
        return true;
      }
    } else {
      console.log('Products bucket already exists');
      return true;
    }
  } catch (error) {
    console.error('Error checking/creating storage bucket:', error);
    return false;
  }
};

// Check if the user has permission to upload to the products bucket
export const testStoragePermission = async () => {
  try {
    // Try to get the bucket to test permissions
    const { data, error } = await supabase.storage.getBucket('products');
    
    if (error) {
      if (error.message?.includes('The resource was not found')) {
        // Bucket doesn't exist yet, try to create it
        return ensureStorageBucketExists();
      }
      console.error('Error testing bucket permissions:', error);
      return false;
    }
    
    console.log('User has access to products bucket');
    return true;
  } catch (error) {
    console.error('Error testing storage permissions:', error);
    return false;
  }
};
