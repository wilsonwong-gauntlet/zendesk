import { createClient } from '@supabase/supabase-js'
import type { Database } from '../../types/database.types'
import { EmailChannel, type EmailConfig } from './email'
import { ChatChannel, type ChatConfig } from './chat'
import { PhoneChannel, type PhoneConfig } from './phone'

export class ChannelManager {
  private supabase
  private channels: Map<string, EmailChannel | ChatChannel | PhoneChannel> = new Map()

  constructor() {
    this.supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }

  async initialize() {
    // Fetch all active channels from the database
    const { data: channels, error } = await this.supabase
      .from('channels')
      .select('*')
      .eq('is_active', true)

    if (error) {
      throw new Error('Failed to fetch channels')
    }

    // Initialize each channel
    for (const channel of channels) {
      switch (channel.type) {
        case 'email':
          this.channels.set(
            channel.id,
            new EmailChannel(channel.id, channel.config as EmailConfig)
          )
          break
        case 'chat':
          this.channels.set(
            channel.id,
            new ChatChannel(channel.id, channel.config as ChatConfig)
          )
          break
        case 'phone':
          this.channels.set(
            channel.id,
            new PhoneChannel(channel.id, channel.config as PhoneConfig)
          )
          break
      }
    }
  }

  getChannel<T extends EmailChannel | ChatChannel | PhoneChannel>(
    channelId: string
  ): T | undefined {
    return this.channels.get(channelId) as T | undefined
  }

  getChannelsByType<T extends EmailChannel | ChatChannel | PhoneChannel>(
    type: 'email' | 'chat' | 'phone'
  ): T[] {
    return Array.from(this.channels.values()).filter(
      channel => {
        switch (type) {
          case 'email':
            return channel instanceof EmailChannel
          case 'chat':
            return channel instanceof ChatChannel
          case 'phone':
            return channel instanceof PhoneChannel
        }
      }
    ) as T[]
  }

  async createChannel(params: {
    name: string
    type: 'email' | 'chat' | 'phone'
    config: EmailConfig | ChatConfig | PhoneConfig
  }) {
    const { data: channel, error } = await this.supabase
      .from('channels')
      .insert({
        name: params.name,
        type: params.type,
        config: params.config,
        is_active: true
      })
      .select()
      .single()

    if (error || !channel) {
      throw new Error('Failed to create channel')
    }

    // Initialize the new channel
    switch (params.type) {
      case 'email':
        this.channels.set(
          channel.id,
          new EmailChannel(channel.id, params.config as EmailConfig)
        )
        break
      case 'chat':
        this.channels.set(
          channel.id,
          new ChatChannel(channel.id, params.config as ChatConfig)
        )
        break
      case 'phone':
        this.channels.set(
          channel.id,
          new PhoneChannel(channel.id, params.config as PhoneConfig)
        )
        break
    }

    return channel
  }

  async updateChannel(
    channelId: string,
    params: {
      name?: string
      config?: EmailConfig | ChatConfig | PhoneConfig
      is_active?: boolean
    }
  ) {
    const { data: channel, error } = await this.supabase
      .from('channels')
      .update(params)
      .eq('id', channelId)
      .select()
      .single()

    if (error || !channel) {
      throw new Error('Failed to update channel')
    }

    // Reinitialize the channel if it's active
    if (channel.is_active) {
      switch (channel.type) {
        case 'email':
          this.channels.set(
            channel.id,
            new EmailChannel(channel.id, channel.config as EmailConfig)
          )
          break
        case 'chat':
          this.channels.set(
            channel.id,
            new ChatChannel(channel.id, channel.config as ChatConfig)
          )
          break
        case 'phone':
          this.channels.set(
            channel.id,
            new PhoneChannel(channel.id, channel.config as PhoneConfig)
          )
          break
      }
    } else {
      // Remove inactive channel
      this.channels.delete(channelId)
    }

    return channel
  }

  async deleteChannel(channelId: string) {
    const { error } = await this.supabase
      .from('channels')
      .delete()
      .eq('id', channelId)

    if (error) {
      throw new Error('Failed to delete channel')
    }

    this.channels.delete(channelId)
  }
} 