# StreamForge

**AI-powered social media aggregator for vMix.** The vMix Social replacement that actually works.

Pulls comments from YouTube, Twitch, TikTok (and more), runs AI content moderation, and pushes the good stuff to your vMix broadcast.

---

## Why StreamForge?

vMix Social hasn't been updated in years. It's the #1 complaint in the vMix community. StreamForge fixes that:

- ✅ **Multi-platform** — YouTube, Twitch, TikTok, more coming
- ✅ **AI moderation** — Local LLM filters spam, highlights the best comments
- ✅ **vMix native** — Pushes via XML Data Source and HTTP API
- ✅ **Church mode** — Strict content filtering for family-friendly productions
- ✅ **Real-time dashboard** — See and manage your feed live
- ✅ **Zero cloud** — Runs entirely on your machine

---

## Quick Start

```bash
# Install dependencies
npm install

# Configure
cp config/.env.example .env
# Edit .env with your API keys and vMix settings

# Run
npm start
```

Open http://localhost:4242 for the dashboard.

---

## vMix Setup

### Option 1: Data Source (Recommended)
1. In vMix: **Add Input → Data Source → URL**
2. Enter: `http://localhost:4242/vmix/feed.xml`
3. Map fields (Author, Message, Platform) to your title template
4. StreamForge keeps the XML updated automatically

### Option 2: Direct Title Push
1. Set `VMIX_INPUT` in `.env` to your title input name
2. StreamForge pushes highlighted comments directly to that input
3. Works best with a "Lower Third" or "Social Comment" title

---

## AI Moderation

StreamForge uses Ollama (local LLM) for content moderation:

- **Standard mode** — blocks spam, hate speech, harassment
- **Strict mode** (`STRICT_MODE=true`) — family-friendly, perfect for churches

Automatically highlights questions and engaging comments for TD attention.

**Requires:** [Ollama](https://ollama.ai) running locally with `llama3.2` installed.
Falls back to rule-based filtering if Ollama is unavailable.

---

## Platform Setup

### YouTube
1. Get an API key at https://console.cloud.google.com
2. Enable YouTube Data API v3
3. Get your Live Chat ID from YouTube Studio
4. Add to `.env`: `YOUTUBE_API_KEY=...` and `YOUTUBE_LIVE_CHAT_ID=...`

### Twitch
1. Set `TWITCH_CHANNEL=yourchannel` in `.env`
2. For anonymous read-only, no tokens needed
3. For moderation actions, generate an OAuth token at https://twitchtokengenerator.com

### TikTok
1. Set `TIKTOK_USERNAME=yourusername` in `.env`
2. Uses unofficial TikTok Live connection (no API key needed)

---

## Architecture

```
Platform APIs ──→ Connectors ──→ Feed Manager ──→ vMix HTTP API
                                      │                 ↑
                               AI Moderator      XML Data Source
                                      │
                              WebSocket Server
                                      │
                               Dashboard UI
```

---

## Roadmap

- [ ] Instagram Live support
- [ ] YouTube OAuth (for moderation actions)
- [ ] X/Twitter integration
- [ ] Replay/queue system (hold comments for later)
- [ ] OBS integration (via obs-websocket)
- [ ] Template designer for vMix title overlays
- [ ] Multi-show management

---

## License

MIT

---

*Built for the vMix community by someone who's actually run live productions.*
