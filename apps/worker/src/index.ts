import { Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { handleMetadata } from './handlers/metadata';
import { handleBatch } from './handlers/batch';
import { handleConsole } from './handlers/console';
import { handleNetwork } from './handlers/network';
import { handleEmbedding } from './handlers/embedding';
import { handleIdentify } from './handlers/identify';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const redis = new Redis(REDIS_URL, { maxRetriesPerRequest: null });

console.log('Worker starting, listening to "events" queue...');

const worker = new Worker('events', async (job: Job) => {
  if (job.name === 'process_batch') {
    const { projectId, payload } = job.data;
    
    try {
      if (payload.type === 'metadata') {
        await handleMetadata(projectId, payload);
      } else if (payload.type === 'batch') {
        await handleBatch(projectId, payload);
      } else if (payload.type === 'console') {
        await handleConsole(projectId, payload);
      } else if (payload.type === 'network') {
        await handleNetwork(projectId, payload);
      } else if (payload.type === 'identify') {
        await handleIdentify(projectId, payload);
      }
    } catch (err) {
      console.error(`Error processing ${payload.type} for project ${projectId}:`, err);
      throw err; // Re-throw to let BullMQ handle retries
    }
  } else if (job.name === 'process_mega_batch') {
    const { batches } = job.data;
    for (const b of batches) {
      const { projectId, payload } = b;
      try {
        if (payload.type === 'metadata') {
          await handleMetadata(projectId, payload);
        } else if (payload.type === 'batch') {
          await handleBatch(projectId, payload);
        } else if (payload.type === 'console') {
          await handleConsole(projectId, payload);
        } else if (payload.type === 'network') {
          await handleNetwork(projectId, payload);
        } else if (payload.type === 'identify') {
          await handleIdentify(projectId, payload);
        }
      } catch (err) {
        console.error(`Error processing ${payload.type} for project ${projectId} in mega_batch:`, err);
      }
    }
  } else if (job.name === 'embed_session') {
    try {
      await handleEmbedding(job.data.sessionId);
    } catch (err) {
      console.error(`Error embedding session ${job.data.sessionId}:`, err);
      throw err;
    }
  }
}, { connection: redis as any });

worker.on('completed', (job) => {
  // console.log(`Job ${job.id} completed!`);
});

worker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed with ${err.message}`);
});
