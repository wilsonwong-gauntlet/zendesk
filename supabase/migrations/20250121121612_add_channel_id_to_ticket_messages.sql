-- Add channel_id column to ticket_messages if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ticket_messages' 
        AND column_name = 'channel_id'
    ) THEN
        ALTER TABLE ticket_messages ADD COLUMN channel_id UUID REFERENCES channels(id);
        CREATE INDEX idx_ticket_messages_channel_id ON ticket_messages(channel_id);
    END IF;
END $$;
