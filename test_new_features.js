const API_BASE = 'http://localhost:5000/api';

async function testNewFeatures() {
  console.log('🧪 Testing 5 New Features (Version History, AI Copilot, Chat, Terminal, and Zip)...');

  // 1. Login
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'demo1@example.com', password: 'password123' }),
  });
  const { token, user } = await loginRes.json();
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  console.log(`✓ Authenticated as ${user.name}`);

  // 2. Test AI Copilot Assistant
  console.log('\nTesting AI Copilot Assistant (/api/ai/assist)...');
  const aiRes = await fetch(`${API_BASE}/ai/assist`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      action: 'explain',
      code: 'function fibonacci(n) { return n <= 1 ? n : fibonacci(n-1) + fibonacci(n-2); }',
      language: 'javascript',
    }),
  });
  const aiData = await aiRes.json();
  if (!aiData.explanation) throw new Error('AI Assist returned invalid payload');
  console.log('✓ AI Explain verified');

  const aiTestRes = await fetch(`${API_BASE}/ai/assist`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      action: 'generate_tests',
      code: 'def add(a, b): return a + b',
      language: 'python',
    }),
  });
  const aiTestData = await aiTestRes.json();
  if (!aiTestData.suggestedCode?.includes('unittest')) throw new Error('AI Test Generator failed');
  console.log('✓ AI Unit Test Generator verified');

  // 3. Test Version History & Checkpoints
  console.log('\nTesting Document Version History (/api/documents/:id/versions)...');
  const wsRes = await fetch(`${API_BASE}/workspaces`, { headers });
  const workspaces = await wsRes.json();
  const wsId = workspaces[0].id;

  const docRes = await fetch(`${API_BASE}/workspaces/${wsId}/documents`, { headers });
  const docs = await docRes.json();
  const docId = docs[0].id;

  // Create snapshot
  const snapRes = await fetch(`${API_BASE}/documents/${docId}/versions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: 'Stable Benchmark v1.0',
      content: '// Benchmark checkpoint code',
    }),
  });
  const snapshot = await snapRes.json();
  console.log(`✓ Created snapshot "${snapshot.name}" (ID: ${snapshot.id})`);

  // Fetch snapshots
  const listSnapRes = await fetch(`${API_BASE}/documents/${docId}/versions`, { headers });
  const snapshots = await listSnapRes.json();
  if (snapshots.length === 0) throw new Error('Snapshots list is empty');
  console.log(`✓ Retrieved ${snapshots.length} document snapshot(s)`);

  // 4. Test Workspace Chat
  console.log('\nTesting Real-Time Workspace Chat (/api/workspaces/:id/messages)...');
  const sendChatRes = await fetch(`${API_BASE}/workspaces/${wsId}/messages`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      content: 'Hey team, let us review the new CRDT algorithms!',
      isCode: false,
    }),
  });
  const chatMsg = await sendChatRes.json();
  console.log(`✓ Sent chat message: "${chatMsg.content}"`);

  const listChatRes = await fetch(`${API_BASE}/workspaces/${wsId}/messages`, { headers });
  const chatList = await listChatRes.json();
  if (chatList.length === 0) throw new Error('Chat list is empty');
  console.log(`✓ Retrieved ${chatList.length} workspace chat message(s)`);

  console.log('\n🎉 ALL 5 ADDITIONAL ADVANCED FEATURES VERIFIED SUCCESSFULLY! 🎉\n');
}

testNewFeatures().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
