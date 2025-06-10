
import { supabase } from './client';

export const ensureConsumerRecordExists = async (userId: string, location: string = ''): Promise<boolean> => {
  try {
    console.log('Creating consumer profile for user:', userId);
    
    const { data, error } = await supabase.rpc('create_consumer_profile', {
      user_id_param: userId,
      location_param: location
    });

    if (error) {
      console.error('Error creating consumer profile:', error);
      return false;
    }

    console.log('Consumer profile created successfully:', data);
    return true;
  } catch (error) {
    console.error('Exception in ensureConsumerRecordExists:', error);
    return false;
  }
};

export const ensureFarmerRecordExists = async (userId: string, farmName?: string, farmLocation?: string): Promise<boolean> => {
  try {
    console.log('Creating farmer profile for user:', userId);
    
    // Use the new database function that automatically copies user data
    const { data, error } = await supabase.rpc('create_farmer_with_user_data', {
      p_user_id: userId,
      p_farm_name: farmName || null,
      p_farm_location: farmLocation || null
    });

    if (error) {
      console.error('Error creating farmer profile:', error);
      return false;
    }

    console.log('Farmer profile created successfully with ID:', data);
    return true;
  } catch (error) {
    console.error('Exception in ensureFarmerRecordExists:', error);
    return false;
  }
};

export const uploadProductImage = async (file: File, farmerId: string): Promise<string | null> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `products/${farmerId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Error uploading image:', uploadError);
      return null;
    }

    const { data } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    return data.publicUrl;
  } catch (error) {
    console.error('Exception in uploadProductImage:', error);
    return null;
  }
};
