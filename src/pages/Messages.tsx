import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { MessageCircle, Send, User, Plus, Search, Store, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Message } from '@/types';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter 
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface FarmData {
  id: string;
  user_id: string;
  farm_name: string;
  username: string;
  location: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  stock_level: number;
  image_url?: string;
}

const Messages = () => {
  const { user, loading, getFarmerId, getConsumerId } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const params = new URLSearchParams(location.search);
  const targetFarmerId = params.get('farmerId');
  
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [recipientName, setRecipientName] = useState<string>('');
  const [senderId, setSenderId] = useState<string | null>(null);
  
  // New state for new conversation dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedFarm, setSelectedFarm] = useState<string>('');
  const [availableFarms, setAvailableFarms] = useState<FarmData[]>([]);
  const [firstMessage, setFirstMessage] = useState('');
  const [farmsLoading, setFarmsLoading] = useState(false);
  
  // Product catalog state
  const [showProducts, setShowProducts] = useState(false);
  const [selectedFarmProducts, setSelectedFarmProducts] = useState<Product[]>([]);
  const [selectedFarmName, setSelectedFarmName] = useState<string>('');
  const [productsLoading, setProductsLoading] = useState(false);

  // Fetch user ID based on role
  useEffect(() => {
    const fetchUserId = async () => {
      if (user) {
        console.log('Fetching user ID for role:', user.role);
        if (user.role === 'farmer') {
          const id = await getFarmerId();
          console.log('Farmer ID:', id);
          setSenderId(id);
        } else if (user.role === 'consumer') {
          const id = await getConsumerId();
          console.log('Consumer ID:', id);
          setSenderId(id);
        }
      }
    };
    
    fetchUserId();
  }, [user, getFarmerId, getConsumerId]);

  // Fetch available farms with user_id mapping
  useEffect(() => {
    const fetchFarms = async () => {
      if (!user || user.role !== 'consumer') return;
      
      try {
        setFarmsLoading(true);
        const { data: farmsData, error } = await supabase
          .from('farmers')
          .select(`
            id,
            user_id,
            farm_name,
            farm_location,
            users!inner(username)
          `);
        
        if (error) {
          console.error('Error fetching farms:', error);
          return;
        }
        
        console.log('Fetched farms data:', farmsData);
        
        const farms: FarmData[] = farmsData?.map(farm => ({
          id: farm.id,
          user_id: farm.user_id,
          farm_name: farm.farm_name || 'Unnamed Farm',
          username: (farm.users as any)?.username || 'Unknown',
          location: farm.farm_location || 'Unknown location'
        })) || [];
        
        console.log('Processed farms:', farms);
        setAvailableFarms(farms);
      } catch (error) {
        console.error('Error fetching farms:', error);
        toast({
          variant: "destructive",
          title: "Failed to load farms",
          description: "Please try again later."
        });
      } finally {
        setFarmsLoading(false);
      }
    };
    
    fetchFarms();
  }, [user, toast]);

  // Set up initial conversation when farmerId is provided
  useEffect(() => {
    const setupInitialConversation = async () => {
      if (targetFarmerId && availableFarms.length > 0 && senderId) {
        console.log('Setting up conversation with farmerId:', targetFarmerId);
        
        // Find the farmer by farmer ID and get their user ID
        const targetFarm = availableFarms.find(farm => farm.id === targetFarmerId);
        if (targetFarm) {
          console.log('Found target farm:', targetFarm);
          
          // Check if conversation already exists
          const existingConversation = conversations.find(conv => conv.id === targetFarm.user_id);
          
          if (existingConversation) {
            // Conversation exists, just select it
            console.log('Existing conversation found, selecting it');
            setActiveConversation(targetFarm.user_id);
            setRecipientName(targetFarm.farm_name);
          } else {
            // No existing conversation, create a new one
            console.log('No existing conversation, creating new one');
            setActiveConversation(targetFarm.user_id);
            setRecipientName(targetFarm.farm_name);
            
            // Add to conversations list if not already there
            const newConversation = {
              id: targetFarm.user_id,
              name: targetFarm.farm_name,
              info: `by ${targetFarm.username} • ${targetFarm.location}`,
              lastMessage: '',
              timestamp: new Date().toISOString(),
              unread: 0
            };
            
            setConversations(prev => {
              const exists = prev.find(conv => conv.id === targetFarm.user_id);
              if (!exists) {
                return [newConversation, ...prev];
              }
              return prev;
            });
          }
        }
      }
    };
    
    setupInitialConversation();
  }, [targetFarmerId, availableFarms, senderId, conversations]);
  
  // Fetch conversations
  useEffect(() => {
    const fetchConversations = async () => {
      if (!user || !senderId) {
        console.log('Cannot fetch conversations: user or senderId missing');
        return;
      }
      
      try {
        console.log('Fetching conversations for user role:', user.role, 'senderId:', senderId);
        
        const { data: allMessages, error } = await supabase
          .from('messages')
          .select('*')
          .or(`sender_id.eq.${senderId},receiver_id.eq.${senderId}`)
          .order('timestamp', { ascending: false });
        
        if (error) {
          console.error('Error fetching messages:', error);
          throw error;
        }
        
        console.log('All messages:', allMessages);
        
        if (allMessages && allMessages.length > 0) {
          const conversationMap = new Map();
          
          for (const msg of allMessages) {
            const partnerId = msg.sender_id === senderId ? msg.receiver_id : msg.sender_id;
            
            if (!conversationMap.has(partnerId)) {
              conversationMap.set(partnerId, {
                id: partnerId,
                name: `User ${partnerId.substring(0, 8)}`,
                info: '',
                lastMessage: msg.content,
                timestamp: msg.timestamp,
                unread: msg.receiver_id === senderId && !msg.is_read ? 1 : 0
              });
            } else if (msg.receiver_id === senderId && !msg.is_read) {
              const conv = conversationMap.get(partnerId);
              conv.unread = (conv.unread || 0) + 1;
              conversationMap.set(partnerId, conv);
            }
          }
          
          const conversationsArray = Array.from(conversationMap.values());
          
          for (const conv of conversationsArray) {
            try {
              const { data: farmerData } = await supabase
                .from('farmers')
                .select(`
                  farm_name,
                  users!inner(username)
                `)
                .eq('user_id', conv.id)
                .single();
              
              if (farmerData && (farmerData.users as any)) {
                conv.name = farmerData.farm_name || (farmerData.users as any).username;
                conv.info = `by ${(farmerData.users as any).username}`;
              } else {
                const { data: consumerData } = await supabase
                  .from('consumers')
                  .select(`
                    location,
                    users!inner(username)
                  `)
                  .eq('user_id', conv.id)
                  .single();
                
                if (consumerData && (consumerData.users as any)) {
                  conv.name = (consumerData.users as any).username;
                  conv.info = consumerData.location;
                }
              }
            } catch (err) {
              console.log('Could not fetch user details for:', conv.id);
            }
          }
          
          setConversations(conversationsArray);
          
          if (!activeConversation && conversationsArray.length > 0) {
            const firstId = conversationsArray[0].id;
            setActiveConversation(firstId);
            setRecipientName(conversationsArray[0].name);
          }
        } else {
          setConversations([]);
        }
      } catch (error) {
        console.error('Error fetching conversations:', error);
        toast({
          variant: "destructive",
          title: "Failed to load conversations",
          description: "Please try again later."
        });
      }
    };
    
    fetchConversations();
  }, [user, senderId, toast, activeConversation]);

  // Fetch messages for active conversation
  useEffect(() => {
    const fetchMessages = async () => {
      if (!activeConversation || !senderId) return;
      
      try {
        console.log('Fetching messages between:', senderId, 'and', activeConversation);
        
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .or(`and(sender_id.eq.${senderId},receiver_id.eq.${activeConversation}),and(sender_id.eq.${activeConversation},receiver_id.eq.${senderId})`)
          .order('timestamp', { ascending: true });
        
        if (error) throw error;
        
        console.log('Messages data:', data);
        
        if (data) {
          const unreadMsgIds = data
            .filter(msg => msg.receiver_id === senderId && !msg.is_read)
            .map(msg => msg.id);
          
          if (unreadMsgIds.length > 0) {
            await supabase
              .from('messages')
              .update({ is_read: true })
              .in('id', unreadMsgIds);
          }
          
          setMessages(data.map(msg => ({
            id: msg.id,
            senderId: msg.sender_id,
            receiverId: msg.receiver_id,
            content: msg.content,
            timestamp: msg.timestamp,
            isRead: msg.is_read
          })));
          
          const conversation = conversations.find(c => c.id === activeConversation);
          if (conversation) {
            setRecipientName(conversation.name);
          }
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
        toast({
          variant: "destructive",
          title: "Failed to load messages",
          description: "Please try again later."
        });
      }
    };
    
    fetchMessages();
  }, [activeConversation, senderId, conversations, toast]);

  // Fetch products for selected farm
  const fetchFarmProducts = async (farmId: string, farmName: string) => {
    try {
      setProductsLoading(true);
      const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .eq('farmer_id', farmId)
        .gt('stock_level', 0);
      
      if (error) {
        console.error('Error fetching products:', error);
        throw error;
      }
      
      setSelectedFarmProducts(products || []);
      setSelectedFarmName(farmName);
      setShowProducts(true);
    } catch (error) {
      console.error('Error fetching farm products:', error);
      toast({
        variant: "destructive",
        title: "Failed to load products",
        description: "Please try again later."
      });
    } finally {
      setProductsLoading(false);
    }
  };

  // Start new conversation
  const startNewConversation = async () => {
    if (!selectedFarm || !firstMessage.trim() || !senderId) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please select a farm and enter a message."
      });
      return;
    }
    
    try {
      // Find the selected farm to get the user_id
      const farm = availableFarms.find(f => f.id === selectedFarm);
      if (!farm) {
        toast({
          variant: "destructive",
          title: "Farm not found",
          description: "Selected farm could not be found."
        });
        return;
      }

      const newMessage = {
        sender_id: senderId,
        receiver_id: farm.user_id, // Use the farmer's user_id, not farmer_id
        content: firstMessage,
        timestamp: new Date().toISOString(),
        is_read: false
      };
      
      console.log('Sending message:', newMessage);
      
      const { error } = await supabase.from('messages').insert(newMessage);
      
      if (error) throw error;
      
      setDialogOpen(false);
      setSelectedFarm('');
      setFirstMessage('');
      
      setActiveConversation(farm.user_id);
      
      const newConversation = {
        id: farm.user_id,
        name: farm.farm_name,
        info: `by ${farm.username}`,
        lastMessage: firstMessage,
        timestamp: new Date().toISOString(),
        unread: 0
      };
      
      setConversations(prev => [newConversation, ...prev]);
      setRecipientName(farm.farm_name);
      
      setMessages([{
        id: Date.now().toString(),
        senderId: senderId,
        receiverId: farm.user_id,
        content: firstMessage,
        timestamp: new Date().toISOString(),
        isRead: false
      }]);
      
      toast({
        title: "Conversation started",
        description: "Your message has been sent."
      });
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast({
        variant: "destructive",
        title: "Failed to start conversation",
        description: "Please try again later."
      });
    }
  };

  // Send message
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || !activeConversation || !senderId) return;
    
    try {
      const newMessage = {
        sender_id: senderId,
        receiver_id: activeConversation,
        content: message,
        timestamp: new Date().toISOString(),
        is_read: false
      };
      
      console.log('Sending message:', newMessage);
      
      const { error } = await supabase.from('messages').insert(newMessage);
      
      if (error) throw error;
      
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        senderId: senderId!,
        receiverId: activeConversation!,
        content: message,
        timestamp: new Date().toISOString(),
        isRead: false
      }]);
      
      setMessage('');
      
      toast({
        title: "Message sent",
        description: "Your message has been sent successfully."
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        variant: "destructive",
        title: "Failed to send message",
        description: "Please try again later."
      });
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto pt-6 text-center py-12">
        <div className="rounded-full bg-muted w-16 h-16 mx-auto flex items-center justify-center mb-4">
          <MessageCircle className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Messages are only available for logged in users</h2>
        <p className="text-muted-foreground mb-8">Sign in to chat with farmers and stay updated on your orders.</p>
        <div className="flex gap-4 justify-center">
          <Button 
            className="bg-market-green hover:bg-market-green-dark"
            onClick={() => navigate('/login?redirect=/messages')}
          >
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pt-6 pb-16">
      <h1 className="text-2xl font-bold mb-6">Messages</h1>

      {/* Product Catalog Dialog */}
      <Dialog open={showProducts} onOpenChange={setShowProducts}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedFarmName} - Product Catalog</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-4">
            {productsLoading ? (
              <p>Loading products...</p>
            ) : selectedFarmProducts.length > 0 ? (
              selectedFarmProducts.map((product) => (
                <Card key={product.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    {product.image_url && (
                      <img 
                        src={product.image_url} 
                        alt={product.name}
                        className="w-full h-32 object-cover rounded-md mb-3"
                      />
                    )}
                    <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{product.category}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-market-green">BWP {product.price}</span>
                      <span className="text-sm text-muted-foreground">{product.stock_level} in stock</span>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p>No products available for this farm.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Card className="border shadow-sm overflow-hidden">
        <div className="grid md:grid-cols-3 h-[600px]">
          {/* Conversation List */}
          <div className="border-r border-border/50 md:col-span-1 overflow-y-auto">
            <div className="p-4 border-b flex items-center justify-between">
              <Input 
                placeholder="Search conversations..." 
                className="mr-2"
              />
              {user?.role === 'consumer' && (
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="icon" className="bg-market-green hover:bg-market-green-dark" aria-label="New conversation">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Start a new conversation</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Select a Farm</label>
                        <Select value={selectedFarm} onValueChange={setSelectedFarm}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a farm to contact..." />
                          </SelectTrigger>
                          <SelectContent className="bg-background border shadow-lg z-50">
                            {farmsLoading ? (
                              <SelectItem value="loading" disabled>Loading farms...</SelectItem>
                            ) : availableFarms.length > 0 ? (
                              availableFarms.map((farm) => (
                                <SelectItem key={farm.id} value={farm.id}>
                                  <div className="flex items-center justify-between w-full">
                                    <div>
                                      <div className="font-medium">{farm.farm_name}</div>
                                      <div className="text-sm text-muted-foreground">by {farm.username} • {farm.location}</div>
                                    </div>
                                  </div>
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="no-farms" disabled>No farms available</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                        {selectedFarm && (
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const farm = availableFarms.find(f => f.id === selectedFarm);
                                if (farm) fetchFarmProducts(farm.id, farm.farm_name);
                              }}
                              className="flex items-center gap-1"
                            >
                              <Eye className="h-4 w-4" />
                              View Products
                            </Button>
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Message</label>
                        <Input
                          placeholder="Type your first message..."
                          value={firstMessage}
                          onChange={(e) => setFirstMessage(e.target.value)}
                          disabled={!selectedFarm}
                          className="w-full"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button 
                        onClick={startNewConversation}
                        disabled={!selectedFarm || !firstMessage.trim()}
                        className="bg-market-green hover:bg-market-green-dark"
                      >
                        Start Conversation
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
            
            {conversations.length > 0 ? (
              <div>
                {conversations.map((conversation) => (
                  <div 
                    key={conversation.id}
                    className={`flex items-center p-4 gap-3 cursor-pointer hover:bg-secondary/50 ${
                      activeConversation === conversation.id ? 'bg-secondary' : ''
                    }`}
                    onClick={() => setActiveConversation(conversation.id)}
                  >
                    <div className="rounded-full bg-primary/10 h-10 w-10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <h3 className="font-medium truncate">{conversation.name}</h3>
                        <span className="text-xs text-muted-foreground">
                          {new Date(conversation.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <p className="text-sm text-muted-foreground truncate">
                        {conversation.lastMessage}
                      </p>
                      
                      {conversation.info && (
                        <p className="text-xs text-muted-foreground truncate">
                          {conversation.info}
                        </p>
                      )}
                    </div>
                    
                    {conversation.unread > 0 && (
                      <div className="bg-market-green text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {conversation.unread}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <MessageCircle className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No conversations yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Click the + button above to start a new conversation
                </p>
              </div>
            )}
          </div>
          
          {/* Message Area */}
          <div className="md:col-span-2 flex flex-col h-full">
            {activeConversation ? (
              <>
                <div className="p-4 border-b">
                  <h3 className="font-medium">{recipientName || 'Conversation'}</h3>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length > 0 ? (
                    messages.map((msg) => (
                      <div key={msg.id} className={`flex ${msg.senderId === senderId ? 'justify-end' : 'justify-start'}`}>
                        <div className={`rounded-lg p-3 max-w-[80%] ${
                          msg.senderId === senderId 
                            ? 'bg-market-green/10 text-market-green-dark' 
                            : 'bg-secondary'
                        }`}>
                          <p className="text-sm">{msg.content}</p>
                          <span className={`text-xs ${
                            msg.senderId === senderId 
                              ? 'text-market-green-dark/70' 
                              : 'text-muted-foreground'
                          } mt-1 block`}>
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">No messages yet</p>
                      <p className="text-sm text-muted-foreground mt-2">Send a message to start the conversation</p>
                    </div>
                  )}
                </div>
                
                <div className="p-4 border-t">
                  <form onSubmit={sendMessage} className="flex gap-2">
                    <Input
                      placeholder="Type a message..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="flex-1"
                    />
                    <Button 
                      type="submit" 
                      className="bg-market-green hover:bg-market-green-dark"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center p-6">
                  <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No conversation selected</h3>
                  <p className="text-muted-foreground mt-1 mb-6">
                    Select a conversation from the list or start a new one
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Messages;
