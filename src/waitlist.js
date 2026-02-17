/**
 * Waitlist Backend
 * Simple email collection with JSON file storage.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');
const WAITLIST_FILE = join(DATA_DIR, 'waitlist.json');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function loadWaitlist() {
  if (!existsSync(WAITLIST_FILE)) return [];
  try {
    return JSON.parse(readFileSync(WAITLIST_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

function saveWaitlist(list) {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(WAITLIST_FILE, JSON.stringify(list, null, 2));
}

/**
 * Register waitlist routes on an Express app.
 * @param {import('express').Express} app
 */
export function registerWaitlistRoutes(app) {
  app.post('/api/waitlist', (req, res) => {
    const { email } = req.body || {};

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Email is required' });
    }

    const trimmed = email.trim().toLowerCase();

    if (!EMAIL_RE.test(trimmed)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const list = loadWaitlist();

    if (list.some(e => e.email === trimmed)) {
      return res.json({ message: 'Already on the waitlist', count: list.length });
    }

    list.push({ email: trimmed, joinedAt: new Date().toISOString() });
    saveWaitlist(list);

    return res.json({ message: 'Added to waitlist', count: list.length });
  });
}
