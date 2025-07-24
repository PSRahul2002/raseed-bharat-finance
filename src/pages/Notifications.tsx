import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Notifications: React.FC = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
        <p className="text-muted-foreground mt-1">
          Stay updated with your financial activities
        </p>
      </div>
      
      <Card className="raseed-card">
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Smart notifications and alerts are coming soon! We'll keep you informed about important financial events.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Notifications;