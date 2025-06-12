
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from "@/components/ui/switch";
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { uploadProductImage } from '@/integrations/supabase/storage';
import { Trash2, Plus } from 'lucide-react';

interface ProductEntry {
  id: string;
  name: string;
  description: string;
  price: string;
  stockLevel: string;
  category: string;
  unit: string;
  isOrganic: boolean;
  image: File | null;
  imageUrl: string | null;
}

const BulkProductForm = () => {
  const [products, setProducts] = useState<ProductEntry[]>([
    {
      id: '1',
      name: '',
      description: '',
      price: '',
      stockLevel: '',
      category: '',
      unit: '',
      isOrganic: false,
      image: null,
      imageUrl: null,
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const addProductEntry = () => {
    const newProduct: ProductEntry = {
      id: Date.now().toString(),
      name: '',
      description: '',
      price: '',
      stockLevel: '',
      category: '',
      unit: '',
      isOrganic: false,
      image: null,
      imageUrl: null,
    };
    setProducts([...products, newProduct]);
  };

  const removeProductEntry = (id: string) => {
    if (products.length > 1) {
      setProducts(products.filter(product => product.id !== id));
    }
  };

  const updateProduct = (id: string, field: keyof ProductEntry, value: any) => {
    setProducts(products.map(product => 
      product.id === id ? { ...product, [field]: value } : product
    ));
  };

  const handleImageChange = (id: string, file: File | null) => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateProduct(id, 'image', file);
        updateProduct(id, 'imageUrl', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const validateProducts = () => {
    const newErrors: Record<string, string> = {};
    
    products.forEach((product, index) => {
      if (!product.name) newErrors[`${product.id}-name`] = 'Name is required';
      if (!product.description) newErrors[`${product.id}-description`] = 'Description is required';
      if (!product.price) newErrors[`${product.id}-price`] = 'Price is required';
      if (!product.stockLevel) newErrors[`${product.id}-stockLevel`] = 'Stock level is required';
      if (!product.category) newErrors[`${product.id}-category`] = 'Category is required';
      if (!product.unit) newErrors[`${product.id}-unit`] = 'Unit is required';
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateProducts()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields for all products",
        variant: "destructive"
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to add products",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      console.log('Starting bulk product creation for user:', user.id);

      // Get or create farmer record first
      const { data: farmer, error: farmerError } = await supabase
        .from('farmers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      let farmerId = farmer?.id;

      if (farmerError && farmerError.code === 'PGRST116') {
        const { data: newFarmerId, error: createError } = await supabase.rpc('create_farmer_with_user_data', {
          p_user_id: user.id,
          p_farm_name: null,
          p_farm_location: null
        });

        if (createError) {
          console.error('Failed to create farmer:', createError);
          toast({
            title: "Error",
            description: "Failed to create farmer profile",
            variant: "destructive"
          });
          return;
        }
        
        farmerId = newFarmerId;
      } else if (farmerError) {
        console.error('Error checking farmer:', farmerError);
        toast({
          title: "Error",
          description: "Failed to verify farmer profile",
          variant: "destructive"
        });
        return;
      }

      const createdProducts = [];

      for (const product of products) {
        try {
          let productImageUrl = null;
          
          if (product.image) {
            console.log('Uploading image for product:', product.name);
            productImageUrl = await uploadProductImage(product.image, farmerId);
            if (!productImageUrl) {
              throw new Error(`Failed to upload image for ${product.name}`);
            }
          }

          console.log('Creating product:', product.name);
          const { data, error } = await supabase.functions.invoke('create-product', {
            body: {
              name: product.name,
              description: product.description,
              price: parseFloat(product.price),
              stockLevel: parseInt(product.stockLevel),
              imageUrl: productImageUrl,
              category: product.category,
              unit: product.unit,
              isOrganic: product.isOrganic,
            },
          });

          if (error) {
            throw new Error(`Failed to create ${product.name}: ${error.message}`);
          }

          createdProducts.push(data.product);
          console.log('Successfully created product:', product.name);

        } catch (productError: any) {
          console.error(`Error creating product ${product.name}:`, productError);
          throw new Error(`Failed to create ${product.name}: ${productError.message}`);
        }
      }

      toast({
        title: "Products Added Successfully",
        description: `Successfully added ${createdProducts.length} products`
      });

      navigate('/products');

    } catch (err: any) {
      console.error('Error in bulk product creation:', err);
      toast({
        title: "Bulk Creation Failed",
        description: err.message || "There was a problem creating your products",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-8 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Add Multiple Products</h1>
        <Button 
          type="button" 
          onClick={addProductEntry}
          className="bg-market-green hover:bg-market-green-dark"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Another Product
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {products.map((product, index) => (
          <div key={product.id} className="border rounded-lg p-6 space-y-4 relative">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Product {index + 1}</h3>
              {products.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeProductEntry(product.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`name-${product.id}`}>Name</Label>
                <Input
                  id={`name-${product.id}`}
                  type="text"
                  placeholder="Product Name"
                  value={product.name}
                  onChange={(e) => updateProduct(product.id, 'name', e.target.value)}
                  className={errors[`${product.id}-name`] ? 'border-destructive' : ''}
                  required
                />
                {errors[`${product.id}-name`] && (
                  <p className="text-sm text-destructive mt-1">{errors[`${product.id}-name`]}</p>
                )}
              </div>

              <div>
                <Label htmlFor={`price-${product.id}`}>Price</Label>
                <Input
                  id={`price-${product.id}`}
                  type="number"
                  placeholder="Price"
                  value={product.price}
                  onChange={(e) => updateProduct(product.id, 'price', e.target.value)}
                  className={errors[`${product.id}-price`] ? 'border-destructive' : ''}
                  required
                />
                {errors[`${product.id}-price`] && (
                  <p className="text-sm text-destructive mt-1">{errors[`${product.id}-price`]}</p>
                )}
              </div>

              <div>
                <Label htmlFor={`stockLevel-${product.id}`}>Stock Level</Label>
                <Input
                  id={`stockLevel-${product.id}`}
                  type="number"
                  placeholder="Stock Level"
                  value={product.stockLevel}
                  onChange={(e) => updateProduct(product.id, 'stockLevel', e.target.value)}
                  className={errors[`${product.id}-stockLevel`] ? 'border-destructive' : ''}
                  required
                />
                {errors[`${product.id}-stockLevel`] && (
                  <p className="text-sm text-destructive mt-1">{errors[`${product.id}-stockLevel`]}</p>
                )}
              </div>

              <div>
                <Label htmlFor={`category-${product.id}`}>Category</Label>
                <Select onValueChange={(value) => updateProduct(product.id, 'category', value)} value={product.category}>
                  <SelectTrigger className={errors[`${product.id}-category`] ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Fruits">Fruits</SelectItem>
                    <SelectItem value="Vegetables">Vegetables</SelectItem>
                    <SelectItem value="Dairy">Dairy</SelectItem>
                    <SelectItem value="Meat">Meat</SelectItem>
                    <SelectItem value="Baked Goods">Baked Goods</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {errors[`${product.id}-category`] && (
                  <p className="text-sm text-destructive mt-1">{errors[`${product.id}-category`]}</p>
                )}
              </div>

              <div>
                <Label htmlFor={`unit-${product.id}`}>Unit</Label>
                <Select onValueChange={(value) => updateProduct(product.id, 'unit', value)} value={product.unit}>
                  <SelectTrigger className={errors[`${product.id}-unit`] ? 'border-destructive' : ''}>
                    <SelectValue placeholder="Select a unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="lb">lb</SelectItem>
                    <SelectItem value="piece">piece</SelectItem>
                    <SelectItem value="bunch">bunch</SelectItem>
                    <SelectItem value="dozen">dozen</SelectItem>
                    <SelectItem value="other">other</SelectItem>
                  </SelectContent>
                </Select>
                {errors[`${product.id}-unit`] && (
                  <p className="text-sm text-destructive mt-1">{errors[`${product.id}-unit`]}</p>
                )}
              </div>

              <div>
                <Label htmlFor={`organic-${product.id}`}>Organic</Label>
                <div className="flex items-center space-x-2 mt-2">
                  <Switch 
                    id={`organic-${product.id}`} 
                    checked={product.isOrganic} 
                    onCheckedChange={(checked) => updateProduct(product.id, 'isOrganic', checked)} 
                  />
                  <Label htmlFor={`organic-${product.id}`}>Is Organic</Label>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor={`description-${product.id}`}>Description</Label>
              <Textarea
                id={`description-${product.id}`}
                placeholder="Product Description"
                value={product.description}
                onChange={(e) => updateProduct(product.id, 'description', e.target.value)}
                className={errors[`${product.id}-description`] ? 'border-destructive' : ''}
                required
              />
              {errors[`${product.id}-description`] && (
                <p className="text-sm text-destructive mt-1">{errors[`${product.id}-description`]}</p>
              )}
            </div>

            <div>
              <Label htmlFor={`image-${product.id}`}>Image</Label>
              <Input
                id={`image-${product.id}`}
                type="file"
                accept="image/*"
                onChange={(e) => handleImageChange(product.id, e.target.files?.[0] || null)}
              />
              {product.imageUrl && (
                <img
                  src={product.imageUrl}
                  alt="Product Preview"
                  className="mt-2 w-32 h-32 object-cover rounded-md"
                />
              )}
            </div>
          </div>
        ))}

        <div className="flex gap-4">
          <Button 
            type="submit" 
            className="bg-market-green hover:bg-market-green-dark flex-1" 
            disabled={loading}
          >
            {loading ? `Adding ${products.length} Products...` : `Add ${products.length} Products`}
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => navigate('/add-product')}
            disabled={loading}
          >
            Add Single Product Instead
          </Button>
        </div>
      </form>
    </div>
  );
};

export default BulkProductForm;
