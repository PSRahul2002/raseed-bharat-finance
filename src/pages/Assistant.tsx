import React, { useState } from 'react';
import { Send, Bot, User, Receipt, FileText, Calculator } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const Assistant = () => {
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

  const suggestedQueries = [
    "How much did I spend on groceries this month?",
    "What's my biggest expense category?",
    "Show me receipts from Swiggy",
    "Calculate my dining out expenses",
    "Find bills over ₹5,000"
  ];

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: generateResponse(inputValue),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const generateResponse = (query: string): string => {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('food') || lowerQuery.includes('groceries') || lowerQuery.includes('dining')) {
      return "Based on your receipts, you spent ₹12,450 on food this month. This includes ₹7,200 on groceries, ₹3,800 on dining out (mainly Swiggy and Zomato), and ₹1,450 on snacks. That's 15% higher than last month.";
    } else if (lowerQuery.includes('biggest') || lowerQuery.includes('highest')) {
      return "Your biggest expense category this month is Rent (₹25,000), followed by Food & Dining (₹12,450), and Transportation (₹8,300). Your single largest expense was ₹25,000 for apartment rent.";
    } else if (lowerQuery.includes('swiggy')) {
      return "I found 8 Swiggy receipts this month totaling ₹2,340. The biggest order was ₹450 on March 15th. You order most frequently on weekends, averaging ₹290 per order.";
    } else if (lowerQuery.includes('calculate') || lowerQuery.includes('total')) {
      return "Your total expenses this month: ₹68,750. Income: ₹85,000. Savings: ₹16,250 (19.1%). You're on track to meet your 20% savings goal!";
    } else if (lowerQuery.includes('5000') || lowerQuery.includes('5,000')) {
      return "I found 3 bills over ₹5,000: Apartment Rent (₹25,000), Car Insurance (₹8,500), and Electronics Purchase from Flipkart (₹6,200). Would you like me to show the receipt details?";
    } else {
      return "I understand you're asking about your financial data. I can help you analyze your receipts, track spending patterns, find specific transactions, or calculate expenses by category. Could you be more specific about what you'd like to know?";
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
          <Bot className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-2xl font-semibold text-foreground">Receipt Assistant</h1>
        <p className="text-muted-foreground">Ask questions about your receipts, bills, and spending patterns</p>
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
                {message.type === 'assistant' && (
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                )}
                <div
                  className={`max-w-[70%] p-3 rounded-lg ${
                    message.type === 'user'
                      ? 'bg-primary text-primary-foreground'
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
                  <Bot className="w-4 h-4 text-primary" />
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
              placeholder="Ask about your receipts, bills, or spending..."
              className="flex-1"
              disabled={isLoading}
            />
            <Button 
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
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
            <p className="text-2xl font-semibold text-foreground">124</p>
            <p className="text-sm text-muted-foreground">Receipts Analyzed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <FileText className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="text-2xl font-semibold text-foreground">₹68,750</p>
            <p className="text-sm text-muted-foreground">Total Tracked</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Calculator className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="text-2xl font-semibold text-foreground">15</p>
            <p className="text-sm text-muted-foreground">Categories</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Assistant;