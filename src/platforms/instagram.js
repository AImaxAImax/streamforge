/**
 * Instagram Live Comments — Platform Stub
 * 
 * STATUS: STUB — Instagram's API does not support real-time live comment streaming.
 * 
 * ## API Research (as of Feb 2026)
 * 
 * ### Instagram Basic Display API
 * - DEPRECATED (sunset June 2024). Replaced by Instagram Platform API.
 * - Never supported live comments anyway — only user profile and media.
 * 
 * ### Instagram Graph API (Business/Creator accounts)
 * - Supports reading comments on POSTS and REELS (GET /{media-id}/comments)
 * - Does NOT support live video comments
 * - Live video endpoints (GET /{ig-user-id}/live_media) return metadata only
 * - No webhook/streaming for live comments
 * - Rate limited: 200 calls/user/hour
 * 
 * ### Instagram Platform API (replacement for Basic Display)
 * - Consumer-facing, limited scope
 * - No live comment access at all
 * 
 * ### Possible Workarounds
 * 1. **Browser automation** — Scrape live comments from instagram.com/live
 *    - Fragile, against ToS, breaks frequently
 *    - Libraries like `instagram-private-api` exist but are unofficial
 * 2. **Meta Spark / Messenger Platform** — No live comment access
 * 3. **Third-party services** — Some tools (Restream, Socialstream.ninja) claim
 *    Instagram Live support but typically use browser automation internally
 * 4. **Instagram API waitlist** — Meta occasionally grants expanded access
 *    for specific use cases (apply at developers.facebook.com)
 * 
 * ### Recommendation
 * Monitor Meta's developer changelog for live comment API availability.
 * If needed urgently, consider Socialstream.ninja integration (browser-based, 
 * outputs to a local WebSocket that StreamForge could consume).
 * 
 * @see https://developers.facebook.com/docs/instagram-api/
 * @see https://developers.facebook.com/docs/instagram-platform
 */

import { EventEmitter } from 'events';

export default class InstagramChat extends EventEmitter {
  constructor(config = {}) {
    super();
    this.username = config.username || null;
    this.running = false;
    this.platform = 'instagram';
  }

  async start() {
    console.warn(
      '[instagram] ⚠️  Instagram Live comment API is not available. ' +
      'This is a stub — see src/platforms/instagram.js for details and workarounds.'
    );
    this.running = true;
    this.emit('debug', 'Instagram stub started (no live comment API available)');
  }

  async stop() {
    this.running = false;
    this.emit('debug', 'Instagram stub stopped');
  }

  /**
   * Simulate a comment for testing/demo purposes.
   * Call this manually to test the pipeline with Instagram-formatted comments.
   */
  injectTestComment(message, author = 'test_user') {
    const comment = {
      id: `ig-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      platform: 'instagram',
      author,
      message,
      avatar: '',
      timestamp: new Date().toISOString(),
      raw: { source: 'test-injection' },
    };
    this.emit('comment', comment);
    return comment;
  }
}
