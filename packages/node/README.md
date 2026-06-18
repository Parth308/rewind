# rewind-node

The official Node.js SDK for [Rewind](https://github.com/Parth308/rewind) - The Open Source Session Replay & Telemetry Platform.

Session replay is strictly visual, but many critical failures happen purely on the backend. You can use the `rewind-node` SDK to push backend context, custom events, exceptions, and user identities directly into the active user's session timeline!

## Installation

```bash
npm install rewind-node
```

## Quick Start (Express Middleware)

The easiest way to integrate the SDK in an Express application is using our built-in middleware. This automatically extracts the `x-rewind-session-id` header from the frontend tracker and injects `req.rewind` into all your endpoints.

```typescript
import { Rewind, expressMiddleware } from 'rewind-node';
import express from 'express';

const rewind = new Rewind({
  projectToken: 'YOUR_PROJECT_TOKEN', // Found in your Dashboard Settings
  ingestorUrl: 'http://localhost:3001' // Point this to your Ingestor service
});

const app = express();

// Apply the middleware
app.use(expressMiddleware(rewind));

app.post('/api/checkout', async (req, res) => {
  try {
    // 1. Link the backend User ID to the active session
    req.rewind?.identify('user_12345', { email: 'user@example.com', plan: 'pro' });

    // 2. Track custom business logic
    req.rewind?.track('Checkout Started', { cartValue: 99.99 });
    
    // ... your logic ...
    
    res.json({ success: true });
  } catch (error) {
    // 3. Attach backend stack traces directly to the session replay timeline!
    req.rewind?.captureException(error, { route: '/api/checkout' });
    res.status(500).json({ error: 'Checkout failed' });
  }
});
```

## Manual Usage (Other Frameworks)

If you aren't using Express, you can manually orchestrate these calls by passing the frontend `sessionId` directly to the methods:

```typescript
import { Rewind } from 'rewind-node';

const rewind = new Rewind({ projectToken: 'YOUR_PROJECT_TOKEN' });

// You must extract the sessionId from the frontend request (e.g. from a header)
const sessionId = req.headers['x-rewind-session-id'];

rewind.track(sessionId, 'Order Completed', { orderId: 'ord_123' });
rewind.identify(sessionId, 'user_123', { role: 'admin' });
rewind.captureException(sessionId, new Error("Database timeout"));
```

## Documentation

For full documentation, architecture details, and Docker deployment guides, visit the [official documentation](https://rewind-parth308.vercel.app/docs/node-sdk).
