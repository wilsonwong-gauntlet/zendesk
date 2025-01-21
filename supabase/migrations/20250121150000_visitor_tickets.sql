-- Make created_by nullable in tickets table
ALTER TABLE tickets ALTER COLUMN created_by DROP NOT NULL;

-- Make sender_id nullable in ticket_messages table
ALTER TABLE ticket_messages ALTER COLUMN sender_id DROP NOT NULL;

-- Add metadata column to ticket_messages table
ALTER TABLE ticket_messages ADD COLUMN metadata jsonb DEFAULT '{}'::jsonb;

-- Add policy for visitor tickets
CREATE POLICY "Allow visitor ticket creation"
  ON tickets FOR INSERT
  WITH CHECK (
    metadata->>'is_visitor' = 'true'
  );

-- Add policy for visitor messages
CREATE POLICY "Allow visitor messages"
  ON ticket_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tickets
      WHERE tickets.id = ticket_messages.ticket_id
      AND tickets.metadata->>'is_visitor' = 'true'
    )
  ); 