/**
 * Twitch Chat Connector
 * 
 * Real-time IRC chat via tmi.js (WebSocket-based).
 * Supports anonymous reading or authenticated with OAuth token.
 * Can join multiple channels simultaneously.
 * 
 * Usage:
 *   const tw = new TwitchChat({ channels: ['shroud', 'pokimane'] });
 *   tw.on('comment', (comment) => console.log(comment));
 *   await tw.start();
 */

import { EventEmitter } from 'events';
import tmi from 'tmi.js';

export default class TwitchChat extends EventEmitter {
  /**
   * @param {Object} opts
   * @param {string[]} opts.channels - Twitch channel names to join
   * @param {string} [opts.username] - Bot username (omit for anonymous)
   * @param {string} [opts.token] - OAuth token (omit for anonymous)
   */
  constructor(opts = {}) {
    super();
    this.channels = opts.channels || [];
    this.username = opts.username || process.env.TWITCH_USERNAME || undefined;
    this.token = opts.token || process.env.TWITCH_OAUTH_TOKEN || undefined;
    this._client = null;
  }

  /** Normalize tmi.js message to standard format */
  _normalize(channel, tags, message) {
    return {
      id: tags.id || `twitch-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      platform: 'twitch',
      author: tags['display-name'] || tags.username || 'Unknown',
      authorId: tags['user-id'] || '',
      message,
      avatar: '', // Twitch IRC doesn't provide avatars; fetch via Helix API if needed
      timestamp: tags['tmi-sent-ts']
        ? new Date(parseInt(tags['tmi-sent-ts'])).toISOString()
        : new Date().toISOString(),
      raw: { channel: channel.replace('#', ''), tags },
    };
  }

  /** Start the tmi.js client */
  async start() {
    const identity = this.username && this.token
      ? { username: this.username, password: this.token }
      : undefined; // anonymous

    this._client = new tmi.Client({
      options: { debug: false },
      connection: { reconnect: true, secure: true },
      identity,
      channels: this.channels,
    });

    this._client.on('message', (channel, tags, message, self) => {
      if (self) return; // ignore own messages
      this.emit('comment', this._normalize(channel, tags, message));
    });

    this._client.on('connected', (addr, port) => {
      this.emit('debug', `Twitch connected to ${addr}:${port}`);
    });

    this._client.on('disconnected', (reason) => {
      this.emit('error', new Error(`Twitch disconnected: ${reason}`));
    });

    await this._client.connect();
    this.emit('debug', `Twitch chat started for channels: ${this.channels.join(', ')}`);
  }

  /** Join additional channel at runtime */
  async joinChannel(channel) {
    if (!this._client) throw new Error('Client not started');
    await this._client.join(channel);
    this.channels.push(channel);
  }

  /** Leave a channel */
  async leaveChannel(channel) {
    if (!this._client) return;
    await this._client.part(channel);
    this.channels = this.channels.filter(c => c !== channel);
  }

  /** Stop the client */
  async stop() {
    if (this._client) {
      await this._client.disconnect();
      this._client = null;
    }
    this.emit('debug', 'Twitch chat stopped');
  }
}
