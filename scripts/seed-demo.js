#!/usr/bin/env node
/**
 * Rewind Demo Seed Script
 * -----------------------
 * Run this script against your production Neon/Supabase database to populate
 * it with realistic demo session data so the live dashboard looks great.
 *
 * Usage:
 *   node scripts/seed-demo.js
 *
 * Requirements:
 *   - DATABASE_URL set in your environment (or .env file in project root)
 */

import 'dotenv/config';
import pg from 'pg';
import { randomUUID, randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';

const { Pool } = pg;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const query = (text, params) => pool.query(text, params);

// ─── Helpers ──────────────────────────────────────────────────────────────────
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[rand(0, arr.length - 1)];
const bool = (prob = 0.5) => Math.random() < prob;
const now = () => new Date();
const minsAgo = (m) => new Date(Date.now() - m * 60 * 1000);
const daysAgo = (d) => new Date(Date.now() - d * 24 * 60 * 60 * 1000);

// ─── Demo Data Pools ──────────────────────────────────────────────────────────
const BROWSERS = ['Chrome 124', 'Firefox 125', 'Safari 17', 'Edge 123', 'Chrome 123'];
const OS_LIST = ['macOS 14', 'Windows 11', 'Windows 10', 'Ubuntu 22.04', 'iOS 17'];
const DEVICES = ['desktop', 'desktop', 'desktop', 'mobile', 'tablet'];
const COUNTRIES = ['US', 'GB', 'DE', 'IN', 'CA', 'AU', 'FR', 'JP', 'BR', 'NL'];
const TAGS = ['checkout', 'onboarding', 'error', 'rage', 'support', 'premium'];
const REFERRERS = [
  'https://google.com/search',
  'https://twitter.com',
  'https://github.com/Parth308/rewind',
  'https://reddit.com/r/webdev',
  null,
];
const ENTRY_URLS = [
  'https://demo.myapp.io/',
  'https://demo.myapp.io/pricing',
  'https://demo.myapp.io/features',
  'https://demo.myapp.io/signup',
  'https://demo.myapp.io/blog/getting-started',
];
const ERROR_MESSAGES = [
  'TypeError: Cannot read properties of undefined (reading \'map\')',
  'ReferenceError: stripeLoaded is not defined',
  'UnhandledPromiseRejectionWarning: Network request to /api/checkout failed',
  'SyntaxError: Unexpected token < in JSON at position 0',
  'Error: Payment gateway timeout after 30000ms',
];
const NETWORK_URLS = [
  { url: '/api/auth/session', method: 'GET', statuses: [200, 200, 200, 401] },
  { url: '/api/checkout', method: 'POST', statuses: [200, 200, 422, 500] },
  { url: '/api/user/profile', method: 'GET', statuses: [200, 200] },
  { url: '/api/products', method: 'GET', statuses: [200, 200, 200] },
  { url: '/api/cart', method: 'PUT', statuses: [200, 400] },
  { url: 'https://api.stripe.com/v1/payment_intents', method: 'POST', statuses: [200, 402] },
];
const CONSOLE_MESSAGES = [
  { level: 'log', message: '[Analytics] Page view tracked: /checkout' },
  { level: 'warn', message: 'Stripe.js loaded asynchronously — checkout may be delayed' },
  { level: 'error', message: 'Failed to load resource: the server responded with a status of 500' },
  { level: 'log', message: '[Cart] Item added: prod_abc123 qty:1' },
  { level: 'info', message: 'User identified: user_12345' },
  { level: 'error', message: 'Uncaught TypeError: Cannot read properties of null (reading "focus")' },
];
const AI_NARRATIVES = [
  'User landed on the homepage via a Google search, browsed the pricing page for 45 seconds, then navigated to the signup flow. They rage-clicked the "Get Started" button 3 times before the form validated correctly.',
  'A premium user viewed their account settings and attempted to update their billing information. A network request to /api/checkout returned a 500 error, causing the session to end abruptly.',
  'Mobile user from the UK spent 3 minutes on the onboarding flow. They skipped the tutorial, navigated directly to the main dashboard, and successfully completed the setup wizard.',
  'User exhibiting frustration signals: 4 rage clicks detected on the payment form submit button. Console errors show a Stripe.js initialization failure. Session ended without completing checkout.',
  'New user from Germany completed the full onboarding flow in under 2 minutes. Zero errors, smooth navigation path from /signup → /setup → /dashboard.',
];

// ─── Main ─────────────────────────────────────────────────────────────────────
async function seed() {
  console.log('🌱 Starting Rewind demo seed...\n');

  // 1. Create Demo User ─────────────────────────────────────────────────────
  console.log('👤 Creating demo admin user...');
  const userId = randomUUID();
  const passwordHash = await bcrypt.hash('demo-password-123', 10);
  
  await query(`
    INSERT INTO users (id, email, password_hash, name, role)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
    RETURNING id
  `, [userId, 'demo@rewind.io', passwordHash, 'Demo User', 'owner']);

  // Fetch the real user ID in case it already existed
  const userRes = await query(`SELECT id FROM users WHERE email = 'demo@rewind.io'`);
  const realUserId = userRes.rows[0].id;
  console.log(`   ✅ User: demo@rewind.io (id: ${realUserId})\n`);

  // 2. Create Demo Projects ─────────────────────────────────────────────────
  console.log('📦 Creating demo projects...');
  const projectNames = ['E-Commerce Frontend', 'Marketing Site', 'SaaS Dashboard Beta'];
  const projectIds = [];

  for (const name of projectNames) {
    const projectId = randomUUID();
    const token = randomBytes(32).toString('hex');
    await query(`
      INSERT INTO projects (id, user_id, name, token)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT DO NOTHING
    `, [projectId, realUserId, name, token]);
    const pRes = await query(`SELECT id FROM projects WHERE name = $1 AND user_id = $2`, [name, realUserId]);
    projectIds.push(pRes.rows[0].id);
    console.log(`   ✅ Project: "${name}"`);
  }
  console.log();

  // 3. Create Demo Sessions ─────────────────────────────────────────────────
  console.log('🎬 Seeding 80 demo sessions across projects...');
  const sessionIds = [];

  for (let i = 0; i < 80; i++) {
    const sessionId = randomUUID();
    const projectId = pick(projectIds);
    const durationMs = rand(5000, 720000); // 5s to 12min
    const startedAt = daysAgo(rand(0, 30));
    const endedAt = new Date(startedAt.getTime() + durationMs);
    const hasRageClicks = bool(0.18);
    const hasDeadClicks = bool(0.22);
    const hasUTurns = bool(0.15);
    const hasWildScrolling = bool(0.12);
    const errorCount = bool(0.25) ? rand(1, 5) : 0;
    const tags = bool(0.4) ? [pick(TAGS)] : [];
    const userId = bool(0.6) ? `user_${rand(1000, 9999)}` : null;

    await query(`
      INSERT INTO sessions (
        id, project_id, started_at, ended_at, duration_ms, page_count, error_count,
        country, browser, os, device, screen_width, screen_height, referrer, entry_url,
        user_id, has_rage_clicks, has_dead_clicks, has_u_turns, has_wild_scrolling,
        status, tags, notes, created_at, updated_at
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,
        'completed',$21,$22,$3,$3
      ) ON CONFLICT DO NOTHING
    `, [
      sessionId, projectId, startedAt, endedAt, durationMs,
      rand(1, 12), errorCount,
      pick(COUNTRIES), pick(BROWSERS), pick(OS_LIST), pick(DEVICES),
      pick([1280, 1440, 1920, 390, 768]), pick([720, 900, 1080, 844, 1024]),
      pick(REFERRERS), pick(ENTRY_URLS),
      userId,
      hasRageClicks, hasDeadClicks, hasUTurns, hasWildScrolling,
      JSON.stringify(tags),
      bool(0.3) ? pick(AI_NARRATIVES) : null,
    ]);

    sessionIds.push({ sessionId, startedAt: startedAt.getTime() });
  }
  console.log(`   ✅ Seeded 80 sessions\n`);

  // 4. Seed Events (DOM snapshots) ──────────────────────────────────────────
  console.log('⚡ Seeding DOM events...');
  let eventCount = 0;
  for (const { sessionId, startedAt } of sessionIds.slice(0, 30)) { // Only for first 30 for speed
    const numEvents = rand(5, 20);
    for (let e = 0; e < numEvents; e++) {
      const ts = startedAt + e * rand(500, 5000);
      await query(`
        INSERT INTO events (id, session_id, type, timestamp, data)
        VALUES ($1, $2, $3, $4, $5)
      `, [
        randomUUID(), sessionId,
        pick([2, 3, 3, 3, 4]), // 2=fullSnapshot, 3=incrementalSnapshot, 4=meta
        ts,
        JSON.stringify({ source: rand(0, 8), type: rand(1, 6) }),
      ]);
      eventCount++;
    }
  }
  console.log(`   ✅ Seeded ${eventCount} events\n`);

  // 5. Seed Console Logs ────────────────────────────────────────────────────
  console.log('📋 Seeding console logs...');
  let logCount = 0;
  for (const { sessionId, startedAt } of sessionIds.slice(0, 50)) {
    const numLogs = rand(2, 8);
    for (let l = 0; l < numLogs; l++) {
      const log = pick(CONSOLE_MESSAGES);
      const ts = startedAt + l * rand(1000, 15000);
      await query(`
        INSERT INTO console_logs (id, session_id, level, message, timestamp)
        VALUES ($1, $2, $3, $4, $5)
      `, [randomUUID(), sessionId, log.level, log.message, ts]);
      logCount++;
    }
  }
  console.log(`   ✅ Seeded ${logCount} console log entries\n`);

  // 6. Seed Network Requests ────────────────────────────────────────────────
  console.log('🌐 Seeding network requests...');
  let netCount = 0;
  for (const { sessionId, startedAt } of sessionIds.slice(0, 50)) {
    const numReqs = rand(3, 10);
    for (let n = 0; n < numReqs; n++) {
      const endpoint = pick(NETWORK_URLS);
      const status = pick(endpoint.statuses);
      const ts = startedAt + n * rand(500, 8000);
      await query(`
        INSERT INTO network_requests (id, session_id, url, method, status, duration, timestamp)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [randomUUID(), sessionId, endpoint.url, endpoint.method, status, rand(40, 2500), ts]);
      netCount++;
    }
  }
  console.log(`   ✅ Seeded ${netCount} network requests\n`);

  // 7. Seed Errors ──────────────────────────────────────────────────────────
  console.log('🐛 Seeding errors...');
  let errCount = 0;
  for (const { sessionId, startedAt } of sessionIds) {
    if (bool(0.25)) {
      const numErrors = rand(1, 3);
      for (let err = 0; err < numErrors; err++) {
        const msg = pick(ERROR_MESSAGES);
        const ts = startedAt + rand(5000, 60000);
        await query(`
          INSERT INTO errors (id, session_id, message, stack, source, line, col, timestamp)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          randomUUID(), sessionId, msg,
          `Error: ${msg}\n    at checkout (main.js:${rand(100, 900)})\n    at EventEmitter.emit (events.js:314)`,
          'main.js', rand(50, 900), rand(1, 80), ts,
        ]);
        errCount++;
      }
    }
  }
  console.log(`   ✅ Seeded ${errCount} errors\n`);

  // ─── Done! ────────────────────────────────────────────────────────────────
  await pool.end();
  console.log('─────────────────────────────────────────────────');
  console.log('✅  Demo seed complete!');
  console.log('');
  console.log('   Dashboard Login:   demo@rewind.io');
  console.log('   Password:          demo-password-123');
  console.log('');
  console.log('   Or enable NEXT_PUBLIC_DEMO_MODE=true on Vercel');
  console.log('   and visitors can enter via the demo button!');
  console.log('─────────────────────────────────────────────────');
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
