
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Product } from '@/types';
import { ProductCard } from '@/components/ui/product-card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Filter, MapPin } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const navigate = useNavigate();
  const { user, consumer } = useAuth();

  useEffect(() => {
    const fetchProducts = async () => {
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
          .gt('stock_level', 0)
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (data) {
          const formattedProducts = data.map(item => ({
            id: item.id,
            name: item.name,
            description: item.description,
            price: item.price,
            stockLevel: item.stock_level,
            farmerId: item.farmer_id,
            farmName: item.farmers.farm_name,
            farmerName: item.farmers.users.username,
            imageUrl: item.image_url || undefined,
            created_at: item.created_at,
            category: item.category || undefined,
            isOrganic: item.is_organic || false,
            unit: item.unit || 'each'
          }));
          
          setProducts(formattedProducts);
          setFilteredProducts(formattedProducts);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Filter products when search query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredProducts(products);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = products.filter(
      product => 
        product.name.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query) ||
        product.category?.toLowerCase().includes(query) ||
        product.farmName?.toLowerCase().includes(query)
    );
    
    setFilteredProducts(filtered);
  }, [searchQuery, products]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <section className="rounded-xl bg-gradient-to-r from-market-green/90 to-market-green-dark text-white p-6 md:p-10 shadow-md">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Fresh from Farm to Your Table</h1>
          <p className="text-lg mb-6 opacity-90">
            Connect directly with local farmers and discover fresh, seasonal produce in your area
          </p>
          
          <div className="relative max-w-md mx-auto">
            <div className="flex">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-5 w-5" />
                <Input
                  type="text"
                  placeholder="Search for fresh produce..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  className="pl-10 h-12 rounded-l-full bg-white/90 text-black border-0 ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
              <Button className="h-12 px-6 rounded-r-full bg-market-orange hover:bg-market-orange-dark border-0">
                Search
              </Button>
            </div>
          </div>

          {consumer && (
            <div className="mt-4 inline-flex items-center text-sm bg-white/20 py-1 px-3 rounded-full">
              <MapPin className="h-4 w-4 mr-1" />
              <span>Showing products near {consumer.location}</span>
            </div>
          )}
        </div>
      </section>

      {/* Filter Section */}
      <section className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Fresh Products</h2>
        <Button variant="outline" size="sm" className="gap-2">
          <Filter className="h-4 w-4" />
          Filter
        </Button>
      </section>
      
      {/* Products Grid */}
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
      
      {/* CTA Section */}
      {!user && (
        <section className="rounded-xl bg-secondary p-6 md:p-10 text-center mt-10">
          <h2 className="text-2xl font-bold mb-4">Ready to connect with local farmers?</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Create an account to place orders, chat with farmers, and get notified about new products and special offers.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => navigate('/register')}
              className="bg-market-green hover:bg-market-green-dark text-white"
              size="lg"
            >
              Sign Up Now
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/login')}
              size="lg"
            >
              Log In
            </Button>
          </div>
        </section>
      )}
    </div>
  );
};

export default Index;
