import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import StatusBadge from '@/components/tickets/StatusBadge'
import PriorityBadge from '@/components/tickets/PriorityBadge'
import TicketActions from '@/components/tickets/TicketActions'
import TicketMessages from '@/components/tickets/TicketMessages'

export default async function TicketPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  // Get ticket with creator and assignee profiles
  const { data: ticket, error } = await supabase
    .from('tickets')
    .select(`
      *,
      creator:profiles!tickets_created_by_fkey(id, full_name, email, role),
      assignee:profiles!tickets_assigned_to_fkey(id, full_name, email, role)
    `)
    .eq('id', params.id)
    .single()

  if (error || !ticket) {
    notFound()
  }

  // Get current user's role
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user?.id)
    .single()

  const userRole = profile?.role
  
  // Check if this is a visitor ticket
  const isVisitorTicket = ticket.metadata?.is_visitor === true
  const visitorName = ticket.metadata?.visitor_name
  const visitorEmail = ticket.metadata?.visitor_email

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-4 sm:px-0">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Ticket #{ticket.id.split('-')[0]}</h1>
          <TicketActions ticket={ticket} userRole={userRole} />
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

        {/* Ticket Messages */}
        <div className="mt-8 border-t border-gray-100">
          <TicketMessages ticketId={ticket.id} userRole={userRole} />
        </div>
      </div>
    </div>
  )
} 