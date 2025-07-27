import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useAuth } from '@/contexts/AuthContext';
import { useDataService, UserAnalytics } from '@/services/dataService';
import { useToast } from '@/hooks/use-toast';
import { useLocalStorageData, debugLocalStorage } from '@/hooks/use-local-storage-data';
import { Loader2, AlertCircle, TrendingUp, DollarSign, Receipt, Eye, RefreshCw } from 'lucide-react';

// Colors for pie chart
const COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', 
  '#d084d0', '#ffb347', '#87ceeb', '#dda0dd', '#98fb98',
  '#f0e68c', '#ff6347', '#40e0d0', '#ee82ee', '#90ee90'
];

const Insights: React.FC = () => {
  const { user } = useAuth();
  const dataService = useDataService();
  const { toast } = useToast();

  // State
  const [analytics, setAnalytics] = useState<UserAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<'api' | 'cache'>('api');

  // Use localStorage data for real-time updates
  const localStorageData = useLocalStorageData(user?.email || '');

  // Debug localStorage on component mount
  useEffect(() => {
    if (user?.email) {
      console.log('=== INSIGHTS PAGE DEBUG ===');
      debugLocalStorage();
      console.log('LocalStorage data:', localStorageData);
    }
  }, [user?.email, localStorageData]);

  // Use localStorage data as fallback when available
  useEffect(() => {
    if (localStorageData.analytics && !analytics) {
      console.log('Using localStorage analytics data:', localStorageData.analytics);
      setAnalytics(localStorageData.analytics);
      setDataSource('cache');
      setLoading(false);
    }
  }, [localStorageData.analytics, analytics]);

  // Show real-time receipt count when localStorage has data
  const hasLocalStorageReceipts = localStorageData.receipts && localStorageData.receipts.length > 0;

  // Fetch analytics data
  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!user?.email) return;

      try {
        setLoading(true);
        setError(null);

        const analyticsData = await dataService.getUserAnalytics(user.email);
        setAnalytics(analyticsData);
        setDataSource('api');

        console.log('Analytics data loaded from API:', analyticsData);
      } catch (error) {
        console.error('Error fetching analytics:', error);
        setError('Failed to load insights data');
        toast({
          title: "Error",
          description: "Failed to load insights data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
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

  // Custom tooltip for pie chart
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-semibold">{data.category}</p>
          <p className="text-blue-600">{formatCurrency(data.total_amount)}</p>
          <p className="text-sm text-gray-600">{data.percentage.toFixed(1)}% of total</p>
          <p className="text-sm text-gray-600">{data.receipt_count} receipts</p>
        </div>
      );
    }
    return null;
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Spending Insights</h1>
          <p className="text-muted-foreground mt-1">
            Analyze your spending patterns and get smart recommendations
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
          <h1 className="text-2xl font-bold text-foreground">Spending Insights</h1>
          <p className="text-muted-foreground mt-1">
            Analyze your spending patterns and get smart recommendations
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

  // No data state
  if (!analytics || analytics.total_receipts === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Spending Insights</h1>
            <p className="text-muted-foreground mt-1">
              Analyze your spending patterns and get smart recommendations
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
              {hasLocalStorageReceipts ? 'Processing Your Data...' : 'No Data Available'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {hasLocalStorageReceipts 
                ? `Found ${localStorageData.receipts.length} receipts in local storage. Analytics will be available shortly.`
                : 'Add some receipts to see your spending insights and analytics here.'
              }
            </p>
            <Link to="/add-expense" className="inline-flex items-center px-4 py-2 bg-primary text-white rounded hover:bg-primary/90">
              <Receipt className="w-4 h-4 mr-2" />
              {hasLocalStorageReceipts ? 'Add More Receipts' : 'Add Your First Receipt'}
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Spending Insights</h1>
          <p className="text-muted-foreground mt-1">
            Analyze your spending patterns and get smart recommendations
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <RefreshCw className="w-4 h-4" />
          <span>
            Data from: {dataSource === 'cache' ? 'Local Storage (Real-time)' : 'API'}
          </span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="raseed-card border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Spent
            </CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(analytics.total_spent)}
            </div>
          </CardContent>
        </Card>

        <Card className="raseed-card border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Receipts
            </CardTitle>
            <Receipt className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {analytics.total_receipts}
            </div>
          </CardContent>
        </Card>

        <Card className="raseed-card border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average Spending
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(analytics.average_spending)}
            </div>
          </CardContent>
        </Card>

        <Card className="raseed-card border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Categories
            </CardTitle>
            <Eye className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {analytics.categories_breakdown.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown - Pie Chart */}
      {analytics.categories_breakdown.length > 0 && (
        <Card className="raseed-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Spending by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full h-96">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.categories_breakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.category}: ${entry.percentage.toFixed(1)}%`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="total_amount"
                  >
                    {analytics.categories_breakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Vendors */}
      {analytics.top_vendors.length > 0 && (
        <Card className="raseed-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Top Vendors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.top_vendors.slice(0, 5).map((vendor, index) => (
                <div key={vendor.vendor_name} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{vendor.vendor_name}</p>
                      <p className="text-sm text-muted-foreground">{vendor.receipt_count} receipts</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">
                      {formatCurrency(vendor.total_amount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Monthly Trends */}
      {analytics.monthly_trends.length > 0 && (
        <Card className="raseed-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Monthly Spending Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.monthly_trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`} />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), 'Amount']}
                    labelFormatter={(label) => `Month: ${label}`}
                  />
                  <Bar dataKey="total_amount" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category Details Table */}
      {analytics.categories_breakdown.length > 0 && (
        <Card className="raseed-card">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Category Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Category</th>
                    <th className="text-right p-2">Amount</th>
                    <th className="text-right p-2">Receipts</th>
                    <th className="text-right p-2">Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.categories_breakdown.map((category, index) => (
                    <tr key={category.category} className="border-b hover:bg-muted/50">
                      <td className="p-2 flex items-center">
                        <div 
                          className="w-4 h-4 rounded mr-2" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        ></div>
                        {category.category}
                      </td>
                      <td className="text-right p-2 font-semibold">
                        {formatCurrency(category.total_amount)}
                      </td>
                      <td className="text-right p-2">{category.receipt_count}</td>
                      <td className="text-right p-2">{category.percentage.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Insights;