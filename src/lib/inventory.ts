import { supabase } from './supabase';
import type { Database } from './database.types';

type Tables = Database['public']['Tables'];
type InventoryItem = Tables['inventory_items']['Row'];
type StationeryRequest = Tables['stationery_requests']['Row'];
type RequestItem = Tables['request_items']['Row'];

export async function getInventoryItems() {
  const { data, error } = await supabase
    .from('inventory_items')
    .select('*')
    .order('name');

  if (error) throw error;
  return data;
}

export async function getInventoryItem(id: string) {
  const { data, error } = await supabase
    .from('inventory_items')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function createInventoryItem(item: Tables['inventory_items']['Insert']) {
  const { data, error } = await supabase
    .from('inventory_items')
    .insert(item)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateInventoryItem(id: string, item: Tables['inventory_items']['Update']) {
  const { data, error } = await supabase
    .from('inventory_items')
    .update(item)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteInventoryItem(id: string) {
  const { error } = await supabase
    .from('inventory_items')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export type StationeryRequestWithDetails = StationeryRequest & {
  requester: { id: string; email: string; first_name: string; last_name: string };
  items: (RequestItem & { item: InventoryItem })[];
};

export async function getStationeryRequests() {
  const { data, error } = await supabase
    .from('stationery_requests')
    .select(`
      *,
      requester:requester_id(id, email, first_name, last_name),
      items:request_items(
        *,
        item:item_id(*)
      )
    `)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as StationeryRequestWithDetails[];
}

export async function createStationeryRequest(
  request: Tables['stationery_requests']['Insert'],
  items: Tables['request_items']['Insert'][]
) {
  const { data: requestData, error: requestError } = await supabase
    .from('stationery_requests')
    .insert(request)
    .select()
    .single();

  if (requestError) throw requestError;

  const requestItems = items.map(item => ({
    ...item,
    request_id: requestData.id
  }));

  const { error: itemsError } = await supabase
    .from('request_items')
    .insert(requestItems);

  if (itemsError) throw itemsError;

  return requestData;
}

export async function updateStationeryRequestStatus(
  id: string,
  status: Tables['stationery_requests']['Row']['status'],
  approval_date?: string
) {
  const { data, error } = await supabase
    .from('stationery_requests')
    .update({ status, approval_date })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getLowStockItems(threshold?: number) {
  const query = supabase
    .from('inventory_items')
    .select('*')
    .order('quantity');

  if (threshold !== undefined) {
    query.lte('quantity', threshold);
  } else {
    query.lte('quantity', 'minimum_quantity');
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
}

export async function getInventoryStats() {
  const { data, error } = await supabase
    .rpc('get_inventory_stats');

  if (error) throw error;
  return data;
}

export async function processStationeryRequest(requestId: string, approved: boolean) {
  if (!approved) {
    return updateStationeryRequestStatus(requestId, 'rejected');
  }

  // Start a transaction to update stock levels and request status
  const { error: updateError } = await supabase
    .rpc('process_stationery_request', {
      p_request_id: requestId
    });

  if (updateError) throw updateError;

  return getStationeryRequests();
}