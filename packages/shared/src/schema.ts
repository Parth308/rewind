import {
  pgTable, uuid, varchar, text, integer, bigint, boolean,
  timestamp, jsonb, index, uniqueIndex,
} from 'drizzle-orm/pg-core';
import { customType } from 'drizzle-orm/pg-core';

// ─── USERS ────────────────────────────────────────────────
export const users = pgTable('users', {
  id:            uuid('id').primaryKey().defaultRandom(),
  email:         varchar('email', { length: 255 }).notNull().unique(),
  passwordHash:  varchar('password_hash', { length: 255 }).notNull(),
  name:          varchar('name', { length: 100 }),
  createdAt:     timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt:     timestamp('updated_at', { withTimezone: true }).defaultNow(),
  settings:      jsonb('settings').default({}),
});

// ─── PROJECTS ─────────────────────────────────────────────
export const projects = pgTable('projects', {
  id:            uuid('id').primaryKey().defaultRandom(),
  userId:        uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name:          varchar('name', { length: 100 }).notNull(),
  token:         varchar('token', { length: 64 }).notNull().unique(),
  settings:      jsonb('settings').default({}),
  createdAt:     timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt:     timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  userIdIdx: index('idx_projects_user_id').on(table.userId),
  tokenIdx: index('idx_projects_token').on(table.token),
}));

// ─── SESSIONS ─────────────────────────────────────────────
export const sessions = pgTable('sessions', {
  id:            uuid('id').primaryKey().defaultRandom(),
  projectId:     uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  startedAt:     timestamp('started_at', { withTimezone: true }).notNull(),
  endedAt:       timestamp('ended_at', { withTimezone: true }),
  durationMs:    integer('duration_ms'),
  pageCount:     integer('page_count').default(0),
  errorCount:    integer('error_count').default(0),
  country:       varchar('country', { length: 2 }),
  browser:       varchar('browser', { length: 50 }),
  os:            varchar('os', { length: 50 }),
  device:        varchar('device', { length: 20 }),
  screenWidth:   integer('screen_width'),
  screenHeight:  integer('screen_height'),
  referrer:      text('referrer'),
  entryUrl:      text('entry_url'),
  userId:        text('user_id'),
  metadata:      jsonb('metadata').default({}),
  hasRageClicks: boolean('has_rage_clicks').default(false),
  hasDeadClicks: boolean('has_dead_clicks').default(false),
  hasUTurns: boolean('has_u_turns').default(false),
  hasWildScrolling: boolean('has_wild_scrolling').default(false),
  thumbnailUrl:  text('thumbnail_url'),
  status:        varchar('status', { length: 20 }).default('active'),
  customEvents:  jsonb('custom_events').default([]),
  tags:          jsonb('tags').default([]),
  notes:         text('notes'),
  createdAt:     timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt:     timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  projectIdIdx: index('idx_sessions_project_id').on(table.projectId),
  startedAtIdx: index('idx_sessions_started_at').on(table.projectId, table.startedAt),
  userIdIdx: index('idx_sessions_user_id').on(table.projectId, table.userId),
  errorsIdx: index('idx_sessions_errors').on(table.projectId, table.errorCount),
  rageIdx: index('idx_sessions_rage').on(table.projectId),
  durationIdx: index('idx_sessions_duration').on(table.projectId, table.durationMs),
  browserIdx: index('idx_sessions_browser').on(table.projectId, table.browser),
  countryIdx: index('idx_sessions_country').on(table.projectId, table.country),
}));

// ─── SHARED SESSIONS ──────────────────────────────────────
export const sharedSessions = pgTable('shared_sessions', {
  id:            uuid('id').primaryKey().defaultRandom(),
  sessionId:     uuid('session_id').notNull().references(() => sessions.id, { onDelete: 'cascade' }),
  token:         varchar('token', { length: 64 }).notNull().unique(),
  expiresAt:     timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt:     timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  tokenIdx: index('idx_shared_sessions_token').on(table.token),
}));

// ─── FUNNELS ─────────────────────────────────────────────
export const funnels = pgTable('funnels', {
  id:            uuid('id').primaryKey().defaultRandom(),
  projectId:     uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  name:          varchar('name', { length: 255 }).notNull(),
  description:   text('description'),
  steps:         jsonb('steps').notNull(),
  filters:       jsonb('filters').default({}),
  timeWindowMs:  integer('time_window_ms').default(1800000), // 30 minutes
  createdAt:     timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt:     timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  projectIdIdx: index('idx_funnels_project_id').on(table.projectId),
}));

// ─── DASHBOARD WIDGETS ────────────────────────────────────
export const dashboardWidgets = pgTable('dashboard_widgets', {
  id:            uuid('id').primaryKey().defaultRandom(),
  projectId:     uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }),
  type:          varchar('type', { length: 50 }).notNull(), // 'line_chart', 'stat_card', etc.
  metric:        varchar('metric', { length: 50 }).notNull(), // 'sessions', 'custom_event', 'rage_clicks', 'errors'
  config:        jsonb('config').default({}), // e.g. { eventName: "Checkout", color: "#a3e635" }
  position:      integer('position').default(0),
  createdAt:     timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt:     timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  projectIdIdx: index('idx_widgets_project_id').on(table.projectId),
}));

// ─── SESSION EMBEDDINGS (pgvector) ────────────────────────
export const aiUsageLogs = pgTable('ai_usage_logs', {
  id:               uuid('id').primaryKey().defaultRandom(),
  projectId:        uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  action:           varchar('action', { length: 50 }).notNull(), // 'summarize_session', 'embed_session', 'semantic_search'
  provider:         varchar('provider', { length: 50 }).notNull(), // 'google', 'openai'
  model:            varchar('model', { length: 100 }).notNull(),
  promptTokens:     integer('prompt_tokens').notNull().default(0),
  completionTokens: integer('completion_tokens').notNull().default(0),
  totalTokens:      integer('total_tokens').notNull().default(0),
  createdAt:        timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  projectIdIdx: index('idx_ai_usage_project_id').on(table.projectId),
  createdAtIdx: index('idx_ai_usage_created_at').on(table.createdAt),
}));


export const sessionEmbeddings = pgTable('session_embeddings', {
  id:            uuid('id').primaryKey().defaultRandom(),
  sessionId:     uuid('session_id').notNull().references(() => sessions.id, { onDelete: 'cascade' }),
  narrative:     text('narrative').notNull(),
  // using customType with just 'vector' as data type to see if it fixes the parse issue, 
  // or we can just use the provided pgvector type.
  embedding:     customType<{ data: number[]; driverData: string }>({
    dataType() { return 'vector'; },
    toDriver(value: number[]): string { return JSON.stringify(value); },
    fromDriver(value: string): number[] { return typeof value === 'string' ? JSON.parse(value) : value; }
  })('embedding').notNull(),
  modelUsed:     varchar('model_used', { length: 50 }).notNull(),
  createdAt:     timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  sessionIdIdx: index('idx_embeddings_session_id').on(table.sessionId),
}));

// ─── EVENTS (largest table — ~80% of storage) ─────────────
export const events = pgTable('events', {
  id:            uuid('id').primaryKey().defaultRandom(),
  sessionId:     uuid('session_id').notNull().references(() => sessions.id, { onDelete: 'cascade' }),
  type:          integer('type').notNull(),
  timestamp:     bigint('timestamp', { mode: 'number' }).notNull(),
  data:          jsonb('data').notNull(),
  createdAt:     timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  sessionTimeIdx: index('idx_events_session_time').on(table.sessionId, table.timestamp),
  typeIdx: index('idx_events_type').on(table.sessionId, table.type),
}));

// ─── CONSOLE LOGS ─────────────────────────────────────────
export const consoleLogs = pgTable('console_logs', {
  id:            uuid('id').primaryKey().defaultRandom(),
  sessionId:     uuid('session_id').notNull().references(() => sessions.id, { onDelete: 'cascade' }),
  level:         varchar('level', { length: 10 }).notNull(),
  message:       text('message').notNull(),
  stack:         text('stack'),
  timestamp:     bigint('timestamp', { mode: 'number' }).notNull(),
  createdAt:     timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  sessionTimeIdx: index('idx_console_session_time').on(table.sessionId, table.timestamp),
  errorsIdx: index('idx_console_errors').on(table.sessionId),
}));

// ─── NETWORK REQUESTS ─────────────────────────────────────
export const networkRequests = pgTable('network_requests', {
  id:            uuid('id').primaryKey().defaultRandom(),
  sessionId:     uuid('session_id').notNull().references(() => sessions.id, { onDelete: 'cascade' }),
  url:           text('url').notNull(),
  method:        varchar('method', { length: 10 }).notNull(),
  status:        integer('status'),
  duration:      integer('duration'),
  requestBody:   text('request_body'),
  responseBody:  text('response_body'),
  timestamp:     bigint('timestamp', { mode: 'number' }).notNull(),
  createdAt:     timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  sessionTimeIdx: index('idx_network_session_time').on(table.sessionId, table.timestamp),
  errorsIdx: index('idx_network_errors').on(table.sessionId),
}));

// ─── ERRORS ───────────────────────────────────────────────
export const errors = pgTable('errors', {
  id:            uuid('id').primaryKey().defaultRandom(),
  sessionId:     uuid('session_id').notNull().references(() => sessions.id, { onDelete: 'cascade' }),
  message:       text('message').notNull(),
  stack:         text('stack'),
  source:        text('source'),
  line:          integer('line'),
  col:           integer('col'),
  timestamp:     bigint('timestamp', { mode: 'number' }).notNull(),
  createdAt:     timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  sessionTimeIdx: index('idx_errors_session_time').on(table.sessionId, table.timestamp),
  messageIdx: index('idx_errors_message').on(table.sessionId, table.message),
}));
