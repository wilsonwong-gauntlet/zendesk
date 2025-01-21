import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database.types'

export interface TicketStats {
  newTickets: number
  openTickets: number
  resolvedToday: number
  urgentTickets: number
  statusCounts: {
    new: number
    open: number
    pending: number
    resolved: number
    closed: number
  }
  priorityCounts: {
    urgent: number
    high: number
    medium: number
    low: number
  }
}

export async function getTicketStatistics(): Promise<TicketStats> {
  const supabase = await createClient()

  // Get today's date at midnight UTC
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)

  const [
    { count: newTickets },
    { count: openTickets },
    { count: resolvedToday },
    { count: urgentTickets },
    statusResults,
    priorityResults
  ] = await Promise.all([
    // New tickets count
    supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'new'),

    // Open tickets count
    supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'open'),

    // Resolved today count
    supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'resolved')
      .gte('updated_at', today.toISOString()),

    // Urgent tickets count
    supabase
      .from('tickets')
      .select('*', { count: 'exact', head: true })
      .eq('priority', 'urgent'),

    // Status counts
    supabase.from('tickets').select('status'),

    // Priority counts
    supabase.from('tickets').select('priority')
  ])

  // Calculate status counts
  const statusCounts = {
    new: 0,
    open: 0,
    pending: 0,
    resolved: 0,
    closed: 0
  }
  statusResults.data?.forEach((ticket: { status: keyof typeof statusCounts }) => {
    statusCounts[ticket.status]++
  })

  // Calculate priority counts
  const priorityCounts = {
    urgent: 0,
    high: 0,
    medium: 0,
    low: 0
  }
  priorityResults.data?.forEach((ticket: { priority: keyof typeof priorityCounts }) => {
    priorityCounts[ticket.priority]++
  })

  return {
    newTickets: newTickets || 0,
    openTickets: openTickets || 0,
    resolvedToday: resolvedToday || 0,
    urgentTickets: urgentTickets || 0,
    statusCounts,
    priorityCounts
  }
} 