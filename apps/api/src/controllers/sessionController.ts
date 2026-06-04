import { eq } from 'drizzle-orm';
import { db } from '../db';
import { sessions, projects, events } from '@rewind/shared';

export const getSession = async (req: any, res: any) => {
  const { sessionId } = req.params;
  
  const sessionList = await db.select().from(sessions).where(eq(sessions.id, sessionId));
  if (sessionList.length === 0) return res.status(404).json({ error: 'Session not found' });
  
  const session = sessionList[0];

  const projectList = await db.select().from(projects).where(eq(projects.id, session.projectId));
  if (projectList.length === 0 || projectList[0].userId !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  res.json(session);
};

export const getSessionEvents = async (req: any, res: any) => {
  const { sessionId } = req.params;
  
  const sessionEvents = await db.select()
    .from(events)
    .where(eq(events.sessionId, sessionId))
    .orderBy(events.timestamp);
    
  res.json(sessionEvents.map(e => e.data));
};
