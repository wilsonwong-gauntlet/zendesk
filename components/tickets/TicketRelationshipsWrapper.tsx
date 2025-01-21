'use client'

import { useRouter } from 'next/navigation'
import { TicketRelationships } from './TicketRelationships'
import { Ticket } from '@/types/tickets'

interface TicketRelationshipsWrapperProps {
  ticket: Ticket
  currentUser: { id: string }
}

export function TicketRelationshipsWrapper({ ticket, currentUser }: TicketRelationshipsWrapperProps) {
  const router = useRouter()

  return (
    <TicketRelationships
      ticket={ticket}
      currentUser={currentUser}
      onUpdate={() => {
        router.refresh()
      }}
    />
  )
} 