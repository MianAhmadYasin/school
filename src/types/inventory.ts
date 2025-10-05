export type InventoryItem = {
  id: string;
  name: string;
  category: string;
  quantity: number;
  minimum_quantity: number;
  unit_price: number;
  location: string;
  last_restocked: string;
  created_at: string;
  updated_at: string;
};

export type StationeryRequest = {
  id: string;
  requester_id: string;
  department: string;
  items: RequestItem[];
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  request_date: string;
  approval_date: string | null;
  remarks: string | null;
  created_at: string;
  updated_at: string;
};

export type RequestItem = {
  id: string;
  request_id: string;
  item_id: string;
  quantity: number;
  created_at: string;
  updated_at: string;
};