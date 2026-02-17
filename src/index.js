/**
 * StreamForge — AI-Powered Social Media Aggregator for vMix
 * 
 * Usage:
 *   node src/index.js
 *   
 * Configure via .env file (see config/.env.example)
 */

import 'dotenv/config';
import { FeedManager } from './feed.js';
import { StreamForgeServer } from './server.js';

async function main() {
  console.log('🎬 StreamForge v0.1.0 starting...');

  // Config from environment
  const config = {
    // Server
    port: parseInt(process.env.PORT) || 4242,

    // vMix
    vmixHost: process.env.VMIX_HOST || 'localhost',
    vmixPort: parseInt(process.env.VMIX_PORT) || 8088,
    vmixInput: process.env.VMIX_INPUT || null,
    pushToVmix: process.env.PUSH_TO_VMIX !== 'false',

    // Moderation
    moderationEnabled: process.env.MODERATION !== 'false',
    strictMode: process.env.STRICT_MODE === 'true',
    aiModel: process.env.AI_MODEL || 'llama3.2',

    // Feed
    maxFeedSize: parseInt(process.env.MAX_FEED_SIZE) || 50,
  };

  // Initialize feed manager
  const feed = new FeedManager(config);
  await feed.init();

  // Load platform connectors dynamically
  const platforms = [];

  if (process.env.YOUTUBE_API_KEY || process.env.YOUTUBE_LIVE_CHAT_ID) {
    try {
      const { YouTubePlatform } = await import('./platforms/youtube.js');
      const yt = new YouTubePlatform({
        apiKey: process.env.YOUTUBE_API_KEY,
        liveChatId: process.env.YOUTUBE_LIVE_CHAT_ID,
      });
      yt.on('comment', (c) => feed.addComment(c));
      platforms.push(yt);
      console.log('[main] YouTube platform loaded');
    } catch (e) {
      console.warn('[main] YouTube platform failed to load:', e.message);
    }
  }

  if (process.env.TWITCH_CHANNEL) {
    try {
      const { TwitchPlatform } = await import('./platforms/twitch.js');
      const twitch = new TwitchPlatform({
        channel: process.env.TWITCH_CHANNEL,
        accessToken: process.env.TWITCH_ACCESS_TOKEN,
        username: process.env.TWITCH_USERNAME || 'justinfan12345',
      });
      twitch.on('comment', (c) => feed.addComment(c));
      platforms.push(twitch);
      console.log('[main] Twitch platform loaded');
    } catch (e) {
      console.warn('[main] Twitch platform failed to load:', e.message);
    }
  }

  if (process.env.TIKTOK_USERNAME) {
    try {
      const { TikTokPlatform } = await import('./platforms/tiktok.js');
      const tiktok = new TikTokPlatform({
        username: process.env.TIKTOK_USERNAME,
      });
      tiktok.on('comment', (c) => feed.addComment(c));
      platforms.push(tiktok);
      console.log('[main] TikTok platform loaded');
    } catch (e) {
      console.warn('[main] TikTok platform failed to load:', e.message);
    }
  }

  if (platforms.length === 0) {
    console.warn('[main] No platforms configured — running in demo mode');
    // Start demo mode: inject fake comments to test the pipeline
    startDemoMode(feed);
  }

  // Start all platforms
  for (const platform of platforms) {
    await platform.start();
  }

  // Start HTTP/WebSocket server
  const server = new StreamForgeServer(feed, config);
  await server.start();

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n[main] Shutting down...');
    for (const platform of platforms) {
      await platform.stop?.();
    }
    feed.stop();
    process.exit(0);
  });

  console.log('✅ StreamForge ready');
  console.log(`   Dashboard:      http://localhost:${config.port}`);
  console.log(`   vMix data src:  http://localhost:${config.port}/vmix/feed.xml`);
  console.log(`   vMix host:      ${config.vmixHost}:${config.vmixPort}`);
  console.log(`   Moderation:     ${config.moderationEnabled ? 'AI' : 'rules only'} (${config.strictMode ? 'strict' : 'standard'})`);
}

// Demo mode: inject fake comments to test pipeline without live streams
function startDemoMode(feed) {
  console.log('[demo] Starting demo mode — injecting test comments');

  const demoComments = [
    { platform: 'youtube', author: 'ChurchTech42', message: 'Great production quality today! 🙏', avatar: '' },
    { platform: 'twitch', author: 'esports_fan', message: 'Can we get a replay of that last round?', avatar: '' },
    { platform: 'youtube', author: 'StreamNerd', message: 'What switcher are you using?', avatar: '' },
    { platform: 'tiktok', author: 'viewer123', message: 'This is so cool how do you do this', avatar: '' },
    { platform: 'twitch', author: 'spambot', message: 'BUY FOLLOWERS NOW CLICK HERE', avatar: '' },
    { platform: 'youtube', author: 'TechDirector', message: 'NDI is a game changer for remote production', avatar: '' },
    { platform: 'youtube', author: 'FirstTimer', message: 'first!!!!!!!!!!!!!!!!', avatar: '' },
  ];

  let i = 0;
  setInterval(() => {
    const base = demoComments[i % demoComments.length];
    feed.addComment({
      ...base,
      id: `demo-${Date.now()}`,
      authorId: base.author,
      timestamp: new Date().toISOString(),
      raw: {},
    });
    i++;
  }, 3000);
}

main().catch((err) => {
  console.error('[main] Fatal error:', err);
  process.exit(1);
});
