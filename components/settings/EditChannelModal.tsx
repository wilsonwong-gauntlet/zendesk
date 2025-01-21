'use client'

import { Fragment, useState, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database.types'

type Channel = Database['public']['Tables']['channels']['Row']

interface EditChannelModalProps {
  isOpen: boolean
  channel: Channel
  onClose: () => void
  onChannelUpdated: (channel: Channel) => void
}

export default function EditChannelModal({
  isOpen,
  channel,
  onClose,
  onChannelUpdated
}: EditChannelModalProps) {
  const [name, setName] = useState(channel.name)
  const [config, setConfig] = useState<any>(channel.config)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    setName(channel.name)
    setConfig(channel.config)
  }, [channel])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const { data: updatedChannel, error } = await supabase
        .from('channels')
        .update({
          name,
          config
        })
        .eq('id', channel.id)
        .select()
        .single()

      if (error) throw error
      if (!updatedChannel) throw new Error('No channel returned')

      onChannelUpdated(updatedChannel)
    } catch (error) {
      alert('Failed to update channel')
      console.error('Error updating channel:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderConfigFields = () => {
    switch (channel.type) {
      case 'email':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Inbound Email
              </label>
              <input
                type="email"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={config.inbound_email || ''}
                onChange={(e) => setConfig({ ...config, inbound_email: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                SMTP Host
              </label>
              <input
                type="text"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={config.smtp_settings?.host || ''}
                onChange={(e) => setConfig({
                  ...config,
                  smtp_settings: { ...config.smtp_settings, host: e.target.value }
                })}
              />
            </div>
          </>
        )
      case 'chat':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Widget Title
              </label>
              <input
                type="text"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={config.widget_settings?.title || ''}
                onChange={(e) => setConfig({
                  ...config,
                  widget_settings: { ...config.widget_settings, title: e.target.value }
                })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Timezone
              </label>
              <input
                type="text"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={config.operating_hours?.timezone || ''}
                onChange={(e) => setConfig({
                  ...config,
                  operating_hours: { ...config.operating_hours, timezone: e.target.value }
                })}
              />
            </div>
          </>
        )
      case 'phone':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Twilio Account SID
              </label>
              <input
                type="text"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={config.twilio_settings?.account_sid || ''}
                onChange={(e) => setConfig({
                  ...config,
                  twilio_settings: { ...config.twilio_settings, account_sid: e.target.value }
                })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <input
                type="text"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={config.twilio_settings?.phone_number || ''}
                onChange={(e) => setConfig({
                  ...config,
                  twilio_settings: { ...config.twilio_settings, phone_number: e.target.value }
                })}
              />
            </div>
          </>
        )
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
                <form onSubmit={handleSubmit}>
                  <div>
                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                      Edit Channel
                    </Dialog.Title>
                    <div className="mt-6 space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Channel Name
                        </label>
                        <input
                          type="text"
                          required
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                        />
                      </div>

                      {renderConfigFields()}
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                    >
                      {isSubmitting ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
} 