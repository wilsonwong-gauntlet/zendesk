import type { Database } from './database.types'

export type TicketStatus = Database['public']['Tables']['tickets']['Row']['status']
export type TicketPriority = Database['public']['Tables']['tickets']['Row']['priority']

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