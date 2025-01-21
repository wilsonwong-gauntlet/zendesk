-- Create channels table
CREATE TABLE IF NOT EXISTS channels (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT CHECK (type IN ('email', 'chat', 'phone', 'web', 'api')) NOT NULL,
    config JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_channels_type ON channels(type);
CREATE INDEX IF NOT EXISTS idx_channels_is_active ON channels(is_active);
CREATE INDEX IF NOT EXISTS idx_channels_created_at ON channels(created_at);

-- Enable RLS
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;

-- Policies for channels
CREATE POLICY "Channels are viewable by authenticated users"
    ON channels FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Only admins can manage channels"
    ON channels
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Add trigger for updated_at
CREATE TRIGGER update_channels_updated_at
    BEFORE UPDATE ON channels
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant access to authenticated users
GRANT ALL ON channels TO authenticated;

-- Add to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE channels;
