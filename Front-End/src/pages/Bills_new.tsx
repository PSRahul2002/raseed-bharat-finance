import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useDataService, Receipt } from '@/services/dataService';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, 
  Search, 
  Filter, 
  Receipt as ReceiptIcon, 
  Calendar,
  DollarSign,
  Building,
  Tag,
  AlertCircle,
  Plus
} from 'lucide-react';

const Bills: React.FC = () => {
  const { user } = useAuth();
  const dataService = useDataService();
  const { toast } = useToast();

  // State
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [filteredReceipts, setFilteredReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date-desc');

  // Fetch receipts data
  useEffect(() => {
    const fetchReceipts = async () => {
      if (!user?.email) return;

      try {
        setLoading(true);
        setError(null);

        const userData = await dataService.getUserData(user.email);
        setReceipts(userData.receipts || []);
        setFilteredReceipts(userData.receipts || []);

        console.log('Receipts data loaded:', userData.receipts);
      } catch (error) {
        console.error('Error fetching receipts:', error);
        setError('Failed to load receipts data');
        toast({
          title: "Error",
          description: "Failed to load receipts data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchReceipts();
  }, [user?.email, dataService, toast]);

  // Get unique categories for filter
  const categories = React.useMemo(() => {
    const uniqueCategories = [...new Set(receipts.map(receipt => receipt.category))];
    return uniqueCategories.filter(category => category && category.trim() !== '');
  }, [receipts]);

  // Filter and sort receipts
  useEffect(() => {
    let filtered = [...receipts];

    // Apply search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(receipt => 
        receipt.vendor_name?.toLowerCase().includes(search) ||
        receipt.category?.toLowerCase().includes(search) ||
        receipt.receipt_id?.toLowerCase().includes(search)
      );
    }

    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(receipt => receipt.category === categoryFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'date-asc':
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'amount-desc':
          return b.total_amount - a.total_amount;
        case 'amount-asc':
          return a.total_amount - b.total_amount;
        case 'vendor-asc':
          return (a.vendor_name || '').localeCompare(b.vendor_name || '');
        case 'vendor-desc':
          return (b.vendor_name || '').localeCompare(a.vendor_name || '');
        default:
          return 0;
      }
    });

    setFilteredReceipts(filtered);
  }, [receipts, searchTerm, categoryFilter, sortBy]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format date
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get category color
  const getCategoryColor = (category: string) => {
    const colors = {
      'Food': 'bg-orange-100 text-orange-800',
      'Transportation': 'bg-blue-100 text-blue-800',
      'Shopping': 'bg-purple-100 text-purple-800',
      'Entertainment': 'bg-pink-100 text-pink-800',
      'Healthcare': 'bg-red-100 text-red-800',
      'Utilities': 'bg-green-100 text-green-800',
      'Education': 'bg-indigo-100 text-indigo-800',
      'Travel': 'bg-teal-100 text-teal-800',
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Bills & Receipts</h1>
          <p className="text-muted-foreground mt-1">
            View and manage all your receipts and bills
          </p>
        </div>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Bills & Receipts</h1>
          <p className="text-muted-foreground mt-1">
            View and manage all your receipts and bills
          </p>
        </div>
        <Card className="raseed-card">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Failed to Load Data</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <button onClick={() => window.location.reload()} className="px-4 py-2 bg-primary text-white rounded">
              Try Again
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Bills & Receipts</h1>
          <p className="text-muted-foreground mt-1">
            View and manage all your receipts and bills
          </p>
        </div>
        <Link 
          to="/add-expense" 
          className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Receipt
        </Link>
      </div>

      {receipts.length === 0 ? (
        // No data state
        <Card className="raseed-card">
          <CardContent className="p-6 text-center">
            <ReceiptIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Receipts Found</h3>
            <p className="text-muted-foreground mb-4">
              You haven't added any receipts yet. Start by adding your first receipt to track your expenses.
            </p>
            <Link to="/add-expense" className="inline-flex items-center px-4 py-2 bg-primary text-white rounded hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Receipt
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="raseed-card border-l-4 border-l-primary">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Receipts
                </CardTitle>
                <ReceiptIcon className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {receipts.length}
                </div>
              </CardContent>
            </Card>

            <Card className="raseed-card border-l-4 border-l-green-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Amount
                </CardTitle>
                <DollarSign className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {formatCurrency(receipts.reduce((sum, receipt) => sum + receipt.total_amount, 0))}
                </div>
              </CardContent>
            </Card>

            <Card className="raseed-card border-l-4 border-l-blue-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Categories
                </CardTitle>
                <Tag className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {categories.length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="raseed-card">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Search */}
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search receipts..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Category Filter */}
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Sort */}
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date-desc">Date (Newest)</SelectItem>
                    <SelectItem value="date-asc">Date (Oldest)</SelectItem>
                    <SelectItem value="amount-desc">Amount (High to Low)</SelectItem>
                    <SelectItem value="amount-asc">Amount (Low to High)</SelectItem>
                    <SelectItem value="vendor-asc">Vendor (A-Z)</SelectItem>
                    <SelectItem value="vendor-desc">Vendor (Z-A)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Results Count */}
          <div className="text-sm text-muted-foreground">
            Showing {filteredReceipts.length} of {receipts.length} receipts
          </div>

          {/* Receipts List */}
          {filteredReceipts.length === 0 ? (
            <Card className="raseed-card">
              <CardContent className="p-6 text-center">
                <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Results Found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search terms or filters to see more results.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredReceipts.map((receipt) => (
                <Card key={receipt.receipt_id} className="raseed-card hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-muted-foreground" />
                          <h3 className="font-semibold text-foreground">
                            {receipt.vendor_name || 'Unknown Vendor'}
                          </h3>
                          {receipt.category && (
                            <Badge className={getCategoryColor(receipt.category)}>
                              {receipt.category}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(receipt.date)}
                          </div>
                          <div className="flex items-center gap-1">
                            <ReceiptIcon className="w-4 h-4" />
                            {receipt.receipt_id}
                          </div>
                        </div>

                        {receipt.items && receipt.items.length > 0 && (
                          <div className="text-sm text-muted-foreground">
                            {receipt.items.length} item{receipt.items.length !== 1 ? 's' : ''}
                            {receipt.items.length <= 3 && (
                              <span className="ml-2">
                                {receipt.items.map(item => item.item_name).join(', ')}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="text-right">
                        <div className="text-2xl font-bold text-foreground">
                          {formatCurrency(receipt.total_amount)}
                        </div>
                        {receipt.tax_amount > 0 && (
                          <div className="text-sm text-muted-foreground">
                            Tax: {formatCurrency(receipt.tax_amount)}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Bills;
