
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProductsData } from '@/hooks/useProductsData';
import { ProductsHero } from '@/components/products/ProductsHero';
import { ProductsFilter } from '@/components/products/ProductsFilter';
import { ProductsGrid } from '@/components/products/ProductsGrid';

const Products = () => {
  const { consumer } = useAuth();
  const {
    products,
    loading,
    categories,
    filteredProducts,
    searchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter
  } = useProductsData();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <ProductsHero 
        searchQuery={searchQuery} 
        handleSearchChange={handleSearchChange} 
        consumer={consumer}
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
      />
    </div>
  );
};

export default Products;
