
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, User, Package, LogOut, ShoppingBasket } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const Profile = () => {
  const { user, farmer, consumer, loading, signOut, updateUserProfile } = useAuth();
  const navigate = useNavigate();
  
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState(user?.username || '');
  const [location, setLocation] = useState(consumer?.location || '');
  const [farmName, setFarmName] = useState(farmer?.farmName || '');
  const [farmLocation, setFarmLocation] = useState(farmer?.farmLocation || '');

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const handleSaveProfile = async () => {
    try {
      if (user?.role === 'farmer') {
        await updateUserProfile({
          username,
          farmName,
          farmLocation
        });
      } else if (user?.role === 'consumer') {
        await updateUserProfile({
          username,
          location
        });
      }
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto pt-6 space-y-8">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-24" />
        </div>
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
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto pt-6 text-center py-12">
        <div className="rounded-full bg-muted w-16 h-16 mx-auto flex items-center justify-center mb-4">
          <User className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold mb-2">You're not logged in</h2>
        <p className="text-muted-foreground mb-8">Sign in to view your profile and manage your orders.</p>
        <div className="flex gap-4 justify-center">
          <Button 
            className="bg-market-green hover:bg-market-green-dark"
            onClick={() => navigate('/login')}
          >
            Sign In
          </Button>
          <Button 
            variant="outline"
            onClick={() => navigate('/register')}
          >
            Create Account
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pt-6 pb-16 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Profile</h1>
        <Button 
          variant="outline" 
          size="sm"
          className="gap-2 text-muted-foreground" 
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-3 mb-6">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          {user.role === 'farmer' && (
            <TabsTrigger value="products">My Products</TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isEditing ? (
                  <form className="space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input
                          id="username"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          value={user.email}
                          disabled
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Email cannot be changed
                        </p>
                      </div>

                      {user.role === 'consumer' && (
                        <div className="space-y-2">
                          <Label htmlFor="location">Location</Label>
                          <Input
                            id="location"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                          />
                        </div>
                      )}

                      {user.role === 'farmer' && (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor="farmName">Farm Name</Label>
                            <Input
                              id="farmName"
                              value={farmName}
                              onChange={(e) => setFarmName(e.target.value)}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="farmLocation">Farm Location</Label>
                            <Input
                              id="farmLocation"
                              value={farmLocation}
                              onChange={(e) => setFarmLocation(e.target.value)}
                            />
                          </div>
                        </>
                      )}
                    </div>

                    <div className="flex gap-3 pt-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsEditing(false)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="button" 
                        onClick={handleSaveProfile}
                        className="flex-1 bg-market-green hover:bg-market-green-dark"
                      >
                        Save Changes
                      </Button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="flex flex-col space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-2">
                        <span className="text-muted-foreground">Username</span>
                        <span className="font-medium">{user.username}</span>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-2">
                        <span className="text-muted-foreground">Email</span>
                        <span className="font-medium">{user.email}</span>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-2">
                        <span className="text-muted-foreground">Account Type</span>
                        <span className="font-medium capitalize">{user.role}</span>
                      </div>
                      
                      {consumer && (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-2">
                          <span className="text-muted-foreground">Location</span>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4 text-market-green" />
                            <span>{consumer.location}</span>
                          </div>
                        </div>
                      )}

                      {farmer && (
                        <>
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-2">
                            <span className="text-muted-foreground">Farm Name</span>
                            <span className="font-medium">{farmer.farmName}</span>
                          </div>
                          
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-2">
                            <span className="text-muted-foreground">Farm Location</span>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4 text-market-green" />
                              <span>{farmer.farmLocation}</span>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                    
                    <div className="pt-4">
                      <Button 
                        onClick={() => setIsEditing(true)}
                        className="bg-market-green hover:bg-market-green-dark"
                      >
                        Edit Profile
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>Your Orders</CardTitle>
            </CardHeader>
            <CardContent className="text-center py-12">
              <div className="rounded-full bg-muted w-16 h-16 mx-auto flex items-center justify-center mb-4">
                <ShoppingBasket className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-1">No orders yet</h3>
              <p className="text-muted-foreground mb-6">
                When you place an order, it will appear here.
              </p>
              <Button 
                onClick={() => navigate('/')}
                className="bg-market-green hover:bg-market-green-dark"
              >
                Browse Products
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        {user.role === 'farmer' && (
          <TabsContent value="products">
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
                <Button className="bg-market-green hover:bg-market-green-dark">
                  Add Product
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default Profile;
