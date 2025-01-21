import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { ChatChannel } from '@/lib/channels/chat'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { channelId, visitor, message } = await request.json()

    // Get channel configuration
    const { data: channel } = await supabase
      .from('channels')
      .select('*')
      .eq('id', channelId)
      .single()

    if (!channel || !channel.is_active || channel.type !== 'chat') {
      return NextResponse.json(
        { error: 'Chat channel is not available' },
        { status: 400 }
      )
    }

    // Initialize chat channel
    const chatChannel = new ChatChannel(channelId, channel.config, supabase)

    // Start chat session
    const { ticketId, chatId } = await chatChannel.startChat({
      name: visitor.name,
      email: visitor.email,
      initial_message: message
    })

    return NextResponse.json({ chatId, ticketId })
  } catch (error) {
    console.error('Error starting chat:', error)
    return NextResponse.json(
      { error: 'Failed to start chat' },
      { status: 500 }
    )
  }
} 