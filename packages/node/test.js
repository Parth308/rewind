const { Rewind } = require('./dist/index.js');

async function test() {
  // We need a valid project token. Let's just use whatever token is in the database.
  // In a real environment, the user would provide this.
  // Since we are just testing, we assume a local token 'test-token' or we fetch one from DB.
  // We will assume the test runner will pass the token as an argument.
  const token = process.argv[2];
  const sessionId = process.argv[3];

  if (!token || !sessionId) {
    console.error('Usage: node test.js <projectToken> <sessionId>');
    process.exit(1);
  }

  const rewind = new Rewind({
    projectToken: token,
    ingestorUrl: 'http://localhost:3001'
  });

  console.log('Sending custom event to sessionId:', sessionId);

  await rewind.track(sessionId, 'Backend Test Event', {
    message: 'Hello from Node.js SDK!',
    randomId: Math.random().toString(36).substring(7)
  });

  console.log('Event sent!');
}

test().catch(console.error);
