/**
 * Platform Manager
 * 
 * Loads and manages all platform connectors. Emits unified 'comment' events.
 * Individual platform failures are isolated — one crash doesn't kill others.
 * 
 * Usage:
 *   const mgr = new PlatformManager();
 *   mgr.on('comment', (c) => console.log(c));
 *   await mgr.addPlatform('twitch', { channels: ['shroud'] });
 *   await mgr.startAll();
 */

import { EventEmitter } from 'events';
import YouTubeChat from './youtube.js';
import TwitchChat from './twitch.js';
import TikTokChat from './tiktok.js';

const PLATFORMS = {
  youtube: YouTubeChat,
  twitch: TwitchChat,
  tiktok: TikTokChat,
};

export default class PlatformManager extends EventEmitter {
  constructor() {
    super();
    /** @type {Map<string, {instance: EventEmitter, config: Object}>} */
    this._platforms = new Map();
  }

  /**
   * Add and optionally start a platform connector.
   * @param {string} name - Platform key (youtube|twitch|tiktok)
   * @param {Object} config - Platform-specific config
   * @param {boolean} [autoStart=false]
   */
  async addPlatform(name, config, autoStart = false) {
    const Cls = PLATFORMS[name];
    if (!Cls) throw new Error(`Unknown platform: ${name}`);

    // Stop existing instance if replacing
    if (this._platforms.has(name)) await this.removePlatform(name);

    const instance = new Cls(config);

    // Forward events with isolation
    instance.on('comment', (comment) => {
      this.emit('comment', comment);
    });

    instance.on('error', (err) => {
      this.emit('platformError', { platform: name, error: err });
    });

    instance.on('debug', (msg) => {
      this.emit('debug', `[${name}] ${msg}`);
    });

    this._platforms.set(name, { instance, config });

    if (autoStart) {
      await this.startPlatform(name);
    }
  }

  /** Start a single platform */
  async startPlatform(name) {
    const entry = this._platforms.get(name);
    if (!entry) throw new Error(`Platform not added: ${name}`);
    try {
      await entry.instance.start();
    } catch (err) {
      this.emit('platformError', { platform: name, error: err });
    }
  }

  /** Stop a single platform */
  async stopPlatform(name) {
    const entry = this._platforms.get(name);
    if (!entry) return;
    try {
      await entry.instance.stop();
    } catch (err) {
      this.emit('platformError', { platform: name, error: err });
    }
  }

  /** Remove a platform entirely */
  async removePlatform(name) {
    await this.stopPlatform(name);
    const entry = this._platforms.get(name);
    if (entry) entry.instance.removeAllListeners();
    this._platforms.delete(name);
  }

  /** Start all added platforms (failures are isolated) */
  async startAll() {
    const results = await Promise.allSettled(
      [...this._platforms.keys()].map(name => this.startPlatform(name))
    );
    for (const [i, r] of results.entries()) {
      if (r.status === 'rejected') {
        const name = [...this._platforms.keys()][i];
        this.emit('platformError', { platform: name, error: r.reason });
      }
    }
  }

  /** Stop all platforms */
  async stopAll() {
    await Promise.allSettled(
      [...this._platforms.keys()].map(name => this.stopPlatform(name))
    );
  }

  /** Get list of active platform names */
  list() {
    return [...this._platforms.keys()];
  }
}

export { YouTubeChat, TwitchChat, TikTokChat, PLATFORMS };
