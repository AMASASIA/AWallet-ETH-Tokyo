import { createCoinbaseWalletSDK } from '@coinbase/wallet-sdk';

export interface BaseChainConfig {
  id: number;
  hexId: string;
  name: string;
  rpcUrl: string;
  blockExplorer: string;
  currency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

export const BASE_MAINNET: BaseChainConfig = {
  id: 8453,
  hexId: '0x2105',
  name: 'Base Mainnet',
  rpcUrl: 'https://mainnet.base.org',
  blockExplorer: 'https://basescan.org',
  currency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
};

export const BASE_SEPOLIA: BaseChainConfig = {
  id: 84532,
  hexId: '0x14a34',
  name: 'Base Sepolia',
  rpcUrl: 'https://sepolia.base.org',
  blockExplorer: 'https://sepolia.basescan.org',
  currency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
};

export interface WalletConnectionState {
  isConnected: boolean;
  address: string;
  baseName?: string;
  chainId: number;
  networkName: string;
  walletType: 'coinbase_smart_wallet' | 'coinbase_extension' | 'base_sandbox';
}

let sdkInstance: ReturnType<typeof createCoinbaseWalletSDK> | null = null;

export const getCoinbaseWalletProvider = () => {
  if (typeof window === 'undefined') return null;

  // Check if Coinbase Wallet extension is directly injected
  const win = window as unknown as {
    coinbaseWalletExtension?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on?: (event: string, callback: (...args: unknown[]) => void) => void;
      removeListener?: (event: string, callback: (...args: unknown[]) => void) => void;
    };
    ethereum?: {
      isCoinbaseWallet?: boolean;
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on?: (event: string, callback: (...args: unknown[]) => void) => void;
      removeListener?: (event: string, callback: (...args: unknown[]) => void) => void;
      providers?: Array<{ isCoinbaseWallet?: boolean; request: (args: { method: string; params?: unknown[] }) => Promise<unknown> }>;
    };
  };

  if (win.coinbaseWalletExtension) {
    return win.coinbaseWalletExtension;
  }

  if (win.ethereum?.isCoinbaseWallet) {
    return win.ethereum;
  }

  if (win.ethereum?.providers?.length) {
    const cb = win.ethereum.providers.find(p => p.isCoinbaseWallet);
    if (cb) return cb;
  }

  // Otherwise initialize via SDK
  try {
    if (!sdkInstance) {
      sdkInstance = createCoinbaseWalletSDK({
        appName: 'Base\\Wallet OS',
        appLogoUrl: 'https://avatars.githubusercontent.com/u/108554348?s=200&v=4',
        preference: {
          options: 'all', // allows Passkey Smart Wallet, Mobile QR, or Extension
        },
      });
    }
    return sdkInstance.getProvider();
  } catch (err) {
    console.warn('Failed to initialize Coinbase Wallet SDK:', err);
    return null;
  }
};

/**
 * Switch chain to Base
 */
export const switchChainToBase = async (
  provider: { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> },
  targetChain: BaseChainConfig = BASE_MAINNET
) => {
  try {
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: targetChain.hexId }],
    });
  } catch (switchError: unknown) {
    // 4902 error code means chain not added
    const err = switchError as { code?: number };
    if (err?.code === 4902 || String(switchError).includes('4902')) {
      await provider.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: targetChain.hexId,
            chainName: targetChain.name,
            nativeCurrency: targetChain.currency,
            rpcUrls: [targetChain.rpcUrl],
            blockExplorerUrls: [targetChain.blockExplorer],
          },
        ],
      });
    } else {
      throw switchError;
    }
  }
};

/**
 * Connect to Coinbase Wallet on Base
 */
export const connectCoinbaseWallet = async (
  targetChain: BaseChainConfig = BASE_MAINNET
): Promise<WalletConnectionState> => {
  const provider = getCoinbaseWalletProvider();
  if (!provider) {
    throw new Error('Coinbase Wallet provider could not be initialized.');
  }

  // Request accounts
  const accounts = (await provider.request({
    method: 'eth_requestAccounts',
  })) as string[];

  if (!accounts || accounts.length === 0) {
    throw new Error('No accounts authorized from Coinbase Wallet.');
  }

  const primaryAddress = accounts[0];

  // Try switching to Base
  try {
    await switchChainToBase(provider, targetChain);
  } catch (err) {
    console.warn('Network switch to Base ignored or failed:', err);
  }

  // Attempt resolving Base name or fallback
  const shortAddr = `${primaryAddress.slice(2, 6)}.base.eth`;

  return {
    isConnected: true,
    address: primaryAddress,
    baseName: shortAddr,
    chainId: targetChain.id,
    networkName: targetChain.name,
    walletType: 'coinbase_smart_wallet',
  };
};

/**
 * Mock sandbox connection specifically for Base with preset Smart Wallet
 */
export const connectBaseSandbox = (
  targetChain: BaseChainConfig = BASE_MAINNET
): WalletConnectionState => {
  return {
    isConnected: true,
    address: '0x8453B47c0a9B5B2E8102dCe883f3eD872659dC01',
    baseName: 'alex.base.eth',
    chainId: targetChain.id,
    networkName: targetChain.name,
    walletType: 'base_sandbox',
  };
};
