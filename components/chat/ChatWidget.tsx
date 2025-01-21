'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { ChatBubbleLeftRightIcon, XMarkIcon } from '@heroicons/react/24/outline'
import type { Database } from '@/types/database.types'

type Message = {
  content: string
  sender: 'visitor' | 'agent'
  timestamp: string
}

interface ChatWidgetProps {
  channelId: string
}

export default function ChatWidget({ channelId }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [visitorInfo, setVisitorInfo] = useState({
    name: '',
    email: ''
  })
  const [chatId, setChatId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    if (chatId) {
      // Set up realtime subscription for messages
      const channel = supabase
        .channel('ticket_messages_with_sender')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'ticket_messages',
            filter: `ticket_id=eq.${chatId}`
          },
          async (payload) => {
            const { data: message } = await supabase
              .from('ticket_messages_with_sender')
              .select('*')
              .eq('id', payload.new.id)
              .single()

            if (message) {
              setMessages(prev => [...prev, {
                content: message.message,
                sender: message.metadata.sender_type,
                timestamp: message.created_at
              }])
            }
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [chatId, supabase])

  const initializeChat = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      // Get channel config
      const { data: channel } = await supabase
        .from('channels')
        .select('*')
        .eq('id', channelId)
        .single()

      if (!channel || !channel.is_active) {
        throw new Error('Chat channel is not available')
      }

      // Start chat session
      const response = await fetch('/api/chat/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channelId,
          visitor: visitorInfo,
          message: 'Hello! I need help.'
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to start chat')
      }

      const data = await response.json()
      setChatId(data.chatId)
      setIsInitialized(true)
      setMessages([{
        content: 'Hello! How can we help you today?',
        sender: 'agent',
        timestamp: new Date().toISOString()
      }])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start chat')
    } finally {
      setIsSubmitting(false)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !chatId) return

    setIsSubmitting(true)
    const messageContent = newMessage
    setNewMessage('')

    try {
      const response = await fetch('/api/chat/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatId,
          message: messageContent,
          sender: 'visitor'
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      setMessages(prev => [...prev, {
        content: messageContent,
        sender: 'visitor',
        timestamp: new Date().toISOString()
      }])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message')
      setNewMessage(messageContent)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 p-4 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        <ChatBubbleLeftRightIcon className="h-6 w-6" />
      </button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 h-[600px] bg-white rounded-lg shadow-xl flex flex-col">
      {/* Header */}
      <div className="p-4 border-b flex justify-between items-center bg-indigo-600 text-white rounded-t-lg">
        <h3 className="text-lg font-medium">Chat Support</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-white hover:text-gray-200"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {!isInitialized ? (
          <form onSubmit={initializeChat} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Name
              </label>
              <input
                type="text"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={visitorInfo.name}
                onChange={(e) => setVisitorInfo({ ...visitorInfo, name: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={visitorInfo.email}
                onChange={(e) => setVisitorInfo({ ...visitorInfo, email: e.target.value })}
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isSubmitting ? 'Starting Chat...' : 'Start Chat'}
            </button>
          </form>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.sender === 'visitor' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`rounded-lg px-4 py-2 max-w-[80%] ${
                  message.sender === 'visitor'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <p className="text-xs mt-1 opacity-75">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))
        )}

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
      </div>

      {/* Message Input */}
      {isInitialized && (
        <form onSubmit={sendMessage} className="p-4 border-t">
          <div className="flex space-x-2">
            <input
              type="text"
              className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
            />
            <button
              type="submit"
              disabled={isSubmitting || !newMessage.trim()}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </form>
      )}
    </div>
  )
} 