import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import workspaceRoutes from './routes/workspaceRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import commentRoutes from './routes/commentRoutes.js';
import terminalRoutes from './routes/terminalRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import { setupWebSocketServer } from './websocket/yjsServer.js';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const WS_PORT = Number(process.env.WS_PORT) || 8080;

app.use(cors({ origin: '*' }));
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/terminal', terminalRoutes);
app.use('/api/ai', aiRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'CollabDev Real-Time Server',
    timestamp: new Date().toISOString(),
  });
});

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDist = path.resolve(__dirname, '../../client/dist');

if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

import http from 'http';

const httpServer = http.createServer(app);

// Setup WebSocket server on HTTP server (allows single-port cloud hosts like Render to serve API, WebSockets, and UI)
setupWebSocketServer(httpServer);

// If running locally with separate WS_PORT, also keep dedicated WS port open for backwards compatibility
if (WS_PORT !== PORT && !process.env.RENDER) {
  try {
    setupWebSocketServer(WS_PORT);
  } catch (e) {
    // Port may already be in use
  }
}

// Start combined HTTP + WebSocket server
httpServer.listen(PORT, () => {
  console.log(`⚡ REST API & WebSocket Server listening on http://localhost:${PORT}`);
});
