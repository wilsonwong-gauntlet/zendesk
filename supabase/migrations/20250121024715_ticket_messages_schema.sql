-- Create ticket_messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS ticket_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticket_id UUID NOT NULL,
    sender_id UUID NOT NULL,
    message TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Drop existing constraints if they exist
DO $$ BEGIN
    ALTER TABLE ticket_messages
        DROP CONSTRAINT IF EXISTS ticket_messages_ticket_id_fkey;
    ALTER TABLE ticket_messages
        DROP CONSTRAINT IF EXISTS ticket_messages_sender_id_fkey;
EXCEPTION
    WHEN undefined_table THEN
        NULL;
END $$;

-- Add foreign key constraints
ALTER TABLE ticket_messages
    ADD CONSTRAINT ticket_messages_ticket_id_fkey
    FOREIGN KEY (ticket_id)
    REFERENCES tickets(id)
    ON DELETE CASCADE;

ALTER TABLE ticket_messages
    ADD CONSTRAINT ticket_messages_sender_id_fkey
    FOREIGN KEY (sender_id)
    REFERENCES profiles(id)
    ON DELETE CASCADE;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket_id ON ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_sender_id ON ticket_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_created_at ON ticket_messages(created_at);

-- Add RLS (Row Level Security) policies
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert their own messages" ON ticket_messages;
DROP POLICY IF EXISTS "Users can view messages for tickets they have access to" ON ticket_messages;

-- Policy for inserting messages
CREATE POLICY "Users can insert their own messages"
    ON ticket_messages
    FOR INSERT
    WITH CHECK (
        auth.uid() = sender_id
    );

-- Policy for viewing messages
CREATE POLICY "Users can view messages for tickets they have access to"
    ON ticket_messages
    FOR SELECT
    USING (
        -- Admins and agents can see all messages
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'agent')
        )
        OR
        -- Customers can only see non-internal messages for their own tickets
        (
            NOT is_internal
            AND
            EXISTS (
                SELECT 1 FROM tickets
                WHERE tickets.id = ticket_messages.ticket_id
                AND tickets.created_by = auth.uid()
            )
        )
    );

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_ticket_messages_updated_at ON ticket_messages;
CREATE TRIGGER update_ticket_messages_updated_at
    BEFORE UPDATE ON ticket_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add function and trigger for creating initial message
CREATE OR REPLACE FUNCTION create_initial_ticket_message()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO ticket_messages (
        ticket_id,
        sender_id,
        message,
        is_internal
    ) VALUES (
        NEW.id,
        NEW.created_by,
        'Ticket created with status: ' || NEW.status || ' and priority: ' || NEW.priority,
        FALSE
    );
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS create_ticket_message ON tickets;
CREATE TRIGGER create_ticket_message
    AFTER INSERT ON tickets
    FOR EACH ROW
    EXECUTE FUNCTION create_initial_ticket_message();
