/**
 * Bundler & Anchor Key Store
 * Manages Pimlico / ERC-4337 Bundler configuration per Anchor ID.
 * Avoids hardcoding secrets directly in shared environments.
 */

export interface AnchorBundlerConfig {
  anchorId: string;
  bundlerRpcUrl?: string;
  paymasterUrl?: string;
  sessionKeyAddress?: string;
  updatedAt: string;
}

class BundlerKeyStore {
  private anchorConfigs = new Map<string, AnchorBundlerConfig>();
  private defaultBundlerUrl = process.env.BUNDLER_RPC_URL || 'https://api.pimlico.io/v2/base-sepolia/rpc?apikey=demo';
  private defaultSessionKey = process.env.SESSION_KEY_PRIVATE_KEY || '';

  constructor() {
    // Initialize default anchor
    this.anchorConfigs.set('default', {
      anchorId: 'default',
      bundlerRpcUrl: this.defaultBundlerUrl,
      paymasterUrl: this.defaultBundlerUrl,
      updatedAt: new Date().toISOString(),
    });
  }

  public getConfig(anchorId = 'default'): AnchorBundlerConfig {
    return (
      this.anchorConfigs.get(anchorId) || {
        anchorId,
        bundlerRpcUrl: this.defaultBundlerUrl,
        paymasterUrl: this.defaultBundlerUrl,
        updatedAt: new Date().toISOString(),
      }
    );
  }

  public setConfig(
    anchorId: string,
    config: { bundlerRpcUrl?: string; paymasterUrl?: string; sessionKeyAddress?: string }
  ): AnchorBundlerConfig {
    const existing = this.getConfig(anchorId);
    const updated: AnchorBundlerConfig = {
      ...existing,
      ...config,
      updatedAt: new Date().toISOString(),
    };
    this.anchorConfigs.set(anchorId, updated);
    return updated;
  }

  public getMaskedConfig(anchorId = 'default') {
    const cfg = this.getConfig(anchorId);
    return {
      anchorId: cfg.anchorId,
      bundlerRpcUrl: cfg.bundlerRpcUrl
        ? cfg.bundlerRpcUrl.replace(/apikey=([^&]+)/, 'apikey=***')
        : 'Not configured',
      hasPaymaster: Boolean(cfg.paymasterUrl),
      sessionKeyAddress: cfg.sessionKeyAddress || 'Registered in Memory',
      updatedAt: cfg.updatedAt,
    };
  }
}

export const bundlerKeyStore = new BundlerKeyStore();
