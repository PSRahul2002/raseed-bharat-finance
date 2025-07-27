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
  AlertCircle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useDataService, Receipt as ReceiptType, UserSummary } from '@/services/dataService';
import { useToast } from '@/hooks/use-toast';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const dataService = useDataService();
  const { toast } = useToast();

  // State for real data
  const [userSummary, setUserSummary] = useState<UserSummary | null>(null);
  const [recentReceipts, setRecentReceipts] = useState<ReceiptType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.email) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch user summary and recent receipts
        const [summary, userData] = await Promise.all([
          dataService.getUserSummary(user.email),
          dataService.getUserData(user.email)
        ]);

        setUserSummary(summary);
        
        // Get last 5 receipts, sorted by date
        const sortedReceipts = userData.receipts
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 5);
        
        setRecentReceipts(sortedReceipts);

        console.log('Dashboard data loaded:', { summary, recentReceiptsCount: sortedReceipts.length });
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
  if (!userSummary || userSummary.total_receipts === 0) {
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
            <Receipt className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Receipts Yet</h3>
            <p className="text-muted-foreground mb-4">
              Start by adding your first receipt to see your spending insights here.
            </p>
            <Button asChild>
              <Link to="/add-expense">
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Receipt
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
        <Button className="raseed-button-primary" asChild>
          <Link to="/add-expense">
            <Plus className="w-4 h-4 mr-2" />
            Add Receipt
          </Link>
        </Button>
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
              {formatCurrency(userSummary.total_spent)}
            </div>
            <div className="flex items-center space-x-1 text-sm text-muted-foreground mt-1">
              <Receipt className="w-3 h-3" />
              <span>{userSummary.total_receipts} receipts</span>
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
              {formatCurrency(userSummary.average_per_receipt)}
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
              {userSummary.categories_count}
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
              {userSummary.last_receipt_date ? formatDate(userSummary.last_receipt_date) : 'No receipts'}
            </div>
            <div className="flex items-center space-x-1 text-sm text-muted-foreground mt-1">
              <span>Most recent</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      {recentReceipts.length > 0 && (
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
              {recentReceipts.map((receipt) => (
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
                        {receipt.bill_category} • {formatDate(receipt.date)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground raseed-text-currency">
                      {formatCurrency(receipt.total_amount)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {receipt.items.length} item{receipt.items.length !== 1 ? 's' : ''}
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
          </a>
        </Card>
      </div>
    </div>
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back, {user?.name}! 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Here's your financial overview for January 2024
          </p>
        </div>
        <Button className="raseed-button-primary">
          <Plus className="w-4 h-4 mr-2" />
          Add Transaction
        </Button>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Balance */}
        <Card className="raseed-balance-card border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Balance
            </CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground raseed-text-currency">
              {formatCurrency(totalBalance)}
            </div>
            <div className="flex items-center space-x-1 text-sm text-success mt-1">
              <TrendingUp className="w-3 h-3" />
              <span>+12.5% from last month</span>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Income */}
        <Card className="raseed-card border-l-4 border-l-success">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Monthly Income
            </CardTitle>
            <ArrowUpRight className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold raseed-expense-positive raseed-text-currency">
              {formatCurrency(monthlyIncome)}
            </div>
            <p className="text-xs text-muted-foreground">
              Salary + side income
            </p>
          </CardContent>
        </Card>

        {/* Monthly Expenses */}
        <Card className="raseed-card border-l-4 border-l-warning">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Monthly Expenses
            </CardTitle>
            <ArrowDownRight className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold raseed-expense-negative raseed-text-currency">
              {formatCurrency(monthlyExpenses)}
            </div>
            <p className="text-xs text-muted-foreground">
              46% of income
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Stats */}
        <Card className="raseed-card">
          <CardHeader>
            <CardTitle className="text-lg">Quick Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Savings this month</span>
              <span className="font-semibold raseed-expense-positive raseed-text-currency">
                {formatCurrency(savings)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Daily avg. spending</span>
              <span className="font-semibold raseed-text-currency">
                {formatCurrency(Math.floor(monthlyExpenses / 30))}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Credit card due</span>
              <span className="font-semibold text-warning raseed-text-currency">
                {formatCurrency(12450)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Investments</span>
              <span className="font-semibold raseed-expense-positive raseed-text-currency">
                {formatCurrency(125000)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card className="raseed-card lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Transactions</CardTitle>
            <Button variant="ghost" size="sm" className="text-primary">
              <Eye className="w-4 h-4 mr-1" />
              View All
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      transaction.amount > 0 ? 'bg-success/10' : 'bg-expense/10'
                    }`}>
                      {transaction.amount > 0 ? (
                        <ArrowUpRight className="w-5 h-5 text-success" />
                      ) : (
                        <ArrowDownRight className="w-5 h-5 text-expense" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{transaction.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {transaction.merchant} • {new Date(transaction.date).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold raseed-text-currency ${
                      transaction.amount > 0 ? 'raseed-expense-positive' : 'raseed-expense-negative'
                    }`}>
                      {transaction.amount > 0 ? '+' : ''}{formatCurrency(Math.abs(transaction.amount))}
                    </p>
                    <p className="text-xs text-muted-foreground">{transaction.category}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="raseed-card">
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <Plus className="w-6 h-6" />
              <span className="text-sm">Add Expense</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <CreditCard className="w-6 h-6" />
              <span className="text-sm">Pay Bills</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <TrendingUp className="w-6 h-6" />
              <span className="text-sm">View Insights</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <DollarSign className="w-6 h-6" />
              <span className="text-sm">Set Budget</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;