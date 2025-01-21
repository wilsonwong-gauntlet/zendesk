'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { PlusIcon } from '@heroicons/react/24/outline'
import type { Database } from '@/types/database.types'
import AddChannelModal from './AddChannelModal'
import EditChannelModal from './EditChannelModal'

type Channel = Database['public']['Tables']['channels']['Row']

export default function ChannelList({ initialChannels }: { initialChannels: Channel[] }) {
  const [channels, setChannels] = useState<Channel[]>(initialChannels)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null)
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleDelete = async (channelId: string) => {
    if (!confirm('Are you sure you want to delete this channel?')) return

    const { error } = await supabase
      .from('channels')
      .delete()
      .eq('id', channelId)

    if (error) {
      alert('Failed to delete channel')
      return
    }

    setChannels(channels.filter(c => c.id !== channelId))
  }

  const handleToggleActive = async (channel: Channel) => {
    const { error } = await supabase
      .from('channels')
      .update({ is_active: !channel.is_active })
      .eq('id', channel.id)

    if (error) {
      alert('Failed to update channel')
      return
    }

    setChannels(channels.map(c => 
      c.id === channel.id ? { ...c, is_active: !c.is_active } : c
    ))
  }

  const getChannelTypeColor = (type: string) => {
    switch (type) {
      case 'email':
        return 'bg-blue-100 text-blue-800'
      case 'chat':
        return 'bg-green-100 text-green-800'
      case 'phone':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div>
      <div className="mb-4">
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
          Add Channel
        </button>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul role="list" className="divide-y divide-gray-200">
          {channels.map((channel) => (
            <li key={channel.id}>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {channel.name}
                    </p>
                    <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getChannelTypeColor(channel.type)}`}>
                      {channel.type}
                    </span>
                    <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${channel.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {channel.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleToggleActive(channel)}
                      className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      {channel.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => setEditingChannel(channel)}
                      className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(channel.id)}
                      className="inline-flex items-center px-2.5 py-1.5 border border-transparent shadow-sm text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  Created {new Date(channel.created_at).toLocaleString()}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {isAddModalOpen && (
        <AddChannelModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onChannelAdded={(channel) => {
            setChannels([channel, ...channels])
            setIsAddModalOpen(false)
          }}
        />
      )}

      {editingChannel && (
        <EditChannelModal
          isOpen={true}
          channel={editingChannel}
          onClose={() => setEditingChannel(null)}
          onChannelUpdated={(updatedChannel) => {
            setChannels(channels.map(c => 
              c.id === updatedChannel.id ? updatedChannel : c
            ))
            setEditingChannel(null)
          }}
        />
      )}
    </div>
  )
} 