
import React from 'react';
import { Search, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Consumer } from '@/types';

interface ProductsHeroProps {
  searchQuery: string;
  handleSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  consumer: Consumer | null;
  onSearch?: () => void;
}

export const ProductsHero: React.FC<ProductsHeroProps> = ({ 
  searchQuery, 
  handleSearchChange,
  consumer,
  onSearch
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) onSearch();
  };

  return (
    <section className="rounded-xl bg-gradient-to-r from-market-green/90 to-market-green-dark text-white p-6 md:p-10 shadow-md">
      <div className="max-w-3xl mx-auto text-center">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">Discover Fresh Farm Products</h1>
        <p className="text-lg mb-6 opacity-90">
          Browse quality products from local farmers and order directly
        </p>
        
        <form onSubmit={handleSubmit} className="relative max-w-md mx-auto">
          <div className="flex">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-5 w-5" />
              <Input
                type="text"
                placeholder="Search for products, farms..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="pl-10 h-12 rounded-l-full bg-white/90 text-black border-0 ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
            <Button 
              type="submit"
              className="h-12 px-6 rounded-r-full bg-market-orange hover:bg-market-orange-dark border-0"
            >
              Search
            </Button>
          </div>
        </form>

        {consumer && (
          <div className="mt-4 inline-flex items-center text-sm bg-white/20 py-1 px-3 rounded-full">
            <MapPin className="h-4 w-4 mr-1" />
            <span>Showing products near {consumer.location || 'you'}</span>
          </div>
        )}
      </div>
    </section>
  );
};
