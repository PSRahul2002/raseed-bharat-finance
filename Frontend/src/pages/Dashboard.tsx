import React from 'react';
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
  Eye
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  // Mock data
  const totalBalance = 45750;
  const monthlyIncome = 85000;
  const monthlyExpenses = 39250;
  const savings = monthlyIncome - monthlyExpenses;

  const recentTransactions = [
    {
      id: 1,
      description: 'Swiggy - Dinner',
      amount: -450,
      category: 'Food',
      date: '2024-01-15',
      merchant: 'Swiggy'
    },
    {
      id: 2,
      description: 'Salary Credit',
      amount: 85000,
      category: 'Income',
      date: '2024-01-15',
      merchant: 'Company Ltd'
    },
    {
      id: 3,
      description: 'Flipkart Shopping',
      amount: -2850,
      category: 'Shopping',
      date: '2024-01-14',
      merchant: 'Flipkart'
    },
    {
      id: 4,
      description: 'Metro Card Recharge',
      amount: -500,
      category: 'Transport',
      date: '2024-01-14',
      merchant: 'Delhi Metro'
    },
    {
      id: 5,
      description: 'Electricity Bill',
      amount: -1200,
      category: 'Utilities',
      date: '2024-01-13',
      merchant: 'BSES'
    }
  ];

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