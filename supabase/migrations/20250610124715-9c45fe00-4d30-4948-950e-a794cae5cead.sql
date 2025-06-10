
-- Create a trigger function that copies user data to farmers table
CREATE OR REPLACE FUNCTION public.copy_user_data_to_farmer()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update the farmers record with user data from users table
  UPDATE public.farmers
  SET 
    farm_name = COALESCE(NEW.farm_name, (SELECT username FROM public.users WHERE id = NEW.user_id)),
    farm_location = COALESCE(NEW.farm_location, (SELECT COALESCE(contact_info, 'Unknown Location') FROM public.users WHERE id = NEW.user_id))
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$;

-- Create trigger that fires after farmer record is inserted
DROP TRIGGER IF EXISTS copy_user_data_trigger ON public.farmers;
CREATE TRIGGER copy_user_data_trigger
  AFTER INSERT ON public.farmers
  FOR EACH ROW
  EXECUTE FUNCTION public.copy_user_data_to_farmer();

-- Also add columns to farmers table to store copied user data
ALTER TABLE public.farmers 
ADD COLUMN IF NOT EXISTS username TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS contact_info TEXT;

-- Create a function to update farmer record with user data when farmer is created
CREATE OR REPLACE FUNCTION public.create_farmer_with_user_data(
  p_user_id UUID,
  p_farm_name TEXT DEFAULT NULL,
  p_farm_location TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  farmer_id UUID;
  user_data RECORD;
BEGIN
  -- Get user data
  SELECT username, email, contact_info 
  INTO user_data 
  FROM public.users 
  WHERE id = p_user_id;
  
  -- Insert farmer record with user data
  INSERT INTO public.farmers (
    user_id, 
    farm_name, 
    farm_location, 
    username, 
    email, 
    contact_info
  )
  VALUES (
    p_user_id,
    COALESCE(p_farm_name, user_data.username || '''s Farm'),
    COALESCE(p_farm_location, 'Unknown Location'),
    user_data.username,
    user_data.email,
    user_data.contact_info
  )
  RETURNING id INTO farmer_id;
  
  RETURN farmer_id;
END;
$$;
