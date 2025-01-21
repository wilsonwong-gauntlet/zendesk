import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import StatusBadge from '@/components/tickets/StatusBadge'
import PriorityBadge from '@/components/tickets/PriorityBadge'
import TicketActions from '@/components/tickets/TicketActions'
import TicketMessages from '@/components/tickets/TicketMessages'
import { SLABadge } from '@/components/tickets/SLABadge'
import { TicketRelationshipsWrapper } from '@/components/tickets/TicketRelationshipsWrapper'
import { Ticket, TicketRelationship, TicketWithRelations } from '@/types/tickets'

export default async function TicketPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  // Get ticket with creator, assignee profiles, and relationships
  const { data: ticket, error } = await supabase
    .from('tickets')
    .select(`
      *,
      creator:profiles!tickets_created_by_fkey(id, full_name, email, role),
      assignee:profiles!tickets_assigned_to_fkey(id, full_name, email, role),
      relationships:ticket_relationships!ticket_relationships_parent_ticket_id_fkey(
        id,
        child_ticket_id,
        relationship_type,
        created_by,
        created_at,
        child:tickets!ticket_relationships_child_ticket_id_fkey(id, title, status, metadata)
      ),
      child_relationships:ticket_relationships!ticket_relationships_child_ticket_id_fkey(
        id,
        parent_ticket_id,
        relationship_type,
        created_by,
        created_at,
        parent:tickets!ticket_relationships_parent_ticket_id_fkey(id, title, status, metadata)
      )
    `)
    .eq('id', params.id)
    .single()

  if (error || !ticket) {
    console.error('Error fetching ticket:', error)
    notFound()
  }

  // Get current user's role
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    notFound()
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const userRole = profile?.role
  
  // Check if this is a visitor ticket
  const isVisitorTicket = ticket.metadata?.is_visitor === true
  const visitorName = ticket.metadata?.visitor_name
  const visitorEmail = ticket.metadata?.visitor_email

  // Transform relationships into parent/child tickets
  const typedTicket = ticket as TicketWithRelations
  const parentTickets = typedTicket.child_relationships
    ?.filter((r: TicketRelationship) => r.relationship_type !== 'merge')
    .map((r: TicketRelationship) => r.parent)
  const childTickets = typedTicket.relationships
    ?.filter((r: TicketRelationship) => r.relationship_type !== 'merge')
    .map((r: TicketRelationship) => r.child)

  const transformedTicket = {
    ...typedTicket,
    parent_tickets: parentTickets?.filter((t: Ticket | undefined): t is Ticket => t !== undefined) || [],
    child_tickets: childTickets?.filter((t: Ticket | undefined): t is Ticket => t !== undefined) || []
  }

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-4 sm:px-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Ticket #{ticket.id.split('-')[0]}</h1>
            <div className="mt-2 flex gap-2">
              {ticket.sla_policy_id && (
                <>
                  <SLABadge ticket={transformedTicket} type="first_response" />
                  <SLABadge ticket={transformedTicket} type="resolution" />
                </>
              )}
            </div>
          </div>
          <TicketActions ticket={transformedTicket} userRole={userRole} />
        </div>

        <div className="mt-6 border-t border-gray-100">
          <dl className="divide-y divide-gray-100">
            <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
              <dt className="text-sm font-medium leading-6 text-gray-900">Title</dt>
              <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                {ticket.title}
              </dd>
            </div>

            <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
              <dt className="text-sm font-medium leading-6 text-gray-900">Status</dt>
              <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                <StatusBadge status={ticket.status} />
              </dd>
            </div>

            <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
              <dt className="text-sm font-medium leading-6 text-gray-900">Priority</dt>
              <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                <PriorityBadge priority={ticket.priority} />
              </dd>
            </div>

            <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
              <dt className="text-sm font-medium leading-6 text-gray-900">Created By</dt>
              <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                {isVisitorTicket ? (
                  <span>
                    {visitorName} ({visitorEmail})
                    <span className="ml-2 inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                      Visitor
                    </span>
                  </span>
                ) : (
                  ticket.creator?.full_name || ticket.creator?.email
                )}
              </dd>
            </div>

            {ticket.assignee && (
              <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
                <dt className="text-sm font-medium leading-6 text-gray-900">Assigned To</dt>
                <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                  {ticket.assignee.full_name || ticket.assignee.email}
                </dd>
              </div>
            )}

            <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
              <dt className="text-sm font-medium leading-6 text-gray-900">Description</dt>
              <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                {ticket.description}
              </dd>
            </div>

            <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
              <dt className="text-sm font-medium leading-6 text-gray-900">Created At</dt>
              <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                {new Date(ticket.created_at).toLocaleString()}
              </dd>
            </div>

            <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
              <dt className="text-sm font-medium leading-6 text-gray-900">Last Updated</dt>
              <dd className="mt-1 text-sm leading-6 text-gray-700 sm:col-span-2 sm:mt-0">
                {new Date(ticket.updated_at).toLocaleString()}
              </dd>
            </div>
          </dl>
        </div>

        {/* Ticket Relationships */}
        <div className="mt-8 border-t border-gray-100 pt-8">
          <TicketRelationshipsWrapper
            ticket={transformedTicket}
            currentUser={{ id: user.id }}
          />
        </div>

        {/* Ticket Messages */}
        <div className="mt-8 border-t border-gray-100">
          <TicketMessages ticketId={ticket.id} userRole={userRole} />
        </div>
      </div>
    </div>
  )
} 