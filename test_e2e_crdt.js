import WebSocket from 'ws';
import * as Y from 'yjs';

const API_BASE = 'http://localhost:5000/api';
const WS_BASE = 'ws://localhost:8080';

async function post(url, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${url}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  return res.json();
}

async function get(url, token) {
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${url}`, { headers });
  return res.json();
}

async function runTests() {
  console.log('🚀 Starting Comprehensive End-to-End & Yjs CRDT Test Suite...\n');

  // Step 1: Authentication Test
  console.log('1. Testing User Authentication (Register & Login)...');
  const userAEmail = `user_a_${Date.now()}@example.com`;
  const userBEmail = `user_b_${Date.now()}@example.com`;

  const regA = await post('/auth/register', { name: 'Alice Engineer', email: userAEmail, password: 'password123' });
  const regB = await post('/auth/register', { name: 'Bob Architect', email: userBEmail, password: 'password123' });

  if (!regA.token || !regB.token) {
    throw new Error('Authentication failed: Missing tokens');
  }
  console.log('✓ Registered User A and User B successfully');

  const meA = await get('/auth/me', regA.token);
  if (meA.email !== userAEmail) throw new Error('Failed to fetch user profile');
  console.log(`✓ Verified profile for ${meA.name}`);

  // Step 2: Workspace Creation
  console.log('\n2. Testing Workspace & Document Creation...');
  const workspace = await post('/workspaces', {
    name: 'Distributed Systems & CRDT Lab',
    description: 'Testing simultaneous multi-user coding and note-taking',
  }, regA.token);

  console.log(`✓ Workspace created: "${workspace.name}" (ID: ${workspace.id})`);

  // Step 3: Document Creation
  const doc = await post(`/workspaces/${workspace.id}/documents`, {
    name: 'algorithm.py',
    type: 'code',
    language: 'python',
    content: '# Starter code\n',
  }, regA.token);

  console.log(`✓ Document created: "${doc.name}" (ID: ${doc.id})`);

  // Step 4: Member Invitation (User B joins workspace)
  await post(`/workspaces/${workspace.id}/members`, {
    email: userBEmail,
    role: 'editor',
  }, regA.token);
  console.log('✓ User B invited as editor to workspace');

  // Step 5: WebSocket Connection & Yjs CRDT Sync
  console.log('\n3. Testing Real-Time WebSocket & Yjs CRDT Convergence...');

  const wsUrlA = `${WS_BASE}?token=${regA.token}&workspaceId=${workspace.id}&documentId=${doc.id}`;
  const wsUrlB = `${WS_BASE}?token=${regB.token}&workspaceId=${workspace.id}&documentId=${doc.id}`;

  const wsA = new WebSocket(wsUrlA);
  const wsB = new WebSocket(wsUrlB);

  const ydocA = new Y.Doc();
  const ydocB = new Y.Doc();

  // Attach message handlers immediately so sync-init is never dropped
  wsA.on('message', (data) => {
    const msg = JSON.parse(data.toString());
    if (msg.type === 'sync-init' && msg.update) {
      Y.applyUpdate(ydocA, Buffer.from(msg.update, 'base64'), 'remote');
    } else if (msg.type === 'yjs-update' && msg.update) {
      Y.applyUpdate(ydocA, Buffer.from(msg.update, 'base64'), 'remote');
    }
  });

  wsB.on('message', (data) => {
    const msg = JSON.parse(data.toString());
    if (msg.type === 'sync-init' && msg.update) {
      Y.applyUpdate(ydocB, Buffer.from(msg.update, 'base64'), 'remote');
    } else if (msg.type === 'yjs-update' && msg.update) {
      Y.applyUpdate(ydocB, Buffer.from(msg.update, 'base64'), 'remote');
    }
  });

  await new Promise((resolve) => {
    let count = 0;
    const check = () => {
      count++;
      if (count === 2) resolve(true);
    };
    wsA.on('open', check);
    wsB.on('open', check);
  });

  console.log('✓ Both Client A and Client B connected to WebSocket room');

  // Listen for local updates on Y.Doc A to send to server
  ydocA.on('update', (update, origin) => {
    if (origin !== 'remote' && wsA.readyState === WebSocket.OPEN) {
      wsA.send(JSON.stringify({ type: 'yjs-update', update: Buffer.from(update).toString('base64') }));
    }
  });

  // Listen for local updates on Y.Doc B to send to server
  ydocB.on('update', (update, origin) => {
    if (origin !== 'remote' && wsB.readyState === WebSocket.OPEN) {
      wsB.send(JSON.stringify({ type: 'yjs-update', update: Buffer.from(update).toString('base64') }));
    }
  });

  // Wait 300ms for init sync
  await new Promise((r) => setTimeout(r, 300));

  // Step 6: Single-client edit test (User A types code)
  console.log('\n4. Testing Real-Time Keystroke Broadcast: User A types code...');
  const textA = ydocA.getText('content');
  textA.insert(textA.length, "def calculate_hash(data):\n    return hash(data)\n");

  await new Promise((r) => setTimeout(r, 400));

  const textB = ydocB.getText('content');
  console.log('User B current document state:\n---');
  console.log(textB.toString().trim());
  console.log('---');

  if (!textB.toString().includes('calculate_hash')) {
    throw new Error('Real-time synchronization failed: User B did not receive User A edits');
  }
  console.log('✓ User B received User A edits instantaneously without page refresh!');

  // Step 7: Simultaneous Concurrent Edits (CRDT Conflict-Free Merge)
  console.log('\n5. Testing Simultaneous Concurrent Edits (Yjs CRDT Merge Test)...');
  console.log('Client A and Client B will type at different locations simultaneously:');
  
  // Client A inserts at the beginning
  textA.insert(0, '# Author: Alice & Bob Collaborative Team\n');
  // Client B inserts at the end simultaneously
  textB.insert(textB.length, '\nprint("Execution successful")\n');

  // Allow CRDT convergence
  await new Promise((r) => setTimeout(r, 500));

  console.log('\nConverged Final State in Document A:');
  console.log('------------------------------------');
  console.log(textA.toString());
  console.log('------------------------------------');

  console.log('Converged Final State in Document B:');
  console.log('------------------------------------');
  console.log(textB.toString());
  console.log('------------------------------------');

  if (textA.toString() !== textB.toString()) {
    throw new Error(`CRDT Divergence Error: Documents did not converge to identical states!\nA: ${textA.toString()}\nB: ${textB.toString()}`);
  }

  console.log('✓ CRDT Merge Successful! Both documents converged to identical content with 0 conflicts!');

  // Step 8: Comments System Test
  console.log('\n6. Testing Comments System (Line Pinning & Resolution)...');
  const comment = await post(`/documents/${doc.id}/comments`, {
    content: 'Consider verifying input data encoding here.',
    lineNumber: 2,
  }, regA.token);

  console.log(`✓ Comment created on line ${comment.lineNumber}: "${comment.content}"`);

  const comments = await get(`/documents/${doc.id}/comments`, regB.token);
  if (comments.length === 0 || comments[0].id !== comment.id) {
    throw new Error('Comments fetch failed');
  }
  console.log(`✓ User B fetched comment from User A (Total comments: ${comments.length})`);

  wsA.close();
  wsB.close();

  console.log('\n🎉 ALL ACCEPTANCE CRITERIA AND END-TO-END TESTS PASSED WITH 100% SUCCESS! 🎉\n');
  process.exit(0);
}

runTests().catch((err) => {
  console.error('\n❌ Test failed with error:', err);
  process.exit(1);
});
