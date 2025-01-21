'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'

type Message = {
  id: string
  message: string
  created_at: string
  is_internal: boolean
  sender_id: string
  channel_id: string | null
  channel_name: string | null
  channel_type: 'email' | 'chat' | 'phone' | 'web' | 'api' | null
  metadata: any
  sender: {
    id: string
    full_name: string | null
    email: string
    role: string
  }
}

type TicketMessagesProps = {
  ticketId: string
  userRole: 'admin' | 'agent' | 'customer' | null
}

export default function TicketMessages({ ticketId, userRole }: TicketMessagesProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const canAddInternalNotes = userRole === 'admin' || userRole === 'agent'

  useEffect(() => {
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('ticket_messages_with_sender')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error fetching messages:', error)
        return
      }

      if (data) {
        setMessages(data)
      }
    }

    fetchMessages()

    // Set up realtime subscription
    const channel = supabase
      .channel('ticket_messages_with_sender')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ticket_messages',
          filter: `ticket_id=eq.${ticketId}`
        },
        async (payload) => {
          // Fetch the new message from our view to get the complete data
          const { data, error } = await supabase
            .from('ticket_messages_with_sender')
            .select('*')
            .eq('id', payload.new.id)
            .single()

          if (error) {
            console.error('Error fetching new message:', error)
            return
          }

          if (data) {
            setMessages(prev => [...prev, data])
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [ticketId, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    setIsSubmitting(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('You must be logged in to add a message')

      const { error: insertError } = await supabase
        .from('ticket_messages')
        .insert([
          {
            ticket_id: ticketId,
            sender_id: user.id,
            message: newMessage.trim(),
            is_internal: isInternal && canAddInternalNotes
          }
        ])

      if (insertError) throw insertError

      setNewMessage('')
      setIsInternal(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mt-8">
      <h2 className="text-lg font-medium text-gray-900">Messages</h2>
      
      <div className="mt-4 space-y-6">
        {messages.map((message) => {
          const senderName = message.sender.full_name || message.sender.email
          
          return (
            <div 
              key={message.id}
              className={`flex space-x-3 ${message.is_internal ? 'bg-yellow-50 p-4 rounded-lg' : ''}`}
            >
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-medium text-gray-900">
                      {senderName}
                    </h3>
                    {message.is_internal && (
                      <span className="inline-flex items-center rounded-md bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">
                        Internal Note
                      </span>
                    )}
                    {message.channel_type && message.channel_type !== 'web' && (
                      <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                        message.channel_type === 'email' ? 'bg-blue-100 text-blue-800' :
                        message.channel_type === 'chat' ? 'bg-green-100 text-green-800' :
                        message.channel_type === 'phone' ? 'bg-purple-100 text-purple-800' :
                        message.channel_type === 'api' ? 'bg-gray-100 text-gray-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {message.channel_type}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    {new Date(message.created_at).toLocaleString()}
                  </p>
                </div>
                <p className="text-sm text-gray-500">{message.message}</p>
              </div>
            </div>
          )
        })}

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6">
          <div>
            <label htmlFor="message" className="sr-only">
              Message
            </label>
            <textarea
              id="message"
              name="message"
              rows={3}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="Add a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
            />
          </div>

          <div className="mt-3 flex items-center justify-between">
            {canAddInternalNotes && (
              <div className="flex items-center">
                <input
                  id="internal"
                  name="internal"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  checked={isInternal}
                  onChange={(e) => setIsInternal(e.target.checked)}
                />
                <label htmlFor="internal" className="ml-2 text-sm text-gray-500">
                  Internal note
                </label>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !newMessage.trim()}
              className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isSubmitting ? 'Sending...' : 'Send'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 