
import React, { createContext, useContext, useEffect, useState } from 'react';
import { OrderItem, Product } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface CartItem extends OrderItem {
  productName: string;
  productImage?: string;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const { toast } = useToast();

  // Initialize cart from localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem('market_cart');
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (error) {
        console.error('Failed to parse cart from localStorage', error);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('market_cart', JSON.stringify(items));
  }, [items]);

  const addToCart = (product: Product, quantity: number) => {
    if (quantity <= 0) return;
    
    // Check if we already have this product in cart
    const existingItem = items.find(item => item.productId === product.id);
    
    if (existingItem) {
      // Update existing item
      updateQuantity(product.id, existingItem.quantity + quantity);
    } else {
      // Add new item
      const newItem: CartItem = {
        id: `temp-${Date.now()}`, // Will be replaced with actual ID when order is created
        orderId: '', // Will be set when order is created
        productId: product.id,
        productName: product.name,
        productImage: product.imageUrl,
        quantity: quantity,
        pricePerItem: product.price,
      };
      
      setItems(prevItems => [...prevItems, newItem]);
      toast({
        title: "Added to cart",
        description: `${quantity} × ${product.name} added to your cart`,
      });
    }
  };

  const removeFromCart = (productId: string) => {
    setItems(prevItems => prevItems.filter(item => item.productId !== productId));
    toast({
      title: "Removed from cart",
      description: "Item removed from your cart",
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setItems(prevItems => 
      prevItems.map(item => 
        item.productId === productId 
          ? { ...item, quantity } 
          : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  
  const totalPrice = items.reduce(
    (sum, item) => sum + (item.quantity * item.pricePerItem), 
    0
  );

  return (
    <CartContext.Provider value={{
      items,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      totalItems,
      totalPrice,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
