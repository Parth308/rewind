import { db } from './src/db';
import { sessions, sessionEmbeddings } from '@rewind/shared';
import { handleEmbedding } from './src/handlers/embedding';

async function run() {
  const allSessions = await db.select().from(sessions).limit(1);
  if (allSessions.length === 0) {
    console.log('No sessions found to test. Generating a dummy session...');
    // Create a dummy session
    const [newSession] = await db.insert(sessions).values({
      projectId: '00000000-0000-0000-0000-000000000000', // assuming some projectId
      startedAt: new Date()
    }).returning();
    
    // We need a dummy project
    // Better to just fail if no sessions exist, since creating a project requires user id.
    process.exit(0);
  }
  
  const sessionId = allSessions[0].id;
  console.log('Testing session:', sessionId);
  
  try {
    await handleEmbedding(sessionId);
    const emb = await db.select().from(sessionEmbeddings);
    console.log('Total embeddings in DB:', emb.length);
  } catch (err) {
    console.error('Embedding failed:', err);
  }
  process.exit(0);
}

run().catch(console.error);
