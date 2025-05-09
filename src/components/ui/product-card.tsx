
import React from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Product } from '@/types';
import { useCart } from '@/contexts/CartContext';
import { ShoppingBag } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onClick?: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onClick }) => {
  const { addToCart } = useCart();
  
  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product, 1);
  };

  return (
    <Card 
      className="product-card cursor-pointer transition-all hover:scale-[1.02] border-border/50"
      onClick={onClick}
    >
      <div className="relative h-48 overflow-hidden">
        {product.imageUrl ? (
          <img 
            src={product.imageUrl} 
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <ShoppingBag className="h-12 w-12 text-muted-foreground/50" />
          </div>
        )}
        {product.isOrganic && (
          <div className="absolute top-2 left-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
            Organic
          </div>
        )}
      </div>
      
      <CardContent className="p-3">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-medium text-lg">{product.name}</h3>
          <div className="font-bold text-lg text-market-green">
            ${product.price.toFixed(2)}
            <span className="text-xs text-muted-foreground ml-1">
              /{product.unit || 'each'}
            </span>
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
          {product.description}
        </p>
        
        <div className="text-xs text-muted-foreground mt-2 flex items-center">
          <span>From: {product.farmName || 'Local Farm'}</span>
          <span className="mx-1">•</span>
          <span className={`${product.stockLevel > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {product.stockLevel > 0 
              ? `${product.stockLevel} in stock` 
              : 'Out of stock'}
          </span>
        </div>
      </CardContent>
      
      <CardFooter className="p-3 pt-0">
        <Button
          className="w-full bg-market-green hover:bg-market-green-dark text-white"
          disabled={product.stockLevel <= 0}
          onClick={handleAddToCart}
        >
          Add to Cart
        </Button>
      </CardFooter>
    </Card>
  );
};
