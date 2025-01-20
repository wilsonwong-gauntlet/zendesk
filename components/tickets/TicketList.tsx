'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database.types'
import TicketActions from './TicketActions'

type Ticket = Database['public']['Tables']['tickets']['Row']
type Profile = Database['public']['Tables']['profiles']['Row']

interface TicketWithAssignee extends Ticket {
  assigned_profile?: Profile
  creator_profile?: Profile
}

export default function TicketList() {
  const [tickets, setTickets] = useState<TicketWithAssignee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const fetchTickets = async () => {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          *,
          assigned_profile:profiles!tickets_assigned_to_fkey(id, full_name, email, role),
          creator_profile:profiles!tickets_created_by_fkey(id, full_name, email, role)
        `)
        .order('created_at', { ascending: false })

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
    fetchTickets()
  }, [supabase])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
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

  if (tickets.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        No tickets found. Create one to get started.
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        {tickets.map((ticket) => (
          <div
            key={ticket.id}
            className="p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="space-y-1">
                <h3 className="font-semibold text-lg">{ticket.title}</h3>
                <p className="text-sm text-gray-600">{ticket.description}</p>
                <div className="text-xs text-gray-500 space-x-2">
                  <span>Created by: {ticket.creator_profile?.full_name || ticket.creator_profile?.email || 'Unknown'}</span>
                  <span>•</span>
                  <span>Created: {formatDate(ticket.created_at)}</span>
                  {ticket.updated_at !== ticket.created_at && (
                    <>
                      <span>•</span>
                      <span>Updated: {formatDate(ticket.updated_at)}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end space-y-2">
                <span className={`px-2 py-1 rounded text-sm ${
                  ticket.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                  ticket.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                  ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {ticket.priority}
                </span>
                <span className={`px-2 py-1 rounded text-sm ${
                  ticket.status === 'new' ? 'bg-blue-100 text-blue-800' :
                  ticket.status === 'open' ? 'bg-purple-100 text-purple-800' :
                  ticket.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  ticket.status === 'resolved' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {ticket.status}
                </span>
              </div>
            </div>

            <TicketActions ticket={ticket} onUpdate={fetchTickets} />
          </div>
        ))}
      </div>
    </div>
  )
} 