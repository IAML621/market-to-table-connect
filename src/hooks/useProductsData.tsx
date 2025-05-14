
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Product } from '@/types';

export const useProductsData = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('products')
          .select(`
            *,
            farmers!inner (
              farm_name,
              farm_location,
              users!inner (
                username
              )
            )
          `)
          .gt('stock_level', 0)
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (data) {
          const formattedProducts = data.map(item => ({
            id: item.id,
            name: item.name,
            description: item.description,
            price: item.price,
            stockLevel: item.stock_level,
            farmerId: item.farmer_id,
            farmName: item.farmers.farm_name,
            farmerName: item.farmers.users.username,
            imageUrl: item.image_url || undefined,
            created_at: item.created_at,
            category: item.category || 'Uncategorized',
            isOrganic: item.is_organic || false,
            unit: item.unit || 'each'
          }));
          
          setProducts(formattedProducts);
          setFilteredProducts(formattedProducts);
          
          // Extract unique categories and ensure none are empty strings
          const allCategories = formattedProducts.map(product => 
            product.category ? product.category : 'Uncategorized'
          );
          const uniqueCategories = Array.from(new Set(allCategories));
          setCategories(uniqueCategories);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Filter products when search query or category filter changes
  useEffect(() => {
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
    setCategoryFilter
  };
};
