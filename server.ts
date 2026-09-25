import './server/envLoader.ts';
import http from 'http';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { oneinchRouter } from './server/oneinchProxy.ts';
import { sendRouter } from './server/sendProxy.ts';
import { webauthnRouter } from './server/webauthnProxy.ts';
import { a2aRouter } from './server/a2aRouter.ts';
import { tiveRouter } from './server/tiveRouter.ts';
import { anchorSettingsRouter } from './server/anchorSettingsProxy.ts';
import { verifyRouter } from './server/verifyProxy.ts';
import { tapRouter } from './server/tapProxy.ts';
import { x402Router } from './server/x402Proxy.ts';
import { setupLiveApiBridge } from './server/liveBridge.ts';
import {
  securityHeadersMiddleware,
  createRateLimiter,
  sanitizeRequestBodyMiddleware,
} from './server/securityMiddleware.ts';

async function startServer() {
  const app = express();
  const PORT = 3000;
  const httpServer = http.createServer(app);

  // Attach Gemini Live API WebSocket Bridge
  setupLiveApiBridge(httpServer);

  // Security Headers against Clickjacking, MIME-sniffing, XSS
  app.use(securityHeadersMiddleware);

  // Body parsing with safe size limit to prevent Memory Exhaustion / DoS
  app.use(express.json({ limit: '256kb' }));

  // Sanitize request bodies against zero-width injection and prototype pollution
  app.use(sanitizeRequestBodyMiddleware);

  // Rate Limiter on API routes: 60 requests per minute per IP
  const apiRateLimiter = createRateLimiter(60000, 60);
  app.use('/api', apiRateLimiter);

  // API health route
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'AWallet Server', network: 'Base' });
  });

  // Gemini Live API Status
  app.get('/api/live/status', (req, res) => {
    res.json({
      available: true,
      model: 'gemini-3.8-live',
      hasApiKey: Boolean(process.env.GEMINI_API_KEY),
      wsPath: '/api/live',
    });
  });

  // 1inch Fusion Gasless Swap Proxy with Policy Engine Verification
  app.use('/api/swap', oneinchRouter);

  // Asset Transfer Proxy with Deterministic Policy Engine Verification
  app.use('/api/send', sendRouter);

  // WebAuthn Biometric Authentication and Challenge Endpoint
  app.use('/api/auth/webauthn', webauthnRouter);

  // A2A (AI-to-AI) Payment & Agent Sub-Account Engine
  app.use('/api/a2a', a2aRouter);

  // Tive ◉AI Voice Command Parser (Gemini API)
  app.use('/api/tive', tiveRouter);

  // Anchor & Pimlico Bundler Settings
  app.use('/api/anchor', anchorSettingsRouter);
  app.use('/api/bundler', anchorSettingsRouter);

  // 0DAO On-chain Verification Proxy
  app.use('/api/verify', verifyRouter);

  // Pico W Hardware Tap Switch Receiver & Poller
  app.use('/api/tap', tapRouter);

  // x402 HTTP 402 Payment Required M2M Protocol
  app.use('/api/x402', x402Router);

  // Vite middleware for development vs static bundle for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`AWallet server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start AWallet server:', err);
  process.exit(1);
});
