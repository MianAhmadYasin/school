import React, { useState, useEffect } from 'react';
import { Card } from '../../../components/ui/Card';
import { Table, TableRow, TableCell } from '../../../components/ui/Table';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { useAuth } from '../../../contexts/AuthContext';
import {
  getInventoryItems,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  getStationeryRequests,
  createStationeryRequest,
  getInventoryStats,
  processStationeryRequest,
  type StationeryRequestWithDetails
} from '../../../lib/inventory';
import type { Database } from '../../../lib/database.types';

type Tables = Database['public']['Tables'];
type InventoryItem = Tables['inventory_items']['Row'];
type Category = Database['public']['Enums']['inventory_category'];
type RequestStatus = Database['public']['Enums']['request_status'];

type RequestItem = {
  itemId: string;
  quantity: number;
};

export function InventoryManagement() {
  const { hasPermission, user } = useAuth();
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [requests, setRequests] = useState<StationeryRequestWithDetails[]>([]);
  const [requestItems, setRequestItems] = useState<RequestItem[]>([{ itemId: '', quantity: 1 }]);
  const [stats, setStats] = useState<Database['public']['Functions']['get_inventory_stats']['Returns']>({
    total_items: 0,
    low_stock_items: 0,
    total_value: 0,
    pending_requests: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canManageInventory = hasPermission('manage_inventory');

  useEffect(() => {
    fetchInventoryData();
  }, []);

  const fetchInventoryData = async () => {
    try {
      setLoading(true);
      const [inventoryData, requestsData, statsData] = await Promise.all([
        getInventoryItems(),
        getStationeryRequests(),
        getInventoryStats()
      ]);
      setInventory(inventoryData);
      setRequests(requestsData);
      setStats(statsData);
    } catch (err) {
      setError('Failed to fetch inventory data');
      console.error('Error fetching inventory data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      setLoading(true);
      const itemData = {
        name: formData.get('name') as string,
        category: formData.get('category') as Category,
        quantity: parseInt(formData.get('quantity') as string),
        minimum_quantity: parseInt(formData.get('minimumQuantity') as string),
        unit_price: parseFloat(formData.get('unitPrice') as string),
        location: formData.get('location') as string,
      };

      await createInventoryItem(itemData);
      await fetchInventoryData();
      setIsAddItemModalOpen(false);
      setError(null);
    } catch (err) {
      setError('Failed to add item');
      console.error('Error adding item:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateItemStock = async (itemId: string) => {
    const newQuantity = prompt('Enter new quantity:');
    if (newQuantity === null) return;

    try {
      setLoading(true);
      await updateInventoryItem(itemId, { quantity: parseInt(newQuantity) });
      await fetchInventoryData();
      setError(null);
    } catch (err) {
      setError('Failed to update item stock');
      console.error('Error updating item stock:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      setLoading(true);
      await deleteInventoryItem(itemId);
      await fetchInventoryData();
      setError(null);
    } catch (err) {
      setError('Failed to delete item');
      console.error('Error deleting item:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRequest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      setLoading(true);
      const requestData = {
        department: formData.get('department') as string,
        remarks: formData.get('remarks') as string,
        items: requestItems.filter(item => item.itemId && item.quantity > 0)
      };

      await createStationeryRequest(requestData);
      await fetchInventoryData();
      setIsRequestModalOpen(false);
      setRequestItems([{ itemId: '', quantity: 1 }]);
      setError(null);
    } catch (err) {
      setError('Failed to submit request');
      console.error('Error submitting request:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProcessRequest = async (requestId: string, approved: boolean) => {
    try {
      setLoading(true);
      await processStationeryRequest(requestId, approved);
      await fetchInventoryData();
      setError(null);
    } catch (err) {
      setError('Failed to process request');
      console.error('Error processing request:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && inventory.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">
          Inventory Management
        </h1>
        {canManageInventory && (
          <div className="flex items-center gap-4">
            <Button onClick={() => setIsAddItemModalOpen(true)}>
              Add New Item
            </Button>
            <Button
              variant="secondary"
              onClick={() => setIsRequestModalOpen(true)}
            >
              New Request
            </Button>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-600">Total Items</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900">
            {stats.total_items}
          </p>
        </Card>
        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-600">Low Stock Items</h3>
          <p className="mt-2 text-3xl font-semibold text-red-600">
            {stats.low_stock_items}
          </p>
        </Card>
        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-600">Total Value</h3>
          <p className="mt-2 text-3xl font-semibold text-green-600">
            ${stats.total_value.toLocaleString()}
          </p>
        </Card>
        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-600">
            Pending Requests
          </h3>
          <p className="mt-2 text-3xl font-semibold text-yellow-600">
            {stats.pending_requests}
          </p>
        </Card>
      </div>

      {/* Inventory Items Table */}
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-medium mb-4">Inventory Items</h2>
          <div className="rounded-lg border bg-white">
            <Table
              headers={[
                'Name',
                'Category',
                'Quantity',
                'Unit Price',
                'Value',
                'Location',
                'Status',
                'Actions',
              ]}
            >
              {inventory.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>${item.unit_price.toLocaleString()}</TableCell>
                  <TableCell>
                    ${(item.quantity * item.unit_price).toLocaleString()}
                  </TableCell>
                  <TableCell>{item.location}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex rounded-full px-2 text-xs font-semibold ${
                        item.quantity > item.minimum_quantity
                          ? 'bg-green-100 text-green-800'
                          : item.quantity === 0
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {item.quantity === 0
                        ? 'Out of Stock'
                        : item.quantity <= item.minimum_quantity
                        ? 'Low Stock'
                        : 'In Stock'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {canManageInventory && (
                        <>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleUpdateItemStock(item.id)}
                          >
                            Update Stock
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteItem(item.id)}
                          >
                            Delete
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </Table>
          </div>
        </div>

        {/* Recent Requests Table */}
        <div>
          <h2 className="text-lg font-medium mb-4">Recent Requests</h2>
          <div className="rounded-lg border bg-white">
            <Table
              headers={[
                'Requester',
                'Department',
                'Items',
                'Request Date',
                'Status',
                'Actions',
              ]}
            >
              {requests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>
                    {request.requester?.first_name} {request.requester?.last_name}
                  </TableCell>
                  <TableCell>{request.department}</TableCell>
                  <TableCell>
                    {request.items
                      ?.map((item) => `${item.quantity}x ${item.item.name}`)
                      .join(', ')}
                  </TableCell>
                  <TableCell>{request.request_date}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex rounded-full px-2 text-xs font-semibold ${
                        request.status === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : request.status === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : request.status === 'completed'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {request.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {request.status === 'pending' && (
                        <>
                          <button 
                            onClick={() => handleProcessRequest(request.id, true)}
                            className="text-green-600 hover:text-green-800"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleProcessRequest(request.id, false)}
                            className="text-red-600 hover:text-red-800"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {request.status === 'approved' && (
                        <button className="text-blue-600 hover:text-blue-800">
                          Mark Complete
                        </button>
                      )}
                      <button className="text-blue-600 hover:text-blue-800">
                        Details
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </Table>
          </div>
        </div>
      </div>

      {/* Add Item Modal */}
      <Modal
        isOpen={isAddItemModalOpen}
        onClose={() => setIsAddItemModalOpen(false)}
        title="Add New Item"
      >
        <form onSubmit={handleAddItem} className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Item Name
              </label>
              <Input name="name" type="text" required />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Category
              </label>
              <select
                name="category"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Select Category</option>
                <option value="stationery">Stationery</option>
                <option value="books">Books</option>
                <option value="electronics">Electronics</option>
                <option value="furniture">Furniture</option>
                <option value="supplies">Supplies</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Quantity
              </label>
              <Input name="quantity" type="number" required min="0" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Minimum Quantity
              </label>
              <Input name="minimumQuantity" type="number" required min="0" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Unit Price
              </label>
              <Input
                name="unitPrice"
                type="number"
                required
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Location
              </label>
              <Input name="location" type="text" required />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsAddItemModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Item'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Request Modal */}
      <Modal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        title="New Stationery Request"
      >
        <form onSubmit={handleSubmitRequest} className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Department
            </label>
            <select
              name="department"
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Select Department</option>
              <option value="academic">Academic</option>
              <option value="administration">Administration</option>
              <option value="library">Library</option>
              <option value="laboratory">Laboratory</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Items
            </label>
            <div className="mt-2 space-y-2">
              {requestItems.map((reqItem, index) => (
                <div key={index} className="flex items-center gap-4">
                  <select
                    className="flex-1 rounded-md border-gray-300"
                    value={reqItem.itemId}
                    onChange={(e) => {
                      const newRequestItems = [...requestItems];
                      newRequestItems[index].itemId = e.target.value;
                      setRequestItems(newRequestItems);
                    }}
                  >
                    <option value="">Select Item</option>
                    {inventory.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} (Available: {item.quantity})
                      </option>
                    ))}
                  </select>
                  <Input
                    type="number"
                    placeholder="Quantity"
                    min="1"
                    className="w-24"
                    value={reqItem.quantity}
                    onChange={(e) => {
                      const newRequestItems = [...requestItems];
                      newRequestItems[index].quantity = parseInt(e.target.value);
                      setRequestItems(newRequestItems);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const newRequestItems = requestItems.filter((_, i) => i !== index);
                      setRequestItems(newRequestItems);
                    }}
                    className="text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setRequestItems([...requestItems, { itemId: '', quantity: 1 }])}
              className="mt-2 text-sm text-blue-600 hover:text-blue-800"
            >
              + Add Another Item
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Remarks
            </label>
            <textarea
              name="remarks"
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsRequestModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}