import { createClient } from '@/utils/supabase/server'
import ChatSimulator from '@/components/simulator/ChatSimulator'

export default async function SimulatorPage() {
  const supabase = await createClient()

  // Get available chat channels
  const { data: chatChannels } = await supabase
    .from('channels')
    .select('id, name, config')
    .eq('type', 'chat')
    .eq('is_active', true)

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-4 sm:px-0">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Channel Simulator</h1>
          <p className="mt-1 text-sm text-gray-500">
            Test different support channels by simulating customer interactions.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Chat Simulator Card */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900">Chat</h3>
              <div className="mt-4">
                <ChatSimulator channels={chatChannels || []} />
              </div>
            </div>
          </div>

          {/* Email Simulator Card (Coming Soon) */}
          <div className="bg-white overflow-hidden shadow rounded-lg opacity-50">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900">Email</h3>
              <p className="mt-1 text-sm text-gray-500">Coming soon</p>
            </div>
          </div>

          {/* Phone Simulator Card (Coming Soon) */}
          <div className="bg-white overflow-hidden shadow rounded-lg opacity-50">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900">Phone</h3>
              <p className="mt-1 text-sm text-gray-500">Coming soon</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 