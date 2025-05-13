
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

// Upload a product image to storage
export const uploadProductImage = async (file: File) => {
  try {
    // Ensure bucket exists first
    const bucketExists = await ensureStorageBucketExists();
    if (!bucketExists) {
      throw new Error('Failed to ensure products storage bucket exists');
    }
    
    // Create a unique file name based on timestamp
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;
    
    // Upload the file
    const { data, error } = await supabase.storage
      .from('products')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });
      
    if (error) {
      console.error('Error uploading product image:', error);
      throw error;
    }
    
    // Get public URL for the uploaded file
    const { data: urlData } = supabase.storage
      .from('products')
      .getPublicUrl(filePath);
      
    return urlData.publicUrl;
  } catch (error) {
    console.error('Error in uploadProductImage:', error);
    throw error;
  }
};
