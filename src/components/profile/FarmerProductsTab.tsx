
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Plus, Edit, Trash2, Eye } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useFarmerProducts } from '@/hooks/useFarmerProducts';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface FarmerProductsTabProps {
  farmerId?: string;
}

export const FarmerProductsTab: React.FC<FarmerProductsTabProps> = ({ farmerId }) => {
  const navigate = useNavigate();
  const { products, loading, error, deleteProduct } = useFarmerProducts(farmerId);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (productId: string) => {
    setDeletingId(productId);
    const success = await deleteProduct(productId);
    setDeletingId(null);
    
    if (!success) {
      // Error handling is done in the hook
    }
  };

  const handleViewProduct = (productId: string) => {
    navigate(`/products/${productId}`);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Products</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-12">
          <div className="rounded-full bg-muted w-16 h-16 mx-auto flex items-center justify-center mb-4">
            <Package className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-1">Error loading products</h3>
          <p className="text-muted-foreground mb-6">{error}</p>
          <Button 
            onClick={() => window.location.reload()}
            className="bg-market-green hover:bg-market-green-dark"
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (products.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Products</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-12">
          <div className="rounded-full bg-muted w-16 h-16 mx-auto flex items-center justify-center mb-4">
            <Package className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-1">No products yet</h3>
          <p className="text-muted-foreground mb-6">
            Add products to showcase and sell to local consumers.
          </p>
          <Button 
            className="bg-market-green hover:bg-market-green-dark flex items-center gap-2"
            onClick={() => navigate('/add-product')}
          >
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Your Products ({products.length})</CardTitle>
        <div className="flex gap-2">
          <Button 
            size="sm"
            onClick={() => navigate('/add-product')}
            className="bg-market-green hover:bg-market-green-dark"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
          <Button 
            size="sm"
            variant="outline"
            onClick={() => navigate('/add-products-bulk')}
          >
            <Plus className="h-4 w-4 mr-2" />
            Bulk Add
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    {product.imageUrl ? (
                      <img 
                        src={product.imageUrl} 
                        alt={product.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                        <Package className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-muted-foreground line-clamp-1">
                        {product.description}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm">{product.category}</span>
                  {product.isOrganic && (
                    <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      Organic
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <span className="font-medium">BWP {product.price.toFixed(2)}</span>
                  <span className="text-xs text-muted-foreground">/{product.unit}</span>
                </TableCell>
                <TableCell>
                  <span className={`text-sm ${product.stockLevel > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {product.stockLevel} {product.unit}
                  </span>
                </TableCell>
                <TableCell>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    product.stockLevel > 0 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {product.stockLevel > 0 ? 'In Stock' : 'Out of Stock'}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleViewProduct(product.id)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        // TODO: Implement edit functionality
                        console.log('Edit product:', product.id);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={deletingId === product.id}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Product</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{product.name}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(product.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
