
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Product } from '@/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  ShoppingBag, 
  ChevronLeft, 
  Plus, 
  Minus, 
  MessageCircle, 
  MapPin, 
  Leaf, 
  Package
} from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

const ProductDetail = () => {
  const { productId } = useParams<{ productId: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) return;

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
          .eq('id', productId)
          .single();

        if (error) throw error;

        if (data) {
          setProduct({
            id: data.id,
            name: data.name,
            description: data.description,
            price: data.price,
            stockLevel: data.stock_level,
            farmerId: data.farmer_id,
            farmName: data.farmers.farm_name,
            farmerName: data.farmers.users.username,
            imageUrl: data.image_url || undefined,
            created_at: data.created_at,
            category: data.category || undefined,
            isOrganic: data.is_organic || false,
            unit: data.unit || 'each'
          });
        }
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  const handleAddToCart = () => {
    if (product) {
      addToCart(product, quantity);
    }
  };

  const handleQuantityChange = (amount: number) => {
    const newQuantity = quantity + amount;
    if (newQuantity >= 1 && product && newQuantity <= product.stockLevel) {
      setQuantity(newQuantity);
    }
  };

  const startChat = async () => {
    if (!user || !product) return;
    navigate(`/messages?farmerId=${product.farmerId}`);
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto pt-6 space-y-8">
        <Button variant="ghost" className="mb-4" onClick={() => navigate(-1)}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to products
        </Button>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Skeleton className="h-80 w-full rounded-lg" />
          <div className="space-y-4">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-24 w-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-5 w-1/3" />
            </div>
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-3xl mx-auto pt-6 text-center">
        <h2 className="text-2xl font-bold mb-4">Product not found</h2>
        <p className="text-muted-foreground mb-6">The product you're looking for doesn't exist or has been removed.</p>
        <Button onClick={() => navigate('/')}>Back to Home</Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pt-6 space-y-8">
      <Button variant="ghost" className="mb-4" onClick={() => navigate(-1)}>
        <ChevronLeft className="mr-2 h-4 w-4" />
        Back to products
      </Button>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="rounded-lg overflow-hidden border border-border/50 bg-white">
          {product.imageUrl ? (
            <img 
              src={product.imageUrl} 
              alt={product.name}
              className="w-full h-80 object-cover"
            />
          ) : (
            <div className="w-full h-80 bg-muted flex items-center justify-center">
              <Package className="h-24 w-24 text-muted-foreground/30" />
            </div>
          )}
        </div>
        
        <div>
          <div className="flex items-center gap-3 mb-2">
            {product.category && (
              <span className="bg-secondary text-secondary-foreground text-xs px-2 py-1 rounded">
                {product.category}
              </span>
            )}
            {product.isOrganic && (
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded flex items-center gap-1">
                <Leaf className="h-3 w-3" />
                Organic
              </span>
            )}
          </div>
          
          <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
          
          <div className="text-2xl font-bold text-market-green mb-4">
            ${product.price.toFixed(2)}
            <span className="text-sm text-muted-foreground ml-1">
              /{product.unit || 'each'}
            </span>
          </div>
          
          <p className="text-muted-foreground mb-6">
            {product.description}
          </p>
          
          <div className="space-y-2 mb-6">
            <div className="flex items-center gap-2 text-sm">
              <ShoppingBag className="h-4 w-4 text-market-green" />
              <span className={`${product.stockLevel > 0 ? 'text-green-600' : 'text-red-600'} font-medium`}>
                {product.stockLevel > 0 
                  ? `${product.stockLevel} in stock` 
                  : 'Out of stock'}
              </span>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-market-green" />
              <span>From {product.farmName} in {product.farmerName}</span>
            </div>
          </div>
          
          <Card className="p-4 mb-6">
            <div className="flex items-center justify-between mb-4">
              <span className="font-medium">Quantity</span>
              <div className="flex items-center">
                <Button 
                  variant="outline" 
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="mx-4 min-w-8 text-center">{quantity}</span>
                <Button 
                  variant="outline" 
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleQuantityChange(1)}
                  disabled={!product || quantity >= product.stockLevel}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <Button 
              className="w-full bg-market-green hover:bg-market-green-dark"
              disabled={product.stockLevel <= 0}
              onClick={handleAddToCart}
            >
              Add to Cart - ${(product.price * quantity).toFixed(2)}
            </Button>
          </Card>
          
          {user && (
            <Button 
              variant="outline" 
              className="w-full flex gap-2"
              onClick={startChat}
            >
              <MessageCircle className="h-4 w-4" />
              Chat with the Farmer
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
