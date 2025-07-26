import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Calendar, Filter, Search, Receipt } from 'lucide-react';
import { format } from 'date-fns';

interface Bill {
  id: string;
  date: Date;
  merchant: string;
  amount: number;
  category: string;
  status: 'paid' | 'pending' | 'overdue';
  description: string;
}

const mockBills: Bill[] = [
  {
    id: '1',
    date: new Date('2024-01-15'),
    merchant: 'Swiggy',
    amount: 450,
    category: 'Food & Dining',
    status: 'paid',
    description: 'Lunch order'
  },
  {
    id: '2',
    date: new Date('2024-01-14'),
    merchant: 'Flipkart',
    amount: 2100,
    category: 'Shopping',
    status: 'paid',
    description: 'Electronics purchase'
  },
  {
    id: '3',
    date: new Date('2024-01-13'),
    merchant: 'Delhi Metro',
    amount: 120,
    category: 'Transportation',
    status: 'paid',
    description: 'Metro card recharge'
  },
  {
    id: '4',
    date: new Date('2024-01-12'),
    merchant: 'Reliance Jio',
    amount: 599,
    category: 'Bills & Utilities',
    status: 'pending',
    description: 'Mobile recharge'
  },
  {
    id: '5',
    date: new Date('2024-01-10'),
    merchant: 'BookMyShow',
    amount: 300,
    category: 'Entertainment',
    status: 'paid',
    description: 'Movie tickets'
  },
  {
    id: '6',
    date: new Date('2024-01-08'),
    merchant: 'BigBasket',
    amount: 1250,
    category: 'Groceries',
    status: 'overdue',
    description: 'Weekly grocery shopping'
  }
];

const categories = [
  'All Categories',
  'Food & Dining',
  'Shopping',
  'Transportation',
  'Bills & Utilities',
  'Entertainment',
  'Groceries'
];

const statusOptions = [
  'All Status',
  'paid',
  'pending',
  'overdue'
];

const Bills = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedStatus, setSelectedStatus] = useState('All Status');
  const [sortBy, setSortBy] = useState('date');

  const filteredBills = useMemo(() => {
    let filtered = mockBills.filter(bill => {
      const matchesSearch = bill.merchant.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           bill.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'All Categories' || bill.category === selectedCategory;
      const matchesStatus = selectedStatus === 'All Status' || bill.status === selectedStatus;
      
      return matchesSearch && matchesCategory && matchesStatus;
    });

    // Sort bills
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return b.date.getTime() - a.date.getTime();
        case 'amount':
          return b.amount - a.amount;
        case 'merchant':
          return a.merchant.localeCompare(b.merchant);
        default:
          return 0;
      }
    });

    return filtered;
  }, [searchTerm, selectedCategory, selectedStatus, sortBy]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-success/10 text-success border-success/20';
      case 'pending':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'overdue':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const totalAmount = filteredBills.reduce((sum, bill) => sum + bill.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Bills & Receipts</h1>
          <p className="text-muted-foreground">View and manage all your bills and receipts</p>
        </div>
        <div className="flex items-center gap-2">
          <Receipt className="w-5 h-5 text-primary" />
          <span className="text-sm font-medium text-muted-foreground">
            {filteredBills.length} bills • ₹{totalAmount.toLocaleString('en-IN')} total
          </span>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search bills..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-4">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="amount">Amount</SelectItem>
                  <SelectItem value="merchant">Merchant</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bills Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Merchant</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBills.map((bill) => (
                  <TableRow key={bill.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      {format(bill.date, 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>{bill.merchant}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {bill.description}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {bill.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold">
                      ₹{bill.amount.toLocaleString('en-IN')}
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-xs capitalize ${getStatusColor(bill.status)}`}>
                        {bill.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {filteredBills.length === 0 && (
            <div className="text-center py-12">
              <Receipt className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No bills found</h3>
              <p className="text-muted-foreground">
                Try adjusting your filters or search terms
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Bills;