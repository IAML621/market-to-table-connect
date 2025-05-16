
import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProductsData } from '@/hooks/useProductsData';
import { ProductsHero } from '@/components/products/ProductsHero';
import { ProductsFilter } from '@/components/products/ProductsFilter';
import { ProductsGrid } from '@/components/products/ProductsGrid';
import { toast } from '@/components/ui/use-toast';
import { ensureConsumerRecordExists } from '@/integrations/supabase/storage';

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
    const checkConsumerRecord = async () => {
      if (user && user.role === 'consumer' && user.id) {
        try {
          const consumerId = await ensureConsumerRecordExists(user.id);
          console.log('Ensured consumer record exists:', consumerId);
        } catch (err) {
          console.error('Error ensuring consumer record exists:', err);
        }
      }
    };
    
    checkConsumerRecord();
  }, [user]);

  // Show a toast if we have products data loaded but nothing matches the filters
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
