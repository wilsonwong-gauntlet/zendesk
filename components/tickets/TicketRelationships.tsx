'use client'

import { useState } from 'react'
import { Ticket } from '@/types/tickets'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/components/ui/use-toast'
import { createRelationship, deleteRelationship, mergeTickets } from '@/app/actions/tickets'

interface TicketRelationshipsProps {
  ticket: Ticket
  currentUser: { id: string }
  onUpdate: () => void
}

export function TicketRelationships({ ticket, currentUser, onUpdate }: TicketRelationshipsProps) {
  const [isAddingRelation, setIsAddingRelation] = useState(false)
  const [relatedTicketId, setRelatedTicketId] = useState('')
  const [relationType, setRelationType] = useState<'link' | 'merge'>('link')

  const handleAddRelation = async () => {
    try {
      if (relationType === 'merge') {
        await mergeTickets(ticket.id, relatedTicketId, currentUser.id)
      } else {
        await createRelationship(ticket.id, relatedTicketId, 'link', currentUser.id)
      }
      setIsAddingRelation(false)
      setRelatedTicketId('')
      onUpdate()
      toast({
        title: 'Success',
        description: `Ticket successfully ${relationType === 'merge' ? 'merged' : 'linked'}`,
      })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred'
      toast({
        title: 'Error',
        description: `Failed to ${relationType} ticket: ${message}`,
        variant: 'destructive',
      })
    }
  }

  const handleRemoveRelation = async (relatedTicketId: string) => {
    try {
      await deleteRelationship(ticket.id, relatedTicketId)
      onUpdate()
      toast({
        title: 'Success',
        description: 'Relationship removed successfully',
      })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred'
      toast({
        title: 'Error',
        description: `Failed to remove relationship: ${message}`,
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Related Tickets</h3>
        <Dialog open={isAddingRelation} onOpenChange={setIsAddingRelation}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              Add Relationship
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Related Ticket</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="ticketId">Ticket ID</label>
                <Input
                  id="ticketId"
                  value={relatedTicketId}
                  onChange={(e) => setRelatedTicketId(e.target.value)}
                  placeholder="Enter ticket ID"
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="relationType">Relationship Type</label>
                <Select value={relationType} onValueChange={(value: 'link' | 'merge') => setRelationType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="link">Link</SelectItem>
                    <SelectItem value="merge">Merge</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddingRelation(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddRelation} disabled={!relatedTicketId}>
                Add
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {ticket.relationships?.length === 0 ? (
        <p className="text-sm text-muted-foreground">No related tickets</p>
      ) : (
        <div className="divide-y">
          {ticket.parent_tickets?.map((parentTicket) => (
            <div key={parentTicket.id} className="flex items-center justify-between py-2">
              <div>
                <span className="text-sm text-muted-foreground">Parent: </span>
                <a
                  href={`/tickets/${parentTicket.id}`}
                  className="text-sm font-medium hover:underline"
                >
                  {parentTicket.title}
                </a>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveRelation(parentTicket.id)}
              >
                Remove
              </Button>
            </div>
          ))}
          {ticket.child_tickets?.map((childTicket) => (
            <div key={childTicket.id} className="flex items-center justify-between py-2">
              <div>
                <span className="text-sm text-muted-foreground">
                  {childTicket.metadata?.merged_into ? 'Merged: ' : 'Child: '}
                </span>
                <a
                  href={`/tickets/${childTicket.id}`}
                  className="text-sm font-medium hover:underline"
                >
                  {childTicket.title}
                </a>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveRelation(childTicket.id)}
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 