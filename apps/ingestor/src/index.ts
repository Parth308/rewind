import express from 'express';
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

// Serve the built tracker.js bundle so any HTML page can load it
const trackerBuildPath = path.resolve(__dirname, '../../../tracker/dist');
if (existsSync(trackerBuildPath)) {
  app.use('/tracker', express.static(trackerBuildPath));
  console.log('Serving tracker from', trackerBuildPath);
} else {
  console.warn('Tracker not built yet. Run: pnpm -F @rewind/tracker build');
}

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

  ws.on('message', async (message) => {
    try {
      const payload = JSON.parse(message.toString());
      await eventsQueue.add('process_batch', {
        projectId: project.id,
        payload
      });
    } catch (e) {
      console.error('Failed to parse WebSocket message', e);
    }
  });
});

app.post('/ingest/:token', async (req, res) => {
  const { token } = req.params;
  
  const projectList = await db.select().from(projects).where(eq(projects.token, token));
  if (projectList.length === 0) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  const project = projectList[0];

  try {
    await eventsQueue.add('process_batch', {
      projectId: project.id,
      payload: req.body
    });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to enqueue' });
  }
});

server.listen(PORT, () => {
  console.log(`Ingestor running on port ${PORT}`);
});
