
import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingBasket, MessageCircle, User, Package, Home } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export const MainLayout: React.FC = () => {
  const { user, signOut } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex flex-col min-h-screen bg-market-bg-light">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-border/40 shadow-sm">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2" onClick={() => navigate('/')} role="button">
            <Package className="h-6 w-6 text-market-green" />
            <span className="font-bold text-lg">Market Connect</span>
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate('/profile')}
                className="hidden md:flex"
              >
                {user.username}
              </Button>
            ) : (
              <div className="hidden md:flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate('/login')}
                >
                  Log In
                </Button>
                <Button 
                  size="sm"
                  onClick={() => navigate('/register')}
                  className="bg-market-green hover:bg-market-green-dark"
                >
                  Sign Up
                </Button>
              </div>
            )}

            <Button
              variant="outline"
              size="icon"
              className="relative"
              onClick={() => navigate('/cart')}
            >
              <ShoppingBasket className="h-5 w-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-market-orange text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 container py-6 px-4">
        <Outlet />
      </main>

      {/* Mobile navigation bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 border-t bg-white z-40">
        <div className="flex justify-around items-center h-16">
          <button 
            onClick={() => navigate('/')}
            className={cn(
              "flex flex-col items-center justify-center w-full h-full",
              isActive('/') && "text-market-green"
            )}
          >
            <Home className="h-5 w-5" />
            <span className="text-xs mt-1">Home</span>
          </button>
          
          <button 
            onClick={() => navigate('/messages')}
            className={cn(
              "flex flex-col items-center justify-center w-full h-full",
              isActive('/messages') && "text-market-green"
            )}
          >
            <MessageCircle className="h-5 w-5" />
            <span className="text-xs mt-1">Messages</span>
          </button>
          
          <button 
            onClick={() => navigate('/cart')}
            className={cn(
              "flex flex-col items-center justify-center w-full h-full relative",
              isActive('/cart') && "text-market-green"
            )}
          >
            <ShoppingBasket className="h-5 w-5" />
            {totalItems > 0 && (
              <span className="absolute top-1 right-6 bg-market-orange text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                {totalItems}
              </span>
            )}
            <span className="text-xs mt-1">Cart</span>
          </button>
          
          <button 
            onClick={() => navigate('/profile')}
            className={cn(
              "flex flex-col items-center justify-center w-full h-full",
              isActive('/profile') && "text-market-green"
            )}
          >
            <User className="h-5 w-5" />
            <span className="text-xs mt-1">Profile</span>
          </button>
        </div>
      </div>

      {/* Bottom padding to account for mobile navigation */}
      <div className="md:hidden h-16" />
    </div>
  );
};
