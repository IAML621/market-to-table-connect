
import { supabase } from './client';

// Function to ensure the products bucket exists
export const ensureStorageBucketExists = async () => {
  try {
    // Check if the bucket already exists
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === 'products');
    
    // Only create the bucket if it doesn't exist
    if (!bucketExists) {
      const { error } = await supabase.storage.createBucket('products', {
        public: true, // Make the bucket public so images can be viewed without authentication
        fileSizeLimit: 5242880 // 5MB limit for product images
      });
      
      if (error) {
        console.error('Error creating products storage bucket:', error);
      } else {
        console.log('Products storage bucket created successfully');
      }
    }
  } catch (error) {
    console.error('Error checking/creating storage bucket:', error);
  }
};
