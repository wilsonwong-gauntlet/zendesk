'use client'

import { Badge } from '@/components/ui/badge'
import { Ticket } from '@/types/tickets'
import { Clock, CheckCircle, AlertCircle } from 'lucide-react'

interface SLABadgeProps {
  ticket: Ticket
  type: 'first_response' | 'resolution'
}

export function SLABadge({ ticket, type }: SLABadgeProps) {
  const deadline = type === 'first_response' 
    ? ticket.first_response_deadline 
    : ticket.resolution_deadline

  const breached = type === 'first_response'
    ? ticket.first_response_breach
    : ticket.resolution_breach

  if (!deadline) return null

  const deadlineDate = new Date(deadline)
  const now = new Date()
  const timeLeft = deadlineDate.getTime() - now.getTime()
  const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60))

  let variant: 'default' | 'destructive' | 'outline' | 'secondary' = 'default'
  let Icon = Clock
  
  if (breached) {
    variant = 'destructive'
    Icon = AlertCircle
  } else if (ticket.status === 'resolved' || ticket.status === 'closed') {
    variant = 'secondary'
    Icon = CheckCircle
  } else if (hoursLeft < 4) {
    variant = 'destructive'
  } else if (hoursLeft < 8) {
    variant = 'outline'
  }

  const label = type === 'first_response' ? 'First Response' : 'Resolution'
  const timeDisplay = breached 
    ? 'Breached'
    : ticket.status === 'resolved' || ticket.status === 'closed'
      ? 'Met'
      : `${hoursLeft}h left`

  return (
    <Badge variant={variant} className="gap-1">
      <Icon className="h-3 w-3" />
      {label}: {timeDisplay}
    </Badge>
  )
} 