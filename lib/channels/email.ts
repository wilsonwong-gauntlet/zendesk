import { createClient } from '@supabase/supabase-js'
import type { Database } from '../../types/database.types'

export interface EmailConfig {
  inbound_email: string
  smtp_settings: {
    host: string
    port: number
    secure: boolean
    auth: {
      user: string
      pass: string
    }
  }
  auto_response_template?: string
}

export class EmailChannel {
  private supabase
  private config: EmailConfig
  private channelId: string

  constructor(channelId: string, config: EmailConfig) {
    this.supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    this.config = config
    this.channelId = channelId
  }

  async processIncomingEmail(email: {
    from: string
    subject: string
    text: string
    html?: string
    references?: string[]
    inReplyTo?: string
  }) {
    // Check if this is a reply to an existing ticket
    let ticketId: string | null = null
    if (email.references?.length || email.inReplyTo) {
      const { data: message } = await this.supabase
        .from('ticket_messages')
        .select('ticket_id')
        .eq('metadata->email_id', email.inReplyTo || email.references![0])
        .single()
      
      if (message) {
        ticketId = message.ticket_id
      }
    }

    // If no existing ticket, create a new one
    if (!ticketId) {
      const { data: ticket, error: ticketError } = await this.supabase
        .from('tickets')
        .insert({
          title: email.subject || 'Email Inquiry',
          description: email.text,
          status: 'new',
          priority: 'medium',
          created_by: null // System created
        })
        .select()
        .single()

      if (ticketError || !ticket) {
        throw new Error('Failed to create ticket')
      }

      ticketId = ticket.id
    }

    // Create ticket message
    const { error: messageError } = await this.supabase
      .from('ticket_messages')
      .insert({
        ticket_id: ticketId,
        sender_id: null, // System message
        message: email.text,
        channel_id: this.channelId,
        metadata: {
          email_from: email.from,
          email_subject: email.subject,
          email_html: email.html,
          email_id: email.inReplyTo || email.references?.[0]
        }
      })

    if (messageError) {
      throw new Error('Failed to create ticket message')
    }

    // Send auto-response if configured
    if (this.config.auto_response_template) {
      await this.sendEmail({
        to: email.from,
        subject: `Re: ${email.subject}`,
        text: this.config.auto_response_template
      })
    }

    return ticketId
  }

  async sendEmail({ to, subject, text }: { to: string, subject: string, text: string }) {
    // Implement email sending using the configured SMTP settings
    // This would typically use a library like nodemailer
    // For now, we'll just log the email
    console.log('Sending email:', { to, subject, text })
  }
} 