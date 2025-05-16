
import { supabase } from "@/lib/supabase";

/**
 * Ensures that a consumer record exists for the given user ID
 * This function is used during registration and when accessing pages that require a consumer profile
 */
export const ensureConsumerRecordExists = async (userId: string): Promise<boolean> => {
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
      
      // Use a direct SQL RPC call to create the consumer record
      // This is a workaround for RLS policies that might prevent direct inserts
      const { data: newConsumer, error: insertError } = await supabase
        .rpc('create_consumer_profile', { 
          user_id_param: userId,
          location_param: ''
        });
        
      if (insertError) {
        console.error('Error creating consumer record:', insertError);
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
