/**
 * X (Twitter) Integration — Platform Stub
 * 
 * STATUS: STUB — X API requires paid access for any useful streaming.
 * 
 * ## X API Tiers (as of Feb 2026)
 * 
 * ### Free Tier ($0/mo)
 * - Write-only: post tweets, delete tweets
 * - NO read access, NO search, NO streaming
 * - Useless for StreamForge
 * 
 * ### Basic Tier ($100/mo)
 * - 10,000 tweet reads/month
 * - Search recent tweets (last 7 days)
 * - NO filtered stream (real-time)
 * - **Viable approach:** Poll search endpoint for hashtag/mention tracking
 *   - e.g., search `#YourShow OR @YourShow` every 15-30 seconds
 *   - ~10K reads/month = ~330/day = ~14/hour of polling
 *   - Enough for a weekly show, tight for daily streaming
 * 
 * ### Pro Tier ($5,000/mo)
 * - 1,000,000 tweet reads/month
 * - Full-archive search
 * - Filtered stream (real-time, up to 25 rules)
 * - **Best approach:** Filtered stream with rules like:
 *   - `#YourShow` — track show hashtag
 *   - `@YourAccount` — track mentions
 *   - Real-time delivery, no polling needed
 * 
 * ### Enterprise Tier (custom pricing)
 * - Higher volumes, compliance endpoints
 * - Overkill for live production use
 * 
 * ## Recommendation
 * - **Most productions:** Basic tier ($100/mo) with search polling
 *   - Poll every 30s for `#hashtag OR @mention`
 *   - Good enough for weekly shows
 * - **High-volume / daily shows:** Pro tier if budget allows
 * - **Alternative:** Use a service like Socialstream.ninja which bundles X access
 * 
 * @see https://developer.x.com/en/docs/twitter-api
 */

import { EventEmitter } from 'events';

export default class XChat extends EventEmitter {
  constructor(config = {}) {
    super();
    this.bearerToken = config.bearerToken || process.env.X_BEARER_TOKEN || null;
    this.searchQuery = config.searchQuery || null; // e.g. "#MyShow OR @MyShow"
    this.pollIntervalMs = config.pollIntervalMs || 30000;
    this.running = false;
    this.platform = 'x';
    this._pollTimer = null;
    this._sinceId = null;
  }

  async start() {
    if (!this.bearerToken) {
      console.warn(
        '[x] ⚠️  No X API bearer token configured. ' +
        'X requires a paid API plan ($100+/mo). See src/platforms/x.js for tier details.'
      );
      this.running = true;
      this.emit('debug', 'X stub started (no bearer token — configure X_BEARER_TOKEN)');
      return;
    }

    if (!this.searchQuery) {
      console.warn('[x] ⚠️  No search query configured. Set searchQuery (e.g. "#MyShow OR @MyShow")');
      this.running = true;
      return;
    }

    // Would start polling here with the Basic tier search endpoint:
    // GET https://api.twitter.com/2/tweets/search/recent?query={searchQuery}&since_id={sinceId}
    console.warn('[x] ⚠️  X polling not yet implemented — stub only');
    this.running = true;
    this.emit('debug', `X stub started for query: ${this.searchQuery}`);
  }

  async stop() {
    if (this._pollTimer) {
      clearInterval(this._pollTimer);
      this._pollTimer = null;
    }
    this.running = false;
    this.emit('debug', 'X stub stopped');
  }

  /**
   * Normalize an X API tweet object to StreamForge comment format.
   */
  static normalizeTweet(tweet, includes = {}) {
    const author = includes?.users?.find(u => u.id === tweet.author_id);
    return {
      id: `x-${tweet.id}`,
      platform: 'x',
      author: author?.username || 'unknown',
      message: tweet.text,
      avatar: author?.profile_image_url || '',
      timestamp: tweet.created_at || new Date().toISOString(),
      raw: tweet,
    };
  }

  /**
   * Inject a test comment for pipeline testing.
   */
  injectTestComment(message, author = 'test_user') {
    const comment = {
      id: `x-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      platform: 'x',
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
