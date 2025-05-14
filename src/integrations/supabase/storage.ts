import { supabase } from '@/lib/supabase';

/**
 * Ensures that the storage bucket exists.
 * @returns {Promise<boolean>} - True if the bucket exists or was created, false if there was an error.
 */
export const ensureStorageBucketExists = async (): Promise<boolean> => {
  const bucketName = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET_NAME;

  if (!bucketName) {
    console.error('NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET_NAME environment variable is not set.');
    return false;
  }

  try {
    // Check if the bucket exists by attempting to get its metadata.
    await supabase.storage.getBucket(bucketName);
    console.log(`Storage bucket "${bucketName}" already exists.`);
    return true;
  } catch (error: any) {
    // If the bucket does not exist, the getBucket method will throw an error.
    // We catch the error and create the bucket.
    if (error.message.includes('Storage bucket not found')) {
      try {
        // Create the bucket with public access.
        await supabase.storage.createBucket(bucketName, { public: true });
        console.log(`Storage bucket "${bucketName}" created successfully.`);
        return true;
      } catch (createError) {
        console.error('Error creating storage bucket:', createError);
        return false;
      }
    } else {
      // If the error is not due to the bucket not existing, log the error and return false.
      console.error('Error checking storage bucket:', error);
      return false;
    }
  }
};

/**
 * Uploads a product image to Supabase storage.
 * @param {File} file - The image file to upload.
 * @returns {Promise<string | null>} - The public URL of the uploaded image, or null if there was an error.
 */
export const uploadProductImage = async (file: File): Promise<string | null> => {
  const bucketName = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET_NAME;

  if (!bucketName) {
    console.error('NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET_NAME environment variable is not set.');
    return null;
  }

  const fileName = `${Date.now()}-${file.name}`;
  const filePath = `products/${fileName}`;

  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Error uploading image:', error);
      return null;
    }

    const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucketName}/${filePath}`;
    console.log('Image uploaded successfully:', publicUrl);
    return publicUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    return null;
  }
};

/**
 * Ensures that a farmer record exists for the given user and returns the farmer ID
 */
export const ensureFarmerRecordExists = async (userId: string): Promise<string | null> => {
  try {
    console.log('Ensuring farmer record exists for user:', userId);

    // First, check if a farmer record already exists for this user
    const { data: existingFarmers, error: fetchError } = await supabase
      .from('farmers')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 is the error code for "no rows returned" - we can ignore this one
      console.error('Error checking for existing farmer:', fetchError);
      throw fetchError;
    }

    if (existingFarmers) {
      console.log('Found existing farmer record:', existingFarmers.id);
      return existingFarmers.id;
    }

    console.log('No farmer record found, creating new one for user:', userId);

    // Get user data to set default values
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('username')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('Error fetching user data:', userError);
      throw userError;
    }

    // Create a new farmer record
    const { data: newFarmer, error: insertError } = await supabase
      .from('farmers')
      .insert([
        { 
          user_id: userId,
          farm_name: `${userData?.username || 'Unnamed'}'s Farm`, // Default farm name
          farm_location: 'Not specified' // Default location
        }
      ])
      .select('id')
      .single();

    if (insertError) {
      console.error('Error creating farmer record:', insertError);
      throw insertError;
    }

    console.log('Created new farmer record:', newFarmer.id);
    return newFarmer.id;
  } catch (error) {
    console.error('Error in ensureFarmerRecordExists:', error);
    return null;
  }
};

/**
 * Ensures that a consumer record exists for the given user and returns the consumer ID
 */
export const ensureConsumerRecordExists = async (userId: string): Promise<string | null> => {
  try {
    console.log('Ensuring consumer record exists for user:', userId);

    // First, check if a consumer record already exists for this user
    const { data: existingConsumers, error: fetchError } = await supabase
      .from('consumers')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 is the error code for "no rows returned" - we can ignore this one
      console.error('Error checking for existing consumer:', fetchError);
      throw fetchError;
    }

    if (existingConsumers) {
      console.log('Found existing consumer record:', existingConsumers.id);
      return existingConsumers.id;
    }

    console.log('No consumer record found, creating new one for user:', userId);

    // Get user data to set default values
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('username')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('Error fetching user data:', userError);
      throw userError;
    }

    // Create a new consumer record
    const { data: newConsumer, error: insertError } = await supabase
      .from('consumers')
      .insert([
        { 
          user_id: userId,
          location: 'Not specified' // Default location
        }
      ])
      .select('id')
      .single();

    if (insertError) {
      console.error('Error creating consumer record:', insertError);
      throw insertError;
    }

    console.log('Created new consumer record:', newConsumer.id);
    return newConsumer.id;
  } catch (error) {
    console.error('Error in ensureConsumerRecordExists:', error);
    return null;
  }
};
