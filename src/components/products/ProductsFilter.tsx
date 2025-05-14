
import React from 'react';
import { Filter, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ProductsFilterProps {
  categories: string[];
  categoryFilter: string;
  setCategoryFilter: (value: string) => void;
}

export const ProductsFilter: React.FC<ProductsFilterProps> = ({ 
  categories, 
  categoryFilter, 
  setCategoryFilter 
}) => {
  const navigate = useNavigate();
  
  return (
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
  );
};
