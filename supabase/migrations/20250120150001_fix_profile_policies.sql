-- Create helper functions for role checks
create or replace function is_admin(uid uuid)
returns boolean as $$
begin
  return exists (
    select 1 from profiles
    where id = uid
    and role = 'admin'
  );
end;
$$ language plpgsql security definer;

create or replace function is_agent(uid uuid)
returns boolean as $$
begin
  return exists (
    select 1 from profiles
    where id = uid
    and role = 'agent'
  );
end;
$$ language plpgsql security definer;

create or replace function is_agent_or_admin(uid uuid)
returns boolean as $$
begin
  return exists (
    select 1 from profiles
    where id = uid
    and role in ('admin', 'agent')
  );
end;
$$ language plpgsql security definer;

-- Drop existing policies that might cause recursion
drop policy if exists "Admins have full access to profiles" on profiles;
drop policy if exists "Tickets are viewable by authenticated users" on tickets;
drop policy if exists "Admins and agents can create tickets" on tickets;
drop policy if exists "Agents and admins can update tickets" on tickets;
drop policy if exists "Draft and archived articles viewable by agents and admins" on knowledge_base_articles;
drop policy if exists "Agents and admins can create and update articles" on knowledge_base_articles;
drop policy if exists "Admins have full access to tickets" on tickets;
drop policy if exists "Admins have full access to ticket_messages" on ticket_messages;
drop policy if exists "Admins have full access to knowledge_base_articles" on knowledge_base_articles;

-- Create new policies using helper functions
create policy "Admins have full access to profiles"
  on profiles
  to authenticated
  using (is_admin(auth.uid()))
  with check (is_admin(auth.uid()));

create policy "Tickets are viewable by authenticated users"
  on tickets for select
  to authenticated
  using (
    auth.uid() = created_by or  -- ticket creator
    auth.uid() = assigned_to or  -- assigned agent
    is_agent_or_admin(auth.uid())  -- admin or agent
  );

create policy "Admins and agents can create tickets"
  on tickets for insert
  to authenticated
  with check (
    is_agent_or_admin(auth.uid())
  );

create policy "Agents and admins can update tickets"
  on tickets for update
  to authenticated
  using (
    is_agent_or_admin(auth.uid())
  );

create policy "Draft and archived articles viewable by agents and admins"
  on knowledge_base_articles for select
  to authenticated
  using (
    is_agent_or_admin(auth.uid())
  );

create policy "Agents and admins can create and update articles"
  on knowledge_base_articles for insert
  to authenticated
  with check (
    is_agent_or_admin(auth.uid())
  );

create policy "Admins have full access to tickets"
  on tickets
  to authenticated
  using (is_admin(auth.uid()))
  with check (is_admin(auth.uid()));

create policy "Admins have full access to ticket_messages"
  on ticket_messages
  to authenticated
  using (is_admin(auth.uid()))
  with check (is_admin(auth.uid()));

create policy "Admins have full access to knowledge_base_articles"
  on knowledge_base_articles
  to authenticated
  using (is_admin(auth.uid()))
  with check (is_admin(auth.uid())); 