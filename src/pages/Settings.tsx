import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  User, 
  Bell, 
  Globe, 
  Shield, 
  CreditCard, 
  HelpCircle, 
  LogOut,
  Mail,
  Smartphone,
  Download,
  Trash2,
  Plus
} from 'lucide-react';

const Settings: React.FC = () => {
  const { user, logout } = useAuth();
  const { toast } = useToast();

  const handleSave = () => {
    toast({
      title: "Settings saved!",
      description: "Your preferences have been updated successfully.",
    });
  };

  const handleLogout = () => {
    logout();
    toast({
      title: "Logged out",
      description: "You have been logged out successfully.",
    });
  };

  const handleDeleteAccount = () => {
    // In a real app, this would show a confirmation dialog
    toast({
      title: "Account deletion requested",
      description: "Please contact support to complete account deletion.",
      variant: "destructive",
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account and preferences
        </p>
      </div>

      {/* Profile Settings */}
      <Card className="raseed-card">
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="w-5 h-5 mr-2" />
            Profile Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              defaultValue={user?.name}
              placeholder="Enter your full name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              defaultValue={user?.email}
              placeholder="Enter your email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+91 XXXXX XXXXX"
            />
          </div>
          <Button onClick={handleSave} className="raseed-button-primary">
            Save Changes
          </Button>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card className="raseed-card">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="w-5 h-5 mr-2" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Push Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Get notified about important account activities
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive monthly reports and updates via email
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Budget Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Alert when you're close to budget limits
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Weekly Reports</Label>
              <p className="text-sm text-muted-foreground">
                Get weekly spending summary reports
              </p>
            </div>
            <Switch />
          </div>
        </CardContent>
      </Card>

      {/* App Preferences */}
      <Card className="raseed-card">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Globe className="w-5 h-5 mr-2" />
            App Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Language</Label>
            <Select defaultValue="en">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="hi">हिंदी (Hindi)</SelectItem>
                <SelectItem value="ta">தமிழ் (Tamil)</SelectItem>
                <SelectItem value="te">తెలుగు (Telugu)</SelectItem>
                <SelectItem value="bn">বাংলা (Bengali)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Currency</Label>
            <Select defaultValue="inr">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="inr">₹ Indian Rupee (INR)</SelectItem>
                <SelectItem value="usd">$ US Dollar (USD)</SelectItem>
                <SelectItem value="eur">€ Euro (EUR)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Date Format</Label>
            <Select defaultValue="dd/mm/yyyy">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dd/mm/yyyy">DD/MM/YYYY</SelectItem>
                <SelectItem value="mm/dd/yyyy">MM/DD/YYYY</SelectItem>
                <SelectItem value="yyyy-mm-dd">YYYY-MM-DD</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card className="raseed-card">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="w-5 h-5 mr-2" />
            Security & Privacy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Biometric Authentication</Label>
              <p className="text-sm text-muted-foreground">
                Use fingerprint or face recognition to unlock app
              </p>
            </div>
            <Switch />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto-lock App</Label>
              <p className="text-sm text-muted-foreground">
                Automatically lock app when inactive
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <Button variant="outline" className="w-full">
            <Shield className="w-4 h-4 mr-2" />
            Change Password
          </Button>
          <Button variant="outline" className="w-full">
            <Download className="w-4 h-4 mr-2" />
            Download Data
          </Button>
        </CardContent>
      </Card>

      {/* Connected Accounts */}
      <Card className="raseed-card">
        <CardHeader>
          <CardTitle className="flex items-center">
            <CreditCard className="w-5 h-5 mr-2" />
            Connected Accounts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 border border-border rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Mail className="w-4 h-4 text-primary-foreground" />
              </div>
              <div>
                <p className="font-medium">Google Account</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            <Button variant="outline" size="sm">
              Disconnect
            </Button>
          </div>
          <Button variant="outline" className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Connect Bank Account
          </Button>
        </CardContent>
      </Card>

      {/* Support */}
      <Card className="raseed-card">
        <CardHeader>
          <CardTitle className="flex items-center">
            <HelpCircle className="w-5 h-5 mr-2" />
            Support & Help
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button variant="ghost" className="w-full justify-start">
            <HelpCircle className="w-4 h-4 mr-2" />
            Help Center
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            <Mail className="w-4 h-4 mr-2" />
            Contact Support
          </Button>
          <Button variant="ghost" className="w-full justify-start">
            <Smartphone className="w-4 h-4 mr-2" />
            Feature Requests
          </Button>
          <div className="pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">
              Raseed v1.0.0 • Made in India 🇮🇳
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="raseed-card border-destructive/20">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
          <Button
            onClick={handleDeleteAccount}
            variant="destructive"
            className="w-full"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Account
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Account deletion is permanent and cannot be undone.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;