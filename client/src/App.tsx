
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { Subscription, CreateSubscriptionInput, UpdateSubscriptionInput, SpendingSummary } from '../../server/src/schema';

function App() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [spendingSummary, setSpendingSummary] = useState<SpendingSummary>({
    total_monthly: 0,
    total_yearly: 0,
    active_subscriptions_count: 0,
    upcoming_due_count: 0
  });
  const [upcomingSubscriptions, setUpcomingSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);

  const [createFormData, setCreateFormData] = useState<CreateSubscriptionInput>({
    name: '',
    description: null,
    price: 0,
    billing_cycle: 'monthly',
    next_due_date: new Date()
  });

  const [updateFormData, setUpdateFormData] = useState<UpdateSubscriptionInput>({
    id: 0,
    name: '',
    description: null,
    price: 0,
    billing_cycle: 'monthly',
    next_due_date: new Date(),
    is_active: true
  });

  const loadData = useCallback(async () => {
    try {
      const [subscriptionsResult, summaryResult, upcomingResult] = await Promise.all([
        trpc.getSubscriptions.query(),
        trpc.getSpendingSummary.query(),
        trpc.getUpcomingSubscriptions.query()
      ]);
      setSubscriptions(subscriptionsResult);
      setSpendingSummary(summaryResult);
      setUpcomingSubscriptions(upcomingResult);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await trpc.createSubscription.mutate(createFormData);
      setSubscriptions((prev: Subscription[]) => [...prev, response]);
      setCreateFormData({
        name: '',
        description: null,
        price: 0,
        billing_cycle: 'monthly',
        next_due_date: new Date()
      });
      setIsCreateDialogOpen(false);
      await loadData(); // Refresh all data
    } catch (error) {
      console.error('Failed to create subscription:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await trpc.updateSubscription.mutate(updateFormData);
      setSubscriptions((prev: Subscription[]) => 
        prev.map((sub: Subscription) => sub.id === response.id ? response : sub)
      );
      setIsUpdateDialogOpen(false);
      await loadData(); // Refresh all data
    } catch (error) {
      console.error('Failed to update subscription:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this subscription?')) return;
    
    try {
      await trpc.deleteSubscription.mutate({ id });
      setSubscriptions((prev: Subscription[]) => prev.filter((sub: Subscription) => sub.id !== id));
      await loadData(); // Refresh all data
    } catch (error) {
      console.error('Failed to delete subscription:', error);
    }
  };

  const openUpdateDialog = (subscription: Subscription) => {
    setUpdateFormData({
      id: subscription.id,
      name: subscription.name,
      description: subscription.description,
      price: subscription.price,
      billing_cycle: subscription.billing_cycle,
      next_due_date: subscription.next_due_date,
      is_active: subscription.is_active
    });
    setIsUpdateDialogOpen(true);
  };

  const getBillingCycleColor = (cycle: string) => {
    switch (cycle) {
      case 'monthly': return 'bg-blue-100 text-blue-800';
      case 'yearly': return 'bg-green-100 text-green-800';
      case 'weekly': return 'bg-purple-100 text-purple-800';
      case 'daily': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const getDaysUntilDue = (dueDate: Date) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-cyan-600 bg-clip-text text-transparent mb-2">
            💳 Subscription Tracker
          </h1>
          <p className="text-gray-600">Keep track of all your software subscriptions and never miss a payment</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Monthly Spending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(spendingSummary.total_monthly)}</div>
              <p className="text-xs opacity-75">per month</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Yearly Spending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(spendingSummary.total_yearly)}</div>
              <p className="text-xs opacity-75">per year</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Active Subscriptions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{spendingSummary.active_subscriptions_count}</div>
              <p className="text-xs opacity-75">subscriptions</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Due Soon</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{spendingSummary.upcoming_due_count}</div>
              <p className="text-xs opacity-75">in next 7 days</p>
            </CardContent>
          </Card>
        </div>

        {/* Upcoming Subscriptions Alert */}
        {upcomingSubscriptions.length > 0 && (
          <Alert className="mb-6 border-orange-200 bg-orange-50">
            <AlertDescription>
              <span className="font-semibold">⏰ {upcomingSubscriptions.length} subscription(s) due soon:</span>
              <div className="mt-2 space-y-1">
                {upcomingSubscriptions.map((sub: Subscription) => (
                  <div key={sub.id} className="text-sm">
                    <span className="font-medium">{sub.name}</span> - Due in {getDaysUntilDue(sub.next_due_date)} days ({formatCurrency(sub.price)})
                  </div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Action Bar */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">📋 Your Subscriptions</h2>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600">
                ➕ Add Subscription
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New Subscription</DialogTitle>
                <DialogDescription>
                  Enter the details of your new subscription.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      placeholder="Netflix, Spotify, etc."
                      value={createFormData.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setCreateFormData((prev: CreateSubscriptionInput) => ({ ...prev, name: e.target.value }))
                      }
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Optional description"
                      value={createFormData.description || ''}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setCreateFormData((prev: CreateSubscriptionInput) => ({
                          ...prev,
                          description: e.target.value || null
                        }))
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="price">Price</Label>
                      <Input
                        id="price"
                        type="number"
                        placeholder="9.99"
                        step="0.01"
                        min="0"
                        value={createFormData.price}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setCreateFormData((prev: CreateSubscriptionInput) => ({ ...prev, price: parseFloat(e.target.value) || 0 }))
                        }
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="billing_cycle">Billing Cycle</Label>
                      <Select
                        value={createFormData.billing_cycle}
                        onValueChange={(value: 'monthly' | 'yearly' | 'weekly' | 'daily') =>
                          setCreateFormData((prev: CreateSubscriptionInput) => ({ ...prev, billing_cycle: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="yearly">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="next_due_date">Next Due Date</Label>
                    <Input
                      id="next_due_date"
                      type="date"
                      value={createFormData.next_due_date.toISOString().split('T')[0]}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setCreateFormData((prev: CreateSubscriptionInput) => ({ ...prev, next_due_date: new Date(e.target.value) }))
                      }
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? 'Creating...' : 'Create Subscription'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Subscriptions Grid */}
        {subscriptions.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="text-6xl mb-4">📱</div>
              <h3 className="text-xl font-semibold mb-2">No subscriptions yet</h3>
              <p className="text-gray-600 mb-4">Start tracking your subscriptions to better manage your spending</p>
              <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-gradient-to-r from-indigo-500 to-cyan-500">
                Add Your First Subscription
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subscriptions.map((subscription: Subscription) => {
              const daysUntilDue = getDaysUntilDue(subscription.next_due_date);
              const isDueSoon = daysUntilDue <= 7 && daysUntilDue >= 0;
              
              return (
                <Card key={subscription.id} className={`hover:shadow-lg transition-shadow ${isDueSoon ? 'ring-2 ring-orange-200' : ''}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{subscription.name}</CardTitle>
                        {subscription.description && (
                          <CardDescription className="mt-1">{subscription.description}</CardDescription>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Badge className={getStatusColor(subscription.is_active)}>
                          {subscription.is_active ? '✅ Active' : '❌ Inactive'}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-indigo-600">
                        {formatCurrency(subscription.price)}
                      </span>
                      <Badge className={getBillingCycleColor(subscription.billing_cycle)}>
                        {subscription.billing_cycle}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Next Due:</span>
                        <span className={`font-medium ${isDueSoon ? 'text-orange-600' : 'text-gray-900'}`}>
                          {subscription.next_due_date.toLocaleDateString()}
                        </span>
                      </div>
                      {isDueSoon && (
                        <div className="text-sm text-orange-600 font-medium">
                          ⚠️ Due in {daysUntilDue} day{daysUntilDue !== 1 ? 's' : ''}
                        </div>
                      )}
                    </div>

                    <Separator />

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openUpdateDialog(subscription)}
                        className="flex-1"
                      >
                        ✏️ Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(subscription.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        🗑️ Delete
                      </Button>
                    </div>

                    <div className="text-xs text-gray-500">
                      Created: {subscription.created_at.toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Update Dialog */}
        <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Update Subscription</DialogTitle>
              <DialogDescription>
                Modify the details of your subscription.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="update-name">Name</Label>
                  <Input
                    id="update-name"
                    value={updateFormData.name || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setUpdateFormData((prev: UpdateSubscriptionInput) => ({ ...prev, name: e.target.value }))
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="update-description">Description</Label>
                  <Textarea
                    id="update-description"
                    value={updateFormData.description || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setUpdateFormData((prev: UpdateSubscriptionInput) => ({
                        ...prev,
                        description: e.target.value || null
                      }))
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="update-price">Price</Label>
                    <Input
                      id="update-price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={updateFormData.price || 0}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setUpdateFormData((prev: UpdateSubscriptionInput) => ({ ...prev, price: parseFloat(e.target.value) || 0 }))
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="update-billing_cycle">Billing Cycle</Label>
                    <Select
                      value={updateFormData.billing_cycle || 'monthly'}
                      onValueChange={(value: 'monthly' | 'yearly' | 'weekly' | 'daily') =>
                        setUpdateFormData((prev: UpdateSubscriptionInput) => ({ ...prev, billing_cycle: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="update-next_due_date">Next Due Date</Label>
                  <Input
                    id="update-next_due_date"
                    type="date"
                    value={updateFormData.next_due_date ? new Date(updateFormData.next_due_date).toISOString().split('T')[0] : ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setUpdateFormData((prev: UpdateSubscriptionInput) => ({ ...prev, next_due_date: new Date(e.target.value) }))
                    }
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="update-is_active"
                    checked={updateFormData.is_active || false}
                    onCheckedChange={(checked: boolean) =>
                      setUpdateFormData((prev: UpdateSubscriptionInput) => ({ ...prev, is_active: checked }))
                    }
                  />
                  <Label htmlFor="update-is_active">Active subscription</Label>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Updating...' : 'Update Subscription'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default App;
