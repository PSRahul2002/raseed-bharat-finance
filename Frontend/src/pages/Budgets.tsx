import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Budgets: React.FC = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Budget Management</h1>
        <p className="text-muted-foreground mt-1">
          Set and track your monthly budgets by category
        </p>
      </div>
      
      <Card className="raseed-card">
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Budget creation and tracking features are coming soon! You'll be able to set limits and get alerts.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Budgets;