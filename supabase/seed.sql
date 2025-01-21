-- Create extension if not exists
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Seed admin user
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  aud,
  role
)
VALUES (
  'd7bed82c-89ac-4d93-96e1-fb5589c3ed65',
  '00000000-0000-0000-0000-000000000000',
  'admin@example.com',
  crypt('admin123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  '{"full_name": "Admin User"}'::jsonb,
  'authenticated',
  'authenticated'
);

-- Update admin role
UPDATE profiles 
SET role = 'admin'
WHERE id = 'd7bed82c-89ac-4d93-96e1-fb5589c3ed65';

-- Seed agent users
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  aud,
  role
)
VALUES
(
  'b5a2c24e-1f6e-4401-b4c3-a1e0f5c48e19',
  '00000000-0000-0000-0000-000000000000',
  'agent1@example.com',
  crypt('agent123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  '{"full_name": "Sarah Johnson"}'::jsonb,
  'authenticated',
  'authenticated'
),
(
  'c12e12f9-02a8-4f59-9e3b-ea3bf9d2f632',
  '00000000-0000-0000-0000-000000000000',
  'agent2@example.com',
  crypt('agent123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  '{"full_name": "Michael Chen"}'::jsonb,
  'authenticated',
  'authenticated'
);

-- Update agent roles
UPDATE profiles 
SET role = 'agent'
WHERE id IN (
  'b5a2c24e-1f6e-4401-b4c3-a1e0f5c48e19',
  'c12e12f9-02a8-4f59-9e3b-ea3bf9d2f632'
);

-- Seed customer users
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  aud,
  role
)
VALUES
(
  'e9d2c6f4-1234-5678-90ab-cdef01234567',
  '00000000-0000-0000-0000-000000000000',
  'customer1@example.com',
  crypt('customer123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  '{"full_name": "John Smith"}'::jsonb,
  'authenticated',
  'authenticated'
),
(
  'f8c3b7a2-9876-5432-10fe-dcba09876543',
  '00000000-0000-0000-0000-000000000000',
  'customer2@example.com',
  crypt('customer123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  '{"full_name": "Emma Wilson"}'::jsonb,
  'authenticated',
  'authenticated'
);

-- Seed chat channels
INSERT INTO channels (id, name, type, is_active, config)
VALUES
  (
    'd5e6f7a8-b9c0-4d1e-8f2a-3b4c5d6e7f89',
    'Default Chat',
    'chat',
    true,
    '{
      "widget_settings": {
        "title": "Live Chat"
      },
      "operating_hours": {
        "timezone": "UTC"
      }
    }'
  ),
  (
    '37e6b40e-b27b-4a5e-8c2f-661c6c7678d9',
    'General Support',
    'chat',
    true,
    '{
      "widget_settings": {
        "title": "Chat with us"
      }
    }'
  ),
  (
    'f4d2f41e-b45e-4172-a4d9-7da45b5a7999',
    'Business Hours Support',
    'chat',
    true,
    '{
      "widget_settings": {
        "title": "Business Hours Support"
      },
      "operating_hours": {
        "timezone": "America/New_York",
        "schedule": {
          "monday": {"start": "09:00", "end": "17:00"},
          "tuesday": {"start": "09:00", "end": "17:00"},
          "wednesday": {"start": "09:00", "end": "17:00"},
          "thursday": {"start": "09:00", "end": "17:00"},
          "friday": {"start": "09:00", "end": "17:00"}
        }
      },
      "offline_message": "We are currently offline. Please leave a message and we will get back to you during business hours."
    }'
  ),
  (
    'c3a9b6d2-e5f8-4c1a-b8d7-9e2f3c4b5a6d',
    'Maintenance Channel',
    'chat',
    false,
    '{
      "widget_settings": {
        "title": "Maintenance"
      }
    }'
  );

-- Seed tickets from authenticated customers
INSERT INTO tickets (id, title, description, status, priority, created_by, assigned_to, metadata, created_at)
VALUES
  (
    'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
    'Cannot access my account',
    'I am unable to log in to my account since yesterday.',
    'new',
    'high',
    'e9d2c6f4-1234-5678-90ab-cdef01234567',
    null,
    '{}',
    NOW() - INTERVAL '2 hours'
  ),
  (
    'b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e',
    'Feature request: Dark mode',
    'Would love to see a dark mode option.',
    'open',
    'low',
    'f8c3b7a2-9876-5432-10fe-dcba09876543',
    'b5a2c24e-1f6e-4401-b4c3-a1e0f5c48e19',
    '{}',
    NOW() - INTERVAL '1 day'
  ),
  (
    'c3d4e5f6-a7b8-6c7d-0e1f-2a3b4c5d6e7f',
    'Integration with third-party service',
    'Need help setting up the integration.',
    'pending',
    'medium',
    'e9d2c6f4-1234-5678-90ab-cdef01234567',
    'c12e12f9-02a8-4f59-9e3b-ea3bf9d2f632',
    '{}',
    NOW() - INTERVAL '3 days'
  );

-- Seed visitor tickets (from chat)
INSERT INTO tickets (id, title, description, status, priority, created_by, assigned_to, metadata, created_at)
VALUES
  (
    'd4e5f6a7-b8c9-7d8e-1f2a-3b4c5d6e7f89',
    'Chat with Alice Brown',
    'I need help with my recent purchase',
    'new',
    'medium',
    null,
    null,
    '{
      "is_visitor": true,
      "channel_type": "chat",
      "visitor_name": "Alice Brown",
      "visitor_email": "alice@example.com"
    }',
    NOW() - INTERVAL '30 minutes'
  ),
  (
    'e5f6a7b8-c9d0-8e9f-2a3b-4c5d6e7f8a9b',
    'Chat with Bob Green',
    'Question about product compatibility',
    'open',
    'medium',
    null,
    'b5a2c24e-1f6e-4401-b4c3-a1e0f5c48e19',
    '{
      "is_visitor": true,
      "channel_type": "chat",
      "visitor_name": "Bob Green",
      "visitor_email": "bob@example.com"
    }',
    NOW() - INTERVAL '45 minutes'
  );

-- Seed ticket messages for authenticated customer tickets
INSERT INTO ticket_messages (ticket_id, sender_id, message, is_internal, channel_id, metadata, created_at)
VALUES
  (
    'b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e',
    'f8c3b7a2-9876-5432-10fe-dcba09876543',
    'Would it be possible to add a dark mode option? It would really help reduce eye strain.',
    false,
    null,
    '{}',
    NOW() - INTERVAL '1 day'
  ),
  (
    'b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e',
    'b5a2c24e-1f6e-4401-b4c3-a1e0f5c48e19',
    'Thanks for the suggestion! We are actually working on this feature.',
    false,
    null,
    '{}',
    NOW() - INTERVAL '23 hours'
  ),
  (
    'b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e',
    'b5a2c24e-1f6e-4401-b4c3-a1e0f5c48e19',
    'Internal note: Design team is already working on this.',
    true,
    null,
    '{}',
    NOW() - INTERVAL '23 hours'
  );

-- Seed ticket messages for visitor chat tickets
INSERT INTO ticket_messages (ticket_id, sender_id, message, is_internal, channel_id, metadata, created_at)
VALUES
  (
    'e5f6a7b8-c9d0-8e9f-2a3b-4c5d6e7f8a9b',
    null,
    'Hi, I want to know if your product works with Windows 11?',
    false,
    '37e6b40e-b27b-4a5e-8c2f-661c6c7678d9',
    '{
      "sender_type": "visitor",
      "visitor_name": "Bob Green",
      "visitor_email": "bob@example.com"
    }',
    NOW() - INTERVAL '45 minutes'
  ),
  (
    'e5f6a7b8-c9d0-8e9f-2a3b-4c5d6e7f8a9b',
    'b5a2c24e-1f6e-4401-b4c3-a1e0f5c48e19',
    'Hello Bob! Yes, our product is fully compatible with Windows 11.',
    false,
    '37e6b40e-b27b-4a5e-8c2f-661c6c7678d9',
    '{
      "sender_type": "agent"
    }',
    NOW() - INTERVAL '43 minutes'
  ),
  (
    'e5f6a7b8-c9d0-8e9f-2a3b-4c5d6e7f8a9b',
    null,
    'Great, thank you! One more question - does it require any special permissions?',
    false,
    '37e6b40e-b27b-4a5e-8c2f-661c6c7678d9',
    '{
      "sender_type": "visitor",
      "visitor_name": "Bob Green",
      "visitor_email": "bob@example.com"
    }',
    NOW() - INTERVAL '42 minutes'
  ); 