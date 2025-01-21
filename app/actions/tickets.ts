'use server'

import { createClient } from '@/utils/supabase/server'
import { RelationshipType } from '@/types/tickets'

export async function createRelationship(
  parentTicketId: string,
  childTicketId: string,
  relationshipType: RelationshipType,
  createdBy: string
) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('ticket_relationships')
    .insert({
      parent_ticket_id: parentTicketId,
      child_ticket_id: childTicketId,
      relationship_type: relationshipType,
      created_by: createdBy
    })

  if (error) throw error
}

export async function deleteRelationship(
  parentTicketId: string,
  childTicketId: string
) {
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
) {
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