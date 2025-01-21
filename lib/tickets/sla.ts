import { createClient } from '@/utils/supabase/server'
import { SLAPolicy, Ticket, TicketPriority } from '@/types/tickets'

export async function getSLAPolicies(): Promise<SLAPolicy[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('sla_policies')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function createSLAPolicy(policy: Omit<SLAPolicy, 'id' | 'created_at' | 'updated_at'>) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('sla_policies')
    .insert(policy)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateSLAPolicy(
  id: string,
  updates: Partial<Omit<SLAPolicy, 'id' | 'created_at' | 'updated_at'>>
) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('sla_policies')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteSLAPolicy(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('sla_policies')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function assignSLAPolicy(ticketId: string, policyId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tickets')
    .update({ sla_policy_id: policyId })
    .eq('id', ticketId)
    .select()
    .single()

  if (error) throw error
  return data
}

export function calculateSLAStatus(ticket: Ticket) {
  const now = new Date()
  const firstResponseDeadline = ticket.first_response_deadline ? new Date(ticket.first_response_deadline) : null
  const resolutionDeadline = ticket.resolution_deadline ? new Date(ticket.resolution_deadline) : null

  return {
    firstResponse: {
      breached: ticket.first_response_breach,
      deadline: firstResponseDeadline,
      remaining: firstResponseDeadline ? firstResponseDeadline.getTime() - now.getTime() : null
    },
    resolution: {
      breached: ticket.resolution_breach,
      deadline: resolutionDeadline,
      remaining: resolutionDeadline ? resolutionDeadline.getTime() - now.getTime() : null
    }
  }
}

export function getDefaultSLAPolicy(priority: TicketPriority): Partial<SLAPolicy> {
  const policies: Record<TicketPriority, { first_response_hours: number; resolution_hours: number }> = {
    urgent: { first_response_hours: 1, resolution_hours: 4 },
    high: { first_response_hours: 4, resolution_hours: 8 },
    medium: { first_response_hours: 8, resolution_hours: 24 },
    low: { first_response_hours: 24, resolution_hours: 48 }
  }

  return {
    name: `Default ${priority} priority policy`,
    description: `Default SLA policy for ${priority} priority tickets`,
    ...policies[priority],
    business_hours: true,
    priority: [priority]
  }
} 