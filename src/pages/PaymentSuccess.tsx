
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Package, Home, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const sessionId = searchParams.get('session_id');
  const orderId = searchParams.get('order_id');

  useEffect(() => {
    const updateOrderStatus = async () => {
      if (!orderId) {
        toast({
          title: "Error",
          description: "Order ID not found",
          variant: "destructive",
        });
        navigate('/');
        return;
      }

      try {
        // Update order status to completed
        const { error: updateError } = await supabase
          .from('orders')
          .update({ status: 'confirmed' })
          .eq('id', orderId);

        if (updateError) {
          throw updateError;
        }

        // Fetch order details
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select(`
            *,
            order_items (
              *,
              products (name, price)
            )
          `)
          .eq('id', orderId)
          .single();

        if (orderError) {
          throw orderError;
        }

        setOrderDetails(orderData);

        toast({
          title: "Payment Successful!",
          description: `Your order #${orderId.slice(0, 8)} has been confirmed`,
        });

      } catch (error) {
        console.error('Error updating order:', error);
        toast({
          title: "Error",
          description: "Failed to confirm order status",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    updateOrderStatus();
  }, [orderId, navigate, toast]);

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto pt-20 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-market-green mx-auto mb-4"></div>
        <p>Confirming your payment...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pt-12 pb-16 px-4">
      <Card className="p-8 text-center">
        <div className="mb-6">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-green-600 mb-2">
            Payment Successful!
          </h1>
          <p className="text-muted-foreground">
            Thank you for your order. Your payment has been processed successfully.
          </p>
        </div>

        {orderDetails && (
          <div className="bg-muted rounded-lg p-6 mb-6">
            <h2 className="font-semibold mb-4">Order Details</h2>
            <div className="text-left space-y-2">
              <div className="flex justify-between">
                <span>Order ID:</span>
                <span className="font-mono">#{orderDetails.id.slice(0, 8)}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Amount:</span>
                <span className="font-semibold">BWP {orderDetails.total_price.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <span className="capitalize text-green-600 font-medium">
                  {orderDetails.status}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground mb-6">
            You will receive a confirmation email shortly. The farmer will contact you 
            to arrange delivery of your fresh produce.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              onClick={() => navigate('/')}
              className="bg-market-green hover:bg-market-green-dark"
            >
              <Home className="h-4 w-4 mr-2" />
              Continue Shopping
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => navigate('/messages')}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Message Farmer
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default PaymentSuccess;
