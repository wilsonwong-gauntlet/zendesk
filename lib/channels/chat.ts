import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../../types/database.types'

export interface ChatConfig {
  widget_settings?: {
    title?: string
  }
  operating_hours?: {
    timezone: string
    schedule?: {
      [key: string]: {
        start: string
        end: string
      }
    }
  }
  offline_message?: string
}

export class ChatChannel {
  private channelId: string
  private config: ChatConfig
  private supabase: SupabaseClient<Database>

  constructor(channelId: string, config: ChatConfig, supabase: SupabaseClient<Database>) {
    this.channelId = channelId
    this.config = config
    this.supabase = supabase
  }

  async startChat({ name, email, initial_message }: { 
    name: string
    email: string
    initial_message: string 
  }) {
    // Create a new ticket for the chat visitor
    const { data: ticket, error: ticketError } = await this.supabase
      .from('tickets')
      .insert({
        title: `Chat with ${name}`,
        description: initial_message,
        status: 'new',
        priority: 'medium',
        metadata: {
          channel_type: 'chat',
          visitor_name: name,
          visitor_email: email,
          is_visitor: true
        }
      })
      .select()
      .single()

    if (ticketError) throw ticketError
    if (!ticket) throw new Error('Failed to create ticket')

    // Create initial message
    const { error: messageError } = await this.supabase
      .from('ticket_messages')
      .insert({
        ticket_id: ticket.id,
        message: initial_message,
        channel_id: this.channelId,
        metadata: {
          sender_type: 'visitor',
          visitor_name: name,
          visitor_email: email
        }
      })

    if (messageError) throw messageError

    return {
      ticketId: ticket.id,
      chatId: ticket.id
    }
  }

  async sendMessage({ chatId, content, sender_type }: {
    chatId: string
    content: string
    sender_type: 'visitor' | 'agent'
  }) {
    // Get ticket to verify it exists and is active
    const { data: ticket, error: ticketError } = await this.supabase
      .from('tickets')
      .select('*')
      .eq('id', chatId)
      .single()

    if (ticketError) throw ticketError
    if (!ticket) throw new Error('Chat session not found')
    if (ticket.status === 'closed') throw new Error('Chat session is closed')

    // Get sender ID based on type
    let senderId: string | null = null
    if (sender_type === 'agent') {
      // For agent messages, we'll need to get the assigned agent's ID
      if (!ticket.assigned_to) throw new Error('No agent assigned to this chat')
      senderId = ticket.assigned_to
    }

    // Create message
    const { error: messageError } = await this.supabase
      .from('ticket_messages')
      .insert({
        ticket_id: chatId,
        sender_id: senderId,
        message: content,
        channel_id: this.channelId,
        metadata: {
          sender_type,
          ...(sender_type === 'visitor' && {
            visitor_name: ticket.metadata.visitor_name,
            visitor_email: ticket.metadata.visitor_email
          })
        }
      })

    if (messageError) throw messageError
  }

  async endChat(chatId: string, summary?: string) {
    // Update ticket status
    const { error: ticketError } = await this.supabase
      .from('tickets')
      .update({
        status: 'closed'
      })
      .eq('id', chatId)

    if (ticketError) throw ticketError

    // Add chat end message if summary provided
    if (summary) {
      await this.sendMessage({
        chatId,
        content: `Chat ended. Summary: ${summary}`,
        sender_type: 'agent'
      })
    }
  }

  async isAvailable(): Promise<boolean> {
    if (!this.config.operating_hours) return true

    const now = new Date()
    const timezone = this.config.operating_hours.timezone
    const schedule = this.config.operating_hours.schedule

    if (!schedule) return true

    // Get current day and time in the configured timezone
    const options: Intl.DateTimeFormatOptions = {
      timeZone: timezone,
      weekday: 'long',
      hour: 'numeric',
      minute: 'numeric',
      hour12: false
    }

    const formatter = new Intl.DateTimeFormat('en-US', options)
    const parts = formatter.formatToParts(now)
    const weekday = parts.find(p => p.type === 'weekday')?.value.toLowerCase()
    const time = parts
      .filter(p => p.type === 'hour' || p.type === 'minute')
      .map(p => p.value)
      .join(':')

    if (!weekday) return true

    const daySchedule = schedule[weekday]
    if (!daySchedule) return false

    return time >= daySchedule.start && time <= daySchedule.end
  }
} 