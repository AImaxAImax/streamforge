/**
 * StreamForge HTTP + WebSocket Server
 *
 * Serves:
 * 1. REST API for dashboard
 * 2. WebSocket for real-time dashboard updates
 * 3. vMix XML data source endpoint (vMix polls this)
 * 4. Static dashboard UI
 */

import express from 'express';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export class StreamForgeServer {
  constructor(feed, config = {}) {
    this.feed = feed;
    this.port = config.port || 4242;
    this.app = express();
    this.server = createServer(this.app);
    this.wss = new WebSocketServer({ server: this.server });
    this.clients = new Set();

    this._setupMiddleware();
    this._setupRoutes();
    this._setupWebSocket();
    this._setupFeedEvents();
  }

  _setupMiddleware() {
    this.app.use(express.json());
    this.app.use(express.static(join(__dirname, '../public')));

    // CORS for development
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Headers', 'Content-Type');
      next();
    });
  }

  _setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ status: 'ok', version: '0.1.0' });
    });

    // vMix XML data source endpoint
    // In vMix: Data Sources → Add → URL → http://localhost:4242/vmix/feed.xml
    this.app.get('/vmix/feed.xml', (req, res) => {
      res.set('Content-Type', 'application/xml');
      res.send(this.feed.getXML());
    });

    // REST: get current feed
    this.app.get('/api/feed', (req, res) => {
      const limit = parseInt(req.query.limit) || 20;
      res.json(this.feed.getFeed(limit));
    });

    // REST: get stats
    this.app.get('/api/stats', (req, res) => {
      res.json(this.feed.getStats());
    });

    // REST: highlight a comment
    this.app.post('/api/comments/:id/highlight', (req, res) => {
      this.feed.highlight(req.params.id);
      res.json({ ok: true });
    });

    // REST: pin a comment
    this.app.post('/api/comments/:id/pin', (req, res) => {
      this.feed.pin(req.params.id);
      res.json({ ok: true });
    });

    // REST: clear feed
    this.app.delete('/api/feed', (req, res) => {
      this.feed.clear();
      res.json({ ok: true });
    });

    // Dashboard redirect
    this.app.get('/', (req, res) => {
      res.sendFile(join(__dirname, '../public/index.html'));
    });
  }

  _setupWebSocket() {
    this.wss.on('connection', (ws) => {
      this.clients.add(ws);

      // Send current feed on connect
      ws.send(JSON.stringify({
        type: 'init',
        feed: this.feed.getFeed(50),
        stats: this.feed.getStats(),
      }));

      ws.on('close', () => this.clients.delete(ws));

      ws.on('message', (data) => {
        try {
          const msg = JSON.parse(data);
          this._handleWsMessage(ws, msg);
        } catch (e) {
          // ignore
        }
      });
    });
  }

  _handleWsMessage(ws, msg) {
    switch (msg.type) {
      case 'highlight':
        this.feed.highlight(msg.id);
        break;
      case 'pin':
        this.feed.pin(msg.id);
        break;
      case 'clear':
        this.feed.clear();
        break;
    }
  }

  _setupFeedEvents() {
    // Broadcast new approved comments to all dashboard clients
    this.feed.on('comment:approved', (comment) => {
      this._broadcast({ type: 'comment', comment });
    });

    this.feed.on('comment:highlighted', (comment) => {
      this._broadcast({ type: 'highlighted', comment });
    });

    this.feed.on('comment:pinned', (comment) => {
      this._broadcast({ type: 'pinned', comment });
    });

    this.feed.on('feed:cleared', () => {
      this._broadcast({ type: 'cleared' });
    });

    // Broadcast stats every 5 seconds
    setInterval(() => {
      this._broadcast({ type: 'stats', stats: this.feed.getStats() });
    }, 5000);
  }

  _broadcast(msg) {
    const json = JSON.stringify(msg);
    for (const ws of this.clients) {
      if (ws.readyState === 1) { // OPEN
        ws.send(json);
      }
    }
  }

  start() {
    return new Promise((resolve) => {
      this.server.listen(this.port, () => {
        console.log(`[server] StreamForge running at http://localhost:${this.port}`);
        console.log(`[server] vMix data source: http://localhost:${this.port}/vmix/feed.xml`);
        resolve();
      });
    });
  }
}
