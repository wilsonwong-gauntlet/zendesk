'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database.types'
import { useRouter } from 'next/navigation'
import {
  ChevronDownIcon,
  ChevronUpIcon,
  EllipsisHorizontalIcon,
} from '@heroicons/react/24/outline'
import { getAvailableStatusTransitions } from '@/types/tickets'
import StatusChangeModal from './StatusChangeModal'
import PriorityChangeModal from './PriorityChangeModal'
import AssignmentModal from './AssignmentModal'

type Ticket = Database['public']['Tables']['tickets']['Row']
type Profile = Database['public']['Tables']['profiles']['Row']

interface TicketWithProfiles extends Ticket {
  assigned_profile?: Profile
  creator_profile?: Profile
}

interface Column {
  id: keyof TicketWithProfiles | 'assignee' | 'creator'
  name: string
  sortable?: boolean
}

const columns: Column[] = [
  { id: 'id', name: 'Ticket ID', sortable: true },
  { id: 'title', name: 'Subject', sortable: true },
  { id: 'status', name: 'Status', sortable: true },
  { id: 'priority', name: 'Priority', sortable: true },
  { id: 'creator', name: 'Requester', sortable: true },
  { id: 'assignee', name: 'Assignee', sortable: true },
  { id: 'created_at', name: 'Created', sortable: true },
  { id: 'updated_at', name: 'Updated', sortable: true },
]

export default function EnhancedTicketList() {
  const router = useRouter()
  const [tickets, setTickets] = useState<TicketWithProfiles[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortColumn, setSortColumn] = useState<string>('created_at')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [selectedTickets, setSelectedTickets] = useState<string[]>([])
  const [userRole, setUserRole] = useState<'admin' | 'agent' | 'customer' | null>(null)
  const [statusModalOpen, setStatusModalOpen] = useState(false)
  const [selectedTicketForStatus, setSelectedTicketForStatus] = useState<TicketWithProfiles | null>(null)
  const [priorityModalOpen, setPriorityModalOpen] = useState(false)
  const [selectedTicketForPriority, setSelectedTicketForPriority] = useState<TicketWithProfiles | null>(null)
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false)
  const [selectedTicketForAssignment, setSelectedTicketForAssignment] = useState<TicketWithProfiles | null>(null)
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const fetchUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (profile?.role) {
        setUserRole(profile.role as 'admin' | 'agent' | 'customer')
      }
    } catch (error) {
      console.error('Error fetching user role:', error)
    }
  }

  const fetchTickets = async () => {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          *,
          assigned_profile:profiles!tickets_assigned_to_fkey(id, full_name, email, role),
          creator_profile:profiles!tickets_created_by_fkey(id, full_name, email, role)
        `)
        .order(sortColumn, { ascending: sortDirection === 'asc' })

      if (error) {
        console.error('Error fetching tickets:', error)
        setError(error.message)
        return
      }

      setTickets(data || [])
      setError(null)
    } catch (error) {
      console.error('Error:', error)
      setError('An error occurred while fetching tickets')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUserRole()
  }, [])

  useEffect(() => {
    fetchTickets()
  }, [sortColumn, sortDirection])

  const handleSort = (columnId: string) => {
    if (columnId === sortColumn) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(columnId)
      setSortDirection('asc')
    }
  }

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedTickets(tickets.map(ticket => ticket.id))
    } else {
      setSelectedTickets([])
    }
  }

  const handleSelectTicket = (ticketId: string) => {
    setSelectedTickets(prev => 
      prev.includes(ticketId)
        ? prev.filter(id => id !== ticketId)
        : [...prev, ticketId]
    )
  }

  const handleStatusClick = (ticket: TicketWithProfiles) => {
    if (!userRole) return
    const transitions = getAvailableStatusTransitions(ticket.status, userRole)
    if (transitions.length > 0) {
      setSelectedTicketForStatus(ticket)
      setStatusModalOpen(true)
    }
  }

  const handlePriorityClick = (ticket: TicketWithProfiles) => {
    if (!userRole || (userRole === 'customer')) return
    setSelectedTicketForPriority(ticket)
    setPriorityModalOpen(true)
  }

  const handleAssignmentClick = (ticket: TicketWithProfiles) => {
    if (!userRole || userRole === 'customer') return
    setSelectedTicketForAssignment(ticket)
    setAssignmentModalOpen(true)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else if (days < 7) {
      return `${days}d ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-gray-500">Loading tickets...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white shadow-sm rounded-lg">
      {/* Bulk Actions */}
      {selectedTickets.length > 0 && (
        <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              {selectedTickets.length} selected
            </span>
            <button className="text-sm text-gray-600 hover:text-gray-900">
              Assign to
            </button>
            <button className="text-sm text-gray-600 hover:text-gray-900">
              Update status
            </button>
            <button className="text-sm text-red-600 hover:text-red-900">
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="relative w-12 px-6 sm:w-16 sm:px-8">
                <input
                  type="checkbox"
                  className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  onChange={handleSelectAll}
                  checked={selectedTickets.length === tickets.length}
                />
              </th>
              {columns.map((column) => (
                <th
                  key={column.id}
                  scope="col"
                  className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                >
                  <div className="group inline-flex items-center">
                    {column.name}
                    {column.sortable && (
                      <button
                        onClick={() => handleSort(column.id)}
                        className="ml-2 flex-none rounded text-gray-400 invisible group-hover:visible"
                      >
                        {sortColumn === column.id ? (
                          sortDirection === 'desc' ? (
                            <ChevronDownIcon className="h-4 w-4" />
                          ) : (
                            <ChevronUpIcon className="h-4 w-4" />
                          )
                        ) : (
                          <ChevronUpIcon className="h-4 w-4" />
                        )}
                      </button>
                    )}
                  </div>
                </th>
              ))}
              <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {tickets.map((ticket) => (
              <tr 
                key={ticket.id}
                className="hover:bg-gray-50"
              >
                <td className="relative w-12 px-6 sm:w-16 sm:px-8">
                  <input
                    type="checkbox"
                    className="absolute left-4 top-1/2 -mt-2 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    checked={selectedTickets.includes(ticket.id)}
                    onChange={() => handleSelectTicket(ticket.id)}
                  />
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  #{ticket.id.split('-')[0]}
                </td>
                <td className="px-3 py-4 text-sm text-gray-900">
                  <div>
                    <a 
                      href={`/tickets/${ticket.id}`}
                      className="font-medium text-indigo-600 hover:text-indigo-900 hover:underline"
                    >
                      {ticket.title}
                    </a>
                    <div className="text-gray-500 truncate max-w-md">
                      {ticket.description}
                    </div>
                  </div>
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm">
                  <button
                    onClick={() => handleStatusClick(ticket)}
                    disabled={!userRole}
                    className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                      ticket.status === 'new' ? 'bg-blue-100 text-blue-800' :
                      ticket.status === 'open' ? 'bg-yellow-100 text-yellow-800' :
                      ticket.status === 'pending' ? 'bg-orange-100 text-orange-800' :
                      ticket.status === 'resolved' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    } ${userRole ? 'cursor-pointer hover:bg-opacity-75' : 'cursor-not-allowed opacity-75'}`}
                  >
                    {ticket.status}
                  </button>
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm">
                  <button
                    onClick={() => handlePriorityClick(ticket)}
                    disabled={!userRole || userRole === 'customer'}
                    className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                      ticket.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                      ticket.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                      ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    } ${userRole && userRole !== 'customer' ? 'cursor-pointer hover:bg-opacity-75' : 'cursor-not-allowed opacity-75'}`}
                  >
                    {ticket.priority}
                  </button>
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                  {ticket.creator_profile?.full_name || ticket.creator_profile?.email || 'Unknown'}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                  <button
                    onClick={() => handleAssignmentClick(ticket)}
                    disabled={!userRole || userRole === 'customer'}
                    className={`text-left ${userRole && userRole !== 'customer' ? 'hover:text-indigo-600' : 'cursor-not-allowed opacity-75'}`}
                  >
                    {ticket.assigned_profile?.full_name || ticket.assigned_profile?.email || 'Unassigned'}
                  </button>
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  {formatDate(ticket.created_at)}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  {formatDate(ticket.updated_at)}
                </td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                  <button className="text-gray-400 hover:text-gray-500">
                    <EllipsisHorizontalIcon className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Status Change Modal */}
      {selectedTicketForStatus && userRole && (
        <StatusChangeModal
          isOpen={statusModalOpen}
          onClose={() => {
            setStatusModalOpen(false)
            setSelectedTicketForStatus(null)
          }}
          ticketId={selectedTicketForStatus.id}
          currentStatus={selectedTicketForStatus.status}
          availableTransitions={getAvailableStatusTransitions(selectedTicketForStatus.status, userRole)}
          onStatusChanged={fetchTickets}
        />
      )}

      {selectedTicketForPriority && userRole && userRole !== 'customer' && (
        <PriorityChangeModal
          isOpen={priorityModalOpen}
          onClose={() => {
            setPriorityModalOpen(false)
            setSelectedTicketForPriority(null)
          }}
          ticketId={selectedTicketForPriority.id}
          currentPriority={selectedTicketForPriority.priority}
          onPriorityChanged={fetchTickets}
        />
      )}

      {selectedTicketForAssignment && userRole && userRole !== 'customer' && (
        <AssignmentModal
          isOpen={assignmentModalOpen}
          onClose={() => {
            setAssignmentModalOpen(false)
            setSelectedTicketForAssignment(null)
          }}
          ticketId={selectedTicketForAssignment.id}
          currentAssigneeId={selectedTicketForAssignment.assigned_to}
          onAssignmentChanged={fetchTickets}
        />
      )}
    </div>
  )
} 