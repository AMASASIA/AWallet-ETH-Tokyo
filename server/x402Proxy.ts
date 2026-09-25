/**
 * x402 Express Proxy Router (/api/x402/*)
 * Provides HTTP 402 Payment Required endpoints for A2A and M2M agent settlement.
 */

import { Router } from 'express';
import { X402Client } from './x402Client.ts';

export const x402Router = Router();

// GET a paywalled agent resource: returns HTTP 402 Payment Required if no valid auth token
x402Router.get('/resource/:id', (req, res) => {
  const resourceId = req.params.id || 'market_data_ai';
  const authHeader = req.headers['authorization'] || req.headers['x-402-token'];

  // Check if paid access token is provided
  if (authHeader && String(authHeader).includes('x402_grant_')) {
    return res.json({
      status: 200,
      resourceId,
      content: {
        symbol: 'BTC/USDC',
        orderbookSpread: '0.012%',
        oracleLatency: '18ms',
        insight: 'Liquidity depth on Base Sepolia is optimal for A2A routing.',
        timestamp: new Date().toISOString(),
      },
    });
  }

  // Otherwise return HTTP 402 Payment Required
  const requirement = X402Client.createRequirement(
    resourceId,
    0.05,
    `Autonomous AI Agent Resource: ${resourceId}`
  );

  res.setHeader(
    'WWW-Authenticate',
    `x402 network="base-sepolia", token="${requirement.token}", amount="${requirement.amount}", recipient="${requirement.recipient}"`
  );

  return res.status(402).json({
    error: 'Payment Required',
    message: 'Access to this AI agent resource requires a micropayment settled via Base Sepolia.',
    requirement,
  });
});

// POST payment proof to unlock resource (/api/x402/pay)
x402Router.post('/pay', (req, res) => {
  const { txHash, sender, resourceId = 'market_data_ai' } = req.body || {};

  if (!txHash) {
    return res.status(400).json({ error: 'txHash payment proof is required' });
  }

  try {
    const receipt = X402Client.verifyProof({
      txHash,
      sender: sender || '0x8453B47c0a9B5B2E8102dCe883f3eD872659dC01',
      resourceId,
    });

    return res.json({
      success: true,
      message: 'x402 payment verified and resource unlocked',
      receipt,
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      error: err?.message || 'Payment verification failed',
    });
  }
});
