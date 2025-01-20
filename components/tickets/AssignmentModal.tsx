'use client'

import { Fragment, useState, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']

interface AssignmentModalProps {
  isOpen: boolean
  onClose: () => void
  ticketId: string
  currentAssigneeId?: string | null
  onAssignmentChanged: () => void
}

export default function AssignmentModal({
  isOpen,
  onClose,
  ticketId,
  currentAssigneeId,
  onAssignmentChanged
}: AssignmentModalProps) {
  const [selectedAgentId, setSelectedAgentId] = useState<string | ''>('')
  const [agents, setAgents] = useState<Profile[]>([])
  const [comment, setComment] = useState('')
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
        setError('Failed to load agents')
      }
    }

    fetchAgents()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    setLoading(true)
    setError(null)

    try {
      // Update ticket assignment
      const updates = {
        assigned_to: selectedAgentId || null,
        status: selectedAgentId ? 'open' : 'new',
        updated_at: new Date().toISOString()
      }

      const { error: updateError } = await supabase
        .from('tickets')
        .update(updates)
        .eq('id', ticketId)

      if (updateError) throw updateError

      // Add assignment change comment
      const assignee = agents.find(a => a.id === selectedAgentId)
      const message = selectedAgentId
        ? `Ticket assigned to ${assignee?.full_name || assignee?.email}${comment ? `: ${comment}` : ''}`
        : `Ticket unassigned${comment ? `: ${comment}` : ''}`

      const { error: commentError } = await supabase
        .from('ticket_messages')
        .insert({
          ticket_id: ticketId,
          message,
          is_internal: true,
          sender_id: (await supabase.auth.getUser()).data.user?.id
        })

      if (commentError) throw commentError

      onAssignmentChanged()
      onClose()
      setSelectedAgentId('')
      setComment('')
    } catch (err) {
      console.error('Error updating ticket assignment:', err)
      setError(err instanceof Error ? err.message : 'Failed to update ticket assignment')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div className="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                      Assign Ticket
                    </Dialog.Title>
                    
                    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                      <div>
                        <label htmlFor="agent" className="block text-sm font-medium text-gray-700">
                          Assign to
                        </label>
                        <select
                          id="agent"
                          value={selectedAgentId}
                          onChange={(e) => setSelectedAgentId(e.target.value)}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
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
                        <label htmlFor="comment" className="block text-sm font-medium text-gray-700">
                          Comment (Optional)
                        </label>
                        <textarea
                          id="comment"
                          rows={3}
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                          placeholder="Add a comment about this assignment..."
                        />
                      </div>

                      {error && (
                        <div className="rounded-md bg-red-50 p-4">
                          <div className="flex">
                            <div className="text-sm text-red-700">{error}</div>
                          </div>
                        </div>
                      )}

                      <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                        <button
                          type="submit"
                          disabled={loading}
                          className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:ml-3 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {loading ? 'Updating...' : 'Update Assignment'}
                        </button>
                        <button
                          type="button"
                          className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                          onClick={onClose}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
} 