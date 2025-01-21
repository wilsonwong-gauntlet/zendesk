-- Drop existing publication if it exists
DROP PUBLICATION IF EXISTS ticket_messages_pub;

-- Create a new publication for ticket messages
CREATE PUBLICATION ticket_messages_pub FOR TABLE 
    ticket_messages,
    profiles;

-- Create a secure view that joins ticket_messages with sender information
CREATE OR REPLACE VIEW ticket_messages_with_sender AS
SELECT 
    tm.*,
    jsonb_build_object(
        'id', p.id,
        'full_name', p.full_name,
        'email', p.email,
        'role', p.role
    ) as sender
FROM 
    ticket_messages tm
    LEFT JOIN profiles p ON tm.sender_id = p.id
WHERE
    -- Admins and agents can see all messages
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'agent')
    )
    OR
    -- Customers can only see non-internal messages for their own tickets
    (
        NOT tm.is_internal
        AND
        EXISTS (
            SELECT 1 FROM tickets
            WHERE tickets.id = tm.ticket_id
            AND tickets.created_by = auth.uid()
        )
    );

-- Grant access to the view
GRANT SELECT ON ticket_messages_with_sender TO authenticated;
