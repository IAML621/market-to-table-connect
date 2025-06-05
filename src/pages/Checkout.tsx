
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, CreditCard, MapPin, User } from 'lucide-react';

const Checkout = () => {
  const { items, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [orderNotes, setOrderNotes] = useState('');

  // Calculate delivery fee based on order value
  const calculateDeliveryFee = () => {
    if (totalPrice >= 100) return 0; // Free delivery for orders over BWP 100
    if (totalPrice >= 50) return 15; // BWP 15 for orders over BWP 50
    return 25; // BWP 25 for smaller orders
  };

  const deliveryFee = calculateDeliveryFee();
  const finalTotal = totalPrice + deliveryFee;

  // Redirect if cart is empty
  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  // Redirect if not logged in
  if (!user) {
    navigate('/login?redirect=/checkout');
    return null;
  }

  const handlePlaceOrder = async () => {
    if (!deliveryAddress.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide a delivery address",
        variant: "destructive",
      });
      return;
    }

    if (!contactNumber.trim()) {
      toast({
        title: "Missing Information", 
        description: "Please provide a contact number",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      console.log('Starting order placement process...');
      
      // Get consumer ID
      const { data: consumerData, error: consumerError } = await supabase
        .from('consumers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (consumerError) {
        console.error('Consumer lookup error:', consumerError);
        throw new Error('Failed to find consumer profile');
      }

      console.log('Consumer found:', consumerData);

      // Create the order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          consumer_id: consumerData.id,
          order_date: new Date().toISOString(),
          total_price: finalTotal,
          status: 'pending'
        })
        .select()
        .single();

      if (orderError) {
        console.error('Order creation error:', orderError);
        throw new Error('Failed to create order');
      }

      console.log('Order created:', orderData);

      // Create order items
      const orderItems = items.map(item => ({
        order_id: orderData.id,
        product_id: item.productId,
        quantity: item.quantity,
        price_per_item: item.pricePerItem
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('Order items creation error:', itemsError);
        throw new Error('Failed to create order items');
      }

      console.log('Order items created successfully');

      // Create Stripe checkout session
      console.log('Creating Stripe checkout session...');
      const { data: stripeData, error: stripeError } = await supabase.functions.invoke('create-payment', {
        body: {
          orderId: orderData.id,
          amount: Math.round(finalTotal * 100), // Convert to cents
          currency: 'bwp',
          orderItems: items.map(item => ({
            name: item.productName,
            quantity: item.quantity,
            price: item.pricePerItem
          })),
          deliveryFee: deliveryFee,
          deliveryAddress: deliveryAddress,
          contactNumber: contactNumber,
          orderNotes: orderNotes
        }
      });

      if (stripeError) {
        console.error('Stripe session creation error:', stripeError);
        throw new Error(`Failed to create payment session: ${stripeError.message}`);
      }

      console.log('Stripe session created:', stripeData);

      if (!stripeData?.url) {
        throw new Error('No payment URL received from Stripe');
      }

      // Clear the cart
      clearCart();

      // Redirect to Stripe Checkout
      console.log('Redirecting to Stripe checkout...');
      window.location.href = stripeData.url;

    } catch (error) {
      console.error('Order placement error:', error);
      toast({
        title: "Order Failed",
        description: error instanceof Error ? error.message : "Failed to place order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pt-6 pb-16 px-4">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/cart')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">Checkout</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Order Details Form */}
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <User className="h-5 w-5" />
              Contact Information
            </h2>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={user.email || ''}
                  disabled
                  className="bg-muted"
                />
              </div>
              
              <div>
                <Label htmlFor="contact">Contact Number *</Label>
                <Input
                  id="contact"
                  type="tel"
                  placeholder="Enter your phone number"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Delivery Information
            </h2>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="address">Delivery Address *</Label>
                <Textarea
                  id="address"
                  placeholder="Enter your full delivery address"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="notes">Order Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Any special instructions for your order"
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          </Card>
        </div>

        {/* Order Summary */}
        <div>
          <Card className="p-6 sticky top-6">
            <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
            
            <div className="space-y-4 mb-6">
              {items.map(item => (
                <div key={item.productId} className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-medium">{item.productName}</h3>
                    <p className="text-sm text-muted-foreground">
                      BWP {item.pricePerItem.toFixed(2)} × {item.quantity}
                    </p>
                  </div>
                  <span className="font-medium">
                    BWP {(item.pricePerItem * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
            
            <Separator className="my-4" />
            
            <div className="space-y-2 mb-6">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>BWP {totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Fee</span>
                <span className="text-sm">
                  {deliveryFee === 0 ? (
                    <span className="text-green-600">Free</span>
                  ) : (
                    `BWP ${deliveryFee.toFixed(2)}`
                  )}
                </span>
              </div>
              {deliveryFee === 0 && (
                <p className="text-xs text-green-600">Free delivery on orders over BWP 100!</p>
              )}
            </div>
            
            <Separator className="my-4" />
            
            <div className="flex justify-between font-semibold text-lg mb-6">
              <span>Total</span>
              <span>BWP {finalTotal.toFixed(2)}</span>
            </div>
            
            <Button
              className="w-full bg-market-green hover:bg-market-green-dark"
              onClick={handlePlaceOrder}
              disabled={isLoading}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              {isLoading ? 'Processing...' : 'Pay with Stripe'}
            </Button>
            
            <p className="text-xs text-muted-foreground text-center mt-4">
              You will be redirected to Stripe to complete your payment securely.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
