'use client'

import TicketActions from '@/components/tickets/TicketActions'
import TicketMessages from '@/components/tickets/TicketMessages'

type TicketData = {
  id: string
  title: string
  description: string
  status: 'new' | 'open' | 'pending' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assigned_to: string | null
  created_at: string
  creator: {
    full_name: string | null
    email: string
  } | null
  assignee: {
    full_name: string | null
    email: string
  } | null
}

type TicketDetailViewProps = {
  ticket: TicketData
  userRole: 'admin' | 'agent' | 'customer' | null
}

export default function TicketDetailView({ ticket, userRole }: TicketDetailViewProps) {
  if (!ticket) {
    return <div>Ticket not found</div>
  }

  const creatorName = ticket.creator?.full_name || ticket.creator?.email || 'Unknown'

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
      <div className="space-y-6">
        {/* Ticket Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{ticket.title}</h1>
          <p className="mt-2 text-sm text-gray-500">
            Created by {creatorName} on{' '}
            {new Date(ticket.created_at).toLocaleString()}
          </p>
        </div>

        {/* Ticket Actions */}
        <TicketActions 
          ticket={ticket} 
          userRole={userRole} 
        />

        {/* Ticket Description */}
        <div className="prose max-w-none">
          <p>{ticket.description}</p>
        </div>

        {/* Ticket Messages */}
        <TicketMessages 
          ticketId={ticket.id} 
          userRole={userRole} 
        />
      </div>
    </div>
  )
} 