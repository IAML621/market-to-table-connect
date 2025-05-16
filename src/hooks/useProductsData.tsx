
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Product } from '@/types';
import { toast } from '@/components/ui/use-toast';

export const useProductsData = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching products...');
        
        // Simple query to get all products with stock
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .gt('stock_level', 0)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching products:', error);
          setError('Failed to load products. Please try again later.');
          toast({
            title: "Failed to load products",
            description: "Please try again later",
            variant: "destructive"
          });
          return;
        }

        if (!data || data.length === 0) {
          console.log('No products found in database');
          setProducts([]);
          setFilteredProducts([]);
          setCategories([]);
          return;
        }

        console.log(`Found ${data.length} products in database`);
        
        // Process the product data
        const formattedProducts = await Promise.all(data.map(async (item) => {
          // Fetch farmer details separately
          const { data: farmerData } = await supabase
            .from('farmers')
            .select('farm_name, farm_location, user_id')
            .eq('id', item.farmer_id)
            .single();
            
          let farmName = 'Unknown Farm';
          let farmerName = 'Unknown Farmer';
          
          if (farmerData) {
            farmName = farmerData.farm_name || 'Unnamed Farm';
            
            const { data: userData } = await supabase
              .from('users')
              .select('username')
              .eq('id', farmerData.user_id)
              .single();
              
            if (userData) {
              farmerName = userData.username;
            }
          }
          
          return {
            id: item.id,
            name: item.name,
            description: item.description,
            price: item.price,
            stockLevel: item.stock_level,
            farmerId: item.farmer_id,
            farmName: farmName,
            farmerName: farmerName,
            imageUrl: item.image_url || undefined,
            created_at: item.created_at,
            category: item.category || 'Uncategorized',
            isOrganic: item.is_organic || false,
            unit: item.unit || 'each'
          };
        }));
        
        console.log('Formatted products:', formattedProducts);
        setProducts(formattedProducts);
        setFilteredProducts(formattedProducts);
        
        // Extract unique categories
        const allCategories = formattedProducts.map(product => 
          product.category ? product.category : 'Uncategorized'
        );
        const uniqueCategories = Array.from(new Set(allCategories));
        setCategories(uniqueCategories);
      } catch (error: any) {
        console.error('Exception in fetchProducts:', error);
        setError('An unexpected error occurred. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Filter products when search query or category filter changes
  useEffect(() => {
    if (products.length === 0) {
      setFilteredProducts([]);
      return;
    }
    
    let filtered = products;
    
    // Apply category filter
    if (categoryFilter && categoryFilter !== 'all') {
      filtered = filtered.filter(product => product.category === categoryFilter);
    }
    
    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        product => 
          product.name.toLowerCase().includes(query) ||
          product.description.toLowerCase().includes(query) ||
          product.farmName?.toLowerCase().includes(query)
      );
    }
    
    console.log(`Filtered products: ${filtered.length} results`);
    setFilteredProducts(filtered);
  }, [searchQuery, categoryFilter, products]);

  return {
    products,
    loading,
    categories,
    filteredProducts,
    searchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter,
    error
  };
};
