
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Product } from '@/types';
import { toast } from '@/components/ui/use-toast';

export const useFarmerProducts = (farmerId?: string) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!farmerId) {
      setProducts([]);
      setLoading(false);
      return;
    }

    const fetchFarmerProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching products for farmer:', farmerId);
        
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('farmer_id', farmerId)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching farmer products:', error);
          setError('Failed to load your products. Please try again later.');
          toast({
            title: "Failed to load products",
            description: "Please try again later",
            variant: "destructive"
          });
          return;
        }

        if (!data) {
          setProducts([]);
          return;
        }

        console.log(`Found ${data.length} products for farmer`);
        
        // Format the products
        const formattedProducts: Product[] = data.map((item) => ({
          id: item.id,
          name: item.name,
          description: item.description,
          price: item.price,
          stockLevel: item.stock_level,
          farmerId: item.farmer_id,
          farmName: '', // Not needed for farmer's own products
          farmerName: '', // Not needed for farmer's own products
          imageUrl: item.image_url || undefined,
          created_at: item.created_at,
          category: item.category || 'Uncategorized',
          isOrganic: item.is_organic || false,
          unit: item.unit || 'each'
        }));
        
        setProducts(formattedProducts);
      } catch (error: any) {
        console.error('Exception in fetchFarmerProducts:', error);
        setError('An unexpected error occurred. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchFarmerProducts();
  }, [farmerId]);

  const deleteProduct = async (productId: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) {
        console.error('Error deleting product:', error);
        toast({
          title: "Failed to delete product",
          description: "Please try again later",
          variant: "destructive"
        });
        return false;
      }

      // Remove the product from local state
      setProducts(prev => prev.filter(p => p.id !== productId));
      
      toast({
        title: "Product deleted",
        description: "The product has been successfully deleted",
      });
      
      return true;
    } catch (error: any) {
      console.error('Exception in deleteProduct:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
      return false;
    }
  };

  return {
    products,
    loading,
    error,
    deleteProduct
  };
};
