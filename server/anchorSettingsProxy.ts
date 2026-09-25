/**
 * Anchor Settings & Bundler Management Router
 * Allows registering Pimlico Bundler keys and session configurations safely via UI.
 */

import { Router } from 'express';
import { bundlerKeyStore } from './bundlerKeyStore.ts';
import { checkBundlerHealth, executeGaslessUserOp } from './bundlerClient.ts';

export const anchorSettingsRouter = Router();

// GET current Anchor & Bundler settings (masked)
anchorSettingsRouter.get('/settings', (req, res) => {
  const anchorId = (req.query.anchorId as string) || 'default';
  const masked = bundlerKeyStore.getMaskedConfig(anchorId);
  res.json({
    success: true,
    anchor: masked,
  });
});

// POST update Anchor & Bundler settings
anchorSettingsRouter.post('/settings', (req, res) => {
  const { anchorId = 'default', bundlerRpcUrl, paymasterUrl, sessionKeyAddress } = req.body;

  if (bundlerRpcUrl && typeof bundlerRpcUrl !== 'string') {
    return res.status(400).json({ error: 'Invalid bundlerRpcUrl' });
  }

  const updated = bundlerKeyStore.setConfig(anchorId, {
    bundlerRpcUrl,
    paymasterUrl,
    sessionKeyAddress,
  });

  return res.json({
    success: true,
    message: 'Anchor settings successfully registered in KeyStore',
    anchor: bundlerKeyStore.getMaskedConfig(anchorId),
  });
});

// Bundler endpoints
anchorSettingsRouter.get('/health', async (req, res) => {
  const anchorId = (req.query.anchorId as string) || 'default';
  const health = await checkBundlerHealth(anchorId);
  res.json(health);
});

anchorSettingsRouter.post('/execute', async (req, res) => {
  try {
    const { sender, target, value, data, anchorId } = req.body;
    if (!sender || !target) {
      return res.status(400).json({ error: 'sender and target are required' });
    }

    const result = await executeGaslessUserOp({
      sender,
      target,
      value,
      data,
      anchorId,
    });

    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err?.message || 'Bundler execution failed',
    });
  }
});
