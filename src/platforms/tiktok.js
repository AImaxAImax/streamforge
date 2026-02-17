/**
 * TikTok Live Chat Connector
 * 
 * Uses tiktok-live-connector (unofficial) to receive real-time
 * live stream chat events via WebSocket/protobuf.
 * 
 * ⚠️  No official TikTok Live API exists. This relies on reverse-engineered
 * WebSocket connections and may break without notice.
 * 
 * Install: npm i tiktok-live-connector
 * 
 * Usage:
 *   const tt = new TikTokChat({ username: 'somestreamer' });
 *   tt.on('comment', (comment) => console.log(comment));
 *   await tt.start();
 */

import { EventEmitter } from 'events';

// Dynamic import so the app doesn't crash if the package isn't installed
let WebcastPushConnection;
try {
  const mod = await import('tiktok-live-connector');
  WebcastPushConnection = mod.WebcastPushConnection;
} catch {
  WebcastPushConnection = null;
}

export default class TikTokChat extends EventEmitter {
  /**
   * @param {Object} opts
   * @param {string} opts.username - TikTok username (without @) of the streamer
   * @param {Object} [opts.sessionId] - Optional sessionId cookie for auth
   */
  constructor(opts = {}) {
    super();
    this.username = opts.username || '';
    this.sessionId = opts.sessionId || process.env.TIKTOK_SESSION_ID || undefined;
    this._connection = null;
  }

  /** Normalize TikTok chat event to standard format */
  _normalize(data) {
    return {
      id: data.msgId || `tiktok-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      platform: 'tiktok',
      author: data.nickname || data.uniqueId || 'Unknown',
      authorId: data.userId?.toString() || '',
      message: data.comment || '',
      avatar: data.profilePictureUrl || '',
      timestamp: new Date().toISOString(),
      raw: data,
    };
  }

  /** Start listening to TikTok live chat */
  async start() {
    if (!WebcastPushConnection) {
      this.emit('error', new Error(
        'tiktok-live-connector not installed. Run: npm i tiktok-live-connector'
      ));
      return;
    }

    if (!this.username) {
      throw new Error('TikTok username is required');
    }

    const opts = {};
    if (this.sessionId) opts.sessionId = this.sessionId;

    this._connection = new WebcastPushConnection(this.username, opts);

    this._connection.on('chat', (data) => {
      this.emit('comment', this._normalize(data));
    });

    this._connection.on('disconnected', () => {
      this.emit('error', new Error('TikTok live connection lost'));
    });

    try {
      const state = await this._connection.connect();
      this.emit('debug', `TikTok connected to ${this.username} (${state.roomId})`);
    } catch (err) {
      this.emit('error', new Error(`TikTok connect failed: ${err.message}`));
    }
  }

  /** Stop the connection */
  stop() {
    if (this._connection) {
      this._connection.disconnect();
      this._connection = null;
    }
    this.emit('debug', 'TikTok chat stopped');
  }
}
