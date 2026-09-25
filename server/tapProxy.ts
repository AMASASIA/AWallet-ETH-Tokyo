/**
 * Pico W Hardware Tap Express Router (/api/tap/*)
 * Handles hardware button presses from Pico W and polling from frontend SlideToConfirm/Action queues.
 */

import { Router } from 'express';
import { tapConfirmManager } from './tapConfirm.ts';

export const tapRouter = Router();

// Endpoint called by Pico W hardware when physical button is pressed
tapRouter.post('/press', (req, res) => {
  const { secret, deviceId, actionId } = req.body || {};
  const authHeader = req.headers['x-device-secret'] as string;
  const effectiveSecret = secret || authHeader;

  const result = tapConfirmManager.recordTap(deviceId, effectiveSecret, actionId);
  if (!result.success) {
    return res.status(401).json(result);
  }

  return res.json({
    success: true,
    message: 'Hardware tap registered successfully',
    tap: result.tap,
  });
});

// Endpoint called by UI to check if hardware tap was pressed
tapRouter.get('/status', (req, res) => {
  const actionId = req.query.actionId as string;
  const status = tapConfirmManager.checkTapStatus(actionId);

  return res.json({
    success: true,
    confirmed: status.confirmed,
    tap: status.tap,
  });
});

// Endpoint called by UI to consume tap once action is authorized
tapRouter.post('/consume', (req, res) => {
  const { tapId } = req.body;
  if (!tapId) {
    return res.status(400).json({ error: 'tapId is required' });
  }

  const success = tapConfirmManager.consumeTap(tapId);
  return res.json({ success });
});

// Recent taps list for diagnostics
tapRouter.get('/recent', (req, res) => {
  res.json({
    success: true,
    taps: tapConfirmManager.getRecentTaps(),
  });
});
