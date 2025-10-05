-- Create function to get inventory statistics
create or replace function get_inventory_stats()
returns table (
  total_items bigint,
  low_stock_items bigint,
  total_value numeric,
  pending_requests bigint
) as $$
begin
  return query
  select
    (select count(*) from inventory_items) as total_items,
    (select count(*) 
     from inventory_items 
     where quantity <= minimum_quantity) as low_stock_items,
    (select coalesce(sum(quantity * unit_price), 0) 
     from inventory_items) as total_value,
    (select count(*) 
     from stationery_requests 
     where status = 'pending') as pending_requests;
end;
$$ language plpgsql security definer;

-- Create function to process stationery request (approve and update stock)
create or replace function process_stationery_request(p_request_id uuid)
returns void as $$
declare
  v_item_id uuid;
  v_quantity integer;
  v_current_stock integer;
  v_request_status text;
begin
  -- Check if request exists and is pending
  select status into v_request_status
  from stationery_requests
  where id = p_request_id;

  if not found then
    raise exception 'Request not found';
  end if;

  if v_request_status != 'pending' then
    raise exception 'Request is not in pending status';
  end if;

  -- Start transaction
  begin
    -- Loop through each requested item
    for v_item_id, v_quantity in
      select item_id, quantity
      from request_items
      where request_id = p_request_id
    loop
      -- Check if enough stock is available
      select quantity into v_current_stock
      from inventory_items
      where id = v_item_id
      for update;

      if v_current_stock < v_quantity then
        raise exception 'Insufficient stock for item %', v_item_id;
      end if;

      -- Update inventory
      update inventory_items
      set 
        quantity = quantity - v_quantity,
        updated_at = now()
      where id = v_item_id;
    end loop;

    -- Update request status
    update stationery_requests
    set 
      status = 'approved',
      approval_date = now(),
      updated_at = now()
    where id = p_request_id;

    -- Commit transaction
    commit;
  exception
    when others then
      -- Rollback transaction on any error
      rollback;
      raise;
  end;
end;
$$ language plpgsql security definer;