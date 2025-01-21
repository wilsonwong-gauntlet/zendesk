import { Database } from './database.types'

export type TicketStatus = 'new' | 'open' | 'pending' | 'resolved' | 'closed'
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent'
export type RelationshipType = 'merge' | 'link' | 'duplicate'

export interface SLAPolicy {
  id: string
  name: string
  description: string | null
  first_response_hours: number
  resolution_hours: number
  business_hours: boolean
  priority: TicketPriority[]
  created_at: string
  updated_at: string
}

export interface TicketRelationship {
  id: string
  parent_ticket_id: string
  child_ticket_id: string
  relationship_type: RelationshipType
  created_by: string
  created_at: string
  parent?: Ticket
  child?: Ticket
}

export interface Ticket {
  id: string
  title: string
  description: string
  status: TicketStatus
  priority: TicketPriority
  created_by: string
  assigned_to: string | null
  metadata: Record<string, any>
  created_at: string
  updated_at: string
  // SLA fields
  sla_policy_id: string | null
  first_response_deadline: string | null
  resolution_deadline: string | null
  first_response_breach: boolean
  resolution_breach: boolean
  // Relationships (to be populated by join queries)
  relationships?: TicketRelationship[]
  child_relationships?: TicketRelationship[]
  parent_tickets?: Ticket[]
  child_tickets?: Ticket[]
}

export interface TicketWithRelations extends Ticket {
  relationships: TicketRelationship[]
  child_relationships: TicketRelationship[]
  parent_tickets: Ticket[]
  child_tickets: Ticket[]
}

export interface StatusTransition {
  from: TicketStatus
  to: TicketStatus
  requiresComment: boolean
  allowedRoles: ('admin' | 'agent' | 'customer')[]
}

export const STATUS_TRANSITIONS: StatusTransition[] = [
  // New tickets
  { from: 'new', to: 'open', requiresComment: false, allowedRoles: ['admin', 'agent'] },
  
  // Open tickets
  { from: 'open', to: 'pending', requiresComment: true, allowedRoles: ['admin', 'agent'] },
  { from: 'open', to: 'resolved', requiresComment: true, allowedRoles: ['admin', 'agent'] },
  
  // Pending tickets
  { from: 'pending', to: 'open', requiresComment: false, allowedRoles: ['admin', 'agent', 'customer'] },
  { from: 'pending', to: 'resolved', requiresComment: true, allowedRoles: ['admin', 'agent'] },
  
  // Resolved tickets
  { from: 'resolved', to: 'closed', requiresComment: false, allowedRoles: ['admin', 'agent'] },
  { from: 'resolved', to: 'open', requiresComment: true, allowedRoles: ['admin', 'agent', 'customer'] }, // Reopening
  
  // Closed tickets
  { from: 'closed', to: 'open', requiresComment: true, allowedRoles: ['admin']} // Only admins can reopen closed tickets
]

export const getAvailableStatusTransitions = (
  currentStatus: TicketStatus,
  userRole: 'admin' | 'agent' | 'customer'
): StatusTransition[] => {
  return STATUS_TRANSITIONS.filter(
    transition => 
      transition.from === currentStatus && 
      transition.allowedRoles.includes(userRole)
  )
}

export interface StatusChangeParams {
  ticketId: string
  newStatus: TicketStatus
  comment?: string
  userId: string
  userRole: 'admin' | 'agent' | 'customer'
}

export const validateStatusChange = (
  params: StatusChangeParams
): { valid: boolean; error?: string } => {
  const transition = STATUS_TRANSITIONS.find(
    t => t.from === params.newStatus
  )

  if (!transition) {
    return { 
      valid: false, 
      error: 'Invalid status transition' 
    }
  }

  if (!transition.allowedRoles.includes(params.userRole)) {
    return { 
      valid: false, 
      error: 'You do not have permission to make this status change' 
    }
  }

  if (transition.requiresComment && !params.comment) {
    return { 
      valid: false, 
      error: 'A comment is required for this status change' 
    }
  }

  return { valid: true }
} 