-- Add SLA related tables and fields
create table sla_policies (
    id uuid default uuid_generate_v4() primary key,
    name text not null,
    description text,
    first_response_hours int,
    resolution_hours int,
    business_hours boolean default true,
    priority text[] default array['low', 'medium', 'high', 'urgent'],
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add SLA fields to tickets table
alter table tickets add column sla_policy_id uuid references sla_policies(id);
alter table tickets add column first_response_deadline timestamp with time zone;
alter table tickets add column resolution_deadline timestamp with time zone;
alter table tickets add column first_response_breach boolean default false;
alter table tickets add column resolution_breach boolean default false;

-- Create ticket relationships table
create table ticket_relationships (
    id uuid default uuid_generate_v4() primary key,
    parent_ticket_id uuid references tickets(id) on delete cascade,
    child_ticket_id uuid references tickets(id) on delete cascade,
    relationship_type text check (relationship_type in ('merge', 'link', 'duplicate')),
    created_by uuid references profiles(id),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    constraint unique_relationship unique (parent_ticket_id, child_ticket_id)
);

-- Add RLS policies
alter table sla_policies enable row level security;
alter table ticket_relationships enable row level security;

-- SLA policies
create policy "SLA policies viewable by authenticated users"
    on sla_policies for select
    to authenticated
    using (true);

create policy "Admins can manage SLA policies"
    on sla_policies
    to authenticated
    using (
        exists (
            select 1 from profiles
            where profiles.id = auth.uid()
            and profiles.role = 'admin'
        )
    )
    with check (
        exists (
            select 1 from profiles
            where profiles.id = auth.uid()
            and profiles.role = 'admin'
        )
    );

-- Ticket relationships policies
create policy "Ticket relationships viewable by ticket participants"
    on ticket_relationships for select
    to authenticated
    using (
        exists (
            select 1 from tickets
            where (tickets.id = ticket_relationships.parent_ticket_id
                  or tickets.id = ticket_relationships.child_ticket_id)
            and (
                tickets.created_by = auth.uid() or
                tickets.assigned_to = auth.uid() or
                exists (
                    select 1 from profiles
                    where profiles.id = auth.uid()
                    and profiles.role in ('admin', 'agent')
                )
            )
        )
    );

create policy "Agents and admins can manage ticket relationships"
    on ticket_relationships
    to authenticated
    using (
        exists (
            select 1 from profiles
            where profiles.id = auth.uid()
            and profiles.role in ('admin', 'agent')
        )
    )
    with check (
        exists (
            select 1 from profiles
            where profiles.id = auth.uid()
            and profiles.role in ('admin', 'agent')
        )
    );

-- Create function to update SLA deadlines
create or replace function calculate_sla_deadlines()
returns trigger as $$
begin
    if NEW.sla_policy_id is not null then
        select
            now() + (first_response_hours || ' hours')::interval,
            now() + (resolution_hours || ' hours')::interval
        into NEW.first_response_deadline, NEW.resolution_deadline
        from sla_policies
        where id = NEW.sla_policy_id;
    end if;
    return NEW;
end;
$$ language plpgsql;

-- Create trigger for SLA deadline calculation
create trigger calculate_ticket_sla_deadlines
    before insert or update of sla_policy_id
    on tickets
    for each row
    execute function calculate_sla_deadlines();

-- Add updated_at trigger for sla_policies
create trigger update_sla_policies_updated_at
    before update on sla_policies
    for each row
    execute function update_updated_at_column(); 