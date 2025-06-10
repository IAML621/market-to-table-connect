import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from "@/components/ui/switch"
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { uploadProductImage } from '@/integrations/supabase/storage';

const AddProduct = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stockLevel, setStockLevel] = useState('');
  const [category, setCategory] = useState('');
  const [unit, setUnit] = useState('');
  const [isOrganic, setIsOrganic] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      // Optionally display a preview of the image
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!name || !description || !price || !stockLevel || !category || !unit) {
      setError('Please fill in all required fields.');
      setLoading(false);
      return;
    }

    if (!user) {
      setError('You must be logged in to add a product.');
      setLoading(false);
      return;
    }

    try {
      console.log('Starting product creation for user:', user.id);

      let productImageUrl = null;
      if (image) {
        console.log('Uploading product image...');
        
        // Get or create farmer record first for image upload
        const { data: farmer, error: farmerError } = await supabase
          .from('farmers')
          .select('id')
          .eq('user_id', user.id)
          .single();

        let farmerId = farmer?.id;
        
        if (farmerError && farmerError.code === 'PGRST116') {
          // Farmer doesn't exist, create one using the database function
          const { data: newFarmerId, error: createError } = await supabase.rpc('create_farmer_with_user_data', {
            p_user_id: user.id,
            p_farm_name: null,
            p_farm_location: null
          });

          if (createError) {
            console.error('Failed to create farmer for image upload:', createError);
            setError('Failed to create farmer profile for image upload.');
            setLoading(false);
            return;
          }
          
          farmerId = newFarmerId;
          console.log('Created farmer for image upload:', farmerId);
        } else if (farmerError) {
          console.error('Error checking farmer:', farmerError);
          setError('Failed to verify farmer profile.');
          setLoading(false);
          return;
        }

        productImageUrl = await uploadProductImage(image, farmerId);
        if (!productImageUrl) {
          setError('Failed to upload product image.');
          setLoading(false);
          return;
        }
        console.log('Image uploaded successfully:', productImageUrl);
      }

      // Create the product using the edge function
      console.log('Calling create-product edge function');
      const { data, error } = await supabase.functions.invoke('create-product', {
        body: {
          name,
          description,
          price: parseFloat(price),
          stockLevel: parseInt(stockLevel),
          imageUrl: productImageUrl,
          category,
          unit,
          isOrganic,
        },
      });

      if (error) {
        console.error('Product creation error:', error);
        setError(error.message || 'Failed to add product.');
        toast({
          title: "Product creation failed",
          description: error.message || "There was a problem creating your product",
          variant: "destructive"
        });
      } else {
        console.log('Product created successfully:', data);
        toast({
          title: "Product added",
          description: "Your product has been added successfully"
        });
        navigate('/products'); // Redirect to products page
      }
    } catch (err: any) {
      console.error('Error adding product:', err);
      setError(err.message || 'An unexpected error occurred.');
      toast({
        title: "Product creation failed",
        description: err.message || "There was a problem creating your product",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-4">Add New Product</h1>
      {error && (
        <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm mb-4">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            type="text"
            placeholder="Product Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Product Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="price">Price</Label>
          <Input
            id="price"
            type="number"
            placeholder="Price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="stockLevel">Stock Level</Label>
          <Input
            id="stockLevel"
            type="number"
            placeholder="Stock Level"
            value={stockLevel}
            onChange={(e) => setStockLevel(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="category">Category</Label>
          <Select onValueChange={setCategory}>
            <SelectTrigger className="w-full">
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
        </div>
        <div>
          <Label htmlFor="unit">Unit</Label>
          <Select onValueChange={setUnit}>
            <SelectTrigger className="w-full">
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
        </div>
        <div>
          <Label htmlFor="isOrganic">Organic</Label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Switch id="isOrganic" checked={isOrganic} onCheckedChange={setIsOrganic} />
              <Label htmlFor="isOrganic">Is Organic</Label>
            </div>
          </div>
        </div>
        <div>
          <Label htmlFor="image">Image</Label>
          <Input
            id="image"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
          />
          {imageUrl && (
            <img
              src={imageUrl}
              alt="Product Preview"
              className="mt-2 w-32 h-32 object-cover rounded-md"
            />
          )}
        </div>
        <Button type="submit" className="bg-market-green hover:bg-market-green-dark w-full" disabled={loading}>
          {loading ? 'Adding Product...' : 'Add Product'}
        </Button>
      </form>
    </div>
  );
};

export default AddProduct;
