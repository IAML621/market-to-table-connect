
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Product } from '@/types';
import { ProductCard } from '@/components/ui/product-card';
import { Skeleton } from '@/components/ui/skeleton';

interface ProductsGridProps {
  products: Product[];
  loading: boolean;
  filteredProducts: Product[];
}

export const ProductsGrid: React.FC<ProductsGridProps> = ({ 
  products, 
  loading, 
  filteredProducts 
}) => {
  const navigate = useNavigate();
  
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {loading ? (
        // Loading skeletons
        Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="product-card">
            <Skeleton className="h-48 w-full" />
            <div className="p-3 space-y-2">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-8 w-full mt-3" />
            </div>
          </div>
        ))
      ) : filteredProducts.length > 0 ? (
        filteredProducts.map(product => (
          <ProductCard 
            key={product.id} 
            product={product}
            onClick={() => navigate(`/products/${product.id}`)}
          />
        ))
      ) : (
        <div className="col-span-full text-center py-12">
          <h3 className="text-xl font-medium mb-2">No products found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search or filters to find what you're looking for.
          </p>
        </div>
      )}
    </section>
  );
};
