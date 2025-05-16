
import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProductsData } from '@/hooks/useProductsData';
import { ProductsHero } from '@/components/products/ProductsHero';
import { ProductsFilter } from '@/components/products/ProductsFilter';
import { ProductsGrid } from '@/components/products/ProductsGrid';
import { toast } from '@/hooks/use-toast'; // Update import path
import { supabase } from '@/lib/supabase'; // Direct import

const Products = () => {
  const { user, consumer } = useAuth();
  const {
    products,
    loading,
    categories,
    filteredProducts,
    searchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter,
    error
  } = useProductsData();

  // Ensure consumer record exists if user is a consumer
  useEffect(() => {
    const ensureConsumerRecordExists = async () => {
      if (user && user.role === 'consumer' && user.id) {
        try {
          console.log('Checking/creating consumer record for user:', user.id);
          
          // First check if consumer record exists
          const { data: existingConsumer, error: fetchError } = await supabase
            .from('consumers')
            .select('id')
            .eq('user_id', user.id)
            .single();
            
          if (fetchError && fetchError.code !== 'PGRST116') { // Not found error
            console.error('Error checking consumer record:', fetchError);
            return;
          }
          
          // If no record exists, create one
          if (!existingConsumer) {
            console.log('No consumer record found, creating one...');
            const { data: newConsumer, error: insertError } = await supabase
              .from('consumers')
              .insert({
                user_id: user.id,
                location: ''  // Default empty location
              })
              .select('id')
              .single();
              
            if (insertError) {
              console.error('Error creating consumer record:', insertError);
              return;
            }
            
            console.log('Consumer record created:', newConsumer);
          } else {
            console.log('Consumer record exists:', existingConsumer);
          }
        } catch (err) {
          console.error('Exception ensuring consumer record:', err);
        }
      }
    };
    
    ensureConsumerRecordExists();
  }, [user]);

  // Show toast notification based on search and filter results
  useEffect(() => {
    if (!loading && products.length > 0 && filteredProducts.length === 0) {
      toast({
        title: "No matching products",
        description: "Try adjusting your search or filter criteria.",
        variant: "default"
      });
    }
  }, [loading, products, filteredProducts]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSearch = () => {
    console.log('Search triggered. Products:', products.length, 'Filtered:', filteredProducts.length);
    
    if (products.length === 0 && !loading) {
      toast({
        title: "No products available",
        description: "There are currently no products in the marketplace.",
        variant: "default"
      });
    } else if (filteredProducts.length === 0 && !loading) {
      toast({
        title: "No matching products",
        description: "Try adjusting your search criteria.",
        variant: "default"
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <ProductsHero 
        searchQuery={searchQuery} 
        handleSearchChange={handleSearchChange} 
        consumer={consumer}
        onSearch={handleSearch}
      />

      {/* Filter Section */}
      <ProductsFilter 
        categories={categories} 
        categoryFilter={categoryFilter} 
        setCategoryFilter={setCategoryFilter} 
      />
      
      {/* Products Grid */}
      <ProductsGrid 
        products={products} 
        loading={loading} 
        filteredProducts={filteredProducts} 
        error={error}
      />
    </div>
  );
};

export default Products;
