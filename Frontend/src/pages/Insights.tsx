import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Insights: React.FC = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Spending Insights</h1>
        <p className="text-muted-foreground mt-1">
          Analyze your spending patterns and get smart recommendations
        </p>
      </div>
      
      <Card className="raseed-card">
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Advanced insights and analytics are coming soon! We'll help you understand your spending patterns better.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Insights;