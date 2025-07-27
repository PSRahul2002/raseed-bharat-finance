import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Camera, 
  Upload, 
  DollarSign, 
  Calendar, 
  Tag, 
  FileText,
  CheckCircle,
  Plus,
  Minus,
  Trash2,
  Store,
  ExternalLink,
  RefreshCw,
  Check,
  X,
  AlertCircle,
  Loader2
} from 'lucide-react';

// Interface for bill items
interface BillItem {
  name: string;
  quantity: number;
  unit_price: number;
}

// Interface for the complete bill
interface Bill {
  vendor_name: string;
  date: string;
  timestamp: string;
  total_amount: number;
  taxes: number;
  items: BillItem[];
  bill_category: string;
  user_id: string; // User ID (will be the email)
}

// Interface for API success response
interface ApiSuccessResponse {
  success: boolean;
  message: string;
  wallet_pass_url?: string;
  document_id?: string;
  firestore_status?: string;
  ai_processing_status?: string;
}

// Interface for API error response
interface ApiErrorResponse {
  success: boolean;
  message: string;
  error_details?: string;
  error_type?: 'database' | 'ai_processing' | 'wallet_creation' | 'validation' | 'unknown';
}

const AddExpense: React.FC = () => {
  // API Configuration from environment variables
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081';
  const RECEIPT_PROCESSING_URL = import.meta.env.VITE_RECEIPT_PROCESSING_URL || 'https://receipt-categorization-593566622908.us-central1.run.app';
  
  // Get authenticated user information
  const { user } = useAuth();
  const currentUserEmail = user?.email || 'user@example.com';
  const { toast } = useToast();

  // Bill state using the new schema
  const [bill, setBill] = useState<Bill>({
    vendor_name: '',
    date: new Date().toISOString().split('T')[0],
    timestamp: new Date().toISOString(),
    total_amount: 0,
    taxes: 0,
    items: [
      {
        name: '',
        quantity: 1,
        unit_price: 0
      }
    ],
    bill_category: '',
    user_id: currentUserEmail // Use email as user ID
  });
  
  const [receipt, setReceipt] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<{
    saving: boolean;
    aiProcessing: boolean;
    walletCreation: boolean;
    completed: boolean;
  }>({
    saving: false,
    aiProcessing: false,
    walletCreation: false,
    completed: false
  });
  const [lastApiResponse, setLastApiResponse] = useState<ApiSuccessResponse | null>(null);

  const billCategories = [
    'Electronics',
    'Food & Dining',
    'Transportation',
    'Shopping',
    'Entertainment',
    'Bills & Utilities',
    'Healthcare',
    'Education',
    'Travel',
    'Groceries',
    'Other'
  ];

  // Helper functions for bill management
  const updateBillField = (field: keyof Bill, value: any) => {
    setBill(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updateItem = (index: number, field: keyof BillItem, value: any) => {
    setBill(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const addItem = () => {
    setBill(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          name: '',
          quantity: 1,
          unit_price: 0
        }
      ]
    }));
  };

  const removeItem = (index: number) => {
    if (bill.items.length > 1) {
      setBill(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index)
      }));
    }
  };

  // Calculate total amount based on items
  const calculateTotal = () => {
    const itemsTotal = bill.items.reduce((sum, item) => 
      sum + (item.quantity * item.unit_price), 0
    );
    return itemsTotal + bill.taxes;
  };

  // Update total amount when items or taxes change
  useEffect(() => {
    const newTotal = calculateTotal();
    if (newTotal !== bill.total_amount) {
      updateBillField('total_amount', newTotal);
    }
  }, [bill.items, bill.taxes]);

  // Update user ID when authentication state changes
  useEffect(() => {
    if (user?.email && user.email !== bill.user_id) {
      updateBillField('user_id', user.email);
      console.log('User ID updated:', user.email); // Log the user ID
    }
  }, [user?.email, bill.user_id]);

  const handleReceiptUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/png', 'image/jpg', 'image/jpeg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PNG, JPG, JPEG, or WEBP image.",
        variant: "destructive",
      });
      return;
    }

    setReceipt(file);
    setLoading(true);

    try {
      // Debug logging
      console.log('Uploading file:', file.name, 'Type:', file.type, 'Size:', file.size);
      
      // Call the receipt categorization API with CORS handling
      const apiUrl = import.meta.env.DEV 
        ? '/api/process-receipt' // Use proxy in development
        : `${RECEIPT_PROCESSING_URL}/process-receipt`; // Use environment variable
      
      console.log('Making API call to:', apiUrl);
      
      // Create FormData and append the file
      const formData = new FormData();
      formData.append('file', file);
      
      console.log('Sending file as FormData:', file.name);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        mode: 'cors', // Explicitly set CORS mode
        body: formData // Send file as FormData, no Content-Type header needed
      });

      if (!response.ok) {
        // Log the error response body for debugging
        const errorText = await response.text();
        console.log('Error response body:', errorText);
        throw new Error(`API request failed with status ${response.status}: ${response.statusText}. Response: ${errorText}`);
      }

      const billData = await response.json();
      
      // Debug logging to see what the API actually returns
      console.log('API Response:', billData);
      console.log('Raw API Response Status:', response.status);
      console.log('Raw API Response Headers:', Object.fromEntries(response.headers.entries()));
      
      // Update the bill state with the API response
      setBill({
        vendor_name: billData.vendor_name || '',
        date: billData.date || new Date().toISOString().split('T')[0],
        timestamp: billData.timestamp || new Date().toISOString(),
        total_amount: billData.total_amount || 0,
        taxes: billData.taxes || 0,
        items: billData.items || [
          {
            name: '',
            quantity: 1,
            unit_price: 0
          }
        ],
        bill_category: billData.bill_category || '',
        user_id: currentUserEmail // Use email as user ID
      });

      toast({
        title: "Receipt processed successfully!",
        description: "Bill details extracted from receipt. You can edit them below.",
      });

    } catch (error) {
      console.error('Error processing receipt:', error);
      
      // Handle different types of errors with appropriate messages
      let errorTitle = "Receipt processing failed";
      let errorDescription = "Please try again or enter details manually.";
      
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        errorTitle = "Network Error";
        errorDescription = "Unable to connect to the receipt processing service. Please check your internet connection and try again.";
      } else if (error instanceof Error) {
        if (error.message.includes('CORS')) {
          errorTitle = "CORS Policy Error";
          errorDescription = "The receipt processing service is not configured to accept requests from this domain. Please contact support.";
        } else if (error.message.includes('403') || error.message.includes('401')) {
          errorTitle = "Authentication Error";
          errorDescription = "You don't have permission to access the receipt processing service.";
        } else if (error.message.includes('429')) {
          errorTitle = "Rate Limit Exceeded";
          errorDescription = "Too many requests. Please wait a moment and try again.";
        } else if (error.message.includes('422')) {
          errorTitle = "Invalid Request Format";
          errorDescription = "The image format or request structure is not supported by the API. Please try a different image.";
        } else if (error.message.includes('500') || error.message.includes('502') || error.message.includes('503')) {
          errorTitle = "Server Error";
          errorDescription = "The receipt processing service is temporarily unavailable. Please try again later.";
        } else {
          errorDescription = `Error: ${error.message}`;
        }
      }
      
      toast({
        title: errorTitle,
        description: errorDescription,
        variant: "destructive",
      });
      
      // Reset the receipt file input
      setReceipt(null);
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset previous success status
    setLastApiResponse(null);
    
    // Validation
    if (!bill.vendor_name || !bill.bill_category || bill.items.some(item => !item.name || item.quantity <= 0 || item.unit_price <= 0)) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields including vendor, category, and items.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setSubmissionStatus({
      saving: true,
      aiProcessing: false,
      walletCreation: false,
      completed: false
    });
    
    // Update timestamp before submission
    const billToSubmit = {
      ...bill,
      timestamp: new Date().toISOString()
    };

    console.log('Submitting bill with user_id:', billToSubmit.user_id); // Log the user ID

    try {
      // Call the bill submission API
      const apiUrl = import.meta.env.DEV 
        ? '/api/store-receipt' // Use proxy in development
        : `${API_BASE_URL}/store-receipt`; // Use environment variable with correct endpoint
      
      console.log('Submitting bill to API:', apiUrl);
      console.log('Complete bill data being submitted:', billToSubmit);
      console.log('User ID in submission:', billToSubmit.user_id);
      console.log('API_BASE_URL from env:', API_BASE_URL);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'cors',
        body: JSON.stringify(billToSubmit)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed with status ${response.status}: ${response.statusText}. Response: ${errorText}`);
      }

      const apiResponse: ApiSuccessResponse = await response.json();
      console.log('API Response:', apiResponse);
      
      // Update progress status
      setSubmissionStatus({
        saving: true,
        aiProcessing: apiResponse.ai_processing_status === 'completed',
        walletCreation: !!apiResponse.wallet_pass_url,
        completed: true
      });
      
      setLastApiResponse(apiResponse);

      // Show success notification with detailed status
      const statusItems = [
        'Data stored in database ✓',
        ...(apiResponse.ai_processing_status === 'completed' ? ['AI processing completed ✓'] : []),
        ...(apiResponse.wallet_pass_url ? ['Wallet pass created ✓'] : [])
      ];

      toast({
        title: "Receipt saved successfully!",
        description: `${apiResponse.message || 'Wallet pass created.'} ${apiResponse.document_id ? `(ID: ${apiResponse.document_id})` : ''}`,
        variant: "default",
        duration: 5000,
      });

      // Show additional success notification with wallet pass link if available
      if (apiResponse.wallet_pass_url) {
        setTimeout(() => {
          toast({
            title: "Google Wallet Pass Ready",
            description: "Your receipt has been converted to a wallet pass. Click to add to Google Wallet.",
            action: (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(apiResponse.wallet_pass_url, '_blank')}
                className="ml-2"
              >
                <ExternalLink className="w-4 h-4 mr-1" />
                Add to Wallet
              </Button>
            ),
            duration: 10000,
          });
        }, 1000);
      }

      // Reset form after successful submission
      setBill({
        vendor_name: '',
        date: new Date().toISOString().split('T')[0],
        timestamp: new Date().toISOString(),
        total_amount: 0,
        taxes: 0,
        items: [
          {
            name: '',
            quantity: 1,
            unit_price: 0
          }
        ],
        bill_category: '',
        user_id: currentUserEmail // Use email as user ID
      });
      setReceipt(null);
      
      // Reset status displays after a delay to show success
      setTimeout(() => {
        setSubmissionStatus({
          saving: false,
          aiProcessing: false,
          walletCreation: false,
          completed: false
        });
        setLastApiResponse(null);
      }, 5000);

    } catch (error) {
      console.error('Error submitting bill:', error);
      
      setSubmissionStatus({
        saving: false,
        aiProcessing: false,
        walletCreation: false,
        completed: false
      });
      
      // Handle different types of errors with appropriate messages
      let errorTitle = "Failed to save receipt";
      let errorDescription = "Please try again or contact support.";
      let showRetry = true;
      
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        errorTitle = "Network Error";
        errorDescription = "Unable to connect to the server. Please check your internet connection and try again.";
      } else if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();
        
        if (errorMessage.includes('database') || errorMessage.includes('500')) {
          errorTitle = "Database Error";
          errorDescription = "Failed to save receipt. Please try again.";
        } else if (errorMessage.includes('ai') || errorMessage.includes('processing')) {
          errorTitle = "Processing Error";
          errorDescription = "Receipt saved but AI processing failed.";
          showRetry = false;
        } else if (errorMessage.includes('wallet') || errorMessage.includes('pass')) {
          errorTitle = "Wallet Pass Error";
          errorDescription = "Receipt saved but wallet pass creation failed.";
          showRetry = false;
        } else if (errorMessage.includes('403') || errorMessage.includes('401')) {
          errorTitle = "Authentication Error";
          errorDescription = "You don't have permission to save receipts.";
          showRetry = false;
        } else if (errorMessage.includes('422')) {
          errorTitle = "Validation Error";
          errorDescription = "The bill data format is invalid. Please check your entries.";
          showRetry = false;
        } else {
          errorDescription = `Error: ${error.message}`;
        }
      }
      
      toast({
        title: errorTitle,
        description: errorDescription,
        variant: "destructive",
        action: showRetry ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSubmit(e)}
            className="ml-2"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Retry
          </Button>
        ) : undefined,
        duration: 8000,
      });
      
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: string) => {
    if (!value) return '';
    return new Intl.NumberFormat('en-IN').format(Number(value));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Add Bill</h1>
        <p className="text-muted-foreground mt-1">
          Upload receipt or manually enter bill details
        </p>
      </div>

      {/* Receipt Upload */}
      <Card className="raseed-card">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Camera className="w-5 h-5 mr-2" />
            Upload Receipt (Optional)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-border rounded-xl p-6 text-center">
            {loading ? (
              <div className="space-y-2">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="font-medium text-foreground">Processing receipt...</p>
                <p className="text-sm text-muted-foreground">
                  Extracting bill details using AI...
                </p>
              </div>
            ) : receipt ? (
              <div className="space-y-2">
                <CheckCircle className="w-8 h-8 text-success mx-auto" />
                <p className="font-medium text-foreground">{receipt.name}</p>
                <p className="text-sm text-muted-foreground">
                  Receipt processed! Bill details populated below.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="w-8 h-8 text-muted-foreground mx-auto" />
                <p className="font-medium text-foreground">Upload your receipt</p>
                <p className="text-sm text-muted-foreground">
                  We'll automatically extract vendor, items, and amounts
                </p>
              </div>
            )}
          </div>
          
          <div className="flex space-x-2">
            <label className="flex-1">
              <input
                type="file"
                accept="image/*"
                onChange={handleReceiptUpload}
                className="sr-only"
              />
              <Button type="button" variant="outline" className="w-full" asChild>
                <span>
                  <Camera className="w-4 h-4 mr-2" />
                  Take Photo
                </span>
              </Button>
            </label>
            <label className="flex-1">
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleReceiptUpload}
                className="sr-only"
              />
              <Button type="button" variant="outline" className="w-full" asChild>
                <span>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload File
                </span>
              </Button>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Bill Form */}
      <Card className="raseed-card">
        <CardHeader>
          <CardTitle>Bill Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* User ID */}
            <div className="space-y-2">
              <Label htmlFor="user_id" className="flex items-center">
                <FileText className="w-4 h-4 mr-1" />
                User ID (Logged-in User)
              </Label>
              <Input
                id="user_id"
                type="email"
                value={bill.user_id}
                readOnly
                disabled
                className="bg-muted text-muted-foreground cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground">
                This is automatically set to your logged-in email address
              </p>
            </div>

            {/* Vendor and Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vendor_name" className="flex items-center">
                  <Store className="w-4 h-4 mr-1" />
                  Vendor Name *
                </Label>
                <Input
                  id="vendor_name"
                  value={bill.vendor_name}
                  onChange={(e) => updateBillField('vendor_name', e.target.value)}
                  placeholder="e.g., Tech Store, Restaurant Name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center">
                  <Tag className="w-4 h-4 mr-1" />
                  Bill Category *
                </Label>
                <Select value={bill.bill_category} onValueChange={(value) => updateBillField('bill_category', value)} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select bill category" />
                  </SelectTrigger>
                  <SelectContent>
                    {billCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Date and Taxes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date" className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  Date *
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={bill.date}
                  onChange={(e) => updateBillField('date', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="taxes" className="flex items-center">
                  <DollarSign className="w-4 h-4 mr-1" />
                  Taxes (₹)
                </Label>
                <Input
                  id="taxes"
                  type="number"
                  min="0"
                  step="0.01"
                  value={bill.taxes}
                  onChange={(e) => updateBillField('taxes', parseFloat(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>
            </div>

            {/* Items Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-lg font-medium">Items</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addItem}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Item
                </Button>
              </div>

              {bill.items.map((item, index) => (
                <Card key={index} className="p-4 border-l-4 border-l-primary">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Item {index + 1}</h4>
                      {bill.items.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeItem(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                      <div className="space-y-2">
                        <Label>Item Name *</Label>
                        <Input
                          value={item.name}
                          onChange={(e) => updateItem(index, 'name', e.target.value)}
                          placeholder="e.g., USB Cable, Wireless Mouse"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Quantity *</Label>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Unit Price (₹) *</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unit_price}
                          onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                          required
                        />
                      </div>
                    </div>

                    <div className="text-sm text-muted-foreground">
                      Subtotal: ₹{(item.quantity * item.unit_price).toFixed(2)}
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Total Summary */}
            <Card className="p-4 bg-muted/50">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Items Total:</span>
                  <span>₹{bill.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Taxes:</span>
                  <span>₹{bill.taxes.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-semibold border-t pt-2">
                  <span>Total Amount:</span>
                  <span>₹{bill.total_amount.toFixed(2)}</span>
                </div>
              </div>
            </Card>

            {/* Submit Button and Processing Status */}
            <div className="space-y-4">
              {/* Progress Indicators */}
              {loading && (
                <Card className="p-4 bg-muted/50">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">Processing your receipt...</span>
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        {submissionStatus.saving ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                        )}
                        <span className={`text-sm ${submissionStatus.saving ? 'text-green-600' : 'text-blue-600'}`}>
                          Saving to database...
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {submissionStatus.aiProcessing ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : submissionStatus.saving ? (
                          <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                        ) : (
                          <div className="w-4 h-4 border border-gray-300 rounded-full" />
                        )}
                        <span className={`text-sm ${submissionStatus.aiProcessing ? 'text-green-600' : submissionStatus.saving ? 'text-blue-600' : 'text-gray-500'}`}>
                          AI processing...
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {submissionStatus.walletCreation ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : submissionStatus.aiProcessing ? (
                          <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                        ) : (
                          <div className="w-4 h-4 border border-gray-300 rounded-full" />
                        )}
                        <span className={`text-sm ${submissionStatus.walletCreation ? 'text-green-600' : submissionStatus.aiProcessing ? 'text-blue-600' : 'text-gray-500'}`}>
                          Creating wallet pass...
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              )}

              {/* Success Status Display */}
              {lastApiResponse && submissionStatus.completed && !loading && (
                <Card className="p-4 border-green-200 bg-green-50">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-green-800">Receipt saved successfully!</span>
                    </div>
                    
                    {lastApiResponse.document_id && (
                      <p className="text-sm text-green-700">
                        Document ID: {lastApiResponse.document_id}
                      </p>
                    )}
                    
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2 text-sm text-green-700">
                        <Check className="w-3 h-3" />
                        <span>Data stored in database</span>
                      </div>
                      {lastApiResponse.ai_processing_status === 'completed' && (
                        <div className="flex items-center space-x-2 text-sm text-green-700">
                          <Check className="w-3 h-3" />
                          <span>AI processing completed</span>
                        </div>
                      )}
                      {lastApiResponse.wallet_pass_url && (
                        <div className="flex items-center space-x-2 text-sm text-green-700">
                          <Check className="w-3 h-3" />
                          <span>Wallet pass created</span>
                        </div>
                      )}
                    </div>
                    
                    {lastApiResponse.wallet_pass_url && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(lastApiResponse.wallet_pass_url, '_blank')}
                        className="mt-2 border-green-300 text-green-700 hover:bg-green-100"
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        Add to Google Wallet
                      </Button>
                    )}
                  </div>
                </Card>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full raseed-button-primary"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing receipt...</span>
                  </div>
                ) : (
                  'Add Bill'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddExpense;