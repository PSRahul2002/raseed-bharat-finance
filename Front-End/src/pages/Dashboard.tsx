import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CreditCard, 
  ArrowUpRight, 
  ArrowDownRight,
  Plus,
  Eye,
  Receipt,
  Loader2,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useDataService, Receipt as ReceiptType, UserSummary } from '@/services/dataService';
import { useToast } from '@/hooks/use-toast';
import { useLocalStorageData, debugLocalStorage } from '@/hooks/use-local-storage-data';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const dataService = useDataService();
  const { toast } = useToast();

  // State for real data
  const [receipts, setReceipts] = useState<ReceiptType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<'api' | 'cache'>('api');

  // Use localStorage data for real-time updates
  const localStorageData = useLocalStorageData(user?.email || '');

  // Calculate stats from receipt data
  const calculateStats = (receipts: ReceiptType[]) => {
    console.log('Calculating stats for receipts:', receipts);
    
    if (receipts.length === 0) {
      return {
        totalSpent: 0,
        averagePerReceipt: 0,
        categoriesCount: 0,
        lastReceiptDate: '',
        recentReceipts: []
      };
    }

    const totalSpent = receipts.reduce((sum, receipt) => sum + receipt.total_amount, 0);
    const averagePerReceipt = totalSpent / receipts.length;
    
    // Get unique categories
    const categories = [...new Set(receipts.map(receipt => receipt.bill_category || receipt.category || 'Uncategorized').filter(Boolean))];
    const categoriesCount = categories.length;
    
    // Sort receipts by date and get the most recent
    const sortedReceipts = [...receipts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const lastReceiptDate = sortedReceipts[0]?.date || '';
    const recentReceipts = sortedReceipts.slice(0, 5);

    const result = {
      totalSpent,
      averagePerReceipt,
      categoriesCount,
      lastReceiptDate,
      recentReceipts
    };
    
    console.log('Calculated stats:', result);
    return result;
  };

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.email) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch user receipts data
        const userData = await dataService.getUserData(user.email);
        setReceipts(userData.receipts || []);

        console.log('Dashboard data loaded:', { 
          receiptsCount: userData.receipts?.length || 0,
          firstReceipt: userData.receipts?.[0],
          userData: userData
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data');
        toast({
          title: "Error",
          description: "Failed to load dashboard data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user?.email, dataService, toast]);

  // Use localStorage data as fallback when available
  useEffect(() => {
    if (localStorageData.receipts && localStorageData.receipts.length > 0 && receipts.length === 0) {
      console.log('Using localStorage receipts data for Dashboard:', localStorageData.receipts);
      setReceipts(localStorageData.receipts);
      setDataSource('cache');
      setLoading(false);
    }
  }, [localStorageData.receipts, receipts.length]);

  // Calculate current stats
  const stats = calculateStats(receipts);

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
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {user?.name || 'User'}!
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
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {user?.name || 'User'}!
          </p>
        </div>
        <Card className="raseed-card">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Failed to Load Data</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // No data state
  if (receipts.length === 0) {
    const hasLocalStorageReceipts = localStorageData.receipts && localStorageData.receipts.length > 0;
    
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Welcome back, {user?.name || 'User'}!
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <RefreshCw className="w-4 h-4" />
            <span>
              Data from: {dataSource === 'cache' ? 'Local Storage (Real-time)' : 'API'}
            </span>
          </div>
        </div>
        <Card className="raseed-card">
          <CardContent className="p-6 text-center">
            <Receipt className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {hasLocalStorageReceipts ? 'Loading Your Data...' : 'No Receipts Yet'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {hasLocalStorageReceipts 
                ? `Found ${localStorageData.receipts.length} receipts in local storage. Your data will be available shortly.`
                : 'Start by adding your first receipt to see your spending insights here.'
              }
            </p>
            <Button asChild>
              <Link to="/add-expense">
                <Plus className="w-4 h-4 mr-2" />
                {hasLocalStorageReceipts ? 'Add More Receipts' : 'Add Your First Receipt'}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back, {user?.name}! 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's your financial overview
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <RefreshCw className="w-4 h-4" />
            <span>
              Data from: {dataSource === 'cache' ? 'Local Storage (Real-time)' : 'API'}
            </span>
          </div>
          <Button className="raseed-button-primary" asChild>
            <Link to="/add-expense">
              <Plus className="w-4 h-4 mr-2" />
              Add Receipt
            </Link>
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Total Spent */}
        <Card className="raseed-balance-card border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Spent
            </CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground raseed-text-currency">
              {formatCurrency(stats.totalSpent)}
            </div>
            <div className="flex items-center space-x-1 text-sm text-muted-foreground mt-1">
              <Receipt className="w-3 h-3" />
              <span>{receipts.length} receipts</span>
            </div>
          </CardContent>
        </Card>

        {/* Average per Receipt */}
        <Card className="raseed-card border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average per Receipt
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground raseed-text-currency">
              {formatCurrency(stats.averagePerReceipt)}
            </div>
            <div className="flex items-center space-x-1 text-sm text-muted-foreground mt-1">
              <span>Per transaction</span>
            </div>
          </CardContent>
        </Card>

        {/* Categories */}
        <Card className="raseed-card border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Categories
            </CardTitle>
            <CreditCard className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {stats.categoriesCount}
            </div>
            <div className="flex items-center space-x-1 text-sm text-muted-foreground mt-1">
              <span>Different categories</span>
            </div>
          </CardContent>
        </Card>

        {/* Last Receipt */}
        <Card className="raseed-card border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Last Receipt
            </CardTitle>
            <ArrowUpRight className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-foreground">
              {stats.lastReceiptDate ? formatDate(stats.lastReceiptDate) : 'No receipts'}
            </div>
            <div className="flex items-center space-x-1 text-sm text-muted-foreground mt-1">
              <span>Most recent</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      {stats.recentReceipts.length > 0 && (
        <Card className="raseed-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">Recent Receipts</CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link to="/insights">
                  <Eye className="w-4 h-4 mr-2" />
                  View All
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentReceipts.map((receipt) => (
                <div 
                  key={receipt.id} 
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Receipt className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {receipt.vendor_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {receipt.bill_category || receipt.category || 'Uncategorized'} • {formatDate(receipt.date)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground raseed-text-currency">
                      {formatCurrency(receipt.total_amount)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {receipt.items?.length || 0} item{(receipt.items?.length || 0) !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="raseed-card hover:shadow-md transition-shadow cursor-pointer">
          <Link to="/add-expense">
            <CardContent className="p-6 text-center">
              <Plus className="w-8 h-8 text-primary mx-auto mb-2" />
              <h3 className="font-semibold mb-1">Add Receipt</h3>
              <p className="text-sm text-muted-foreground">Upload or scan a new receipt</p>
            </CardContent>
          </Link>
        </Card>

        <Card className="raseed-card hover:shadow-md transition-shadow cursor-pointer">
          <Link to="/insights">
            <CardContent className="p-6 text-center">
              <TrendingUp className="w-8 h-8 text-primary mx-auto mb-2" />
              <h3 className="font-semibold mb-1">View Insights</h3>
              <p className="text-sm text-muted-foreground">Analyze your spending patterns</p>
            </CardContent>
          </Link>
        </Card>

        <Card className="raseed-card hover:shadow-md transition-shadow cursor-pointer">
          <Link to="/assistant">
            <CardContent className="p-6 text-center">
              <Eye className="w-8 h-8 text-primary mx-auto mb-2" />
              <h3 className="font-semibold mb-1">Ask Assistant</h3>
              <p className="text-sm text-muted-foreground">Get AI-powered financial insights</p>
            </CardContent>
          </Link>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
