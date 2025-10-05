create type inventory_category as enum (
  'stationery',
  'books',
  'electronics',
  'furniture',
  'supplies'
);

create type request_status as enum (
  'pending',
  'approved',
  'rejected',
  'completed'
);

create table inventory_items (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  category inventory_category not null,
  quantity integer not null default 0,
  minimum_quantity integer not null default 0,
  unit_price decimal(10,2) not null default 0.00,
  location text not null,
  last_restocked timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table stationery_requests (
  id uuid primary key default uuid_generate_v4(),
  requester_id uuid not null references auth.users(id),
  department text not null,
  status request_status not null default 'pending',
  request_date timestamp with time zone default now(),
  approval_date timestamp with time zone,
  remarks text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table request_items (
  id uuid primary key default uuid_generate_v4(),
  request_id uuid not null references stationery_requests(id),
  item_id uuid not null references inventory_items(id),
  quantity integer not null default 1,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Add indexes for performance
create index idx_inventory_items_category on inventory_items(category);
create index idx_inventory_items_last_restocked on inventory_items(last_restocked);
create index idx_stationery_requests_status on stationery_requests(status);
create index idx_stationery_requests_requester on stationery_requests(requester_id);
create index idx_request_items_request on request_items(request_id);
create index idx_request_items_item on request_items(item_id);

-- Add triggers to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = current_timestamp;
  return new;
end;
$$ language plpgsql;

create trigger update_inventory_items_updated_at
  before update on inventory_items
  for each row
  execute procedure update_updated_at_column();

create trigger update_stationery_requests_updated_at
  before update on stationery_requests
  for each row
  execute procedure update_updated_at_column();

create trigger update_request_items_updated_at
  before update on request_items
  for each row
  execute procedure update_updated_at_column();

-- Create RLS policies
alter table inventory_items enable row level security;
alter table stationery_requests enable row level security;
alter table request_items enable row level security;

-- Inventory items policies
create policy "Anyone can view inventory items"
  on inventory_items for select
  using (true);

create policy "Only administrators can manage inventory items"
  on inventory_items for insert update delete
  using (exists (
    select 1 from auth.users
    where auth.users.id = auth.uid()
    and auth.users.role = 'admin'
  ));

-- Stationery requests policies
create policy "Users can view their own requests"
  on stationery_requests for select
  using (auth.uid() = requester_id);

create policy "Administrators can view all requests"
  on stationery_requests for select
  using (exists (
    select 1 from auth.users
    where auth.users.id = auth.uid()
    and auth.users.role = 'admin'
  ));

create policy "Users can create their own requests"
  on stationery_requests for insert
  with check (auth.uid() = requester_id);

create policy "Only administrators can approve/reject requests"
  on stationery_requests for update
  using (exists (
    select 1 from auth.users
    where auth.users.id = auth.uid()
    and auth.users.role = 'admin'
  ));

-- Request items policies
create policy "Users can view their own request items"
  on request_items for select
  using (exists (
    select 1 from stationery_requests
    where stationery_requests.id = request_items.request_id
    and stationery_requests.requester_id = auth.uid()
  ));

create policy "Administrators can view all request items"
  on request_items for select
  using (exists (
    select 1 from auth.users
    where auth.users.id = auth.uid()
    and auth.users.role = 'admin'
  ));

create policy "Users can create their own request items"
  on request_items for insert
  with check (exists (
    select 1 from stationery_requests
    where stationery_requests.id = request_items.request_id
    and stationery_requests.requester_id = auth.uid()
  ));

create policy "Only administrators can update request items"
  on request_items for update
  using (exists (
    select 1 from auth.users
    where auth.users.id = auth.uid()
    and auth.users.role = 'admin'
  ));