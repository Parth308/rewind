import express from 'express';
import zlib from 'zlib';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { z } from 'zod';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { eq } from 'drizzle-orm';
import { projects } from '@rewind/shared';
import path from 'path';
import { existsSync } from 'fs';

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());
// sendBeacon sends text/plain — parse that too
app.use(express.text({ type: 'text/plain', limit: '50mb' }));
// fallback beacon and fetch sending compressed blobs
app.use(express.raw({ type: 'application/octet-stream', limit: '50mb' }));

app.get('/health', async (req, res) => {
  try {
    await redis.ping();
    res.json({ status: 'ok', redis: 'connected' });
  } catch {
    res.status(503).json({ status: 'degraded', redis: 'offline' });
  }
});

import fs from 'fs';

// Serve the built tracker.js bundle so any HTML page can load it
const trackerBuildPath = path.resolve(__dirname, '../../tracker/dist');
app.use('/tracker', express.static(trackerBuildPath));

if (!existsSync(trackerBuildPath)) {
  console.warn('Tracker not built yet. Run: pnpm -F @rewind/tracker build');
} else {
  console.log('Serving tracker from', trackerBuildPath);
}

// Serve pre-built static configuration
app.get('/config/:token.js', async (req, res) => {
  const { token } = req.params;
  
  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Cache-Control', 'public, max-age=60'); // 1 minute max-age

  try {
    // Fast path: Read pre-built script directly from Redis
    const cachedScript = await redis.get(`tracker:config:${token}`);
    if (cachedScript) {
      return res.send(cachedScript);
    }

    // Cache miss: Fallback to DB, generate it, and save to Redis forever
    const projectList = await db.select().from(projects).where(eq(projects.token, token));
    if (projectList.length === 0) {
      return res.status(401).send('console.error("Rewind tracker: Invalid token");');
    }

    const project = projectList[0];
    const settings = (project.settings as any) || {};

    const remoteConfig = {
      maskInputs: settings.maskInputs !== undefined ? settings.maskInputs : true,
      maskSelectors: settings.maskSelectors || [],
      blockSelectors: settings.blockSelectors || [],
      ignoreUrls: settings.ignoreUrls || []
    };

    const configScript = `window.__rewind_remote = ${JSON.stringify(remoteConfig)};\n`;
    
    // Save back to Redis
    await redis.set(`tracker:config:${token}`, configScript);
    
    return res.send(configScript);
  } catch (err) {
    console.error('Failed to serve config', err);
    res.status(500).send('console.error("Rewind tracker: internal error");');
  }
});

const PORT = process.env.PORT || 3001;
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:5433/rewind';

const redis = new Redis(REDIS_URL);
const pool = new Pool({ connectionString: DATABASE_URL });
const db = drizzle(pool);

const eventsQueue = new Queue('events', { connection: redis as any });

const server = createServer(app);
const wss = new WebSocketServer({ server });

wss.on('connection', async (ws, req) => {
  const urlParts = req.url?.split('/') || [];
  const token = urlParts[urlParts.length - 1];

  if (!token) {
    ws.close(1008, 'Token required');
    return;
  }

  // Validate token
  const projectList = await db.select().from(projects).where(eq(projects.token, token));
  if (projectList.length === 0) {
    ws.close(1008, 'Invalid token');
    return;
  }
  const project = projectList[0];

  ws.on('message', async (message: Buffer, isBinary: boolean) => {
    try {
      let payloadStr: string;
      if (isBinary) {
        payloadStr = zlib.gunzipSync(message).toString('utf-8');
      } else {
        payloadStr = message.toString();
      }
      const payload = JSON.parse(payloadStr);
      await eventsQueue.add('process_batch', {
        projectId: project.id,
        payload
      });
    } catch (e) {
      console.error('Failed to parse WebSocket message', e);
    }
  });
});

app.post('/ingest/:token', async (req, res) =>
{
  const { token } = req.params;
  
  const projectList = await db.select().from(projects).where(eq(projects.token, token));
  if (projectList.length === 0) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  const project = projectList[0];

  try {
    let payload;
    if (Buffer.isBuffer(req.body)) {
      const unzipped = zlib.gunzipSync(req.body).toString('utf-8');
      payload = JSON.parse(unzipped);
    } else {
      payload = req.body;
      if (typeof payload === 'string') {
        try { payload = JSON.parse(payload); } catch { /* leave as-is */ }
      }
    }
    
    if (payload?.isFinal) {
      console.log(`[Ingestor] isFinal=true received for session ${payload.sessionId} — will trigger embedding`);
    }

    await eventsQueue.add('process_batch', {
      projectId: project.id,
      payload,
    });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to enqueue' });
  }
});

server.listen(PORT, () => {
  console.log(`Ingestor running on port ${PORT}`);
});
