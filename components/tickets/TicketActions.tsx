'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'

type Ticket = {
  id: string
  status: 'new' | 'open' | 'pending' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assigned_to: string | null
}

type TicketActionsProps = {
  ticket: Ticket
  userRole: 'admin' | 'agent' | 'customer' | null
}

export default function TicketActions({ ticket, userRole }: TicketActionsProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const canUpdateTicket = userRole === 'admin' || userRole === 'agent'

  const updateStatus = async (newStatus: Ticket['status']) => {
    if (!canUpdateTicket) return
    
    setIsUpdating(true)
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ status: newStatus })
        .eq('id', ticket.id)

      if (error) throw error
      router.refresh()
    } catch (error) {
      console.error('Error updating ticket:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const updatePriority = async (newPriority: Ticket['priority']) => {
    if (!canUpdateTicket) return
    
    setIsUpdating(true)
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ priority: newPriority })
        .eq('id', ticket.id)

      if (error) throw error
      router.refresh()
    } catch (error) {
      console.error('Error updating ticket:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  if (!canUpdateTicket) return null

  return (
    <div className="flex items-center space-x-4">
      <select
        value={ticket.status}
        onChange={(e) => updateStatus(e.target.value as Ticket['status'])}
        disabled={isUpdating}
        className="rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
      >
        <option value="new">New</option>
        <option value="open">Open</option>
        <option value="pending">Pending</option>
        <option value="resolved">Resolved</option>
        <option value="closed">Closed</option>
      </select>

      <select
        value={ticket.priority}
        onChange={(e) => updatePriority(e.target.value as Ticket['priority'])}
        disabled={isUpdating}
        className="rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
      >
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
        <option value="urgent">Urgent</option>
      </select>
    </div>
  )
} 