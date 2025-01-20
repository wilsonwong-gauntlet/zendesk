'use client'

import { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { createBrowserClient } from '@supabase/ssr'
import type { TicketPriority } from '@/types/tickets'

interface PriorityChangeModalProps {
  isOpen: boolean
  onClose: () => void
  ticketId: string
  currentPriority: TicketPriority
  onPriorityChanged: () => void
}

const PRIORITIES: TicketPriority[] = ['urgent', 'high', 'medium', 'low']

export default function PriorityChangeModal({
  isOpen,
  onClose,
  ticketId,
  currentPriority,
  onPriorityChanged
}: PriorityChangeModalProps) {
  const [selectedPriority, setSelectedPriority] = useState<TicketPriority | ''>('')
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPriority) return

    setLoading(true)
    setError(null)

    try {
      // Update ticket priority
      const { error: updateError } = await supabase
        .from('tickets')
        .update({ 
          priority: selectedPriority,
          updated_at: new Date().toISOString()
        })
        .eq('id', ticketId)

      if (updateError) throw updateError

      // Add priority change comment if provided
      if (comment) {
        const { error: commentError } = await supabase
          .from('ticket_messages')
          .insert({
            ticket_id: ticketId,
            message: `Priority changed to ${selectedPriority}${comment ? `: ${comment}` : ''}`,
            is_internal: true,
            sender_id: (await supabase.auth.getUser()).data.user?.id
          })

        if (commentError) throw commentError
      }

      onPriorityChanged()
      onClose()
      setSelectedPriority('')
      setComment('')
    } catch (err) {
      console.error('Error updating ticket priority:', err)
      setError(err instanceof Error ? err.message : 'Failed to update ticket priority')
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
                      Update Ticket Priority
                    </Dialog.Title>
                    
                    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                      <div>
                        <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                          New Priority
                        </label>
                        <select
                          id="priority"
                          value={selectedPriority}
                          onChange={(e) => setSelectedPriority(e.target.value as TicketPriority)}
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                          required
                        >
                          <option value="">Select priority</option>
                          {PRIORITIES.map((priority) => (
                            <option key={priority} value={priority}>
                              {priority.charAt(0).toUpperCase() + priority.slice(1)}
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
                          placeholder="Add a comment about this priority change..."
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
                          disabled={loading || !selectedPriority}
                          className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:ml-3 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {loading ? 'Updating...' : 'Update Priority'}
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