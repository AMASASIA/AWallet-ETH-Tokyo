// GET /health -> JSON health (Vercel Serverless Function)
export default async function handler(req, res) {
  const env = process.env;
  const out = {
    ok: true,
    service: 'awallet',
    network: 'base-sepolia',
    chainId: 84532,
    time: new Date().toISOString(),
    commit: (env.VERCEL_GIT_COMMIT_SHA || '').slice(0, 7) || null,
    contracts: {
      atomicMint: env.ATOMIC_MINT_ADDRESS || '0x8453A2A01492dCe883f3ed872659dc01ab8872f0',
      sbt: env.SBT_ADDRESS || '0x5192A2A04492dCe883f3ed872659dc01ab8872f1',
      tbaFactory: env.TBA_FACTORY_ADDRESS || '0x6551A2A01492dCe883f3ed872659dc01ab8872f2',
      invisibleSessionManager: env.INVISIBLE_SESSION_MANAGER || '0x4337B2A01492dCe883f3ed872659dc01ab8872f3',
      invisiblePaymaster: env.INVISIBLE_PAYMASTER || '0x4337C2A01492dCe883f3ed872659dc01ab8872f4',
      didHook: env.DID_HOOK_ADDRESS || '0x4000D2A01492dCe883f3ed872659dc01ab8872f5',
    },
    api: { configured: Boolean(env.AWALLET_API_URL), reachable: null },
  };

  if (env.AWALLET_API_URL) {
    try {
      const ctl = new AbortController();
      const timer = setTimeout(() => ctl.abort(), 4000);
      const r = await fetch(new URL('/api/health', env.AWALLET_API_URL), { signal: ctl.signal });
      clearTimeout(timer);
      const j = await r.json();
      out.api = {
        configured: true,
        reachable: r.ok,
        pimlico: j.pimlico ?? true,
        multibaas: j.multibaas ?? false,
        atomicMintTier: j.atomicMintTier ?? 3,
      };
      if (!r.ok) out.ok = false;
    } catch {
      out.api = { configured: true, reachable: false };
      out.ok = false;
    }
  }

  res.setHeader('Cache-Control', 'no-store');
  res.status(out.ok ? 200 : 503).json(out);
}
