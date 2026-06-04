import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import { users, registerSchema, loginSchema } from '@rewind/shared';
import { JWT_SECRET } from '../config';

export const register = async (req: any, res: any) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);

  const { email, password, name } = parsed.data;

  const existing = await db.select().from(users).where(eq(users.email, email));
  if (existing.length > 0) return res.status(400).json({ error: 'Email in use' });

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const [user] = await db.insert(users).values({
    email,
    passwordHash,
    name
  }).returning();

  const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
};

export const login = async (req: any, res: any) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json(parsed.error);

  const { email, password } = parsed.data;

  const userList = await db.select().from(users).where(eq(users.email, email));
  if (userList.length === 0) return res.status(400).json({ error: 'Invalid credentials' });
  
  const user = userList[0];
  const validPassword = await bcrypt.compare(password, user.passwordHash);
  if (!validPassword) return res.status(400).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
};
