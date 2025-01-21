import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import ChannelList from '@/components/settings/ChannelList'

export default async function ChannelsPage() {
  const supabase = await createClient()

  // Check if user is admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  // Fetch channels
  const { data: channels } = await supabase
    .from('channels')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-4 sm:px-0">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Channel Management</h1>
        </div>
        <ChannelList initialChannels={channels || []} />
      </div>
    </div>
  )
} 