'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

interface Channel {
  id: string
  name: string
  config: any
}

interface ChatSimulatorProps {
  channels: Channel[]
}

export default function ChatSimulator({ channels }: ChatSimulatorProps) {
  const [selectedChannel, setSelectedChannel] = useState<string>(channels[0]?.id || '')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [chatId, setChatId] = useState<string | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const startChat = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          channelId: selectedChannel,
          visitor: { name, email },
          message
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to start chat')
      }

      const data = await response.json()
      setChatId(data.chatId)
      setMessages([{
        content: message,
        sender_type: 'visitor',
        timestamp: new Date().toISOString()
      }])
      setMessage('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start chat')
    } finally {
      setIsLoading(false)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || !chatId) return

    setError(null)
    setIsLoading(true)
    const messageContent = message
    setMessage('')

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
        sender_type: 'visitor',
        timestamp: new Date().toISOString()
      }])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message')
      setMessage(messageContent)
    } finally {
      setIsLoading(false)
    }
  }

  const resetChat = () => {
    setChatId(null)
    setMessages([])
    setError(null)
  }

  return (
    <div className="space-y-4">
      {!chatId ? (
        <form onSubmit={startChat} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Channel
            </label>
            <select
              value={selectedChannel}
              onChange={(e) => setSelectedChannel(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              required
            >
              {channels.map((channel) => (
                <option key={channel.id} value={channel.id}>
                  {channel.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isLoading ? 'Starting Chat...' : 'Start Chat'}
          </button>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="border rounded-lg p-4 h-64 overflow-y-auto space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.sender_type === 'visitor' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`rounded-lg px-4 py-2 max-w-[80%] ${
                    message.sender_type === 'visitor'
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
            ))}
          </div>

          <form onSubmit={sendMessage} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={2}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                required
              />
            </div>

            <div className="flex justify-between">
              <button
                type="button"
                onClick={resetChat}
                className="inline-flex justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                End Chat
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {isLoading ? 'Sending...' : 'Send'}
              </button>
            </div>
          </form>
        </div>
      )}

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        </div>
      )}
    </div>
  )
} 