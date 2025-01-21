import { createClient } from '@/utils/supabase/server'
import { Ticket, TicketRelationship, RelationshipType } from '@/types/tickets'

export async function getTicketRelationships(ticketId: string): Promise<TicketRelationship[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('ticket_relationships')
    .select('*')
    .or(`parent_ticket_id.eq.${ticketId},child_ticket_id.eq.${ticketId}`)

  if (error) throw error
  return data
}

export async function getRelatedTickets(ticketId: string): Promise<{
  parentTickets: Ticket[]
  childTickets: Ticket[]
}> {
  const supabase = await createClient()
  
  // Get parent tickets
  const { data: parentRelations, error: parentError } = await supabase
    .from('ticket_relationships')
    .select('parent_ticket_id')
    .eq('child_ticket_id', ticketId)

  if (parentError) throw parentError

  // Get child tickets
  const { data: childRelations, error: childError } = await supabase
    .from('ticket_relationships')
    .select('child_ticket_id')
    .eq('parent_ticket_id', ticketId)

  if (childError) throw childError

  // Get the actual ticket details
  const parentIds = parentRelations.map(r => r.parent_ticket_id)
  const childIds = childRelations.map(r => r.child_ticket_id)

  const { data: parentTickets, error: parentTicketsError } = await supabase
    .from('tickets')
    .select('*')
    .in('id', parentIds)

  if (parentTicketsError) throw parentTicketsError

  const { data: childTickets, error: childTicketsError } = await supabase
    .from('tickets')
    .select('*')
    .in('id', childIds)

  if (childTicketsError) throw childTicketsError

  return {
    parentTickets: parentTickets || [],
    childTickets: childTickets || []
  }
}

export async function createTicketRelationship(
  parentTicketId: string,
  childTicketId: string,
  relationshipType: RelationshipType,
  createdBy: string
): Promise<TicketRelationship> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('ticket_relationships')
    .insert({
      parent_ticket_id: parentTicketId,
      child_ticket_id: childTicketId,
      relationship_type: relationshipType,
      created_by: createdBy
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteTicketRelationship(
  parentTicketId: string,
  childTicketId: string
): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('ticket_relationships')
    .delete()
    .match({
      parent_ticket_id: parentTicketId,
      child_ticket_id: childTicketId
    })

  if (error) throw error
}

export async function mergeTickets(
  primaryTicketId: string,
  secondaryTicketId: string,
  createdBy: string
): Promise<void> {
  const supabase = await createClient()

  // Start a transaction
  const { error: relationshipError } = await supabase
    .from('ticket_relationships')
    .insert({
      parent_ticket_id: primaryTicketId,
      child_ticket_id: secondaryTicketId,
      relationship_type: 'merge',
      created_by: createdBy
    })

  if (relationshipError) throw relationshipError

  // Get current metadata
  const { data: currentTicket, error: getError } = await supabase
    .from('tickets')
    .select('metadata')
    .eq('id', secondaryTicketId)
    .single()

  if (getError) throw getError

  // Update the secondary ticket's status to indicate it's merged
  const { error: updateError } = await supabase
    .from('tickets')
    .update({
      status: 'closed',
      metadata: {
        ...(currentTicket?.metadata || {}),
        merged_into: primaryTicketId
      }
    })
    .eq('id', secondaryTicketId)

  if (updateError) throw updateError

  // Move all messages from secondary to primary ticket
  const { error: messagesError } = await supabase
    .from('ticket_messages')
    .update({ ticket_id: primaryTicketId })
    .eq('ticket_id', secondaryTicketId)

  if (messagesError) throw messagesError
} 