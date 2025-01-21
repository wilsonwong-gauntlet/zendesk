-- Insert default SLA policies
insert into sla_policies (name, description, first_response_hours, resolution_hours, business_hours, priority)
values
  ('Urgent Priority', 'SLA policy for urgent tickets', 1, 4, true, array['urgent']),
  ('High Priority', 'SLA policy for high priority tickets', 4, 8, true, array['high']),
  ('Medium Priority', 'SLA policy for medium priority tickets', 8, 24, true, array['medium']),
  ('Low Priority', 'SLA policy for low priority tickets', 24, 72, true, array['low']);

-- Function to automatically assign SLA policy based on ticket priority
create or replace function assign_sla_policy()
returns trigger as $$
begin
  select id into NEW.sla_policy_id
  from sla_policies
  where NEW.priority = any(priority)
  limit 1;
  return NEW;
end;
$$ language plpgsql;

-- Create trigger to automatically assign SLA policy on ticket creation/update
create trigger assign_ticket_sla_policy
  before insert or update of priority
  on tickets
  for each row
  execute function assign_sla_policy(); 