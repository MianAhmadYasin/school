import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/Card';
import { Table, TableRow, TableCell } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { getManagerDashboardData, type ManagerStats } from '../../lib/manager';

export function ManagerDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<ManagerStats | null>(null);
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [recentDistributions, setRecentDistributions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const data = await getManagerDashboardData();
      setStats(data.stats);
      setLowStockItems(data.lowStockItems);
      setRecentTransactions(data.recentTransactions);
      setRecentDistributions(data.recentDistributions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-medium text-red-600">Error</h3>
          <p className="mt-2 text-sm text-gray-600">{error}</p>
          <Button onClick={loadDashboardData} className="mt-4">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back, {profile?.full_name}
          </h1>
          <p className="text-sm text-gray-600">Inventory & Stationery Management Dashboard</p>
        </div>
        <div className="flex items-center gap-4">
          <Button onClick={loadDashboardData} variant="secondary">
            Refresh
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="p-6">
            <h3 className="text-sm font-medium text-gray-600">Total Items</h3>
            <p className="mt-2 text-3xl font-semibold text-gray-900">
              {stats.inventory.totalItems}
            </p>
            <p className="mt-1 text-sm text-gray-600">
              Total inventory items
            </p>
          </Card>

          <Card className="p-6">
            <h3 className="text-sm font-medium text-gray-600">Low Stock Items</h3>
            <p className="mt-2 text-3xl font-semibold text-yellow-600">
              {stats.inventory.lowStockItems}
            </p>
            <p className="mt-1 text-sm text-gray-600">
              Need restocking
            </p>
          </Card>

          <Card className="p-6">
            <h3 className="text-sm font-medium text-gray-600">Total Value</h3>
            <p className="mt-2 text-3xl font-semibold text-green-600">
              ${stats.inventory.totalValue.toLocaleString()}
            </p>
            <p className="mt-1 text-sm text-gray-600">
              Inventory value
            </p>
          </Card>

          <Card className="p-6">
            <h3 className="text-sm font-medium text-gray-600">Pending Requests</h3>
            <p className="mt-2 text-3xl font-semibold text-red-600">
              {stats.distributions.pendingRequests}
            </p>
            <p className="mt-1 text-sm text-gray-600">
              Awaiting approval
            </p>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Low Stock Items */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">Low Stock Items</h3>
            <Button size="sm" variant="secondary">
              View All
            </Button>
          </div>
          <div className="space-y-3">
            {lowStockItems.slice(0, 5).map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{item.name}</p>
                  <p className="text-sm text-gray-600">{item.category}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-red-600">
                    {item.quantity} left
                  </p>
                  <p className="text-xs text-gray-500">
                    Min: {item.minimum_quantity}
                  </p>
                </div>
              </div>
            ))}
            {lowStockItems.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">
                No low stock items
              </p>
            )}
          </div>
        </Card>

        {/* Recent Transactions */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">Recent Transactions</h3>
            <Button size="sm" variant="secondary">
              View All
            </Button>
          </div>
          <div className="space-y-3">
            {recentTransactions.slice(0, 5).map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{transaction.item?.name}</p>
                  <p className="text-sm text-gray-600">
                    {transaction.transaction_type} - {transaction.quantity} units
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {new Date(transaction.transaction_date).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-gray-500">
                    {transaction.performed_by_user?.full_name}
                  </p>
                </div>
              </div>
            ))}
            {recentTransactions.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">
                No recent transactions
              </p>
            )}
          </div>
        </Card>

        {/* Recent Distributions */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">Recent Distributions</h3>
            <Button size="sm" variant="secondary">
              View All
            </Button>
          </div>
          <div className="space-y-3">
            {recentDistributions.slice(0, 5).map((distribution) => (
              <div key={distribution.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{distribution.item?.name}</p>
                  <p className="text-sm text-gray-600">
                    {distribution.student?.first_name} {distribution.student?.last_name}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {distribution.quantity} units
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(distribution.distribution_date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
            {recentDistributions.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">
                No recent distributions
              </p>
            )}
          </div>
        </Card>

        {/* Quick Actions */}
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4">
            <Button className="h-20 flex flex-col items-center justify-center">
              <span className="text-lg">📦</span>
              <span className="text-sm mt-1">Add Item</span>
            </Button>
            <Button variant="secondary" className="h-20 flex flex-col items-center justify-center">
              <span className="text-lg">📋</span>
              <span className="text-sm mt-1">New Request</span>
            </Button>
            <Button variant="secondary" className="h-20 flex flex-col items-center justify-center">
              <span className="text-lg">📊</span>
              <span className="text-sm mt-1">Reports</span>
            </Button>
            <Button variant="secondary" className="h-20 flex flex-col items-center justify-center">
              <span className="text-lg">⚠️</span>
              <span className="text-sm mt-1">Alerts</span>
            </Button>
          </div>
        </Card>
      </div>

      {/* Monthly Statistics */}
      {stats && (
        <Card className="p-6">
          <h3 className="text-lg font-medium mb-4">Monthly Statistics</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-semibold text-blue-600">
                {stats.distributions.thisMonth}
              </p>
              <p className="text-sm text-gray-600">Distributions This Month</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-semibold text-green-600">
                {stats.transactions.thisMonth}
              </p>
              <p className="text-sm text-gray-600">Transactions This Month</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-2xl font-semibold text-purple-600">
                {stats.inventory.outOfStockItems}
              </p>
              <p className="text-sm text-gray-600">Out of Stock Items</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

