import { createClient } from '@supabase/supabase-js'
import type { Database } from '../../types/database.types'

export interface PhoneConfig {
  twilio_settings: {
    account_sid: string
    auth_token: string
    phone_number: string
  }
  voicemail_greeting?: string
  transcription_enabled?: boolean
  recording_enabled?: boolean
  sms_enabled?: boolean
}

export class PhoneChannel {
  private supabase
  private config: PhoneConfig
  private channelId: string

  constructor(channelId: string, config: PhoneConfig) {
    this.supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    this.config = config
    this.channelId = channelId
  }

  async handleIncomingCall(call: {
    from: string
    to: string
    callSid: string
  }) {
    // Create a new ticket for the call
    const { data: ticket, error: ticketError } = await this.supabase
      .from('tickets')
      .insert({
        title: `Phone call from ${call.from}`,
        description: `Incoming call to ${call.to}`,
        status: 'new',
        priority: 'high', // Phone calls are typically high priority
        created_by: null // System created
      })
      .select()
      .single()

    if (ticketError || !ticket) {
      throw new Error('Failed to create ticket')
    }

    // Create initial call message
    const { error: messageError } = await this.supabase
      .from('ticket_messages')
      .insert({
        ticket_id: ticket.id,
        sender_id: null, // System message
        message: `Incoming call received from ${call.from}`,
        channel_id: this.channelId,
        metadata: {
          call_sid: call.callSid,
          caller_number: call.from,
          called_number: call.to,
          call_started_at: new Date().toISOString()
        }
      })

    if (messageError) {
      throw new Error('Failed to create call message')
    }

    return {
      ticketId: ticket.id,
      callId: call.callSid
    }
  }

  async handleVoicemail(callData: {
    callSid: string
    recordingUrl: string
    transcription?: string
  }) {
    // Find the ticket associated with this call
    const { data: message } = await this.supabase
      .from('ticket_messages')
      .select('ticket_id')
      .eq('metadata->call_sid', callData.callSid)
      .single()

    if (!message?.ticket_id) {
      throw new Error('No ticket found for this call')
    }

    // Add voicemail message
    const { error: messageError } = await this.supabase
      .from('ticket_messages')
      .insert({
        ticket_id: message.ticket_id,
        sender_id: null,
        message: callData.transcription || 'Voicemail received (no transcription available)',
        channel_id: this.channelId,
        metadata: {
          call_sid: callData.callSid,
          recording_url: callData.recordingUrl,
          transcription: callData.transcription,
          message_type: 'voicemail'
        }
      })

    if (messageError) {
      throw new Error('Failed to create voicemail message')
    }
  }

  async handleSMS(sms: {
    from: string
    to: string
    body: string
    messageSid: string
  }) {
    // Check if there's an existing ticket for this number
    const { data: recentTicket } = await this.supabase
      .from('tickets')
      .select('id')
      .eq('metadata->phone_number', sms.from)
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    let ticketId = recentTicket?.id

    // If no existing ticket, create a new one
    if (!ticketId) {
      const { data: ticket, error: ticketError } = await this.supabase
        .from('tickets')
        .insert({
          title: `SMS from ${sms.from}`,
          description: sms.body,
          status: 'new',
          priority: 'medium',
          created_by: null,
          metadata: {
            phone_number: sms.from
          }
        })
        .select()
        .single()

      if (ticketError || !ticket) {
        throw new Error('Failed to create ticket')
      }

      ticketId = ticket.id
    }

    // Add SMS message
    const { error: messageError } = await this.supabase
      .from('ticket_messages')
      .insert({
        ticket_id: ticketId,
        sender_id: null,
        message: sms.body,
        channel_id: this.channelId,
        metadata: {
          message_sid: sms.messageSid,
          from_number: sms.from,
          to_number: sms.to,
          message_type: 'sms'
        }
      })

    if (messageError) {
      throw new Error('Failed to create SMS message')
    }

    return ticketId
  }

  async sendSMS(to: string, message: string) {
    // Implement SMS sending using Twilio
    // This would typically use the Twilio SDK
    console.log('Sending SMS:', { to, message })
  }
} 