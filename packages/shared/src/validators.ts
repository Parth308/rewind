import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
});

export const createProjectSchema = z.object({
  name: z.string().min(1),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).optional(),
  settings: z.object({
    maskSelectors: z.array(z.string()).optional(),
    blockSelectors: z.array(z.string()).optional(),
    ignoreUrls: z.array(z.string()).optional(),
    retentionDays: z.number().int().positive().optional(),
  }).optional(),
});
