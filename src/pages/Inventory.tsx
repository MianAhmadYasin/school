import { useEffect, useState } from 'react';
import { Plus, Package, AlertTriangle } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Table, TableRow, TableCell } from '../components/ui/Table';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';

type InventoryItem = Database['public']['Tables']['inventory_items']['Row'];

export function Inventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .order('name');

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error loading inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const lowStockItems = items.filter(
    (item) => item.quantity <= item.minimum_quantity
  );

  if (loading) {
    return <div>Loading inventory...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventory</h1>
          <p className="text-gray-600 mt-1">Manage stationery and supplies</p>
        </div>
        <Button>
          <Plus className="w-5 h-5 mr-2" />
          Add Item
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Items</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{items.length}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Low Stock</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {lowStockItems.length}
              </p>
            </div>
            <div className="bg-red-100 p-3 rounded-full">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Value</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                Rs. {items.reduce((sum, item) => sum + (item.unit_price || 0) * item.quantity, 0).toLocaleString()}
              </p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <Package className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </Card>
      </div>

      {lowStockItems.length > 0 && (
        <Card>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <p className="font-medium text-red-900">Low Stock Alert</p>
                <p className="text-sm text-red-700 mt-1">
                  {lowStockItems.length} items are running low on stock
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      <Card>
        <Table
          headers={[
            'Item Code',
            'Item Name',
            'Unit',
            'Current Stock',
            'Min Stock',
            'Unit Price',
            'Total Value',
            'Status',
          ]}
        >
          {items.length === 0 ? (
            <TableRow>
              <TableCell className="text-center" colSpan={8}>
                No inventory items found
              </TableCell>
            </TableRow>
          ) : (
            items.map((item) => {
              const isLowStock = item.quantity <= item.minimum_quantity;
              return (
                <TableRow key={item.id}>
                  <TableCell>{item.id}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>{item.minimum_quantity}</TableCell>
                  <TableCell>Rs. {item.unit_price.toLocaleString()}</TableCell>
                  <TableCell>
                    Rs. {(item.unit_price * item.quantity).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        isLowStock
                          ? 'bg-red-100 text-red-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {isLowStock ? 'Low Stock' : 'In Stock'}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </Table>
      </Card>
    </div>
  );
}
