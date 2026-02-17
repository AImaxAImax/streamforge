/**
 * AI Content Moderator
 * Uses local Ollama (llama3.2 for speed, configurable) to:
 * 1. Filter spam/inappropriate content
 * 2. Highlight the best/most engaging comments
 * 3. Sanitize before display
 *
 * Falls back to rule-based filtering if Ollama is unavailable
 */

import ollama from 'ollama';

// Simple rule-based blocklist for fallback
const BLOCKED_PATTERNS = [
  /\b(spam|buy now|click here|free money|onlyfans)\b/i,
  /https?:\/\/[^\s]+ https?:\/\//i, // multiple links
];

const SPAM_PATTERNS = [
  /^(.)\1{10,}$/,         // repeated characters: "aaaaaaaaaa"
  /^\W+$/,                // only symbols
  /first\s*!+$/i,         // "first!" spam
];

export class ContentModerator {
  constructor(options = {}) {
    this.model = options.model || 'llama3.2';
    this.useAI = options.useAI !== false;
    this.strictMode = options.strictMode || false; // stricter for churches
    this.cache = new Map(); // cache moderation results
    this.aiAvailable = false;

    this.systemPrompt = this.strictMode
      ? `You moderate live stream comments for a church or family-friendly broadcast. 
         Reply with JSON: {"allow": true/false, "highlight": true/false, "reason": "brief reason"}
         Block: profanity, hate speech, spam, sexual content, anything not family-friendly.
         Highlight: genuine questions, meaningful comments, on-topic engagement.`
      : `You moderate live stream comments for a production broadcast.
         Reply with JSON: {"allow": true/false, "highlight": true/false, "reason": "brief reason"}
         Block: spam, hate speech, harassment, repetitive messages, self-promotion.
         Highlight: insightful questions, interesting reactions, genuinely engaging comments.`;
  }

  async init() {
    // Check if Ollama is available
    try {
      await ollama.list();
      this.aiAvailable = true;
      console.log(`[moderator] AI moderation ready (model: ${this.model})`);
    } catch {
      console.warn('[moderator] Ollama not available, using rule-based moderation');
      this.aiAvailable = false;
    }
  }

  // Moderate a single comment
  async moderate(comment) {
    const cacheKey = `${comment.author}:${comment.message}`;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    // Always run rule-based checks first (fast)
    const ruleResult = this.ruleCheck(comment);
    if (!ruleResult.allow) {
      this.cache.set(cacheKey, ruleResult);
      return ruleResult;
    }

    // AI moderation if available
    if (this.useAI && this.aiAvailable) {
      try {
        const aiResult = await this.aiCheck(comment);
        this.cache.set(cacheKey, aiResult);
        return aiResult;
      } catch (err) {
        console.warn(`[moderator] AI check failed, using rule result: ${err.message}`);
      }
    }

    this.cache.set(cacheKey, ruleResult);
    return ruleResult;
  }

  // Rule-based moderation (fast, no AI)
  ruleCheck(comment) {
    const msg = comment.message || '';

    // Block obvious spam
    for (const pattern of BLOCKED_PATTERNS) {
      if (pattern.test(msg)) {
        return { allow: false, highlight: false, reason: 'blocked pattern' };
      }
    }

    for (const pattern of SPAM_PATTERNS) {
      if (pattern.test(msg)) {
        return { allow: false, highlight: false, reason: 'spam pattern' };
      }
    }

    // Too short to be interesting
    if (msg.trim().length < 2) {
      return { allow: false, highlight: false, reason: 'too short' };
    }

    // Highlight questions (simple heuristic)
    const highlight = msg.includes('?') && msg.length > 15;

    return { allow: true, highlight, reason: 'passed rules' };
  }

  // AI moderation via Ollama
  async aiCheck(comment) {
    const prompt = `Comment from ${comment.author} on ${comment.platform}:\n"${comment.message}"\n\nModerate this comment.`;

    const response = await ollama.chat({
      model: this.model,
      messages: [
        { role: 'system', content: this.systemPrompt },
        { role: 'user', content: prompt },
      ],
      options: { temperature: 0.1 }, // low temp for consistent moderation
    });

    const text = response.message.content.trim();

    // Parse JSON response
    const jsonMatch = text.match(/\{[^}]+\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    // Fallback if JSON parse fails
    return { allow: true, highlight: false, reason: 'ai parse failed' };
  }

  // Batch moderate multiple comments
  async moderateBatch(comments) {
    const results = await Promise.all(
      comments.map(async (c) => {
        const result = await this.moderate(c);
        return { ...c, ...result };
      })
    );
    return results.filter((c) => c.allow);
  }

  clearCache() {
    this.cache.clear();
  }
}
