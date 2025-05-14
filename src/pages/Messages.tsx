
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { MessageCircle, Send, User, Plus, Search } from 'lucide-react';
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

const Messages = () => {
  const { user, loading, getFarmerId, getConsumerId } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const params = new URLSearchParams(location.search);
  const targetFarmerId = params.get('farmerId');
  
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(targetFarmerId);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [recipientName, setRecipientName] = useState<string>('');
  const [senderId, setSenderId] = useState<string | null>(null);
  
  // New state for new conversation dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [potentialRecipients, setPotentialRecipients] = useState<any[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState<string | null>(null);
  const [firstMessage, setFirstMessage] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);

  // Fetch user ID based on role
  useEffect(() => {
    const fetchUserId = async () => {
      if (user) {
        if (user.role === 'farmer') {
          const id = await getFarmerId();
          setSenderId(id);
        } else if (user.role === 'consumer') {
          const id = await getConsumerId();
          setSenderId(id);
        }
      }
    };
    
    fetchUserId();
  }, [user, getFarmerId, getConsumerId]);
  
  // Fetch conversations
  useEffect(() => {
    const fetchConversations = async () => {
      if (!user || !senderId) return;
      
      try {
        let query;
        
        // For farmers, get messages from consumers
        // For consumers, get messages from farmers
        if (user.role === 'farmer') {
          query = supabase
            .from('messages')
            .select(`
              sender_id,
              receiver_id,
              content,
              timestamp,
              is_read,
              consumers!inner (
                user_id,
                location,
                users!inner (
                  username
                )
              )
            `)
            .eq('receiver_id', senderId)
            .order('timestamp', { ascending: false });
        } else {
          query = supabase
            .from('messages')
            .select(`
              sender_id,
              receiver_id,
              content,
              timestamp,
              is_read,
              farmers!inner (
                user_id,
                farm_name,
                farm_location,
                users!inner (
                  username
                )
              )
            `)
            .eq('receiver_id', senderId)
            .order('timestamp', { ascending: false });
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        if (data) {
          // Process and group conversations by sender
          const conversationMap = new Map();
          
          for (const msg of data) {
            const partnerId = msg.sender_id;
            const partnerName = user.role === 'farmer'
              ? msg.consumers.users.username
              : msg.farmers.users.username;
            
            const partnerInfo = user.role === 'farmer'
              ? msg.consumers.location
              : msg.farmers.farm_name;
            
            if (!conversationMap.has(partnerId)) {
              conversationMap.set(partnerId, {
                id: partnerId,
                name: partnerName,
                info: partnerInfo,
                lastMessage: msg.content,
                timestamp: msg.timestamp,
                unread: msg.is_read ? 0 : 1
              });
            } else if (!msg.is_read) {
              const conv = conversationMap.get(partnerId);
              conv.unread = (conv.unread || 0) + 1;
              conversationMap.set(partnerId, conv);
            }
          }
          
          // Also fetch conversations where the user is the sender
          let sentQuery;
          
          if (user.role === 'farmer') {
            sentQuery = supabase
              .from('messages')
              .select(`
                sender_id,
                receiver_id,
                content,
                timestamp,
                is_read,
                consumers!inner (
                  user_id,
                  location,
                  users!inner (
                    username
                  )
                )
              `)
              .eq('sender_id', senderId)
              .order('timestamp', { ascending: false });
          } else {
            sentQuery = supabase
              .from('messages')
              .select(`
                sender_id,
                receiver_id,
                content,
                timestamp,
                is_read,
                farmers!inner (
                  user_id,
                  farm_name,
                  farm_location,
                  users!inner (
                    username
                  )
                )
              `)
              .eq('sender_id', senderId)
              .order('timestamp', { ascending: false });
          }
          
          const { data: sentData, error: sentError } = await sentQuery;
          
          if (sentError) throw sentError;
          
          if (sentData) {
            for (const msg of sentData) {
              const partnerId = msg.receiver_id;
              const partnerName = user.role === 'consumer'
                ? msg.farmers.users.username
                : msg.consumers.users.username;
              
              const partnerInfo = user.role === 'consumer'
                ? msg.farmers.farm_name
                : msg.consumers.location;
              
              if (!conversationMap.has(partnerId)) {
                conversationMap.set(partnerId, {
                  id: partnerId,
                  name: partnerName,
                  info: partnerInfo,
                  lastMessage: msg.content,
                  timestamp: msg.timestamp,
                  unread: 0
                });
              }
            }
          }
          
          setConversations(Array.from(conversationMap.values()));
          
          // If targetFarmerId is provided, set it as active conversation
          if (targetFarmerId && conversationMap.has(targetFarmerId)) {
            setActiveConversation(targetFarmerId);
            // Get farmer name for header
            const farmerData = conversationMap.get(targetFarmerId);
            setRecipientName(farmerData?.name || 'Farmer');
          } else if (!activeConversation && conversationMap.size > 0) {
            // Otherwise set first conversation as active
            const firstId = conversationMap.keys().next().value;
            setActiveConversation(firstId);
            const firstConv = conversationMap.get(firstId);
            setRecipientName(firstConv?.name || 'Conversation');
          }
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
  }, [user, senderId, toast, targetFarmerId, activeConversation, getFarmerId, getConsumerId]);

  // Fetch messages for active conversation
  useEffect(() => {
    const fetchMessages = async () => {
      if (!activeConversation || !senderId) return;
      
      try {
        // Get all messages between these two users (in either direction)
        const { data, error } = await supabase
          .from('messages')
          .select(`
            id,
            sender_id,
            receiver_id,
            content, 
            timestamp,
            is_read
          `)
          .or(`sender_id.eq.${senderId},receiver_id.eq.${senderId}`)
          .or(`sender_id.eq.${activeConversation},receiver_id.eq.${activeConversation}`)
          .order('timestamp', { ascending: true });
        
        if (error) throw error;
        
        if (data) {
          // Filter to only include messages between these two specific users
          const relevantMessages = data.filter(msg => 
            (msg.sender_id === senderId && msg.receiver_id === activeConversation) || 
            (msg.sender_id === activeConversation && msg.receiver_id === senderId)
          );
          
          // Mark unread messages as read
          const unreadMsgIds = relevantMessages
            .filter(msg => msg.receiver_id === senderId && !msg.is_read)
            .map(msg => msg.id);
          
          if (unreadMsgIds.length > 0) {
            await supabase
              .from('messages')
              .update({ is_read: true })
              .in('id', unreadMsgIds);
          }
          
          setMessages(relevantMessages.map(msg => ({
            id: msg.id,
            senderId: msg.sender_id,
            receiverId: msg.receiver_id,
            content: msg.content,
            timestamp: msg.timestamp,
            isRead: msg.is_read
          })));
          
          // Update conversation name
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

  // Search for potential recipients
  const handleSearch = async () => {
    if (!senderId || !searchTerm.trim() || !user) return;
    
    try {
      setSearchLoading(true);
      
      // For consumers, search for farmers
      // For farmers, search for consumers
      let query;
      
      if (user.role === 'farmer') {
        query = supabase
          .from('consumers')
          .select(`
            id,
            location,
            users!inner (
              username
            )
          `)
          .textSearch('users.username', searchTerm, {
            type: 'websearch',
            config: 'english'
          });
      } else {
        query = supabase
          .from('farmers')
          .select(`
            id,
            farm_name,
            farm_location,
            users!inner (
              username
            )
          `)
          .textSearch('users.username', searchTerm, {
            type: 'websearch',
            config: 'english'
          });
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      if (data) {
        const formattedResults = data.map(item => ({
          id: item.id,
          name: item.users.username,
          info: user.role === 'farmer' ? item.location : item.farm_name
        }));
        
        setPotentialRecipients(formattedResults);
      }
    } catch (error) {
      console.error('Error searching for recipients:', error);
      toast({
        variant: "destructive",
        title: "Search failed",
        description: "Please try again later."
      });
    } finally {
      setSearchLoading(false);
    }
  };

  // Start new conversation
  const startNewConversation = async () => {
    if (!selectedRecipient || !firstMessage.trim() || !senderId) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please select a recipient and enter a message."
      });
      return;
    }
    
    try {
      const newMessage = {
        sender_id: senderId,
        receiver_id: selectedRecipient,
        content: firstMessage,
        timestamp: new Date().toISOString(),
        is_read: false
      };
      
      const { error } = await supabase.from('messages').insert(newMessage);
      
      if (error) throw error;
      
      // Close dialog and reset form
      setDialogOpen(false);
      setSearchTerm('');
      setPotentialRecipients([]);
      setSelectedRecipient(null);
      setFirstMessage('');
      
      // Set the new conversation as active
      setActiveConversation(selectedRecipient);
      
      // Reload conversations to include new one
      const recipient = potentialRecipients.find(r => r.id === selectedRecipient);
      if (recipient) {
        const newConversation = {
          id: selectedRecipient,
          name: recipient.name,
          info: recipient.info,
          lastMessage: firstMessage,
          timestamp: new Date().toISOString(),
          unread: 0
        };
        
        setConversations(prev => [newConversation, ...prev]);
        setRecipientName(recipient.name);
      }
      
      // Add new message to messages
      setMessages([{
        id: Date.now().toString(),
        senderId: senderId,
        receiverId: selectedRecipient,
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
      
      const { error } = await supabase.from('messages').insert(newMessage);
      
      if (error) throw error;
      
      // Add to local messages
      setMessages(prev => [...prev, {
        id: Date.now().toString(), // Temporary ID until refresh
        senderId: senderId!,
        receiverId: activeConversation!,
        content: message,
        timestamp: new Date().toISOString(),
        isRead: false
      }]);
      
      // Clear input
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

      <Card className="border shadow-sm overflow-hidden">
        <div className="grid md:grid-cols-3 h-[600px]">
          {/* Conversation List */}
          <div className="border-r border-border/50 md:col-span-1 overflow-y-auto">
            <div className="p-4 border-b flex items-center justify-between">
              <Input 
                placeholder="Search conversations..." 
                className="mr-2"
              />
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
                    <div className="flex items-center space-x-2">
                      <Input 
                        placeholder={`Search for ${user.role === 'farmer' ? 'consumers' : 'farmers'}...`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="flex-1"
                      />
                      <Button 
                        onClick={handleSearch}
                        disabled={searchLoading}
                        className="bg-market-green hover:bg-market-green-dark"
                      >
                        <Search className="h-4 w-4 mr-2" />
                        Search
                      </Button>
                    </div>
                    
                    {potentialRecipients.length > 0 && (
                      <div className="border rounded-lg overflow-hidden">
                        {potentialRecipients.map((recipient) => (
                          <div 
                            key={recipient.id}
                            className={`flex items-center p-3 gap-3 cursor-pointer hover:bg-secondary/50 border-b last:border-0 ${
                              selectedRecipient === recipient.id ? 'bg-secondary' : ''
                            }`}
                            onClick={() => setSelectedRecipient(recipient.id)}
                          >
                            <div className="rounded-full bg-primary/10 h-8 w-8 flex items-center justify-center">
                              <User className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-medium">{recipient.name}</h3>
                              <p className="text-xs text-muted-foreground">{recipient.info}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Message</label>
                      <Input
                        placeholder="Type your first message..."
                        value={firstMessage}
                        onChange={(e) => setFirstMessage(e.target.value)}
                        disabled={!selectedRecipient}
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
                      disabled={!selectedRecipient || !firstMessage.trim()}
                      className="bg-market-green hover:bg-market-green-dark"
                    >
                      Start Conversation
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
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
