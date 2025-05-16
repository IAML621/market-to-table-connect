
import { supabase } from "@/lib/supabase";

/**
 * Ensures that a consumer record exists for the given user ID
 * This function is used during registration and when accessing pages that require a consumer profile
 */
export const ensureConsumerRecordExists = async (userId: string, location: string = ''): Promise<boolean> => {
  if (!userId) return false;
  
  try {
    console.log('Checking if consumer record exists for user:', userId);
    
    // First check if consumer record exists
    const { data: existingConsumer, error: fetchError } = await supabase
      .from('consumers')
      .select('id')
      .eq('user_id', userId)
      .single();
      
    if (fetchError && fetchError.code !== 'PGRST116') { // Not found error
      console.error('Error checking consumer record:', fetchError);
      return false;
    }
    
    // If no record exists, create one
    if (!existingConsumer) {
      console.log('No consumer record found, creating one...');
      
      // Use a direct SQL RPC call to create the consumer profile
      // This is a workaround for RLS policies that might prevent direct inserts
      const { data: newConsumer, error: insertError } = await supabase
        .rpc('create_consumer_profile', { 
          user_id_param: userId,
          location_param: location
        });
        
      if (insertError) {
        console.error('Error creating consumer profile:', insertError);
        return false;
      }
      
      console.log('Consumer record created successfully:', newConsumer);
      return true;
    } else {
      console.log('Consumer record already exists');
      return true;
    }
  } catch (err) {
    console.error('Exception ensuring consumer record exists:', err);
    return false;
  }
};

/**
 * Ensures that a farmer record exists for the given user ID
 * This function is used during registration and when accessing pages that require a farmer profile
 */
export const ensureFarmerRecordExists = async (userId: string): Promise<boolean> => {
  if (!userId) return false;
  
  try {
    console.log('Checking if farmer record exists for user:', userId);
    
    // First check if farmer record exists
    const { data: existingFarmer, error: fetchError } = await supabase
      .from('farmers')
      .select('id')
      .eq('user_id', userId)
      .single();
      
    if (fetchError && fetchError.code !== 'PGRST116') { // Not found error
      console.error('Error checking farmer record:', fetchError);
      return false;
    }
    
    // If no record exists, create one
    if (!existingFarmer) {
      console.log('No farmer record found, creating one...');
      
      // Insert with the current user ID
      const { error: insertError } = await supabase
        .from('farmers')
        .insert({
          user_id: userId,
          farm_name: '', // Empty default value
          farm_location: '', // Empty default value
        });
        
      if (insertError) {
        console.error('Error creating farmer record:', insertError);
        return false;
      }
      
      console.log('Farmer record created successfully');
      return true;
    } else {
      console.log('Farmer record already exists');
      return true;
    }
  } catch (err) {
    console.error('Exception ensuring farmer record exists:', err);
    return false;
  }
};

/**
 * Uploads a product image to Supabase storage
 * @param file The file to upload
 * @param farmerId The farmer ID to associate with the image
 * @returns The URL of the uploaded image or null if upload failed
 */
export const uploadProductImage = async (file: File, farmerId: string): Promise<string | null> => {
  if (!farmerId || !file) return null;
  
  try {
    // Create a unique file path for the image
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `products/${farmerId}/${fileName}`;
    
    // Upload the file to Supabase Storage
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });
      
    if (error) {
      console.error('Error uploading product image:', error);
      return null;
    }
    
    // Get the public URL for the uploaded file
    const { data: publicUrl } = supabase.storage
      .from('product-images')
      .getPublicUrl(data.path);
      
    return publicUrl.publicUrl;
  } catch (err) {
    console.error('Exception uploading product image:', err);
    return null;
  }
};
