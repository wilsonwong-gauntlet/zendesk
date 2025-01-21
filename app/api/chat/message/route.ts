import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { ChatChannel } from '@/lib/channels/chat'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { chatId, message, sender } = await request.json()

    // Get ticket and channel info
    const { data: ticket } = await supabase
      .from('tickets')
      .select(`
        *,
        ticket_messages!inner(
          channel_id
        )
      `)
      .eq('id', chatId)
      .single()

    if (!ticket) {
      return NextResponse.json(
        { error: 'Chat session not found' },
        { status: 404 }
      )
    }

    // Get channel configuration
    const { data: channel } = await supabase
      .from('channels')
      .select('*')
      .eq('id', ticket.ticket_messages[0].channel_id)
      .single()

    if (!channel || !channel.is_active || channel.type !== 'chat') {
      return NextResponse.json(
        { error: 'Chat channel is not available' },
        { status: 400 }
      )
    }

    // Initialize chat channel
    const chatChannel = new ChatChannel(channel.id, channel.config)

    // Send message
    await chatChannel.sendMessage(chatId, {
      content: message,
      sender_type: sender
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
} 