/**
 * YouTube Live Chat Connector
 * 
 * Reads live chat messages via YouTube Data API v3 (poll-based).
 * Supports OAuth2 (channel owner) or API key (public streams).
 * 
 * Usage:
 *   const yt = new YouTubeChat({ apiKey: '...', liveChatId: '...' });
 *   yt.on('comment', (comment) => console.log(comment));
 *   await yt.start();
 */

import { EventEmitter } from 'events';

const API_BASE = 'https://www.googleapis.com/youtube/v3';

export default class YouTubeChat extends EventEmitter {
  /**
   * @param {Object} opts
   * @param {string} [opts.apiKey] - YouTube Data API key (for public streams)
   * @param {string} [opts.accessToken] - OAuth2 access token (for channel owner)
   * @param {string} [opts.videoId] - Video ID to extract liveChatId from
   * @param {string} [opts.liveChatId] - Direct liveChatId (skips lookup)
   * @param {number} [opts.pollIntervalMs=5000] - Fallback poll interval
   */
  constructor(opts = {}) {
    super();
    this.apiKey = opts.apiKey || process.env.YOUTUBE_API_KEY || '';
    this.accessToken = opts.accessToken || process.env.YOUTUBE_ACCESS_TOKEN || '';
    this.videoId = opts.videoId || '';
    this.liveChatId = opts.liveChatId || '';
    this.pollIntervalMs = opts.pollIntervalMs || 5000;

    this._timer = null;
    this._pageToken = null;
    this._running = false;
  }

  /** Build auth query params or headers */
  _authParams() {
    if (this.accessToken) {
      return { headers: { Authorization: `Bearer ${this.accessToken}` }, query: '' };
    }
    return { headers: {}, query: `&key=${this.apiKey}` };
  }

  /** Fetch JSON from YouTube API */
  async _fetch(url) {
    const { headers } = this._authParams();
    const res = await fetch(url, { headers });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`YouTube API ${res.status}: ${body}`);
    }
    return res.json();
  }

  /** Resolve liveChatId from a videoId */
  async _resolveLiveChatId() {
    if (this.liveChatId) return;
    if (!this.videoId) throw new Error('Either videoId or liveChatId is required');

    const { query } = this._authParams();
    const url = `${API_BASE}/videos?part=liveStreamingDetails&id=${this.videoId}${query}`;
    const data = await this._fetch(url);

    const details = data.items?.[0]?.liveStreamingDetails;
    if (!details?.activeLiveChatId) {
      throw new Error(`No active live chat found for video ${this.videoId}`);
    }
    this.liveChatId = details.activeLiveChatId;
    this.emit('debug', `Resolved liveChatId: ${this.liveChatId}`);
  }

  /** Normalize a YouTube chat message to standard format */
  _normalize(item) {
    const snippet = item.snippet || {};
    const author = item.authorDetails || {};
    return {
      id: item.id,
      platform: 'youtube',
      author: author.displayName || 'Unknown',
      authorId: author.channelId || '',
      message: snippet.displayMessage || snippet.textMessageDetails?.messageText || '',
      avatar: author.profileImageUrl || '',
      timestamp: snippet.publishedAt || new Date().toISOString(),
      raw: item,
    };
  }

  /** Single poll iteration */
  async _poll() {
    try {
      const { query } = this._authParams();
      let url = `${API_BASE}/liveChat/messages?liveChatId=${this.liveChatId}&part=snippet,authorDetails${query}`;
      if (this._pageToken) url += `&pageToken=${this._pageToken}`;

      const data = await this._fetch(url);
      this._pageToken = data.nextPageToken || null;

      // YouTube tells us when to poll next (respects quota)
      const nextPoll = data.pollingIntervalMillis || this.pollIntervalMs;

      for (const item of data.items || []) {
        this.emit('comment', this._normalize(item));
      }

      // Schedule next poll using YouTube's recommended interval
      if (this._running) {
        this._timer = setTimeout(() => this._poll(), nextPoll);
      }
    } catch (err) {
      this.emit('error', err);
      // Back off on error
      if (this._running) {
        this._timer = setTimeout(() => this._poll(), this.pollIntervalMs * 3);
      }
    }
  }

  /** Start polling */
  async start() {
    await this._resolveLiveChatId();
    this._running = true;
    this.emit('debug', `YouTube chat started for ${this.liveChatId}`);
    this._poll();
  }

  /** Stop polling */
  stop() {
    this._running = false;
    if (this._timer) {
      clearTimeout(this._timer);
      this._timer = null;
    }
    this.emit('debug', 'YouTube chat stopped');
  }
}
