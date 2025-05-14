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

// Check if the farmer record exists and if not, create it
export const ensureFarmerRecordExists = async (userId: string) => {
  try {
    console.log('Checking if farmer record exists for userId:', userId);
    
    // First check if the farmer record already exists
    const { data: existingFarmer, error: fetchError } = await supabase
      .from('farmers')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (fetchError) {
      console.error('Error checking farmer record:', fetchError);
      return null;
    }
    
    if (existingFarmer) {
      console.log('Farmer record exists:', existingFarmer);
      return existingFarmer.id;
    }
    
    // Get user info to create farmer record
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('username')
      .eq('id', userId)
      .single();
    
    if (userError || !userData) {
      console.error('Error fetching user data:', userError);
      return null;
    }
    
    // Create a new farmer record
    const { data: newFarmer, error: insertError } = await supabase
      .from('farmers')
      .insert({
        user_id: userId,
        farm_name: userData.username + "'s Farm",  // Default farm name based on username
        farm_location: 'Location not specified'    // Default location
      })
      .select('id')
      .single();
    
    if (insertError) {
      console.error('Error creating farmer record:', insertError);
      return null;
    }
    
    console.log('New farmer record created:', newFarmer);
    return newFarmer.id;
  } catch (error) {
    console.error('Error in ensureFarmerRecordExists:', error);
    return null;
  }
};

// Check if the consumer record exists and if not, create it
export const ensureConsumerRecordExists = async (userId: string) => {
  try {
    console.log('Checking if consumer record exists for userId:', userId);
    
    // First check if the consumer record already exists
    const { data: existingConsumer, error: fetchError } = await supabase
      .from('consumers')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (fetchError) {
      console.error('Error checking consumer record:', fetchError);
      return null;
    }
    
    if (existingConsumer) {
      console.log('Consumer record exists:', existingConsumer);
      return existingConsumer.id;
    }
    
    // Create a new consumer record with anonymous connection (row-level security bypass)
    const { data: newConsumer, error: insertError } = await supabase
      .rpc('create_consumer_profile', { 
        user_id_param: userId,
        location_param: 'Location not specified'  // Default location
      })
      .select('id')
      .single();
    
    if (insertError) {
      console.error('Error creating consumer record:', insertError);
      throw insertError;
    }
    
    console.log('New consumer record created:', newConsumer);
    return newConsumer?.id || null;
  } catch (error) {
    console.error('Error in ensureConsumerRecordExists:', error);
    return null;
  }
};
