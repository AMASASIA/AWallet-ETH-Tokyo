import { EthereumProvider } from '@walletconnect/ethereum-provider';

// Public Demo Project ID. In production, get your own from cloud.walletconnect.com
const PROJECT_ID = '3c15d6c13d7d3d7d3d7d3d7d3d7d3d7d'; 

let wcProvider: InstanceType<typeof EthereumProvider> | null = null;

export const getWCProvider = async () => {
  if (!wcProvider) {
    wcProvider = await EthereumProvider.init({
      projectId: PROJECT_ID,
      showQrModal: false, // We will use our own custom modal
      chains: [1], // Mainnet
      methods: ['eth_sendTransaction', 'personal_sign'],
      events: ['chainChanged', 'accountsChanged', 'session_event'],
    });
  }
  return wcProvider;
};

export const disconnectWC = async () => {
  if (wcProvider) {
    await wcProvider.disconnect();
    wcProvider = null;
  }
};
