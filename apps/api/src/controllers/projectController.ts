import { eq, desc } from 'drizzle-orm';
import { db } from '../db';
import { projects, sessions, createProjectSchema } from '@rewind/shared';

export const getProjects = async (req: any, res: any) => {
  const userProjects = await db.select().from(projects).where(eq(projects.userId, req.user.id));
  res.json(userProjects);
};

export const createProject = async (req: any, res: any) => {
  const parsed = createProjectSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);

  const token = require('crypto').randomBytes(32).toString('hex');
  
  const [project] = await db.insert(projects).values({
    name: parsed.data.name,
    userId: req.user.id,
    token,
  }).returning();
  
  res.json(project);
};

export const getProjectSessions = async (req: any, res: any) => {
  const { projectId } = req.params;
  
  const projectList = await db.select().from(projects).where(eq(projects.id, projectId));
  if (projectList.length === 0 || projectList[0].userId !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const projectSessions = await db.select()
    .from(sessions)
    .where(eq(sessions.projectId, projectId))
    .orderBy(desc(sessions.startedAt))
    .limit(50);
    
  res.json(projectSessions);
};
