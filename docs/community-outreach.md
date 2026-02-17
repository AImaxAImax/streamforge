# StreamForge — Community Outreach Templates

Copy-paste posts for validating demand before investing more build time.
Goal: 20+ responses + 100 waitlist signups before writing production code.

---

## Post 1: r/VIDEOENGINEERING

**Title:** Built a vMix Social replacement with AI content moderation — looking for beta testers

**Body:**
Hey all,

Long-time lurker, live production tech (IATSE). Been frustrated with vMix Social for years — it's basically abandoned and doesn't support TikTok, has zero moderation, and the UX is stuck in 2019.

Built a replacement called StreamForge. Here's what it does:

- Pulls from YouTube, Twitch, TikTok simultaneously (Instagram WIP)
- AI content moderation via local LLM — runs on your machine, no cloud, strict mode for churches
- Pushes to vMix via XML Data Source or direct HTTP API
- Real-time dashboard in any browser (second monitor friendly)
- Auto-highlights interesting questions so your TD doesn't miss them

It's open source (MIT) and runs as a local Node.js server.

**Questions for you:**
1. Do you use vMix Social in your productions? What do you hate about it?
2. What platforms do your audiences use most?
3. Would AI moderation (especially for churches/family content) be valuable to you?
4. What would you pay for something like this? ($0/free, $10-20/mo, $50-100 one-time?)

GitHub: https://github.com/AImaxAImax/streamforge
Waitlist: [link]

Happy to answer questions and would love feedback from working engineers.

---

## Post 2: r/vmix (or vMix Forums)

**Title:** StreamForge beta — modern replacement for vMix Social with AI moderation

**Body:**
Hi vMix community,

vMix Social hasn't been updated in years and it's the most requested fix on the forums. I got frustrated enough to build a replacement.

**StreamForge** connects to YouTube, Twitch, and TikTok simultaneously, filters comments with local AI, and feeds into vMix via Data Source XML.

Setup is literally: run the app → add `http://localhost:4242/vmix/feed.xml` as a Data Source in vMix → map fields to your title template. That's it.

**Features:**
✅ Multi-platform (YouTube, Twitch, TikTok live)
✅ AI spam/profanity filtering (runs locally, no cloud)  
✅ Strict "church mode" for family-friendly productions
✅ Auto-highlights best comments for your TD
✅ Real-time dashboard
✅ Open source, free during beta

Would love to get feedback from vMix users. What features would make this actually useful for your productions?

GitHub: https://github.com/AImaxAImax/streamforge

---

## Post 3: Church AV Facebook Groups / r/ChurchAV

**Title:** Free tool for churches: AI-filtered social media comments in vMix

**Body:**
Hey church tech folks,

Know the struggle: you're trying to display audience comments during your live stream but vMix Social is outdated and has zero content filtering. Someone drops an inappropriate comment and it almost makes it to screen.

Built StreamForge specifically with this use case in mind:

**Church Mode** — Strict AI filtering catches profanity, inappropriate content, and spam before it ever reaches your broadcast. Runs entirely on your local machine (no data sent anywhere).

**Multi-platform** — Shows YouTube, Twitch, and TikTok comments in one unified dashboard. Most church streams use YouTube but your congregation might be on multiple platforms.

**vMix native** — Drop-in replacement for vMix Social. Just add the data source URL and map to your title template.

Free during beta. Open source.

GitHub: https://github.com/AImaxAImax/streamforge
Waitlist for updates: [link]

Question for the community: what's your current setup for displaying audience comments during service? What's broken about it?

---

## Post 4: Esports/Gaming Production Communities

**Title:** StreamForge — multi-platform chat aggregator for production teams (vMix/OBS)

**Body:**
For the esports production folks:

Running multiple chat sources during a tournament broadcast is a pain — Twitch chat, YouTube, TikTok, all in separate windows while you're trying to produce. Built StreamForge to fix this.

Single dashboard, all platforms, AI filters the noise. Pushes to vMix or OBS via data source/WebSocket. 

Free and open source: https://github.com/AImaxAImax/streamforge

Would love to know: how are you currently handling social integration in your broadcasts? What's your biggest pain point?

---

## YouTube Community Post (if Josh has a channel)

**Draft:**
I've been frustrated with vMix Social for years — it's basically unmaintained. So I built a replacement.

StreamForge pulls from YouTube, Twitch, and TikTok simultaneously, uses AI to filter comments (runs locally, no cloud), and feeds directly into vMix via Data Source.

If you do live production with vMix, I'd love your feedback.

Open source: https://github.com/AImaxAImax/streamforge

---

## DM Template (for vMix Forum Power Users)

**Subject:** Feedback on vMix Social replacement?

Hey [name],

Saw your post about vMix Social being broken. Built a replacement called StreamForge — multi-platform, AI moderation, native vMix integration. It's open source and I'm looking for feedback from working engineers before I put more time into it.

Would you have 10 minutes to try it and tell me if I'm solving the right problem? Happy to help with setup.

GitHub: https://github.com/AImaxAImax/streamforge

---

## Tracking Responses

Use this table to track community feedback:

| Platform | Post Date | Views | Comments | Signups | Key Feedback |
|----------|-----------|-------|----------|---------|--------------|
| r/VIDEOENGINEERING | | | | | |
| vMix Forums | | | | | |
| Church AV FB | | | | | |
| Esports Discord | | | | | |

**Success criteria:** 
- 20+ meaningful responses (not just "nice!")
- 50+ waitlist signups  
- At least 3 people say "I would pay for this"

If you can't get 50 signups from these communities, the market may be smaller than research suggests. That's valuable data too.
