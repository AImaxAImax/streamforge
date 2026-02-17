/**
 * StreamForge Feed Manager
 * 
 * Central hub that:
 * - Collects comments from all platforms
 * - Runs AI moderation
 * - Maintains the live feed buffer
 * - Pushes approved comments to vMix
 * - Emits events for the dashboard
 */

import { EventEmitter } from 'events';
import { ContentModerator } from './moderator.js';
import { VMixClient, buildDataSourceXML } from './vmix.js';

export class FeedManager extends EventEmitter {
  constructor(config = {}) {
    super();

    this.config = {
      maxFeedSize: config.maxFeedSize || 50,      // keep last N comments
      vmixHost: config.vmixHost || 'localhost',
      vmixPort: config.vmixPort || 8088,
      vmixInput: config.vmixInput || null,         // vMix title input to push to
      vmixTitleField: config.vmixTitleField || 'Message',
      pushToVmix: config.pushToVmix !== false,
      pushInterval: config.pushInterval || 5000,   // push to vMix every 5s
      moderationEnabled: config.moderationEnabled !== false,
      strictMode: config.strictMode || false,
      ...config,
    };

    this.feed = [];           // approved comments, newest first
    this.pending = [];        // awaiting moderation
    this.stats = {
      total: 0,
      approved: 0,
      blocked: 0,
      byPlatform: {},
    };

    this.vmix = new VMixClient(this.config.vmixHost, this.config.vmixPort);
    this.moderator = new ContentModerator({
      strictMode: this.config.strictMode,
      useAI: this.config.moderationEnabled,
    });

    this._pushTimer = null;
    this._currentIndex = 0;   // for cycling through comments in vMix
  }

  async init() {
    await this.moderator.init();

    // Check vMix connection
    const vmixOnline = await this.vmix.ping();
    if (vmixOnline) {
      console.log(`[feed] vMix connected at ${this.config.vmixHost}:${this.config.vmixPort}`);
    } else {
      console.warn('[feed] vMix not reachable — running in offline mode');
    }

    // Start periodic vMix push
    if (this.config.pushToVmix) {
      this._pushTimer = setInterval(
        () => this._pushToVmix(),
        this.config.pushInterval
      );
    }

    console.log('[feed] FeedManager ready');
  }

  // Add a comment from any platform
  async addComment(comment) {
    this.stats.total++;
    this.stats.byPlatform[comment.platform] =
      (this.stats.byPlatform[comment.platform] || 0) + 1;

    // Moderation check
    const result = await this.moderator.moderate(comment);

    if (!result.allow) {
      this.stats.blocked++;
      this.emit('comment:blocked', { comment, reason: result.reason });
      return;
    }

    this.stats.approved++;

    const enriched = {
      ...comment,
      highlighted: result.highlight || false,
      approvedAt: new Date().toISOString(),
    };

    // Add to front of feed (newest first)
    this.feed.unshift(enriched);

    // Trim to max size
    if (this.feed.length > this.config.maxFeedSize) {
      this.feed = this.feed.slice(0, this.config.maxFeedSize);
    }

    // Emit for dashboard
    this.emit('comment:approved', enriched);

    // If highlighted, emit special event
    if (enriched.highlighted) {
      this.emit('comment:highlighted', enriched);
    }

    // Immediately push highlighted comments to vMix
    if (enriched.highlighted && this.config.pushToVmix) {
      await this._pushSingleToVmix(enriched);
    }
  }

  // Push current feed to vMix as XML data source
  async _pushToVmix() {
    if (this.feed.length === 0) return;

    try {
      const xml = buildDataSourceXML(this.feed.slice(0, 20));
      this.emit('vmix:push', { count: this.feed.length });
    } catch (err) {
      console.warn(`[feed] vMix push failed: ${err.message}`);
    }
  }

  // Immediately push a single comment to vMix title
  async _pushSingleToVmix(comment) {
    if (!this.config.vmixInput) return;

    try {
      await this.vmix.setTitleFields(this.config.vmixInput, {
        [this.config.vmixTitleField]: comment.message,
        Author: comment.author,
        Platform: comment.platform,
      });

      await this.vmix.titleBeginAnimation(this.config.vmixInput, 'TransitionIn');
    } catch (err) {
      // Silent fail — vMix might not be running
    }
  }

  // Get current feed (for API endpoint)
  getFeed(limit = 20) {
    return this.feed.slice(0, limit);
  }

  // Get XML for vMix data source
  getXML() {
    return buildDataSourceXML(this.feed.slice(0, 20));
  }

  // Get stats
  getStats() {
    return {
      ...this.stats,
      feedSize: this.feed.length,
      approvalRate: this.stats.total > 0
        ? Math.round((this.stats.approved / this.stats.total) * 100)
        : 0,
    };
  }

  // Clear the feed
  clear() {
    this.feed = [];
    this.stats = { total: 0, approved: 0, blocked: 0, byPlatform: {} };
    this.emit('feed:cleared');
  }

  // Manually highlight a comment
  highlight(commentId) {
    const comment = this.feed.find((c) => c.id === commentId);
    if (comment) {
      comment.highlighted = true;
      this.emit('comment:highlighted', comment);
      this._pushSingleToVmix(comment);
    }
  }

  // Pin a comment (stays at top regardless of new comments)
  pin(commentId) {
    const idx = this.feed.findIndex((c) => c.id === commentId);
    if (idx > -1) {
      const comment = this.feed.splice(idx, 1)[0];
      comment.pinned = true;
      this.feed.unshift(comment);
      this.emit('comment:pinned', comment);
    }
  }

  stop() {
    if (this._pushTimer) {
      clearInterval(this._pushTimer);
      this._pushTimer = null;
    }
  }
}
