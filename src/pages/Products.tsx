
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Product } from '@/types';
import { ProductCard } from '@/components/ui/product-card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Filter, MapPin, ChevronLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
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
            category: item.category || 'Uncategorized',
            isOrganic: item.is_organic || false,
            unit: item.unit || 'each'
          }));
          
          setProducts(formattedProducts);
          setFilteredProducts(formattedProducts);
          
          // Extract unique categories
          const uniqueCategories = Array.from(
            new Set(formattedProducts.map(product => product.category || 'Uncategorized'))
          );
          setCategories(uniqueCategories);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Filter products when search query or category filter changes
  useEffect(() => {
    let filtered = products;
    
    // Apply category filter
    if (categoryFilter && categoryFilter !== 'all') {
      filtered = filtered.filter(product => product.category === categoryFilter);
    }
    
    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        product => 
          product.name.toLowerCase().includes(query) ||
          product.description.toLowerCase().includes(query) ||
          product.farmName?.toLowerCase().includes(query)
      );
    }
    
    setFilteredProducts(filtered);
  }, [searchQuery, categoryFilter, products]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <section className="rounded-xl bg-gradient-to-r from-market-green/90 to-market-green-dark text-white p-6 md:p-10 shadow-md">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Discover Fresh Farm Products</h1>
          <p className="text-lg mb-6 opacity-90">
            Browse quality products from local farmers and order directly
          </p>
          
          <div className="relative max-w-md mx-auto">
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
              <Button className="h-12 px-6 rounded-r-full bg-market-orange hover:bg-market-orange-dark border-0">
                Search
              </Button>
            </div>
          </div>

          {consumer && (
            <div className="mt-4 inline-flex items-center text-sm bg-white/20 py-1 px-3 rounded-full">
              <MapPin className="h-4 w-4 mr-1" />
              <span>Showing products near {consumer.location || 'you'}</span>
            </div>
          )}
        </div>
      </section>

      {/* Filter Section */}
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back to Home
          </Button>
          <h2 className="text-2xl font-bold">All Products</h2>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm" className="gap-2" onClick={() => setCategoryFilter('all')}>
            <Filter className="h-4 w-4" />
            Reset
          </Button>
        </div>
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
    </div>
  );
};

export default Products;
