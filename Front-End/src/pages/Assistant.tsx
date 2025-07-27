import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Receipt, FileText, Calculator, Wifi, WifiOff, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useDataService, UserSummary } from '@/services/dataService';

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'status' | 'intermediate';
  content: string;
  timestamp: Date;
  isProcessing?: boolean;
}

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

interface WebSocketMessage {
  type: 'status' | 'intermediate' | 'result' | 'error' | 'connection';
  message?: string;
  answer?: string;
  error?: string;
  results_count?: number;
  data?: any;
}

const Assistant = () => {
  // Configuration from environment variables
  const WEBSOCKET_URL = import.meta.env.VITE_WEBSOCKET_URL || 'wss://expense-query-websocket-api-593566622908.us-central1.run.app/ws';
  
  // Get authenticated user information
  const { user } = useAuth();
  const dataService = useDataService();
  const USER_ID = user?.email || 'user@example.com'; // Use actual user email from auth context

  // State management
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: "Hi! I'm your financial assistant. You can ask me about your receipts, bills, spending patterns, or any financial questions. Try asking 'How much did I spend on food last month?' or 'Show me my biggest expenses'.",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [userSummary, setUserSummary] = useState<UserSummary | null>(null);
  
  // WebSocket connection
  const websocketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  
  const { toast } = useToast();

  // Don't connect if user is not authenticated
  const isUserAuthenticated = user && user.email;

  // Fetch user summary data
  useEffect(() => {
    const fetchUserSummary = async () => {
      if (!user?.email) return;

      try {
        const summary = await dataService.getUserSummary(user.email);
        setUserSummary(summary);
      } catch (error) {
        console.error('Error fetching user summary:', error);
      }
    };

    fetchUserSummary();
  }, [user?.email, dataService]);

  const suggestedQueries = [
    "Show me all expenses",
    "What did I spend on food?",
    "Find all receipts",
    "What are my total expenses?",
    "Show me expenses by category",
    "Find receipts over 100"
  ];

  // WebSocket connection management
  const connectWebSocket = () => {
    // Don't connect if user is not authenticated
    if (!isUserAuthenticated) {
      console.log('User not authenticated, skipping WebSocket connection');
      setConnectionStatus('disconnected');
      return;
    }

    if (websocketRef.current?.readyState === WebSocket.OPEN || 
        websocketRef.current?.readyState === WebSocket.CONNECTING) {
      return; // Already connected or connecting
    }

    setConnectionStatus('connecting');
    const wsUrl = `${WEBSOCKET_URL}/${USER_ID}`;
    
    console.log('Attempting WebSocket connection to:', wsUrl);
    console.log('Using user email as ID:', USER_ID);
    
    try {
      websocketRef.current = new WebSocket(wsUrl);
      
      websocketRef.current.onopen = () => {
        setConnectionStatus('connected');
        reconnectAttempts.current = 0;
        console.log('WebSocket connected');
        
        toast({
          title: "Connected",
          description: "WebSocket connection established successfully.",
          duration: 3000,
        });
      };

      websocketRef.current.onmessage = (event) => {
        try {
          const data: WebSocketMessage = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
          console.log('Raw message data:', event.data);
          
          // Show user-friendly error for malformed messages
          toast({
            title: "Message Error",
            description: "Received malformed response from server.",
            variant: "destructive",
            duration: 3000,
          });
        }
      };

      websocketRef.current.onclose = (event) => {
        setConnectionStatus('disconnected');
        setIsLoading(false); // Reset loading state on disconnect
        console.log('WebSocket disconnected:', event.code, event.reason);
        
        // Clear any processing messages when connection is lost
        setMessages(prev => prev.filter(msg => !msg.isProcessing));
        
        // Show user notification for unexpected disconnections
        if (event.code !== 1000) {
          toast({
            title: "Connection Lost",
            description: "WebSocket connection was lost. Attempting to reconnect...",
            variant: "destructive",
            duration: 3000,
          });
        }
        
        // Attempt to reconnect if not a normal closure
        if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current + 1}/${maxReconnectAttempts})`);
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++;
            connectWebSocket();
          }, delay);
        } else if (reconnectAttempts.current >= maxReconnectAttempts) {
          toast({
            title: "Connection Failed",
            description: "Could not reconnect to the server. Please refresh the page or try again later.",
            variant: "destructive",
            duration: 10000,
          });
        }
      };

      websocketRef.current.onerror = (error) => {
        setConnectionStatus('error');
        console.error('WebSocket error:', error);
        
        toast({
          title: "Connection Error",
          description: "Failed to connect to the assistant service. Retrying...",
          variant: "destructive",
          duration: 5000,
        });
      };
    } catch (error) {
      setConnectionStatus('error');
      console.error('Failed to create WebSocket connection:', error);
    }
  };

  // Handle incoming WebSocket messages
  const handleWebSocketMessage = (data: WebSocketMessage) => {
    console.log('Received WebSocket message:', data); // Debug logging
    
    // Validate message structure
    if (!data || typeof data !== 'object' || !data.type) {
      console.error('Invalid WebSocket message format:', data);
      return;
    }
    
    const messageId = Date.now().toString();
    
    switch (data.type) {
      case 'connection':
        console.log('WebSocket connection confirmed by server');
        break;
        
      case 'status':
        // Add status message (like "Processing your query...")
        setMessages(prev => [...prev, {
          id: messageId,
          type: 'status',
          content: data.message || 'Processing...',
          timestamp: new Date(),
          isProcessing: true
        }]);
        break;
        
      case 'intermediate':
        // Update with intermediate message using results_count
        const intermediateMessage = data.results_count 
          ? `Found ${data.results_count} matching receipts`
          : (data.message || 'Processing your request...');
          
        setMessages(prev => {
          // Keep status messages but replace previous intermediate messages
          const filtered = prev.filter(msg => msg.type !== 'intermediate');
          return [...filtered, {
            id: messageId,
            type: 'intermediate',
            content: intermediateMessage,
            timestamp: new Date(),
            isProcessing: true
          }];
        });
        break;
        
      case 'result':
        // Final result - use data.answer instead of data.message
        const resultMessage = data.answer || data.message || 'No response received';
        setMessages(prev => {
          const filtered = prev.filter(msg => !msg.isProcessing);
          return [...filtered, {
            id: messageId,
            type: 'assistant',
            content: resultMessage,
            timestamp: new Date()
          }];
        });
        setIsLoading(false);
        
        // Clear loading timeout since we got a response
        if (loadingTimeoutRef.current) {
          clearTimeout(loadingTimeoutRef.current);
        }
        break;
        
      case 'error':
        // Handle error messages - use data.error instead of data.message
        const errorMessage = data.error || data.message || 'An unknown error occurred';
        setMessages(prev => {
          const filtered = prev.filter(msg => !msg.isProcessing);
          return [...filtered, {
            id: messageId,
            type: 'assistant',
            content: `Sorry, I encountered an error: ${errorMessage}. Please try again.`,
            timestamp: new Date()
          }];
        });
        setIsLoading(false);
        
        // Clear loading timeout since we got a response
        if (loadingTimeoutRef.current) {
          clearTimeout(loadingTimeoutRef.current);
        }
        
        toast({
          title: "Query Error",
          description: errorMessage,
          variant: "destructive",
          duration: 5000,
        });
        break;
        
      default:
        console.warn('Unknown WebSocket message type:', data.type);
    }
  };

  // Initialize WebSocket connection on component mount and when user changes
  useEffect(() => {
    if (isUserAuthenticated) {
      connectWebSocket();
    } else {
      // Disconnect if user is not authenticated
      if (websocketRef.current) {
        websocketRef.current.close(1000, 'User not authenticated');
        websocketRef.current = null;
      }
      setConnectionStatus('disconnected');
    }
    
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      if (websocketRef.current) {
        // Clean shutdown - code 1000 means normal closure
        websocketRef.current.close(1000, 'Component unmounting');
        websocketRef.current = null;
      }
    };
  }, [isUserAuthenticated, USER_ID]); // Re-run when authentication status or user ID changes

  const handleSendMessage = async () => {
    if (!inputValue.trim() || connectionStatus !== 'connected' || !isUserAuthenticated) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const query = inputValue;
    setInputValue('');
    setIsLoading(true);
    
    // Set a timeout to reset loading state if no response is received
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }
    
    loadingTimeoutRef.current = setTimeout(() => {
      setIsLoading(false);
      setMessages(prev => {
        const filtered = prev.filter(msg => !msg.isProcessing);
        return [...filtered, {
          id: Date.now().toString(),
          type: 'assistant',
          content: 'Request timed out. The server might be busy. Please try again.',
          timestamp: new Date()
        }];
      });
      
      toast({
        title: "Request Timeout",
        description: "The server is taking too long to respond. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    }, 30000); // 30 second timeout

    try {
      // Send message via WebSocket - now includes user email ID
      const message = {
        type: 'query',
        query: query,
        user_id: USER_ID // Include user email ID in the query
      };
      
      console.log('Sending WebSocket message:', message);
      console.log('User ID (email) included in query:', USER_ID);
      websocketRef.current?.send(JSON.stringify(message));
      
      // Add initial processing message
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          type: 'status',
          content: 'Processing your query...',
          timestamp: new Date(),
          isProcessing: true
        }]);
      }, 100);
      
    } catch (error) {
      console.error('Error sending message:', error);
      setIsLoading(false);
      
      // Clear the timeout since we're handling the error immediately
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      
      toast({
        title: "Send Error",
        description: "Failed to send message. Please check your connection.",
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  const handleSuggestedQuery = (query: string) => {
    setInputValue(query);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessages([{
      id: '1',
      type: 'assistant',
      content: "Hi! I'm your financial assistant. You can ask me about your receipts, bills, spending patterns, or any financial questions.",
      timestamp: new Date()
    }]);
  };

  const getConnectionStatusBadge = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
          <Wifi className="w-3 h-3 mr-1" />
          Connected
        </Badge>;
      case 'connecting':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          Connecting...
        </Badge>;
      case 'disconnected':
        return <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
          <WifiOff className="w-3 h-3 mr-1" />
          Disconnected
        </Badge>;
      case 'error':
        return <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
          <WifiOff className="w-3 h-3 mr-1" />
          Error
        </Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
          <Bot className="w-8 h-8 text-primary" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-foreground">Receipt Assistant</h1>
          <p className="text-muted-foreground">Ask questions about your receipts, bills, and spending patterns</p>
          <div className="flex justify-center items-center gap-4">
            {!isUserAuthenticated ? (
              <Badge variant="destructive" className="bg-orange-100 text-orange-800 border-orange-200">
                <User className="w-3 h-3 mr-1" />
                Not Logged In
              </Badge>
            ) : (
              getConnectionStatusBadge()
            )}
            {!isUserAuthenticated ? (
              <span className="text-xs text-orange-600">Please log in to use the assistant</span>
            ) : (connectionStatus === 'disconnected' || connectionStatus === 'error') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  reconnectAttempts.current = 0; // Reset attempts for manual reconnect
                  connectWebSocket();
                }}
                className="text-xs"
              >
                Reconnect
              </Button>
            )}
            {isUserAuthenticated && connectionStatus === 'connected' && (
              <span className="text-xs text-green-600">Ready to chat (User: {USER_ID})</span>
            )}
          </div>
        </div>
      </div>

      {/* Suggested Queries */}
      {messages.length === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Try asking me:
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {suggestedQueries.map((query, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors"
                  onClick={() => handleSuggestedQuery(query)}
                >
                  {query}
                </Badge>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={clearChat}
                className="text-xs"
              >
                Clear Chat
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chat Messages */}
      <Card className="min-h-[400px]">
        <CardContent className="p-6">
          <div className="space-y-4 mb-4 max-h-[500px] overflow-y-auto">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {(message.type === 'assistant' || message.type === 'status' || message.type === 'intermediate') && (
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    {message.isProcessing ? (
                      <Loader2 className="w-4 h-4 text-primary animate-spin" />
                    ) : (
                      <Bot className="w-4 h-4 text-primary" />
                    )}
                  </div>
                )}
                <div
                  className={`max-w-[70%] p-3 rounded-lg ${
                    message.type === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : message.type === 'status' || message.type === 'intermediate'
                      ? 'bg-blue-50 border border-blue-200 text-blue-800'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <span className="text-xs opacity-70 mt-1 block">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                {message.type === 'user' && (
                  <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-secondary-foreground" />
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Loader2 className="w-4 h-4 text-primary animate-spin" />
                </div>
                <div className="bg-muted p-3 rounded-lg">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:0.1s]"></div>
                    <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                !isUserAuthenticated
                  ? "Please log in to chat with the assistant..."
                  : connectionStatus === 'connected' 
                  ? "Ask about your receipts, bills, or spending..." 
                  : "Connect to WebSocket to start chatting..."
              }
              className="flex-1"
              disabled={isLoading || connectionStatus !== 'connected' || !isUserAuthenticated}
            />
            <Button 
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading || connectionStatus !== 'connected' || !isUserAuthenticated}
              size="icon"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Receipt className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="text-2xl font-semibold text-foreground">
              {userSummary?.total_receipts || 0}
            </p>
            <p className="text-sm text-muted-foreground">Receipts Analyzed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <FileText className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="text-2xl font-semibold text-foreground">
              {userSummary ? 
                new Intl.NumberFormat('en-IN', {
                  style: 'currency',
                  currency: 'INR',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                }).format(userSummary.total_spent) 
                : '₹0'
              }
            </p>
            <p className="text-sm text-muted-foreground">Total Tracked</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Calculator className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="text-2xl font-semibold text-foreground">
              {userSummary?.categories_count || 0}
            </p>
            <p className="text-sm text-muted-foreground">Categories</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Assistant;