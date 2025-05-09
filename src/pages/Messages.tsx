
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { MessageCircle, Send, User } from 'lucide-react';

const Messages = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const targetFarmerId = params.get('farmerId');
  
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(targetFarmerId);
  const [message, setMessage] = useState('');
  
  // This would fetch real messages from Supabase in a full implementation
  useEffect(() => {
    if (user) {
      // Simulate conversations
      const mockConversations = [
        {
          id: '1',
          name: 'Green Acres Farm',
          lastMessage: 'Are the tomatoes still available?',
          timestamp: new Date().toISOString(),
          unread: 2
        },
        {
          id: '2',
          name: 'Sunshine Organics',
          lastMessage: 'Your order #123 has been confirmed',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          unread: 0
        }
      ];
      
      setConversations(mockConversations);
      
      // If no active conversation but we have some, set the first one as active
      if (!activeConversation && mockConversations.length > 0) {
        setActiveConversation(mockConversations[0].id);
      }
    }
  }, [user, activeConversation]);

  // Simulate sending a message
  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() === '') return;
    
    // In a real implementation, this would send to Supabase
    console.log(`Sending message to conversation ${activeConversation}: ${message}`);
    
    // Clear the input
    setMessage('');
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
            <div className="p-4 border-b">
              <Input placeholder="Search conversations..." />
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
              </div>
            )}
          </div>
          
          {/* Message Area */}
          <div className="md:col-span-2 flex flex-col h-full">
            {activeConversation ? (
              <>
                <div className="p-4 border-b">
                  <h3 className="font-medium">
                    {conversations.find(c => c.id === activeConversation)?.name || 'Conversation'}
                  </h3>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  <div className="flex justify-start">
                    <div className="bg-secondary rounded-lg p-3 max-w-[80%]">
                      <p className="text-sm">
                        Hello! Do you have any fresh vegetables available this week?
                      </p>
                      <span className="text-xs text-muted-foreground mt-1 block">
                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <div className="bg-market-green/10 text-market-green-dark rounded-lg p-3 max-w-[80%]">
                      <p className="text-sm">
                        Yes! We have fresh tomatoes, cucumbers, and lettuce. Would you like to place an order?
                      </p>
                      <span className="text-xs text-market-green-dark/70 mt-1 block">
                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
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
