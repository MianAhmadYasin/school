import { supabase } from './supabase';
import type { Database } from './database.types';
import { getInventoryItems, createInventoryItem, updateInventoryItem, deleteInventoryItem } from './inventory';

type Tables = Database['public']['Tables'];
type InventoryItem = Tables['inventory_items']['Row'];
type InventoryTransaction = Tables['inventory_transactions']['Row'];
type StudentDistribution = Tables['student_distributions']['Row'];

export type InventoryItemWithDetails = InventoryItem & {
  category?: { category_name: string };
  transactions?: InventoryTransaction[];
  distributions?: StudentDistribution[];
};

export type ManagerStats = {
  inventory: {
    totalItems: number;
    lowStockItems: number;
    outOfStockItems: number;
    totalValue: number;
  };
  distributions: {
    totalDistributions: number;
    thisMonth: number;
    pendingRequests: number;
  };
  transactions: {
    totalTransactions: number;
    thisMonth: number;
    totalValue: number;
  };
};

export async function getManagerStats(): Promise<ManagerStats> {
  const currentDate = new Date();
  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString().split('T')[0];
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString().split('T')[0];

  // Get inventory stats
  const { data: inventoryItems } = await supabase
    .from('inventory_items')
    .select('quantity, minimum_quantity, unit_price');

  const inventoryStats = inventoryItems?.reduce((acc, item) => {
    acc.totalItems++;
    acc.totalValue += item.quantity * item.unit_price;
    if (item.quantity <= item.minimum_quantity) {
      acc.lowStockItems++;
    }
    if (item.quantity === 0) {
      acc.outOfStockItems++;
    }
    return acc;
  }, { totalItems: 0, lowStockItems: 0, outOfStockItems: 0, totalValue: 0 }) || { totalItems: 0, lowStockItems: 0, outOfStockItems: 0, totalValue: 0 };

  // Get distribution stats
  const [totalDistributions, monthlyDistributions, pendingRequests] = await Promise.all([
    supabase.from('student_distributions').select('id', { count: 'exact', head: true }),
    supabase.from('student_distributions').select('id', { count: 'exact', head: true }).gte('distribution_date', startOfMonth).lte('distribution_date', endOfMonth),
    supabase.from('stationery_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending')
  ]);

  // Get transaction stats
  const [totalTransactions, monthlyTransactions] = await Promise.all([
    supabase.from('inventory_transactions').select('id', { count: 'exact', head: true }),
    supabase.from('inventory_transactions').select('id', { count: 'exact', head: true }).gte('transaction_date', startOfMonth).lte('transaction_date', endOfMonth)
  ]);

  return {
    inventory: inventoryStats,
    distributions: {
      totalDistributions: totalDistributions.count || 0,
      thisMonth: monthlyDistributions.count || 0,
      pendingRequests: pendingRequests.count || 0
    },
    transactions: {
      totalTransactions: totalTransactions.count || 0,
      thisMonth: monthlyTransactions.count || 0,
      totalValue: inventoryStats.totalValue
    }
  };
}

export async function getInventoryTransactions(filters?: {
  itemId?: string;
  transactionType?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}) {
  let query = supabase
    .from('inventory_transactions')
    .select(`
      *,
      item:item_id(name, category),
      performed_by_user:performed_by(full_name)
    `)
    .order('transaction_date', { ascending: false });

  if (filters?.itemId) {
    query = query.eq('item_id', filters.itemId);
  }

  if (filters?.transactionType) {
    query = query.eq('transaction_type', filters.transactionType);
  }

  if (filters?.startDate) {
    query = query.gte('transaction_date', filters.startDate);
  }

  if (filters?.endDate) {
    query = query.lte('transaction_date', filters.endDate);
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
}

export async function createInventoryTransaction(transactionData: Tables['inventory_transactions']['Insert']) {
  const { data, error } = await supabase
    .from('inventory_transactions')
    .insert(transactionData)
    .select()
    .single();

  if (error) throw error;

  // Update item stock
  const item = await getInventoryItems().then(items => items.find(i => i.id === transactionData.item_id));
  if (item) {
    const newQuantity = transactionData.transaction_type === 'in' 
      ? item.quantity + transactionData.quantity
      : item.quantity - transactionData.quantity;

    await updateInventoryItem(transactionData.item_id, {
      quantity: Math.max(0, newQuantity),
      last_restocked: transactionData.transaction_type === 'in' ? new Date().toISOString() : undefined
    });
  }

  return data;
}

export async function getStudentDistributions(filters?: {
  studentId?: string;
  itemId?: string;
  startDate?: string;
  endDate?: string;
  academicYearId?: string;
}) {
  let query = supabase
    .from('student_distributions')
    .select(`
      *,
      student:student_id(first_name, last_name, admission_number),
      item:item_id(name, category),
      distributed_by_user:distributed_by(full_name)
    `)
    .order('distribution_date', { ascending: false });

  if (filters?.studentId) {
    query = query.eq('student_id', filters.studentId);
  }

  if (filters?.itemId) {
    query = query.eq('item_id', filters.itemId);
  }

  if (filters?.startDate) {
    query = query.gte('distribution_date', filters.startDate);
  }

  if (filters?.endDate) {
    query = query.lte('distribution_date', filters.endDate);
  }

  if (filters?.academicYearId) {
    query = query.eq('academic_year_id', filters.academicYearId);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
}

export async function createStudentDistribution(distributionData: Tables['student_distributions']['Insert']) {
  const { data, error } = await supabase
    .from('student_distributions')
    .insert(distributionData)
    .select()
    .single();

  if (error) throw error;

  // Update item stock
  const item = await getInventoryItems().then(items => items.find(i => i.id === distributionData.item_id));
  if (item) {
    const newQuantity = item.quantity - distributionData.quantity;
    await updateInventoryItem(distributionData.item_id, {
      quantity: Math.max(0, newQuantity)
    });

    // Create transaction record
    await createInventoryTransaction({
      item_id: distributionData.item_id,
      transaction_type: 'out',
      quantity: distributionData.quantity,
      transaction_date: distributionData.distribution_date,
      remarks: `Distributed to student: ${distributionData.student_id}`,
      performed_by: distributionData.distributed_by
    });
  }

  return data;
}

export async function getLowStockItems() {
  const { data, error } = await supabase
    .from('inventory_items')
    .select(`
      *,
      category:category_id(category_name)
    `)
    .lte('quantity', 'minimum_quantity')
    .order('quantity');

  if (error) throw error;
  return data;
}

export async function getStockAlerts() {
  const { data, error } = await supabase
    .from('stock_alerts')
    .select(`
      *,
      item:item_id(name, category)
    `)
    .eq('is_resolved', false)
    .order('alert_date', { ascending: false });

  if (error) throw error;
  return data;
}

export async function resolveStockAlert(alertId: string) {
  const { data, error } = await supabase
    .from('stock_alerts')
    .update({
      is_resolved: true,
      resolved_at: new Date().toISOString()
    })
    .eq('id', alertId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function createStockAlert(itemId: string) {
  const item = await getInventoryItems().then(items => items.find(i => i.id === itemId));
  if (!item) throw new Error('Item not found');

  const { data, error } = await supabase
    .from('stock_alerts')
    .insert({
      item_id: itemId,
      current_stock: item.quantity,
      minimum_stock: item.minimum_quantity
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getInventoryReports(filters?: {
  startDate?: string;
  endDate?: string;
  category?: string;
}) {
  const startDate = filters?.startDate || new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
  const endDate = filters?.endDate || new Date().toISOString().split('T')[0];

  // Get items with their transactions and distributions
  let query = supabase
    .from('inventory_items')
    .select(`
      *,
      category:category_id(category_name),
      transactions:inventory_transactions(*),
      distributions:student_distributions(*)
    `);

  if (filters?.category) {
    query = query.eq('category_id', filters.category);
  }

  const { data: items, error } = await query;

  if (error) throw error;

  // Filter transactions and distributions by date range
  const filteredItems = items?.map(item => ({
    ...item,
    transactions: item.transactions?.filter(t => 
      t.transaction_date >= startDate && t.transaction_date <= endDate
    ) || [],
    distributions: item.distributions?.filter(d => 
      d.distribution_date >= startDate && d.distribution_date <= endDate
    ) || []
  }));

  return filteredItems;
}

export async function getMonthlyInventoryReport(month: number, year: number) {
  const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
  const endDate = new Date(year, month, 0).toISOString().split('T')[0];

  return getInventoryReports({ startDate, endDate });
}

export async function exportInventoryData(format: 'csv' | 'excel' = 'csv') {
  const items = await getInventoryItems();
  
  if (format === 'csv') {
    const csvContent = [
      ['Name', 'Category', 'Quantity', 'Minimum Quantity', 'Unit Price', 'Location', 'Last Restocked'].join(','),
      ...items.map(item => [
        item.name,
        item.category,
        item.quantity,
        item.minimum_quantity,
        item.unit_price,
        item.location,
        item.last_restocked || 'Never'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `inventory_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return items;
}

export async function getManagerDashboardData() {
  const [stats, lowStockItems, recentTransactions, recentDistributions] = await Promise.all([
    getManagerStats(),
    getLowStockItems(),
    getInventoryTransactions({ limit: 10 }),
    getStudentDistributions({ limit: 10 })
  ]);

  return {
    stats,
    lowStockItems,
    recentTransactions,
    recentDistributions
  };
}

