import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Camera, 
  Upload, 
  DollarSign, 
  Calendar, 
  Tag, 
  FileText,
  CheckCircle,
  Plus,
  Minus
} from 'lucide-react';

const AddExpense: React.FC = () => {
  const [transactionType, setTransactionType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [receipt, setReceipt] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const expenseCategories = [
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

  const incomeCategories = [
    'Salary',
    'Freelance',
    'Investment',
    'Bonus',
    'Gift',
    'Other'
  ];

  const handleReceiptUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setReceipt(file);
      // Simulate OCR processing
      setTimeout(() => {
        setAmount('450');
        setDescription('Swiggy - Food delivery');
        setCategory('Food & Dining');
        toast({
          title: "Receipt processed!",
          description: "Amount and details extracted from receipt.",
        });
      }, 1500);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description || !category) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      toast({
        title: "Transaction added!",
        description: `₹${amount} ${transactionType} has been recorded.`,
      });
      
      // Reset form
      setAmount('');
      setDescription('');
      setCategory('');
      setReceipt(null);
      setDate(new Date().toISOString().split('T')[0]);
    }, 1000);
  };

  const formatCurrency = (value: string) => {
    if (!value) return '';
    return new Intl.NumberFormat('en-IN').format(Number(value));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Add Transaction</h1>
        <p className="text-muted-foreground mt-1">
          Record your income or expenses quickly and easily
        </p>
      </div>

      {/* Transaction Type Toggle */}
      <Card className="raseed-card">
        <CardContent className="p-4">
          <div className="flex space-x-2">
            <Button
              type="button"
              variant={transactionType === 'expense' ? 'default' : 'outline'}
              onClick={() => setTransactionType('expense')}
              className="flex-1"
            >
              <Minus className="w-4 h-4 mr-2" />
              Expense
            </Button>
            <Button
              type="button"
              variant={transactionType === 'income' ? 'default' : 'outline'}
              onClick={() => setTransactionType('income')}
              className="flex-1"
            >
              <Plus className="w-4 h-4 mr-2" />
              Income
            </Button>
          </div>
        </CardContent>
      </Card>

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
            {receipt ? (
              <div className="space-y-2">
                <CheckCircle className="w-8 h-8 text-success mx-auto" />
                <p className="font-medium text-foreground">{receipt.name}</p>
                <p className="text-sm text-muted-foreground">
                  Processing receipt... Amount and details will be auto-filled.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="w-8 h-8 text-muted-foreground mx-auto" />
                <p className="font-medium text-foreground">Upload your receipt</p>
                <p className="text-sm text-muted-foreground">
                  We'll automatically extract amount, vendor, and category
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

      {/* Transaction Form */}
      <Card className="raseed-card">
        <CardHeader>
          <CardTitle>Transaction Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount" className="flex items-center">
                <DollarSign className="w-4 h-4 mr-1" />
                Amount (₹) *
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">₹</span>
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  className="pl-8 text-lg font-semibold raseed-text-currency"
                  required
                />
              </div>
              {amount && (
                <p className="text-sm text-muted-foreground">
                  Amount: ₹{formatCurrency(amount)}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="flex items-center">
                <FileText className="w-4 h-4 mr-1" />
                Description *
              </Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., Lunch at restaurant, Salary payment"
                required
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label className="flex items-center">
                <Tag className="w-4 h-4 mr-1" />
                Category *
              </Label>
              <Select value={category} onValueChange={setCategory} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {(transactionType === 'expense' ? expenseCategories : incomeCategories).map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="date" className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                Date *
              </Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                placeholder="Any additional details about this transaction..."
                rows={3}
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full raseed-button-primary"
            >
              {loading ? 'Adding...' : `Add ${transactionType === 'expense' ? 'Expense' : 'Income'}`}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Quick Add Suggestions */}
      <Card className="raseed-card">
        <CardHeader>
          <CardTitle>Quick Add</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Coffee ☕', amount: '150', category: 'Food & Dining' },
              { label: 'Metro 🚇', amount: '50', category: 'Transportation' },
              { label: 'Lunch 🍽️', amount: '300', category: 'Food & Dining' },
              { label: 'Grocery 🛒', amount: '1000', category: 'Groceries' },
            ].map((item) => (
              <Button
                key={item.label}
                variant="outline"
                onClick={() => {
                  setAmount(item.amount);
                  setDescription(item.label);
                  setCategory(item.category);
                  setTransactionType('expense');
                }}
                className="text-left justify-start"
              >
                <div>
                  <p className="font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">₹{item.amount}</p>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddExpense;