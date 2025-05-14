
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Product } from '@/types';
import { ProductCard } from '@/components/ui/product-card';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';

interface ProductsGridProps {
  products: Product[];
  loading: boolean;
  filteredProducts: Product[];
  error?: string | null;
}

export const ProductsGrid: React.FC<ProductsGridProps> = ({ 
  products, 
  loading, 
  filteredProducts,
  error
}) => {
  const navigate = useNavigate();
  
  // If there's an error, display error message
  if (error) {
    return (
      <section className="text-center py-12">
        <div className="flex flex-col items-center gap-4">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <h3 className="text-xl font-medium">Error loading products</h3>
          <p className="text-muted-foreground max-w-md">
            {error}
          </p>
        </div>
      </section>
    );
  }
  
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
      ) : products.length > 0 ? (
        <div className="col-span-full text-center py-12">
          <h3 className="text-xl font-medium mb-2">No matching products found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search or filters to find what you're looking for.
          </p>
        </div>
      ) : (
        <div className="col-span-full text-center py-12">
          <h3 className="text-xl font-medium mb-2">No products available</h3>
          <p className="text-muted-foreground">
            There are currently no products available in the marketplace. Please check back later.
          </p>
        </div>
      )}
    </section>
  );
};
