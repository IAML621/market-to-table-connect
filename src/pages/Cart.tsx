
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ShoppingBag, Trash2, Plus, Minus, Package, ChevronRight } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const Cart = () => {
  const { items, removeFromCart, updateQuantity, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleCheckout = () => {
    if (!user) {
      navigate('/login?redirect=/cart');
      return;
    }
    navigate('/checkout');
  };

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto pt-6 text-center py-12">
        <div className="rounded-full bg-muted w-16 h-16 mx-auto flex items-center justify-center mb-4">
          <ShoppingBag className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
        <p className="text-muted-foreground mb-8">Looks like you haven't added any products to your cart yet.</p>
        <Button 
          className="bg-market-green hover:bg-market-green-dark"
          onClick={() => navigate('/')}
        >
          Browse Products
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pt-6 pb-16">
      <h1 className="text-2xl font-bold mb-6">Your Cart</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          {items.map(item => (
            <Card key={item.productId} className="p-4 flex">
              <div className="h-20 w-20 mr-4 rounded overflow-hidden bg-muted flex-shrink-0">
                {item.productImage ? (
                  <img 
                    src={item.productImage} 
                    alt={item.productName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <Package className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex justify-between">
                  <h3 className="font-medium">{item.productName}</h3>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-muted-foreground"
                    onClick={() => removeFromCart(item.productId)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="text-sm text-muted-foreground mb-2">
                  ${item.pricePerItem.toFixed(2)} each
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Button 
                      variant="outline" 
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="mx-3 min-w-6 text-center text-sm">{item.quantity}</span>
                    <Button 
                      variant="outline" 
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  <div className="font-medium">
                    ${(item.quantity * item.pricePerItem).toFixed(2)}
                  </div>
                </div>
              </div>
            </Card>
          ))}
          
          <div className="text-right">
            <Button 
              variant="ghost" 
              className="text-muted-foreground text-sm"
              onClick={() => clearCart()}
            >
              Clear cart
            </Button>
          </div>
        </div>

        <div className="md:col-span-1">
          <Card className="p-4">
            <h3 className="font-medium text-lg mb-4">Order Summary</h3>
            
            <div className="space-y-2 mb-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>${totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery</span>
                <span>Calculated at checkout</span>
              </div>
            </div>
            
            <Separator className="my-4" />
            
            <div className="flex justify-between font-medium mb-6">
              <span>Total</span>
              <span>${totalPrice.toFixed(2)}</span>
            </div>
            
            <Button 
              className="w-full bg-market-green hover:bg-market-green-dark"
              onClick={handleCheckout}
            >
              {user ? 'Proceed to Checkout' : 'Sign in to Checkout'}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
            
            <p className="text-xs text-muted-foreground text-center mt-4">
              Shipping and taxes calculated at checkout
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Cart;
