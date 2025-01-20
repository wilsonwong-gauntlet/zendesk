-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create profiles table
create table profiles (
  id uuid references auth.users primary key,
  full_name text,
  role text check (role in ('admin', 'agent', 'customer')),
  email text unique not null,
  phone_number text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create tickets table
create table tickets (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  description text not null,
  status text check (status in ('new', 'open', 'pending', 'resolved', 'closed')) default 'new',
  priority text check (priority in ('low', 'medium', 'high', 'urgent')) default 'medium',
  created_by uuid references profiles(id) not null,
  assigned_to uuid references profiles(id),
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create ticket_messages table
create table ticket_messages (
  id uuid default uuid_generate_v4() primary key,
  ticket_id uuid references tickets(id) on delete cascade not null,
  sender_id uuid references profiles(id) not null,
  message text not null,
  is_internal boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create knowledge_base_articles table
create table knowledge_base_articles (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  content text not null,
  status text check (status in ('draft', 'published', 'archived')) default 'draft',
  author_id uuid references profiles(id) not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS)
-- Enable RLS on all tables
alter table profiles enable row level security;
alter table tickets enable row level security;
alter table ticket_messages enable row level security;
alter table knowledge_base_articles enable row level security;

-- Profiles policies
create policy "Profiles are viewable by authenticated users"
  on profiles for select
  to authenticated
  using (true);

create policy "Users can update their own profile"
  on profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Tickets policies
create policy "Tickets are viewable by authenticated users"
  on tickets for select
  to authenticated
  using (
    auth.uid() = created_by or  -- ticket creator
    auth.uid() = assigned_to or  -- assigned agent
    exists (                     -- admin or agent
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role in ('admin', 'agent')
    )
  );

create policy "Admins and agents can create tickets"
  on tickets for insert
  to authenticated
  with check (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role in ('admin', 'agent')
    )
  );

create policy "Customers can create tickets"
  on tickets for insert
  to authenticated
  with check (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'customer'
    )
  );

create policy "Agents and admins can update tickets"
  on tickets for update
  to authenticated
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role in ('admin', 'agent')
    )
  );

-- Ticket messages policies
create policy "Messages are viewable by ticket participants"
  on ticket_messages for select
  to authenticated
  using (
    exists (
      select 1 from tickets
      where tickets.id = ticket_messages.ticket_id
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

create policy "Authenticated users can create messages"
  on ticket_messages for insert
  to authenticated
  with check (
    exists (
      select 1 from tickets
      where tickets.id = ticket_messages.ticket_id
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

-- Knowledge base articles policies
create policy "Published articles are viewable by everyone"
  on knowledge_base_articles for select
  using (status = 'published');

create policy "Draft and archived articles viewable by agents and admins"
  on knowledge_base_articles for select
  to authenticated
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role in ('admin', 'agent')
    )
  );

create policy "Agents and admins can create and update articles"
  on knowledge_base_articles for insert
  to authenticated
  with check (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role in ('admin', 'agent')
    )
  );

-- Add admin bypass policies for all tables
create policy "Admins have full access to profiles"
  on profiles
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

create policy "Admins have full access to tickets"
  on tickets
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

create policy "Admins have full access to ticket_messages"
  on ticket_messages
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

create policy "Admins have full access to knowledge_base_articles"
  on knowledge_base_articles
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

-- Create triggers for updated_at timestamps
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

create trigger update_profiles_updated_at
  before update on profiles
  for each row
  execute function update_updated_at_column();

create trigger update_tickets_updated_at
  before update on tickets
  for each row
  execute function update_updated_at_column();

create trigger update_knowledge_base_articles_updated_at
  before update on knowledge_base_articles
  for each row
  execute function update_updated_at_column(); 