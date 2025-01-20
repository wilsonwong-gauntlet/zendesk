'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']
type Ticket = Database['public']['Tables']['tickets']['Row']

interface TicketActionsProps {
  ticket: Ticket
  onUpdate: () => void
}

export default function TicketActions({ ticket, onUpdate }: TicketActionsProps) {
  const [agents, setAgents] = useState<Profile[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .in('role', ['admin', 'agent'])
          .order('full_name')

        if (error) throw error
        setAgents(data || [])
      } catch (err) {
        console.error('Error fetching agents:', err)
        setError(err instanceof Error ? err.message : 'Failed to load agents')
      }
    }

    fetchAgents()
  }, [supabase])

  const handleAssignmentChange = async (agentId: string | null) => {
    setLoading(true)
    setError(null)

    try {
      const { error: updateError } = await supabase
        .from('tickets')
        .update({ 
          assigned_to: agentId,
          status: agentId ? 'open' : 'new' // Automatically update status when assigned
        })
        .eq('id', ticket.id)

      if (updateError) throw updateError
      onUpdate()
    } catch (err) {
      console.error('Error updating assignment:', err)
      setError(err instanceof Error ? err.message : 'Failed to update assignment')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (newStatus: Ticket['status']) => {
    setLoading(true)
    setError(null)

    try {
      const { error: updateError } = await supabase
        .from('tickets')
        .update({ status: newStatus })
        .eq('id', ticket.id)

      if (updateError) throw updateError
      onUpdate()
    } catch (err) {
      console.error('Error updating status:', err)
      setError(err instanceof Error ? err.message : 'Failed to update status')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-4 space-y-4">
      <div>
        <label htmlFor={`assign-${ticket.id}`} className="block text-sm font-medium text-gray-700">
          Assigned To
        </label>
        <select
          id={`assign-${ticket.id}`}
          value={ticket.assigned_to || ''}
          onChange={(e) => handleAssignmentChange(e.target.value || null)}
          disabled={loading}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="">Unassigned</option>
          {agents.map((agent) => (
            <option key={agent.id} value={agent.id}>
              {agent.full_name || agent.email}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor={`status-${ticket.id}`} className="block text-sm font-medium text-gray-700">
          Status
        </label>
        <select
          id={`status-${ticket.id}`}
          value={ticket.status}
          onChange={(e) => handleStatusChange(e.target.value as Ticket['status'])}
          disabled={loading}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="new">New</option>
          <option value="open">Open</option>
          <option value="pending">Pending</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {error && (
        <div className="text-sm text-red-600">
          {error}
        </div>
      )}
    </div>
  )
} 