import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User, Farmer, Consumer } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { ensureConsumerRecordExists, ensureFarmerRecordExists } from '@/integrations/supabase/storage';

interface AuthContextProps {
  user: User | null;
  farmer: Farmer | null;
  consumer: Consumer | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string, role: 'farmer' | 'consumer', location?: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUserProfile: (updates: Partial<User | Farmer | Consumer>) => Promise<void>;
  getFarmerId: () => Promise<string | null>;
  getConsumerId: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [farmer, setFarmer] = useState<Farmer | null>(null);
  const [consumer, setConsumer] = useState<Consumer | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const getCurrentUser = async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          const { data: userData, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (error || !userData) {
            console.error('Error fetching user:', error);
            return;
          }

          const currentUser: User = {
            id: userData.id,
            email: userData.email,
            username: userData.username,
            contactInfo: userData.contact_info || undefined,
            role: userData.user_role as 'farmer' | 'consumer',
            created_at: userData.created_at
          };
          
          setUser(currentUser);

          // Fetch role-specific information
          if (currentUser.role === 'farmer') {
            const { data: farmerData } = await supabase
              .from('farmers')
              .select('*')
              .eq('user_id', currentUser.id)
              .single();
            
            if (farmerData) {
              setFarmer({
                ...currentUser,
                farmName: farmerData.farm_name,
                farmLocation: farmerData.farm_location,
                profileImage: farmerData.profile_image || undefined
              });
            }
          } else if (currentUser.role === 'consumer') {
            const { data: consumerData } = await supabase
              .from('consumers')
              .select('*')
              .eq('user_id', currentUser.id)
              .single();
            
            if (consumerData) {
              setConsumer({
                ...currentUser,
                location: consumerData.location,
                profileImage: consumerData.profile_image || undefined
              });
            }
          }
        }
      } catch (error: any) {
        console.error('Error getting current user:', error.message);
      } finally {
        setLoading(false);
      }
    };

    getCurrentUser();

    // Set up auth listener
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        getCurrentUser();
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setFarmer(null);
        setConsumer(null);
      }
    });

    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        toast({
          title: "Authentication error",
          description: error.message,
          variant: "destructive"
        });
        throw error;
      }
      
      toast({
        title: "Welcome back!",
        description: "You've successfully signed in."
      });
    } catch (error: any) {
      console.error('Error signing in:', error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, username: string, role: 'farmer' | 'consumer', location?: string) => {
    try {
      setLoading(true);
      
      // Create the auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (authError || !authData.user) {
        toast({
          title: "Signup error",
          description: authError?.message || "Failed to create account",
          variant: "destructive"
        });
        throw authError || new Error("Failed to create account");
      }

      console.log('Auth user created:', authData.user.id);

      // Create the user record - this user will have a matching ID with auth.users
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email,
          username,
          user_role: role,
        });
      
      if (userError) {
        console.error('Error creating user profile:', userError);
        toast({
          title: "User profile creation failed",
          description: userError.message,
          variant: "destructive"
        });
        throw userError;
      }

      console.log('User profile created successfully');
      
      // Now create the role-specific profile
      if (role === 'consumer') {
        // Use the function to create a consumer profile with the provided location
        const success = await ensureConsumerRecordExists(authData.user.id, location || '');
        
        if (!success) {
          console.error('Error creating consumer profile using RPC');
          toast({
            title: "Consumer profile creation failed",
            description: "Could not create your consumer profile",
            variant: "destructive"
          });
          throw new Error("Failed to create consumer profile");
        }
        
        console.log('Consumer profile created successfully via RPC');
      } else if (role === 'farmer') {
        // Create farmer profile
        const success = await ensureFarmerRecordExists(authData.user.id);
        
        if (!success) {
          console.error('Error creating farmer profile');
          toast({
            title: "Farmer profile creation failed",
            description: "Could not create your farmer profile",
            variant: "destructive"
          });
          throw new Error("Failed to create farmer profile");
        }
        
        console.log('Farmer profile created successfully');
      }

      toast({
        title: "Account created!",
        description: `You've successfully signed up as a ${role}.`
      });
      
      // Return void instead of authData to match the interface
    } catch (error: any) {
      console.error('Error signing up:', error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
      toast({
        title: "Signed out",
        description: "You've been successfully signed out."
      });
    } catch (error: any) {
      console.error('Error signing out:', error.message);
      toast({
        title: "Sign out failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const updateUserProfile = async (updates: Partial<User | Farmer | Consumer>) => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      const { error: userError } = await supabase
        .from('users')
        .update({
          username: 'username' in updates ? updates.username : undefined,
          contact_info: 'contactInfo' in updates ? updates.contactInfo : undefined,
        })
        .eq('id', user.id);

      if (userError) throw userError;

      if (user.role === 'farmer' && 'farmName' in updates) {
        const { error: farmerError } = await supabase
          .from('farmers')
          .update({
            farm_name: updates.farmName,
            farm_location: 'farmLocation' in updates ? updates.farmLocation : undefined,
            profile_image: 'profileImage' in updates ? updates.profileImage : undefined
          })
          .eq('user_id', user.id);

        if (farmerError) throw farmerError;
      }

      if (user.role === 'consumer' && ('location' in updates || 'profileImage' in updates)) {
        const { error: consumerError } = await supabase
          .from('consumers')
          .update({
            location: 'location' in updates ? updates.location : undefined,
            profile_image: 'profileImage' in updates ? updates.profileImage : undefined
          })
          .eq('user_id', user.id);

        if (consumerError) throw consumerError;
      }

      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated."
      });
      
    } catch (error: any) {
      console.error('Error updating profile:', error.message);
      toast({
        title: "Profile update failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Get the farmer ID for the current user
  const getFarmerId = async (): Promise<string | null> => {
    if (!user || user.role !== 'farmer') {
      return null;
    }

    try {
      // First check if we already have the farmer record loaded
      if (farmer && farmer.id) {
        return farmer.id;
      }

      // Otherwise, fetch it from the database
      const { data, error } = await supabase
        .from('farmers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching farmer ID:', error);
        return null;
      }

      return data.id;
    } catch (error) {
      console.error('Error in getFarmerId:', error);
      return null;
    }
  };

  // Get the consumer ID for the current user
  const getConsumerId = async (): Promise<string | null> => {
    if (!user || user.role !== 'consumer') {
      return null;
    }

    try {
      // First check if we already have the consumer record loaded
      if (consumer && consumer.id) {
        return consumer.id;
      }

      // Otherwise, fetch it from the database
      const { data, error } = await supabase
        .from('consumers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching consumer ID:', error);
        return null;
      }

      return data.id;
    } catch (error) {
      console.error('Error in getConsumerId:', error);
      return null;
    }
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        farmer, 
        consumer, 
        loading, 
        signIn, 
        signUp, 
        signOut,
        updateUserProfile,
        getFarmerId,
        getConsumerId
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
