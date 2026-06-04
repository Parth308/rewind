import express from 'express';
import cors from 'cors';
import { PORT, FRONTEND_URL } from './config';

import authRoutes from './routes/authRoutes';
import projectRoutes from './routes/projectRoutes';
import sessionRoutes from './routes/sessionRoutes';

const app = express();
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true,
}));
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/projects', projectRoutes);
app.use('/sessions', sessionRoutes);

app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});
