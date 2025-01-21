import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import TicketDetailView from '@/components/tickets/TicketDetailView'

type PageProps = {
  params: {
    id: string
  }
}

type DatabaseTicket = {
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
  }[] | null
  assignee: {
    full_name: string | null
    email: string
  }[] | null
}

export default async function TicketPage({ params }: PageProps) {
  const cookieStore = cookies()
  const supabase = await createClient()

  // Get the current user and their role
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    redirect('/auth/login')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError) {
    console.error('Error fetching profile:', profileError)
    redirect('/auth/login')
  }

  // Fetch the ticket details
  const { data: rawTicket, error: ticketError } = await supabase
    .from('tickets')
    .select(`
      id,
      title,
      description,
      status,
      priority,
      assigned_to,
      created_at,
      creator:profiles!tickets_created_by_fkey (
        full_name,
        email
      ),
      assignee:profiles!tickets_assigned_to_fkey (
        full_name,
        email
      )
    `)
    .eq('id', params.id)
    .single()

  if (ticketError) {
    console.error('Error fetching ticket:', ticketError)
    throw new Error('Failed to fetch ticket')
  }

  if (!rawTicket) {
    throw new Error('Ticket not found')
  }

  const ticket = rawTicket as DatabaseTicket
  const formattedTicket = {
    ...ticket,
    creator: ticket.creator?.[0] || null,
    assignee: ticket.assignee?.[0] || null
  }

  return <TicketDetailView ticket={formattedTicket} userRole={profile?.role || null} />
} 