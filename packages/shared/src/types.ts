import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import * as schema from './schema';

export type User = InferSelectModel<typeof schema.users>;
export type NewUser = InferInsertModel<typeof schema.users>;

export type Project = InferSelectModel<typeof schema.projects>;
export type NewProject = InferInsertModel<typeof schema.projects>;

export type Session = InferSelectModel<typeof schema.sessions>;
export type NewSession = InferInsertModel<typeof schema.sessions>;

export type Event = InferSelectModel<typeof schema.events>;
export type NewEvent = InferInsertModel<typeof schema.events>;

export type ConsoleLog = InferSelectModel<typeof schema.consoleLogs>;
export type NewConsoleLog = InferInsertModel<typeof schema.consoleLogs>;

export type NetworkRequest = InferSelectModel<typeof schema.networkRequests>;
export type NewNetworkRequest = InferInsertModel<typeof schema.networkRequests>;

export type ErrorModel = InferSelectModel<typeof schema.errors>;
export type NewErrorModel = InferInsertModel<typeof schema.errors>;

export interface ProjectStats {
  sessionCount: number;
  avgDurationMs: number;
  errorRate: number;
  activeUsers: number;
}

export interface RankedError {
  message: string;
  count: number;
  lastSeen: string;
  sampleSessionId: string;
}

export interface TopPage {
  url: string;
  sessionCount: number;
  avgDurationMs: number;
  errorCount: number;
}

export interface SessionListParams {
  cursor?: string;
  limit?: number;
  browser?: string;
  os?: string;
  device?: string;
  country?: string;
  hasErrors?: boolean;
  hasRageClicks?: boolean;
  minDuration?: number;
  maxDuration?: number;
  userId?: string;
  url?: string;
  startDate?: string;
  endDate?: string;
  sort?: string;
}

export interface SessionListResponse {
  sessions: Session[];
  nextCursor: string | null;
  total: number;
}
